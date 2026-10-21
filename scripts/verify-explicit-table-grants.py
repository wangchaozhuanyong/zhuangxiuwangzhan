#!/usr/bin/env python3
"""Replay migrations and exercise real PostgreSQL ACL/RLS in disposable containers.

No remote database URL, credentials, bind mounts or published ports are accepted.
Auth/Storage bootstrap is a minimal SQL contract, not a running Supabase stack.
"""

import argparse
import hashlib
import json
import subprocess
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIGRATION = ROOT / "supabase/migrations/20261021070913_explicit_table_privileges.sql"
LABEL = "com.flashcast.task=explicit-table-grants-test"

# Independent expectations based on the public readers and final role policies.
PUBLIC_CONTENT = set("""about_sections before_after_items blog_posts brand_partners
cms_content_entries cms_pages cms_section_templates cms_sections cta_blocks faqs
hero_slides home_sections landing_pages material_images materials media_assets
process_steps project_images projects service_areas services site_pages site_settings
testimonials""".split())
ADMIN_CRUD = PUBLIC_CONTENT | set("""admin_users lead_followups leads
maintenance_reminder_items quote_requests translation_jobs""".split())
INTERNAL = {"notification_settings", "form_submission_attempts", "managed_cms_release_permits"}
ALL_TABLES = ADMIN_CRUD | INTERNAL | {"cms_revisions", "admin_audit_logs", "system_event_logs"}
# Existing scripts/backup-supabase.mjs manifest and restore .upsert() require SIU.
RESTORE_TABLES = ALL_TABLES - {"cms_section_templates", "translation_jobs",
                             "form_submission_attempts", "managed_cms_release_permits"}

BOOTSTRAP = """
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create table auth.users(id uuid primary key);
create function auth.jwt() returns jsonb language sql stable as
$$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid() returns uuid language sql stable as
$$select (auth.jwt()->>'sub')::uuid$$;
create function auth.role() returns text language sql stable as
$$select auth.jwt()->>'role'$$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
create table storage.buckets(id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id), name text, owner uuid);
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
"""

SEED = """
insert into auth.users(id) select ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid
from generate_series(1,6) n;
insert into public.admin_users(user_id, email, role, active) values
('00000000-0000-0000-0000-000000000001','super@example.invalid','super_admin',true),
('00000000-0000-0000-0000-000000000002','editor@example.invalid','content_editor',true),
('00000000-0000-0000-0000-000000000003','leads@example.invalid','lead_manager',true),
('00000000-0000-0000-0000-000000000004','viewer@example.invalid','viewer',true),
('00000000-0000-0000-0000-000000000006','disabled@example.invalid','super_admin',false);
insert into public.cms_pages(page_key,path,status,deleted_at) values
('grant-test-public','/grant-test-public','published',null),
('grant-test-draft','/grant-test-draft','draft',null),
('grant-test-deleted','/grant-test-deleted','published',now());
insert into public.cms_sections(page_id,section_key,section_type,status)
select id,'grant-test-section','text','published' from public.cms_pages
where page_key in ('grant-test-public','grant-test-draft');
insert into public.cms_content_entries(content_type,slug,status) values
('grant_test','grant-test-public','published'),('grant_test','grant-test-draft','draft');
insert into public.projects(slug,status) values ('grant-test-public','published'),('grant-test-draft','draft');
insert into public.project_images(project_id,image_url)
select id,'https://example.invalid/' || slug from public.projects where slug like 'grant-test-%';
insert into public.materials(slug,status) values ('grant-test-public','published'),('grant-test-draft','draft');
insert into public.material_images(material_id,image_url,is_active)
select id,'https://example.invalid/' || slug,true from public.materials where slug like 'grant-test-%';
insert into public.material_images(material_id,image_url,is_active)
select id,'https://example.invalid/grant-test-inactive',false from public.materials where slug='grant-test-public';
insert into public.media_assets(file_url,file_name) values ('https://example.invalid/grant-test.webp','grant-test.webp');
insert into public.leads(name,phone,message) values ('grant-test','synthetic','synthetic');
insert into public.system_event_logs(event_type,message) values ('grant_test','synthetic');
"""


def command(args, **kwargs):
    result = subprocess.run(args, text=True, capture_output=True, timeout=90, **kwargs)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout.strip()


class Database:
    def __init__(self, image, mode, report):
        self.name = f"flashcast-grants-{mode}-{uuid.uuid4().hex[:8]}"
        self.image, self.mode, self.report = image, mode, report
        self.started = False

    def __enter__(self):
        command(["docker", "run", "--detach", "--rm", "--name", self.name,
                 "--label", LABEL, "--network", "none",
                 "--tmpfs", "/var/lib/postgresql/data:rw", "-e",
                 "POSTGRES_HOST_AUTH_METHOD=trust", self.image])
        self.started = True
        try:
            for _ in range(40):
                ready = subprocess.run(["docker", "exec", self.name, "pg_isready", "-U", "postgres"],
                                       capture_output=True, timeout=5)
                if ready.returncode == 0:
                    break
                time.sleep(0.25)
            else:
                raise RuntimeError("Isolated database did not become ready")
            self.sql(BOOTSTRAP)
            if self.mode == "legacy":
                self.sql("""alter default privileges for role postgres in schema public
                    grant select,insert,update,delete,truncate,references,trigger on tables
                    to anon,authenticated,service_role;""")
            else:
                self.sql("""alter default privileges for role postgres in schema public
                    revoke all on tables from anon,authenticated,service_role;
                    alter default privileges for role postgres in schema public
                    revoke all on sequences from anon,authenticated,service_role;""")
            return self
        except BaseException:
            self.__exit__(None, None, None)
            raise

    def __exit__(self, *_):
        if self.started:
            # Only stop this run's disposable, synthetic database. --rm removes it.
            label = command(["docker", "inspect", "--format",
                             '{{index .Config.Labels "com.flashcast.task"}}', self.name])
            if label != "explicit-table-grants-test":
                raise RuntimeError("Refusing to stop a container without this test's label")
            command(["docker", "stop", "--time", "3", self.name])

    def sql(self, sql, error=None):
        result = subprocess.run(["docker", "exec", "-i", self.name, "psql", "-X", "-qAt",
                                 "--single-transaction", "-v", "ON_ERROR_STOP=1",
                                 "-v", "VERBOSITY=verbose", "-U", "postgres", "-d", "postgres"],
                                input=sql, text=True, capture_output=True, timeout=90)
        if error:
            if result.returncode == 0 or error not in result.stderr:
                raise AssertionError(f"Expected {error}; got: {result.stderr or result.stdout}")
        elif result.returncode:
            raise RuntimeError(result.stderr)
        return result.stdout.strip()

    def check(self, label, condition):
        if not condition:
            raise AssertionError(label)
        self.report["checks"].append(f"{self.mode}: {label}")

    def actor(self, role, sql, user=None, aal="aal2", error=None):
        assert role in {"anon", "authenticated", "service_role"}
        claims = {"role": role, "aal": aal}
        if user:
            claims["sub"] = f"00000000-0000-0000-0000-{user:012d}"
        # All claims are synthetic and remain inside the network-isolated container.
        payload = json.dumps(claims)
        return self.sql(f"set local role {role}; set local request.jwt.claims='{payload}'; {sql}", error)

    def snapshot(self):
        # Policies, function/sequence ACLs, RLS, defaults and Storage are unchanged.
        queries = [
            "select * from pg_policies order by schemaname,tablename,policyname",
            "select oid::regprocedure::text,proacl::text from pg_proc where pronamespace in "
            "('public'::regnamespace,'auth'::regnamespace) order by 1",
            "select relname,relrowsecurity,relforcerowsecurity from pg_class where "
            "relnamespace='public'::regnamespace and relkind='r' order by 1",
            "select defaclrole,defaclnamespace,defaclobjtype,defaclacl::text from pg_default_acl order by 1,2,3",
            "select relname,relacl::text from pg_class where relnamespace='storage'::regnamespace order by 1",
        ]
        return [self.sql(query) for query in queries]


def replay(db, paths):
    for path in paths:
        db.sql(path.read_text())
    db.check(f"all {len(paths)} historical migrations replay", True)
    actual = set(db.sql("select tablename from pg_tables where schemaname='public'").splitlines())
    db.check("every application table has an explicit reviewed classification", actual == ALL_TABLES)


def table_acl(db):
    return db.sql("""select c.relname,a.grantee,a.privilege_type,a.is_grantable
      from pg_class c cross join lateral aclexplode(c.relacl) a
      where c.relnamespace='public'::regnamespace and c.relkind='r' order by 1,2,3,4""")


def data_fingerprints(db):
    return {table: db.sql(f"select count(*)::text || ':' || md5(coalesce("
            f"string_agg(row_to_json(t)::text,E'\\n' order by row_to_json(t)::text),'')) "
            f"from public.{table} t") for table in sorted(ALL_TABLES)}


def expected_privileges(table, role):
    if role == "anon":
        return {"SELECT"} if table in PUBLIC_CONTENT else set()
    if role == "authenticated":
        if table in ADMIN_CRUD:
            return {"SELECT", "INSERT", "UPDATE", "DELETE"}
        if table in {"admin_audit_logs", "system_event_logs"}:
            return {"SELECT", "INSERT"}
        return {"SELECT"} if table == "cms_revisions" else set()
    if table in RESTORE_TABLES | {"managed_cms_release_permits"}:
        return {"SELECT", "INSERT", "UPDATE"}
    if table == "translation_jobs":
        return {"SELECT", "INSERT"}
    return {"SELECT", "DELETE"} if table == "form_submission_attempts" else {"SELECT"}


def verify_acl(db):
    rows = db.sql("""select t.tablename,r.rolname,p.privilege,
      has_table_privilege(r.rolname,format('public.%I',t.tablename),p.privilege)
      from pg_tables t cross join (values('anon'),('authenticated'),('service_role')) r(rolname)
      cross join (values('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege)
      where t.schemaname='public' order by 1,2,3""")
    for row in rows.splitlines():
        table, role, privilege, granted = row.split("|")
        assert (granted == "t") == (privilege in expected_privileges(table, role)), row
    db.check(f"exact least-privilege matrix ({len(rows.splitlines())} assertions)", True)


def verify_rls(db):
    db.sql(SEED)
    for role, user in [("anon", None), ("authenticated", 5)]:
        for table, key in [("cms_pages", "page_key"), ("cms_content_entries", "slug"),
                           ("projects", "slug"), ("materials", "slug")]:
            result = db.actor(role, f"select {key} from public.{table} where {key} like 'grant-test-%' order by 1", user)
            db.check(f"{role} sees published {table}, excludes draft/deleted", result == "grant-test-public")
        db.check(f"{role} filters CMS sections by parent",
                 db.actor(role, "select count(*) from public.cms_sections where section_key='grant-test-section'", user) == "1")
        for table, filter_sql in [("project_images", "image_url like 'https://example.invalid/grant-test-%'"),
                                  ("material_images", "image_url like 'https://example.invalid/grant-test-%'")]:
            db.check(f"{role} filters {table} by parent/activity",
                     db.actor(role, f"select count(*) from public.{table} where {filter_sql}", user) == "1")
        db.check(f"{role} can read media records",
                 db.actor(role, "select count(*) from public.media_assets where file_name='grant-test.webp'", user) == "1")
        for table in INTERNAL:
            db.actor(role, f"select * from public.{table}", user, error="42501")
        if role == "authenticated":
            for table in ["leads", "quote_requests", "admin_users", "cms_revisions", "system_event_logs"]:
                db.check(f"ordinary login cannot read {table}",
                         db.actor(role, f"select count(*) from public.{table}", user) == "0")
        else:
            db.actor(role, "select * from public.leads", error="42501")
        db.actor(role, "insert into public.cms_pages(page_key,path) values ('grant-test-attack','/grant-test-attack')",
                 user, error="42501")
        if role == "authenticated":
            db.check("ordinary login cannot update published CMS",
                     db.actor(role, "with x as (update public.cms_pages set title_zh='attack' "
                              "where page_key='grant-test-public' returning id) select count(*) from x", user) == "0")
        db.check(f"{role} public homepage RPC remains callable",
                 db.actor(role, "select jsonb_typeof(public.get_public_home_bundle())", user) == "object")

    # Perform a real draft -> published update under content_editor and read it as anon.
    db.actor("authenticated", "insert into public.cms_pages(page_key,path,title_zh,status) "
             "values ('grant-test-editor','/grant-test-editor','Before','draft')", 2)
    db.check("editor-created draft remains hidden from visitors",
             db.actor("anon", "select count(*) from public.cms_pages where page_key='grant-test-editor'") == "0")
    db.actor("authenticated", "update public.cms_pages set title_zh='After',status='published' "
             "where page_key='grant-test-editor'", 2)
    db.check("editor save/publication reads back to visitors",
             db.actor("anon", "select title_zh from public.cms_pages where page_key='grant-test-editor'") == "After")
    db.check("CMS revision trigger works without granting direct revision writes",
             int(db.actor("authenticated", "select count(*) from public.cms_revisions where entity_id="
                          "(select id from public.cms_pages where page_key='grant-test-editor')", 2)) == 2)
    db.actor("authenticated", "insert into public.cms_revisions(entity_table,entity_id,action,snapshot) "
             "values ('cms_pages',gen_random_uuid(),'insert','{}')", 2, error="42501")
    db.actor("authenticated", "insert into public.media_assets(file_url,file_name) "
             "values ('https://example.invalid/editor.webp','grant-test-editor.webp')", 2)
    db.check("editor media write reads back to visitors",
             db.actor("anon", "select count(*) from public.media_assets where file_name='grant-test-editor.webp'") == "1")

    for user, aal, label in [(4, "aal2", "viewer"), (3, "aal2", "lead manager"),
                             (6, "aal2", "disabled admin"), (2, "aal1", "editor without MFA")]:
        db.actor("authenticated", "insert into public.cms_pages(page_key,path) "
                 "values ('grant-test-forbidden','/grant-test-forbidden')", user, aal, error="42501")
        db.check(f"{label} cannot write CMS", True)
    for user in [1, 2]:
        for table in INTERNAL:
            db.actor("authenticated", f"select * from public.{table}", user, error="42501")
    db.check("server-only data denied even to logged-in super admins", True)

    db.check("lead manager reads leads", db.actor("authenticated", "select count(*) from public.leads", 3) == "1")
    db.check("content editor cannot read leads", db.actor("authenticated", "select count(*) from public.leads", 2) == "0")
    db.actor("authenticated", "insert into public.leads(name,phone,message) values ('test','synthetic','test')", 3)
    db.actor("service_role", "insert into public.leads(name,phone,message) values ('edge','synthetic','test')")
    db.check("server form write succeeds without default grants", True)
    db.check("atomic attempt RPC still works for server",
             db.actor("service_role", "select public.consume_form_submission_attempt('contact',repeat('a',64),null)") == "accepted")
    db.actor("anon", "select public.consume_form_submission_attempt('contact',repeat('b',64),null)", error="42501")
    db.actor("service_role", "delete from public.form_submission_attempts where ip_hash=repeat('a',64)")
    db.check("server attempt cleanup retains required DELETE", True)
    db.actor("authenticated", "insert into public.system_event_logs(event_type,message) values ('grant_test','editor')", 2)
    db.actor("authenticated", "insert into public.system_event_logs(event_type,message) values ('grant_test','attack')", 5, error="42501")
    db.check("admin logging works, ordinary-user logging is denied", True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default="postgres:17-alpine")
    parser.add_argument("--output", type=Path, default=ROOT / "reports/explicit-table-grants/verification.json")
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ROOT):
        parser.error("Report output must belong to this project")
    report = {"status": "RUNNING", "checked_at": datetime.now(timezone.utc).isoformat(),
              "root": str(ROOT), "head": command(["git", "-C", str(ROOT), "rev-parse", "HEAD"]),
              "image": args.image, "image_id": command(["docker", "image", "inspect", "--format", "{{.Id}}", args.image]),
              "verifier_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "scope": "PostgreSQL 17 ACL/RLS with minimal Auth/Storage SQL contracts; no hosted/API/UI verification",
              "migrations": [], "checks": []}
    paths = sorted((ROOT / "supabase/migrations").glob("*.sql"))
    for path in paths:
        report["migrations"].append({"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    historical = [p for p in paths if p != MIGRATION]
    try:
        with Database(args.image, "strict", report) as db:
            replay(db, historical)
            db.actor("anon", "select * from public.cms_pages", error="42501")
            db.actor("service_role", "select * from public.media_assets", error="42501")
            db.check("missing-grant failure reproduced before patch", True)
            before = db.snapshot()
            data_before = data_fingerprints(db)
            db.sql(MIGRATION.read_text())
            db.check("RLS, function ACLs, Storage and defaults unchanged", before == db.snapshot())
            db.check("all existing application rows unchanged", data_before == data_fingerprints(db))
            verify_acl(db)
            acl = table_acl(db)
            db.sql(MIGRATION.read_text())
            db.check("migration is idempotent", acl == table_acl(db))
            verify_rls(db)
            db.sql("create table public.grant_future_probe(id uuid); alter table public.grant_future_probe enable row level security;")
            db.check("future unclassified tables remain closed",
                     db.sql("select bool_or(has_table_privilege(r,'public.grant_future_probe','SELECT')) "
                            "from unnest(array['anon','authenticated','service_role']) r") == "f")
            db.sql("alter table public.cms_pages disable row level security")
            db.sql(MIGRATION.read_text(), error="Required RLS-protected table")
            db.check("migration fails closed if a required table lacks RLS", True)
        with Database(args.image, "legacy", report) as db:
            replay(db, historical)
            old_acl = set(table_acl(db).splitlines())
            before = db.snapshot()
            data_before = data_fingerprints(db)
            db.sql(MIGRATION.read_text())
            db.check("existing installations lose no table privileges", old_acl <= set(table_acl(db).splitlines()))
            db.check("existing RLS, function ACLs, Storage and defaults unchanged", before == db.snapshot())
            db.check("all existing application rows unchanged", data_before == data_fingerprints(db))
            db.check("notification secrets remain inaccessible to browser roles",
                     db.sql("select has_table_privilege('anon','public.notification_settings','SELECT') "
                            "or has_table_privilege('authenticated','public.notification_settings','SELECT')") == "f")
        report["status"] = "PASS"
    except BaseException as exc:
        report["status"], report["error"] = "FAIL", str(exc)
        raise
    finally:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(f"{report['status']}: {len(report['checks'])} checks; {output}")


if __name__ == "__main__":
    main()

import { spawn, spawnSync } from "node:child_process";
import { readRecoveryEnv } from "./backup-env.mjs";

export const IMAGE = "public.ecr.aws/supabase/postgres:17.11.0.002";
export const schemas = ["public", "auth", "storage", "supabase_migrations"];
export const excludedRuntimeData = ["sessions", "refresh_tokens", "mfa_amr_claims", "mfa_challenges", "flow_state", "one_time_tokens", "oauth_authorizations", "oauth_client_states", "oauth_consents"];

export async function productionConnection(root, options = {}) {
  const env = readRecoveryEnv(root, options);
  const workflow = (await import("node:fs")).readFileSync(`${root}/.github/workflows/supabase-content-publish-r3.yml`, "utf8");
  const refs = [...new Set([...workflow.matchAll(/--project-ref\s+([a-z0-9]{20})\b/g)].map((match) => match[1]))];
  if (refs.length !== 1 || new URL(env.VITE_SUPABASE_URL).hostname !== `${refs[0]}.supabase.co`
    || env.APP_ENV !== "production" || !env.SUPABASE_DB_PASSWORD || !env.SUPABASE_ACCESS_TOKEN) {
    throw new Error("Private production environment does not match the governed project.");
  }
  const response = await fetch(`https://api.supabase.com/v1/projects/${refs[0]}/config/database/pooler`, {
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Database connection metadata rejected (${response.status}).`);
  const candidates = await response.json();
  const connection = candidates.find((item) => item.database_type === "PRIMARY");
  if (!connection || !connection.db_host || !connection.db_user) throw new Error("Primary database connection not available.");
  return { env, ref: refs[0], connection, cloud: options.cloud === true };
}

export function postgresInvocation(command, args, { cloud = false, connected = false } = {}) {
  if (!["psql", "pg_dump", "pg_restore"].includes(command)) throw new Error("Unsupported recovery tool.");
  return cloud ? { executable: `/usr/lib/postgresql/17/bin/${command}`, args } : {
    executable: "docker", args: ["run", "--rm", "-i",
      ...(connected ? ["--env", "PGPASSWORD", "--env", "PGSSLMODE"] : []), IMAGE, command, ...args] };
}

export function productionCommand(context, command, args, input) {
  const { env, connection } = context;
  const invocation = postgresInvocation(command, ["-h", connection.db_host, "-p", "5432", "-U", connection.db_user, "-d", connection.db_name, ...args], { cloud: context.cloud, connected: true });
  const result = spawnSync(invocation.executable, invocation.args, {
    env: { ...process.env, PGPASSWORD: env.SUPABASE_DB_PASSWORD, PGSSLMODE: "require" },
    input, maxBuffer: 256 * 1024 * 1024, timeout: 300000,
  });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? "timeout"}); private output withheld.`);
  return result.stdout;
}

export async function openSnapshot(context) {
  const { connection, env } = context;
  const invocation = postgresInvocation("psql", ["-XAt", "-v", "ON_ERROR_STOP=1", "-h", connection.db_host, "-p", "5432", "-U", connection.db_user, "-d", connection.db_name], { cloud: context.cloud, connected: true });
  const child = spawn(invocation.executable, invocation.args, {
    env: { ...process.env, PGPASSWORD: env.SUPABASE_DB_PASSWORD, PGSSLMODE: "require" }, stdio: ["pipe", "pipe", "pipe"],
  });
  child.stderr.resume();
  const snapshot = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error("Snapshot export timed out.")); }, 30000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/\b[0-9A-F]{8}-[0-9A-F]{8}-[0-9]+\b/i);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    child.on("error", () => { clearTimeout(timer); reject(new Error("Snapshot process failed.")); });
    child.on("exit", () => { clearTimeout(timer); reject(new Error("Snapshot export failed.")); });
    child.stdin.write("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\nSELECT pg_export_snapshot();\n");
  });
  return { snapshot, close: () => { child.stdin.end("ROLLBACK;\n"); } };
}

export function readSnapshot(context, snapshot, sql) {
  return JSON.parse(productionCommand(context, "psql", ["-XqAt", "-v", "ON_ERROR_STOP=1"],
    `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET TRANSACTION SNAPSHOT '${snapshot}';\n${sql}\nCOMMIT;`)
    .toString().trim());
}

export const tableListSQL = `SELECT coalesce(json_agg(json_build_object('schema',schemaname,'table',tablename) ORDER BY schemaname,tablename),'[]') FROM pg_tables WHERE schemaname IN (${schemas.map((name) => `'${name}'`).join(",")});`;
const ident = (value) => `"${value.replaceAll('"', '""')}"`;
export function normalizeStructure(structure) {
  const positions = new Map();
  return { ...structure, columns: structure.columns?.map((column) => {
    const key = `${column.table_schema}.${column.table_name}`;
    const ordinal_position = (positions.get(key) || 0) + 1;
    positions.set(key, ordinal_position);
    // pg_dump retains visible column order but does not recreate dropped-column gaps.
    return { ...column, ordinal_position };
  }) };
}
export const tableFingerprintSQL = (tables) => `SELECT json_agg(q ORDER BY q.schema,q.table) FROM (${tables.map(({ schema, table }) =>
  `SELECT '${schema}'::text AS schema,'${table}'::text AS table,count(*)::int AS rows,md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),'')) AS checksum FROM ${ident(schema)}.${ident(table)} t`).join(" UNION ALL ")}) q;`;

export const schemaFingerprintSQL = `SELECT json_build_object(
 'columns',(SELECT json_agg(q ORDER BY q.table_schema,q.table_name,q.ordinal_position) FROM (SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default,is_generated,generation_expression FROM information_schema.columns WHERE table_schema IN ('public','auth','storage')) q),
 'constraints',(SELECT json_agg(q ORDER BY q.schema,q.table,q.name) FROM (SELECT n.nspname AS schema,c.relname AS table,k.conname AS name,pg_get_constraintdef(k.oid) AS definition,k.convalidated AS validated FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','auth','storage')) q),
 'indexes',(SELECT json_agg(q ORDER BY q.schemaname,q.tablename,q.indexname) FROM (SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname IN ('public','auth','storage')) q),
 'rls',(SELECT json_agg(q ORDER BY q.schema,q.table) FROM (SELECT n.nspname AS schema,c.relname AS table,c.relrowsecurity AS enabled,c.relforcerowsecurity AS forced FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','auth','storage') AND c.relkind IN ('r','p')) q),
 'policies',(SELECT json_agg(q ORDER BY q.schemaname,q.tablename,q.policyname) FROM (SELECT * FROM pg_policies WHERE schemaname IN ('public','auth','storage')) q),
 'triggers',(SELECT json_agg(q ORDER BY q.schema,q.table,q.name) FROM (SELECT n.nspname AS schema,c.relname AS table,t.tgname AS name,pg_get_triggerdef(t.oid) AS definition,t.tgenabled AS enabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname IN ('public','auth','storage')) q),
 'functions',(SELECT json_agg(q ORDER BY q.schema,q.name,q.arguments) FROM (SELECT n.nspname AS schema,p.proname AS name,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','auth','storage') AND p.prokind='f') q)
);`;

-- R3 managed CMS release permits. This ledger is not a permit issuer: only an
-- independently authenticated server-side issuer may insert rows. No public or
-- authenticated user may read, claim, or mutate permits.
create table if not exists public.managed_cms_release_permits (
  permit_id uuid primary key,
  task_id text not null,
  action_id text not null,
  action_class text not null check (action_class = 'cms_write'),
  operation text not null check (operation in ('publish', 'rollback')),
  scope text not null check (scope like 'flashcast.com.my:%'),
  candidate_version text not null,
  record_id uuid not null,
  slug text not null,
  expected_updated_at timestamptz not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  rollback_payload_sha256 text check (rollback_payload_sha256 ~ '^[0-9a-f]{64}$'),
  parent_permit_id uuid references public.managed_cms_release_permits(permit_id),
  github_repository_id bigint not null check (github_repository_id = 1248188229),
  github_workflow_ref text not null,
  github_workflow_sha text not null check (github_workflow_sha ~ '^[0-9a-f]{40}$'),
  github_actor_id bigint not null check (github_actor_id > 0),
  github_run_id bigint check (github_run_id > 0),
  github_run_attempt integer check (github_run_attempt > 0),
  qa_receipt_id text not null,
  operations_decision_id text not null,
  policy_decision_id text not null,
  issuer_evidence_sha256 text not null check (issuer_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'issued' check (status in ('issued', 'claimed', 'writing', 'completed', 'uncertain', 'revoked')),
  claimed_at timestamptz,
  writing_at timestamptz,
  completed_at timestamptz,
  saved_id uuid,
  saved_updated_at timestamptz,
  check (expires_at > issued_at),
  check ((operation = 'publish' and parent_permit_id is null and rollback_payload_sha256 is not null)
      or (operation = 'rollback' and parent_permit_id is not null and rollback_payload_sha256 is null)),
  check ((github_run_id is null) = (github_run_attempt is null))
);

-- A failed or uncertain write cannot be hidden by issuing another permit for
-- the same exact action. Only a pre-write revoked permit may be replaced.
create unique index if not exists managed_cms_release_permits_active_action_idx
  on public.managed_cms_release_permits (task_id, action_id, candidate_version)
  where status <> 'revoked';

create index if not exists managed_cms_release_permits_run_idx
  on public.managed_cms_release_permits (github_run_id, github_run_attempt);

alter table public.managed_cms_release_permits enable row level security;
revoke all on public.managed_cms_release_permits from public, anon, authenticated;
grant select, insert, update on public.managed_cms_release_permits to service_role;

-- Atomic first claim: every identity field must match the trusted issuer row.
-- Zero returned rows means unknown, expired, revoked, mismatched or already used.
create or replace function public.claim_managed_cms_release_permit(
  p_permit_id uuid,
  p_task_id text,
  p_action_id text,
  p_action_class text,
  p_operation text,
  p_scope text,
  p_candidate_version text,
  p_record_id uuid,
  p_slug text,
  p_expected_updated_at timestamptz,
  p_payload_sha256 text,
  p_github_repository_id bigint,
  p_github_workflow_ref text,
  p_github_workflow_sha text,
  p_github_actor_id bigint,
  p_github_run_id bigint,
  p_github_run_attempt integer
) returns setof public.managed_cms_release_permits
language sql security definer set search_path = ''
as $$
  update public.managed_cms_release_permits
     set status = 'claimed', claimed_at = now(),
         github_run_id = p_github_run_id,
         github_run_attempt = p_github_run_attempt
   where permit_id = p_permit_id
     and status = 'issued'
     and expires_at > now()
     and task_id = p_task_id
     and action_id = p_action_id
     and action_class = p_action_class
     and operation = p_operation
     and scope = p_scope
     and candidate_version = p_candidate_version
     and record_id = p_record_id
     and slug = p_slug
     and expected_updated_at = p_expected_updated_at
     and payload_sha256 = p_payload_sha256
     and github_repository_id = p_github_repository_id
     and github_workflow_ref = p_github_workflow_ref
     and github_workflow_sha = p_github_workflow_sha
     and github_actor_id = p_github_actor_id
     and github_run_id is null
     and github_run_attempt is null
     and p_github_run_id > 0
     and p_github_run_attempt > 0
  returning *;
$$;

-- A claim permits at most one write attempt. A crash after this transition
-- leaves the permit in 'writing'; operators must reconcile CMS state before
-- issuing a distinct permit. Replaying this permit never writes again.
create or replace function public.begin_managed_cms_release_write(
  p_permit_id uuid,
  p_github_run_id bigint,
  p_github_run_attempt integer
) returns setof public.managed_cms_release_permits
language sql security definer set search_path = ''
as $$
  update public.managed_cms_release_permits
     set status = 'writing', writing_at = now()
   where permit_id = p_permit_id
     and status = 'claimed'
     and expires_at > now()
     and github_run_id = p_github_run_id
     and github_run_attempt = p_github_run_attempt
  returning *;
$$;

create or replace function public.finish_managed_cms_release_write(
  p_permit_id uuid,
  p_github_run_id bigint,
  p_github_run_attempt integer,
  p_saved_id uuid,
  p_saved_updated_at timestamptz,
  p_success boolean
) returns setof public.managed_cms_release_permits
language sql security definer set search_path = ''
as $$
  update public.managed_cms_release_permits
     set status = case when p_success then 'completed' else 'uncertain' end,
         completed_at = now(),
         saved_id = case when p_success then p_saved_id else null end,
         saved_updated_at = case when p_success then p_saved_updated_at else null end
   where permit_id = p_permit_id
     and status = 'writing'
     and github_run_id = p_github_run_id
     and github_run_attempt = p_github_run_attempt
     and (not p_success or (p_saved_id = record_id and p_saved_updated_at is not null))
  returning *;
$$;

-- Only pre-write permits may be revoked. A write/uncertain/completed permit
-- remains immutable so operators must reconcile the CMS row before recovery.
create or replace function public.revoke_managed_cms_release_permit(p_permit_id uuid)
returns setof public.managed_cms_release_permits
language sql security definer set search_path = ''
as $$
  update public.managed_cms_release_permits
     set status = 'revoked'
   where permit_id = p_permit_id and status in ('issued', 'claimed')
  returning *;
$$;

revoke all on function public.claim_managed_cms_release_permit(uuid,text,text,text,text,text,text,uuid,text,timestamptz,text,bigint,text,text,bigint,bigint,integer) from public, anon, authenticated;
revoke all on function public.begin_managed_cms_release_write(uuid,bigint,integer) from public, anon, authenticated;
revoke all on function public.finish_managed_cms_release_write(uuid,bigint,integer,uuid,timestamptz,boolean) from public, anon, authenticated;
revoke all on function public.revoke_managed_cms_release_permit(uuid) from public, anon, authenticated;
grant execute on function public.claim_managed_cms_release_permit(uuid,text,text,text,text,text,text,uuid,text,timestamptz,text,bigint,text,text,bigint,bigint,integer) to service_role;
grant execute on function public.begin_managed_cms_release_write(uuid,bigint,integer) to service_role;
grant execute on function public.finish_managed_cms_release_write(uuid,bigint,integer,uuid,timestamptz,boolean) to service_role;
grant execute on function public.revoke_managed_cms_release_permit(uuid) to service_role;

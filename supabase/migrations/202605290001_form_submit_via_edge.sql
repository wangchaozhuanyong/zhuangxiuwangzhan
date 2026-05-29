-- Website forms must go through submit-lead Edge Function (service role), not anon insert.

drop policy if exists "Website can submit leads" on public.leads;
drop policy if exists "Website can submit quote requests" on public.quote_requests;

create table if not exists public.form_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  ip_hash text not null,
  phone_hash text,
  created_at timestamptz not null default now()
);

create index if not exists form_submission_attempts_ip_created_idx
  on public.form_submission_attempts (ip_hash, created_at desc);

create index if not exists form_submission_attempts_phone_created_idx
  on public.form_submission_attempts (phone_hash, created_at desc)
  where phone_hash is not null;

alter table public.form_submission_attempts enable row level security;

-- No policies: only service role (Edge Functions) can read/write.

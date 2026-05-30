-- Security and operations hardening for the professional admin baseline.
-- Adds a lightweight system event log and aligns storage limits with the admin uploader.

create table if not exists public.system_event_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'info',
  source text not null default 'frontend',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint system_event_logs_severity_check check (severity in ('debug', 'info', 'warn', 'error', 'critical')),
  constraint system_event_logs_source_check check (source ~ '^[a-z0-9][a-z0-9_-]*$')
);

create index if not exists system_event_logs_created_idx on public.system_event_logs(created_at desc);
create index if not exists system_event_logs_severity_idx on public.system_event_logs(severity, created_at desc);
create index if not exists system_event_logs_event_type_idx on public.system_event_logs(event_type, created_at desc);

alter table public.system_event_logs enable row level security;

drop policy if exists "Admins can read system event logs" on public.system_event_logs;
create policy "Admins can read system event logs"
on public.system_event_logs for select
using (public.is_admin());

drop policy if exists "Admins can create system event logs" on public.system_event_logs;
create policy "Admins can create system event logs"
on public.system_event_logs for insert
with check (public.is_admin());

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'site-images';

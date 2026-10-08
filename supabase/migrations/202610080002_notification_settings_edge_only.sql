-- Secrets are read/written by the existing authenticated Edge adapter only.
-- No client needs direct access to this table, including super admins.
drop policy if exists "Admins can read notification settings" on public.notification_settings;
drop policy if exists "Admins can manage notification settings" on public.notification_settings;
drop policy if exists "Super admins can manage notification settings" on public.notification_settings;
revoke all on table public.notification_settings from anon, authenticated;
grant select, insert, update on table public.notification_settings to service_role;

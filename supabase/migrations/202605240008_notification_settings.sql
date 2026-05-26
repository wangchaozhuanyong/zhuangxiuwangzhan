create table if not exists public.notification_settings (
  id text primary key default 'default' check (id = 'default'),
  telegram_enabled boolean not null default false,
  telegram_bot_token text,
  telegram_chat_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "Admins can read notification settings" on public.notification_settings;
create policy "Admins can read notification settings" on public.notification_settings
  for select using (public.is_admin());

drop policy if exists "Admins can manage notification settings" on public.notification_settings;
create policy "Admins can manage notification settings" on public.notification_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists touch_notification_settings_updated_at on public.notification_settings;
create trigger touch_notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function public.touch_updated_at();

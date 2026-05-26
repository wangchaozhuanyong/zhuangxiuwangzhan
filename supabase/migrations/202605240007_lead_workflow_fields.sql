alter type public.lead_status add value if not exists 'site_visit_scheduled';
alter type public.lead_status add value if not exists 'spam';

alter type public.quote_status add value if not exists 'contacted';
alter type public.quote_status add value if not exists 'closed';

alter table public.quote_requests
  add column if not exists notes text;

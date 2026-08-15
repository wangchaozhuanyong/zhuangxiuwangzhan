-- Managed growth attribution fields for contact leads and quote requests.
-- Additive only: existing rows remain valid and default to unclassified quality.

alter table public.leads
  add column if not exists first_touch_source text,
  add column if not exists first_touch_medium text,
  add column if not exists first_touch_campaign text,
  add column if not exists first_touch_term text,
  add column if not exists first_touch_content text,
  add column if not exists last_touch_source text,
  add column if not exists last_touch_medium text,
  add column if not exists last_touch_campaign text,
  add column if not exists last_touch_term text,
  add column if not exists last_touch_content text,
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists landing_page text,
  add column if not exists lead_quality text not null default 'unclassified',
  add column if not exists qualified_at timestamptz;

alter table public.quote_requests
  add column if not exists first_touch_source text,
  add column if not exists first_touch_medium text,
  add column if not exists first_touch_campaign text,
  add column if not exists first_touch_term text,
  add column if not exists first_touch_content text,
  add column if not exists last_touch_source text,
  add column if not exists last_touch_medium text,
  add column if not exists last_touch_campaign text,
  add column if not exists last_touch_term text,
  add column if not exists last_touch_content text,
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists landing_page text,
  add column if not exists lead_quality text not null default 'unclassified',
  add column if not exists qualified_at timestamptz;

alter table public.leads
  drop constraint if exists leads_lead_quality_check,
  add constraint leads_lead_quality_check
    check (lead_quality in ('unclassified', 'high', 'medium', 'low', 'spam'));

alter table public.quote_requests
  drop constraint if exists quote_requests_lead_quality_check,
  add constraint quote_requests_lead_quality_check
    check (lead_quality in ('unclassified', 'high', 'medium', 'low', 'spam'));

create index if not exists leads_growth_quality_created_idx
  on public.leads(lead_quality, created_at desc);

create index if not exists quote_requests_growth_quality_created_idx
  on public.quote_requests(lead_quality, created_at desc);

create index if not exists leads_growth_gclid_idx
  on public.leads(gclid)
  where gclid is not null;

create index if not exists quote_requests_growth_gclid_idx
  on public.quote_requests(gclid)
  where gclid is not null;

alter table public.materials
  add column if not exists subcategory text,
  add column if not exists material_type text,
  add column if not exists color text,
  add column if not exists texture text,
  add column if not exists recommended_pairing_zh text,
  add column if not exists recommended_pairing_en text,
  add column if not exists note_zh text,
  add column if not exists note_en text;

alter table public.service_areas
  add column if not exists property_types text[] default '{}',
  add column if not exists common_needs text[] default '{}',
  add column if not exists construction_notes_zh text,
  add column if not exists construction_notes_en text,
  add column if not exists projects jsonb default '[]'::jsonb,
  add column if not exists faqs_zh jsonb default '[]'::jsonb,
  add column if not exists faqs_en jsonb default '[]'::jsonb;

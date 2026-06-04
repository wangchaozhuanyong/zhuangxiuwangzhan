import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SitemapClient = SupabaseClient;

export type SlugRow = {
  slug: string;
};

export type SitemapContentSlugs = {
  projects: SlugRow[];
  posts: SlugRow[];
  materials: SlugRow[];
  areas: SlugRow[];
  landingPages: SlugRow[];
  services: SlugRow[];
};

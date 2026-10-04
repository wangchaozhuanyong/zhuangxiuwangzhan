// Allow the app test compiler to check the shared Deno sitemap source.
// These declarations have no runtime output; Supabase retains its full SDK type.
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export type SupabaseClient = import("@supabase/supabase-js").SupabaseClient;
}

declare const Deno: { env: { get(name: string): string | undefined } };

import { useInteractionQuery } from "@/hooks/useInteractionQuery";
import type { Language } from "@/i18n/routes";
import { getPublishedCtaBlock } from "@/lib/publicCta";
import { publicContentQueryKeys } from "@/lib/publicContentQueryKeys";
import { isSupabaseConfigured } from "@/lib/supabaseConfig";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";

export function usePublishedCtaBlock(language: Language, blockKey: string, options?: { enabled?: boolean }) {
  return useInteractionQuery({
    queryKey: publicContentQueryKeys.ctaBlock.key(language, blockKey),
    queryFn: ({ signal }) => getPublishedCtaBlock(language, blockKey, signal),
    enabled: (options?.enabled ?? true) && isSupabaseConfigured,
    retry: false,
    staleTime: INTERACTION_POLICY.publicStaleTime,
    gcTime: INTERACTION_POLICY.gcTime,
    refetchOnWindowFocus: true,
  });
}

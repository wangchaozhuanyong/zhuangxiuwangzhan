import {
  invokeGenerateEnglishContent,
  type GenerateEnglishContentRequest,
  type GenerateEnglishContentResponse,
} from "@/backend/modules/system/repository/translationRepository";

export type AdminTranslationResult = GenerateEnglishContentResponse & { publicSyncPending: boolean };

export async function generateAdminEnglishContent(input: GenerateEnglishContentRequest): Promise<AdminTranslationResult> {
  const result = await invokeGenerateEnglishContent(input);
  const delivery = result.cache_invalidation;
  const publicSyncPending = Boolean(delivery && (delivery.ok !== true || delivery.edge_purge_requested?.ok !== true));
  return { ...result, publicSyncPending };
}

import {
  invokeGenerateEnglishContent,
  type GenerateEnglishContentRequest,
} from "@/backend/modules/system/repository/translationRepository";

export function generateAdminEnglishContent(input: GenerateEnglishContentRequest) {
  return invokeGenerateEnglishContent(input);
}

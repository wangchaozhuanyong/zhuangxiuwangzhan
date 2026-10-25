export { localizedContentValue } from "./localizedContentValue";
import { hasCompleteMalayContent } from "../lib/publicContentQualification.mjs";


export const isMalayContentReady = (value: object | null | undefined) =>
  (value as { translationComplete?: boolean } | null | undefined)?.translationComplete !== false;

/** Old records stay readable while Malay translations are added. Never copy fallback into CMS fields. */

/** SEO alternates require translated metadata and the actual primary body. */
export function hasMalayContent(row: Record<string, unknown> | null | undefined): boolean {
  return hasCompleteMalayContent(row);
}

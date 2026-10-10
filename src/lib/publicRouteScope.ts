import { getLanguageFromPath, stripLanguagePrefix } from "@/i18n/routes";

/** Language prefixes change presentation, while detail slugs retain business identity. */
export const isSamePublicBusinessPath = (previous: string, next: string) =>
  stripLanguagePrefix(previous) === stripLanguagePrefix(next);

export const isPublicLanguageUpdate = (previous: string, next: string) => {
  const previousLanguage = getLanguageFromPath(previous);
  const nextLanguage = getLanguageFromPath(next);
  return !!previousLanguage && !!nextLanguage && previousLanguage !== nextLanguage
    && isSamePublicBusinessPath(previous, next);
};

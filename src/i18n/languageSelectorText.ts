import { languageTag, type Language } from "./languageDetection";
import selectorText from "./languageSelectorText.json";

export const languageSelectorText = selectorText;
export const languageOptions = (Object.keys(selectorText) as Language[]).map(code => ({
  code, tag: languageTag(code),
}));

import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";

/**
 * Translation hook. Returns a function t(key) that resolves
 * the current language string. Falls back to English if missing.
 */
export const useT = () => {
  const { language } = useLanguage();

  return (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };
};

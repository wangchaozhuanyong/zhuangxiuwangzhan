import { createContext, useContext, useState, useLayoutEffect, ReactNode } from "react";
import { getDefaultLanguage, getLanguageFromPath, Language, rememberLanguage } from "@/i18n/routes";
import { languageTag } from "@/i18n/languageDetection";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return getLanguageFromPath() || getDefaultLanguage();
  });

  useLayoutEffect(() => {
    rememberLanguage(language);
    document.documentElement.lang = languageTag(language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

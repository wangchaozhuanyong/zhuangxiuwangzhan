import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDefaultLanguage, getLanguageFromPath, Language, rememberLanguage } from "@/i18n/routes";

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

  useEffect(() => {
    rememberLanguage(language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

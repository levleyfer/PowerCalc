import { createContext, useContext, useMemo } from "react";
import { translations } from "./translations/index.js";


const DEFAULT_LANGUAGE = "en";

const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  direction: "ltr",
  t: (key) => key,
});

export function I18nProvider({ language = DEFAULT_LANGUAGE, children }) {
  const value = useMemo(() => {
    const safeLanguage = translations[language] ? language : DEFAULT_LANGUAGE;
    const dict = translations[safeLanguage];

    return {
      language: safeLanguage,
      direction: safeLanguage === "he" ? "rtl" : "ltr",

      // Looks for the key in the selected language.
      // If missing, falls back to English.
      // If still missing, returns the key itself.
      t: (key) => dict[key] ?? translations.en[key] ?? key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

import { useEffect, useState } from "react";

import type { Language } from "@/lib/clinic-copy";

const LANGUAGE_KEY = "dental-clinic-language";

export function useClinicLanguage() {
  const [language, setLanguage] = useState<Language>("ar");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage === "ar" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  return { language, setLanguage };
}
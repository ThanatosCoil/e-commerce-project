import { useState, useEffect } from "react";

type Language = "en" | "ru";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("en");

  // Загрузка предпочтений языка из localStorage при инициализации
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ru")) {
      setLanguage(savedLanguage);
    } else {
      // Если настройки нет, можно попробовать использовать язык браузера
      const browserLanguage = navigator.language.split("-")[0];
      if (browserLanguage === "ru") {
        setLanguage("ru");
      }
    }
  }, []);

  // Сохранение языка в localStorage при изменении
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  return {
    language,
    changeLanguage,
    isEnglish: language === "en",
    isRussian: language === "ru",
  };
}

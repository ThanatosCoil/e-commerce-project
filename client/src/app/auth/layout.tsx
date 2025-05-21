"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// Константа для ключа localStorage
const STORED_THEME_KEY = "user-stored-theme";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme, theme } = useTheme();

  // Принудительно устанавливаем светлую тему на страницах авторизации
  useEffect(() => {
    // Сохраняем текущую тему если она ещё не сохранена или отличается от текущей
    if (typeof window !== "undefined" && theme && theme !== "light") {
      const currentStored = localStorage.getItem(STORED_THEME_KEY);

      // Сохраняем только если ещё не сохранили или тема изменилась
      if (!currentStored || currentStored !== theme) {
        localStorage.setItem(STORED_THEME_KEY, theme);
      }
    }

    // Принудительно устанавливаем светлую тему для страниц авторизации
    setTheme("light");

    // При размонтировании восстанавливаем предыдущую тему
    return () => {
      if (typeof window !== "undefined") {
        const savedTheme = localStorage.getItem(STORED_THEME_KEY);
        if (savedTheme) {
          setTheme(savedTheme);
        }
      }
    };
  }, [setTheme, theme]);

  return <>{children}</>;
}

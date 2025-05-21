"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAccessTokenFromCookie,
  isTokenExpiringSoon,
} from "@/utils/tokenUtils";

/**
 * Компонент для автоматического обновления токена авторизации
 * Проверяет срок действия токена при первой загрузке страницы
 * и обновляет его, если он скоро истечет или требуется синхронизация CSRF токена
 */
export default function TokenRefresher() {
  const { isLoggedIn, refreshAccessToken } = useAuth();

  // Проверка и обновление токена при первой загрузке страницы
  useEffect(() => {
    const checkToken = async () => {
      if (isLoggedIn) {
        const token = getAccessTokenFromCookie();

        // Получаем информацию о последнем обновлении токена
        const lastRefresh = localStorage.getItem("lastTokenRefresh");
        const lastRefreshTime = lastRefresh ? parseInt(lastRefresh) : 0;
        const currentTime = Date.now();

        // Обновляем токен, если он скоро истечет (в ближайшие 5 минут)
        // ИЛИ если с момента последнего обновления прошло более 30 секунд
        // (это помогает с синхронизацией токена в новых окнах без частых запросов)
        if (
          isTokenExpiringSoon(token, 5) ||
          currentTime - lastRefreshTime > 30000
        ) {
          console.log("Refreshing token on page load for CSRF synchronization");
          await refreshAccessToken();
          // Запоминаем время последнего обновления
          localStorage.setItem("lastTokenRefresh", currentTime.toString());
        }
      }
    };

    checkToken();
  }, [isLoggedIn, refreshAccessToken]);

  // Компонент ничего не рендерит
  return null;
}

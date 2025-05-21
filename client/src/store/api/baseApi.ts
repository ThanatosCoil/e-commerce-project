import {
  fetchBaseQuery,
  FetchArgs,
  BaseQueryApi,
} from "@reduxjs/toolkit/query/react";
import { getCsrfHeaders, setCsrfToken } from "@/utils/csrfToken";
import { API_ROUTES } from "@/utils/api";

/**
 * Список публичных эндпоинтов, которые не требуют CSRF защиты
 */
export const publicEndpoints = [
  // Аутентификация
  "login",
  "register",
  "refreshToken",
  "forgotPassword",
  "resetPassword",
  "validateResetToken",

  // Продукты - публичные эндпоинты
  "getLatestProducts",
  "getPublicProducts",

  // Отзывы - публичные эндпоинты
  "getProductReviews",
];

// Переменная для отслеживания попыток обновления CSRF токена
// Глобальная переменная, чтобы избежать бесконечных циклов
let csrfRefreshAttempts = 0;
const MAX_CSRF_REFRESH_ATTEMPTS = 3; // Максимальное количество попыток

// Сбрасываем счетчик попыток каждые 5 минут
setInterval(() => {
  csrfRefreshAttempts = 0;
}, 5 * 60 * 1000);

/**
 * Создает базовый fetchBaseQuery с включенной CSRF защитой
 * @param baseUrl Базовый URL для API
 * @returns Настроенный fetchBaseQuery
 */
export const createBaseQueryWithCSRF = (baseUrl: string) => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    credentials: "include", // Включаем cookies
    prepareHeaders: (headers, { endpoint, type }) => {
      if (endpoint && !publicEndpoints.includes(endpoint as string)) {
        // Определяем, является ли запрос FormData запросом
        const isFormDataRequest =
          (type === "mutation" && endpoint === "createProduct") ||
          "updateProduct" ||
          "addFeatureBanners";

        const csrfHeaders = getCsrfHeaders({
          includeContentType: !isFormDataRequest,
        });

        Object.entries(csrfHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });
      }
      return headers;
    },
  });

  // Создаем расширенный baseQuery, который обрабатывает ошибки CSRF токена
  return async (
    args: string | FetchArgs,
    api: BaseQueryApi,
    extraOptions?: any
  ) => {
    let result = await baseQuery(args, api, extraOptions);

    // Если получаем ошибку 403 с сообщением "Invalid CSRF token" или "CSRF token is required"
    if (
      result.error &&
      result.error.status === 403 &&
      typeof result.error.data === "object" &&
      result.error.data &&
      "message" in result.error.data &&
      (result.error.data.message === "Invalid CSRF token" ||
        result.error.data.message === "CSRF token is required") &&
      csrfRefreshAttempts < MAX_CSRF_REFRESH_ATTEMPTS
    ) {
      // Увеличиваем счетчик попыток
      csrfRefreshAttempts++;

      console.log(
        `CSRF token error detected, attempting refresh (attempt ${csrfRefreshAttempts}/${MAX_CSRF_REFRESH_ATTEMPTS})`
      );

      // Обновляем токен
      const refreshResult = await baseQuery(
        {
          url: `${API_ROUTES.AUTH}/refresh-token`,
          method: "POST",
        },
        api,
        extraOptions
      );

      // Если обновление прошло успешно
      if (refreshResult.data) {
        // Сохраняем новый CSRF токен
        if (
          typeof refreshResult.data === "object" &&
          refreshResult.data &&
          "csrfToken" in refreshResult.data
        ) {
          setCsrfToken(refreshResult.data.csrfToken as string);

          // Записываем время последнего обновления токена для синхронизации между вкладками
          localStorage.setItem("lastTokenRefresh", Date.now().toString());

          // Сбрасываем счетчик при успешном обновлении
          csrfRefreshAttempts = 0;

          console.log(
            "CSRF token refreshed successfully, retrying original request"
          );
        }

        // Повторяем исходный запрос с новым токеном
        return baseQuery(args, api, extraOptions);
      } else {
        console.error("Failed to refresh CSRF token");
      }
    }

    return result;
  };
};

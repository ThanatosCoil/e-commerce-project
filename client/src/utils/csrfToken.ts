// Утилиты для работы с CSRF-токеном

// Глобальная переменная для хранения CSRF-токена
let csrfToken: string | null = null;

// Константа для имени ключа в localStorage
const CSRF_TOKEN_KEY = "csrf-token";
// Константа для ключа срока истечения токена
const CSRF_TOKEN_EXPIRY_KEY = "csrf-token-expires";
// Срок действия токена в миллисекундах (24 часа)
const CSRF_TOKEN_TTL = 24 * 60 * 60 * 1000;

export const setCsrfToken = (token: string): void => {
  csrfToken = token;
  // Используем localStorage вместо sessionStorage чтобы токен сохранялся
  // между вкладками/окнами и был доступен во всех контекстах браузера
  try {
    localStorage.setItem(CSRF_TOKEN_KEY, token);

    // Устанавливаем срок действия токена (24 часа от текущего момента)
    const expiry = Date.now() + CSRF_TOKEN_TTL;
    localStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, expiry.toString());

    // Отправляем событие синхронизации для других вкладок/окон
    if (typeof window !== "undefined") {
      // Используем localStorage событие для оповещения других вкладок
      const event = new StorageEvent("storage", {
        key: CSRF_TOKEN_KEY,
        newValue: token,
        url: window.location.href,
        storageArea: localStorage,
      });

      // Для дополнительной совместимости отправляем кастомное событие
      window.dispatchEvent(event);
    }
  } catch (e) {
    console.error("Error storing CSRF token in localStorage:", e);
  }
};

export const getCsrfToken = (): string | null => {
  // Если токен есть в памяти, возвращаем его
  if (csrfToken) {
    return csrfToken;
  }

  // Если токена нет в памяти, пробуем получить из localStorage
  try {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(CSRF_TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);

      // Проверяем срок действия токена
      const isExpired = tokenExpiry && parseInt(tokenExpiry) < Date.now();

      if (isExpired) {
        // Если токен истек, удаляем его
        localStorage.removeItem(CSRF_TOKEN_KEY);
        localStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
        return null;
      }

      if (storedToken) {
        csrfToken = storedToken;
        return storedToken;
      }
    }
  } catch (e) {
    console.error("Error getting CSRF token from localStorage:", e);
  }

  return null;
};

export const clearCsrfToken = (): void => {
  csrfToken = null;
  try {
    localStorage.removeItem(CSRF_TOKEN_KEY);
    localStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
    // Очищаем также информацию о последнем обновлении токена
    localStorage.removeItem("lastTokenRefresh");
  } catch (e) {
    console.error("Error removing CSRF token from localStorage:", e);
  }
};

export const getCsrfHeaders = (options: {
  includeContentType?: boolean;
}): Record<string, string> => {
  const { includeContentType = true } = options;

  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = getCsrfToken();
  if (token) {
    headers["X-CSRF-Token"] = token;
  }

  return headers;
};

// Добавляем прослушиватель события storage, чтобы обновлять токен
// при изменении в других вкладках. Вызывается при инициализации приложения
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === CSRF_TOKEN_KEY) {
      if (event.newValue) {
        csrfToken = event.newValue;
      } else {
        csrfToken = null;
      }
    }
  });
}

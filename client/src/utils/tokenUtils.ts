/**
 * Утилиты для работы с токенами
 */

export function decodeJwt(token: string) {
  try {
    // Разделяем токен на части
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // Декодируем payload
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

export function isTokenExpiringSoon(
  token: string | null,
  thresholdMinutes: number = 5
): boolean {
  if (!token) return false;

  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return false;

    // Получаем время истечения токена
    const expirationTime = decoded.exp * 1000; // конвертируем из секунд в миллисекунды
    const currentTime = Date.now();

    // Вычисляем время до истечения в минутах
    const minutesUntilExpiration = (expirationTime - currentTime) / (1000 * 60);

    // Проверяем, истекает ли токен в ближайшее время
    return (
      minutesUntilExpiration <= thresholdMinutes && minutesUntilExpiration > 0
    );
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return false;
  }
}

export function getAccessTokenFromCookie(): string | null {
  try {
    // В браузере
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "accessToken") {
          return decodeURIComponent(value);
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting access token from cookie:", error);
    return null;
  }
}

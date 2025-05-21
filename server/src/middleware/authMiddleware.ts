import { NextFunction, Request, Response } from "express";
import { jwtVerify, JWTPayload } from "jose";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    csrfToken?: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  jwtVerify(accessToken, new TextEncoder().encode(process.env.JWT_SECRET))
    .then((res) => {
      const payload = res.payload as JWTPayload & {
        userId: string;
        email: string;
        role: string;
        csrfToken: string;
      };

      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        csrfToken: payload.csrfToken,
      };
      next();
    })
    .catch((e) => {
      console.error(e);
      res
        .status(401)
        .json({ success: false, error: "Access token is not present" });
    });
};

// Middleware для проверки CSRF-токена
export const csrfProtection = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Получаем CSRF-токен из заголовка
  const csrfToken = req.headers["x-csrf-token"];

  // Дополнительная проверка источника запроса (защита от CSRF)
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Получаем список разрешенных доменов из переменных окружения
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .filter(Boolean);

  if (allowedOrigins.length > 0) {
    // Проверка происхождения запроса (если в production)
    if (process.env.NODE_ENV === "production") {
      const isValidOrigin =
        !origin || allowedOrigins.some((allowed) => origin === allowed);
      const isValidReferer =
        !referer ||
        allowedOrigins.some((allowed) => referer.startsWith(allowed));

      if (!isValidOrigin && !isValidReferer) {
        console.warn(
          `Suspicious CSRF request: Invalid origin/referer. Origin: ${origin}, Referer: ${referer}, IP: ${req.ip}`
        );
        res
          .status(403)
          .json({ success: false, message: "Invalid request origin" });
        return;
      }
    }
  }

  if (!req.user || !req.user.csrfToken) {
    console.warn(
      `CSRF error: Missing CSRF token in user data. User ID: ${
        req.user?.userId || "unknown"
      }, IP: ${req.ip}`
    );
    res.status(403).json({ success: false, message: "CSRF token is required" });
    return;
  }

  // Проверяем соответствие токенов
  if (!csrfToken || csrfToken !== req.user.csrfToken) {
    // Логируем подробную информацию для отслеживания потенциальных атак
    console.warn(
      `CSRF error: Invalid token match. User ID: ${req.user.userId}, IP: ${req.ip}, URL: ${req.originalUrl}`
    );
    console.warn(
      `Expected token: ${
        req.user.csrfToken
          ? req.user.csrfToken.substring(0, 10) + "..."
          : "none"
      }`
    );
    console.warn(
      `Received token: ${
        typeof csrfToken === "string"
          ? csrfToken.substring(0, 10) + "..."
          : "none"
      }`
    );

    res.status(403).json({ success: false, message: "Invalid CSRF token" });
    return;
  }

  next();
};

export const isSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "SUPER_ADMIN") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }
};

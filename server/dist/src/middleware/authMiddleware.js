"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = exports.csrfProtection = exports.authenticateToken = void 0;
const jose_1 = require("jose");
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    (0, jose_1.jwtVerify)(accessToken, new TextEncoder().encode(process.env.JWT_SECRET))
        .then((res) => {
        const payload = res.payload;
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
});
exports.authenticateToken = authenticateToken;
// Middleware для проверки CSRF-токена
const csrfProtection = (req, res, next) => {
    var _a;
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
            const isValidOrigin = !origin || allowedOrigins.some((allowed) => origin === allowed);
            const isValidReferer = !referer ||
                allowedOrigins.some((allowed) => referer.startsWith(allowed));
            if (!isValidOrigin && !isValidReferer) {
                console.warn(`Suspicious CSRF request: Invalid origin/referer. Origin: ${origin}, Referer: ${referer}, IP: ${req.ip}`);
                res
                    .status(403)
                    .json({ success: false, message: "Invalid request origin" });
                return;
            }
        }
    }
    if (!req.user || !req.user.csrfToken) {
        console.warn(`CSRF error: Missing CSRF token in user data. User ID: ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || "unknown"}, IP: ${req.ip}`);
        res.status(403).json({ success: false, message: "CSRF token is required" });
        return;
    }
    // Проверяем соответствие токенов
    if (!csrfToken || csrfToken !== req.user.csrfToken) {
        // Логируем подробную информацию для отслеживания потенциальных атак
        console.warn(`CSRF error: Invalid token match. User ID: ${req.user.userId}, IP: ${req.ip}, URL: ${req.originalUrl}`);
        console.warn(`Expected token: ${req.user.csrfToken
            ? req.user.csrfToken.substring(0, 10) + "..."
            : "none"}`);
        console.warn(`Received token: ${typeof csrfToken === "string"
            ? csrfToken.substring(0, 10) + "..."
            : "none"}`);
        res.status(403).json({ success: false, message: "Invalid CSRF token" });
        return;
    }
    next();
};
exports.csrfProtection = csrfProtection;
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === "SUPER_ADMIN") {
        next();
    }
    else {
        res.status(403).json({ success: false, message: "Forbidden" });
        return;
    }
};
exports.isSuperAdmin = isSuperAdmin;

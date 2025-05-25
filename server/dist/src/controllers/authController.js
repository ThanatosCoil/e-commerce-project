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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.resetPassword = exports.validateResetToken = exports.forgotPassword = exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const server_1 = require("../server");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const email_1 = require("../config/email");
const crypto_1 = __importDefault(require("crypto"));
function generateToken(userId, email, role) {
    // Генерируем CSRF токен
    const csrfToken = crypto_1.default.randomBytes(32).toString("hex");
    const accessToken = jsonwebtoken_1.default.sign({ userId, email, role, csrfToken }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
    const refreshToken = (0, uuid_1.v4)();
    return { accessToken, refreshToken, csrfToken };
}
function setToken(res_1, accessToken_1, refreshToken_1) {
    return __awaiter(this, arguments, void 0, function* (res, accessToken, refreshToken, rememberMe = false) {
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1 * 60 * 60 * 1000, // 1 час
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 дней если remember me, иначе 7 дней
        });
    });
}
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const existingUser = yield server_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists",
            });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        const user = yield server_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
            },
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            userId: user.id,
        });
    }
    catch (error) {
        console.error("Error registering user", error);
        res.status(500).json({
            message: "Error registering user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, rememberMe = false } = req.body;
        const user = yield server_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
            return;
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
            return;
        }
        const { accessToken, refreshToken, csrfToken } = generateToken(user.id, user.email, user.role);
        // Обновляем refreshToken и rememberMe в базе данных
        yield server_1.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken,
                rememberMe,
            },
        });
        yield setToken(res, accessToken, refreshToken, rememberMe);
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            csrfToken,
        });
    }
    catch (error) {
        console.error("Error logging in", error);
        res.status(500).json({
            message: "Error logging in",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.login = login;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
        return;
    }
    try {
        const user = yield server_1.prisma.user.findFirst({
            where: {
                refreshToken,
            },
        });
        if (!user) {
            // Если refresh token не найден в базе,
            // попытаемся найти пользователя по старому токену в cookie, чтобы сбросить rememberMe
            try {
                const oldToken = req.cookies.accessToken;
                if (oldToken) {
                    const decoded = jsonwebtoken_1.default.verify(oldToken, process.env.JWT_SECRET, {
                        ignoreExpiration: true,
                    });
                    if (decoded && decoded.userId) {
                        // Сбрасываем rememberMe для этого пользователя
                        yield server_1.prisma.user.update({
                            where: { id: decoded.userId },
                            data: {
                                rememberMe: false,
                                refreshToken: null,
                            },
                        });
                    }
                }
            }
            catch (error) {
                // Игнорируем ошибки при попытке декодирования
                console.log("Error finding user from expired token:", error);
            }
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken, csrfToken, } = generateToken(user.id, user.email, user.role);
        // Обновляем refreshToken в базе данных
        yield server_1.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });
        yield setToken(res, accessToken, newRefreshToken, user.rememberMe || false);
        res.status(200).json({
            success: true,
            message: "Access token refreshed",
            csrfToken,
        });
    }
    catch (error) {
        // Если произошла ошибка при обновлении токена, сбрасываем rememberMe
        // Это может произойти, если токен истек или недействителен
        try {
            const oldToken = req.cookies.accessToken;
            if (oldToken) {
                const decoded = jsonwebtoken_1.default.verify(oldToken, process.env.JWT_SECRET, {
                    ignoreExpiration: true,
                });
                if (decoded && decoded.userId) {
                    yield server_1.prisma.user.update({
                        where: { id: decoded.userId },
                        data: {
                            rememberMe: false,
                            refreshToken: null,
                        },
                    });
                }
            }
        }
        catch (tokenError) {
            console.log("Error decoding token during error handling:", tokenError);
        }
        console.error("Error refreshing access token", error);
        res.status(500).json({
            message: "Error refreshing access token",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.refreshAccessToken = refreshAccessToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Получаем accessToken из cookies
        const accessToken = req.cookies.accessToken;
        if (accessToken) {
            try {
                // Декодируем токен для получения ID пользователя
                const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET);
                if (decoded && decoded.userId) {
                    // Сбрасываем rememberMe и refreshToken
                    yield server_1.prisma.user.update({
                        where: { id: decoded.userId },
                        data: {
                            rememberMe: false,
                            refreshToken: null,
                        },
                    });
                }
            }
            catch (error) {
                // Если токен невалидный, просто продолжаем выход без обновления rememberMe
                console.log("Error decoding token during logout:", error);
            }
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({
            success: true,
            message: "Logout successful",
            clearCsrfToken: true,
        });
    }
    catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            success: false,
            message: "Error during logout",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.logout = logout;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield server_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Для безопасности все равно возвращаем успешный ответ
            res.status(200).json({
                success: true,
                message: "If the specified email exists, a link to reset the password will be sent to it",
            });
            return;
        }
        // Генерируем токен для сброса пароля
        const resetToken = (0, uuid_1.v4)();
        // Устанавливаем срок действия токена на 1 час
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
        // Сохраняем токен и срок его действия в базе данных
        yield server_1.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpires,
            },
        });
        // Формируем URL для сброса пароля
        const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
        // Формируем HTML письма
        const html = `
      <h1>Password reset</h1>
      <p>You received this email because you (or someone else) requested a password reset for your account.</p>
      <p>To reset your password, click the link below or copy it into your browser address bar:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you did not request a password reset, ignore this email and your password will remain unchanged.</p>
      <p>The link is valid for 1 hour.</p>
    `;
        try {
            // Отправляем письмо
            const emailPreviewUrl = yield (0, email_1.sendEmail)(user.email, "Password reset", html);
            if (process.env.NODE_ENV !== "production" && emailPreviewUrl) {
                console.log(`Email preview: ${emailPreviewUrl}`);
            }
        }
        catch (emailError) {
            // Только логируем ошибку, но продолжаем выполнение
            console.error("Error sending password reset email:", emailError);
        }
        res.status(200).json({
            success: true,
            message: "If the specified email exists, a link to reset the password will be sent to it",
        });
    }
    catch (error) {
        console.error("Error in forgot password", error);
        res.status(500).json({
            success: false,
            error: "Server error when processing the password reset request",
        });
    }
});
exports.forgotPassword = forgotPassword;
const validateResetToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            res.status(400).json({
                success: false,
                valid: false,
            });
            return;
        }
        const user = yield server_1.prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(), // Проверяем, что токен не истек
                },
            },
        });
        if (!user) {
            res.status(200).json({
                success: true,
                valid: false,
            });
            return;
        }
        res.status(200).json({
            success: true,
            valid: true,
        });
    }
    catch (error) {
        console.error("Error validating reset token", error);
        res.status(500).json({
            success: false,
            valid: false,
            error: "Server error when checking the reset token",
        });
    }
});
exports.validateResetToken = validateResetToken;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({
                success: false,
                error: "Missing required fields",
            });
            return;
        }
        const user = yield server_1.prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(), // Проверяем, что токен не истек
                },
            },
        });
        if (!user) {
            res.status(400).json({
                success: false,
                error: "Invalid or expired reset token",
            });
            return;
        }
        // Хешируем новый пароль
        const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        // Обновляем пароль и сбрасываем токен сброса пароля
        yield server_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        console.error("Error resetting password", error);
        res.status(500).json({
            success: false,
            error: "Server error when resetting password",
        });
    }
});
exports.resetPassword = resetPassword;
// Добавляем эндпоинт для получения информации о текущем пользователе
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Здесь req.user установлен middleware, если пользователь авторизован
        const authenticatedReq = req;
        if (!authenticatedReq.user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        // Получаем информацию о пользователе из базы данных
        const user = yield server_1.prisma.user.findUnique({
            where: {
                id: authenticatedReq.user.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                // Не выбираем пароль и другие конфиденциальные данные
            },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error("Error fetching user profile", error);
        res.status(500).json({
            success: false,
            message: "Error fetching user profile",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getMe = getMe;

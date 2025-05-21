import { prisma } from "../server";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../config/email";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import crypto from "crypto";

function generateToken(userId: string, email: string, role: string) {
  // Генерируем CSRF токен
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const accessToken = jwt.sign(
    { userId, email, role, csrfToken },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    }
  );
  const refreshToken = uuidv4();

  return { accessToken, refreshToken, csrfToken };
}

async function setToken(
  res: Response,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false
) {
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
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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
  } catch (error) {
    console.error("Error registering user", error);
    res.status(500).json({
      message: "Error registering user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;

    const user = await prisma.user.findUnique({
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

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const { accessToken, refreshToken, csrfToken } = generateToken(
      user.id,
      user.email,
      user.role
    );

    // Обновляем refreshToken и rememberMe в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        rememberMe,
      },
    });

    await setToken(res, accessToken, refreshToken, rememberMe);

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
  } catch (error) {
    console.error("Error logging in", error);
    res.status(500).json({
      message: "Error logging in",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  try {
    const user = await prisma.user.findFirst({
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
          const decoded = jwt.verify(oldToken, process.env.JWT_SECRET!, {
            ignoreExpiration: true,
          }) as { userId: string };
          if (decoded && decoded.userId) {
            // Сбрасываем rememberMe для этого пользователя
            await prisma.user.update({
              where: { id: decoded.userId },
              data: {
                rememberMe: false,
                refreshToken: null,
              },
            });
          }
        }
      } catch (error) {
        // Игнорируем ошибки при попытке декодирования
        console.log("Error finding user from expired token:", error);
      }

      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken,
    } = generateToken(user.id, user.email, user.role);

    // Обновляем refreshToken в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    await setToken(res, accessToken, newRefreshToken, user.rememberMe || false);

    res.status(200).json({
      success: true,
      message: "Access token refreshed",
      csrfToken,
    });
  } catch (error) {
    // Если произошла ошибка при обновлении токена, сбрасываем rememberMe
    // Это может произойти, если токен истек или недействителен
    try {
      const oldToken = req.cookies.accessToken;
      if (oldToken) {
        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET!, {
          ignoreExpiration: true,
        }) as { userId: string };
        if (decoded && decoded.userId) {
          await prisma.user.update({
            where: { id: decoded.userId },
            data: {
              rememberMe: false,
              refreshToken: null,
            },
          });
        }
      }
    } catch (tokenError) {
      console.log("Error decoding token during error handling:", tokenError);
    }

    console.error("Error refreshing access token", error);
    res.status(500).json({
      message: "Error refreshing access token",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Получаем accessToken из cookies
    const accessToken = req.cookies.accessToken;

    if (accessToken) {
      try {
        // Декодируем токен для получения ID пользователя
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as {
          userId: string;
        };

        if (decoded && decoded.userId) {
          // Сбрасываем rememberMe и refreshToken
          await prisma.user.update({
            where: { id: decoded.userId },
            data: {
              rememberMe: false,
              refreshToken: null,
            },
          });
        }
      } catch (error) {
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
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Для безопасности все равно возвращаем успешный ответ
      res.status(200).json({
        success: true,
        message:
          "If the specified email exists, a link to reset the password will be sent to it",
      });
      return;
    }

    // Генерируем токен для сброса пароля
    const resetToken = uuidv4();

    // Устанавливаем срок действия токена на 1 час
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Сохраняем токен и срок его действия в базе данных
    await prisma.user.update({
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
      const emailPreviewUrl = await sendEmail(
        user.email,
        "Password reset",
        html
      );

      if (process.env.NODE_ENV !== "production" && emailPreviewUrl) {
        console.log(`Email preview: ${emailPreviewUrl}`);
      }
    } catch (emailError) {
      // Только логируем ошибку, но продолжаем выполнение
      console.error("Error sending password reset email:", emailError);
    }

    res.status(200).json({
      success: true,
      message:
        "If the specified email exists, a link to reset the password will be sent to it",
    });
  } catch (error) {
    console.error("Error in forgot password", error);
    res.status(500).json({
      success: false,
      error: "Server error when processing the password reset request",
    });
  }
};

export const validateResetToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      res.status(400).json({
        success: false,
        valid: false,
      });
      return;
    }

    const user = await prisma.user.findFirst({
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
  } catch (error) {
    console.error("Error validating reset token", error);
    res.status(500).json({
      success: false,
      valid: false,
      error: "Server error when checking the reset token",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
      return;
    }

    const user = await prisma.user.findFirst({
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
    const hashedPassword = await bcrypt.hash(password, 12);

    // Обновляем пароль и сбрасываем токен сброса пароля
    await prisma.user.update({
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
  } catch (error) {
    console.error("Error resetting password", error);
    res.status(500).json({
      success: false,
      error: "Server error when resetting password",
    });
  }
};

// Добавляем эндпоинт для получения информации о текущем пользователе
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // Здесь req.user установлен middleware, если пользователь авторизован
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Получаем информацию о пользователе из базы данных
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error("Error fetching user profile", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

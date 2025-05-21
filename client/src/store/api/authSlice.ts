import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ROUTES } from "@/utils/api";
import { z } from "zod";
import { setCsrfToken, clearCsrfToken } from "@/utils/csrfToken";
import { createBaseQueryWithCSRF } from "./baseApi";

// Схема пользователя
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  role: z.enum(["USER", "SUPER_ADMIN"]),
});

export type User = z.infer<typeof UserSchema>;

// Схемы запросов и ответов
const LoginResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema,
  csrfToken: z.string(),
});

const RegisterResponseSchema = z.object({
  success: z.boolean(),
  userId: z.string(),
});

const ErrorResponseSchema = z.object({
  success: z.boolean().optional(),
  error: z.string(),
});

const ForgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const ValidateResetTokenResponseSchema = z.object({
  success: z.boolean(),
  valid: z.boolean(),
});

const GetMeResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema,
});

const RefreshTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  csrfToken: z.string(),
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createBaseQueryWithCSRF(API_ROUTES.AUTH),
  endpoints: (builder) => ({
    login: builder.mutation<
      User,
      { email: string; password: string; rememberMe?: boolean }
    >({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = LoginResponseSchema.parse(response);
          // Сохраняем CSRF-токен
          setCsrfToken(result.csrfToken);
          return result.user;
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.message}`);
          }
          throw new Error("Login failed with unknown response format");
        }
      },
      transformErrorResponse: (response) => {
        if (response.status === "PARSING_ERROR") {
          return { error: "Failed to parse server response" };
        }

        try {
          if (typeof response.data === "object" && response.data) {
            const result = ErrorResponseSchema.safeParse(response.data);
            if (result.success) {
              return { error: result.data.error };
            }
          }
        } catch (e) {
          return { error: "Login failed" };
        }

        return { error: "Login failed" };
      },
    }),

    register: builder.mutation<
      string,
      { name: string; email: string; password: string }
    >({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = RegisterResponseSchema.parse(response);
          return result.userId;
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.message}`);
          }
          throw new Error("Registration failed with unknown response format");
        }
      },
      transformErrorResponse: (response) => {
        if (response.status === "PARSING_ERROR") {
          return { error: "Failed to parse server response" };
        }

        try {
          if (typeof response.data === "object" && response.data) {
            const result = ErrorResponseSchema.safeParse(response.data);
            if (result.success) {
              return { error: result.data.error };
            }
          }
        } catch (e) {
          return { error: "Registration failed" };
        }

        return { error: "Registration failed" };
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          // Всегда очищаем CSRF-токен при выходе из системы
          clearCsrfToken();

          // Дополнительная очистка localStorage при необходимости
          try {
            // Очищаем sessionStorage на всякий случай (для обратной совместимости)
            if (typeof window !== "undefined" && window.sessionStorage) {
              sessionStorage.removeItem("csrfToken");
            }
          } catch (e) {
            console.error(
              "Error clearing additional storage during logout:",
              e
            );
          }
        } catch (err) {
          console.error("Error during logout:", err);
          // Даже при ошибке попробуем очистить токены на клиенте
          clearCsrfToken();
        }
      },
    }),

    refreshToken: builder.mutation<void, void>({
      query: () => ({
        url: "/refresh-token",
        method: "POST",
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = RefreshTokenResponseSchema.parse(response);
          // Обновляем CSRF-токен
          setCsrfToken(result.csrfToken);
        } catch (error) {
          // Игнорируем ошибки валидации, так как эндпоинт может не возвращать csrfToken
        }
      },
    }),

    getMe: builder.query<User, void>({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = GetMeResponseSchema.parse(response);
          return result.user;
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.message}`);
          }
          throw new Error("Failed to get user profile");
        }
      },
      transformErrorResponse: (response) => {
        return { error: "Failed to get user profile" };
      },
    }),

    forgotPassword: builder.mutation<string, { email: string }>({
      query: (data) => ({
        url: "/forgot-password",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = ForgotPasswordResponseSchema.parse(response);
          return result.message;
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.message}`);
          }
          throw new Error("Request failed with unknown response format");
        }
      },
      transformErrorResponse: (response) => {
        if (response.status === "PARSING_ERROR") {
          return { error: "Failed to parse server response" };
        }

        try {
          if (typeof response.data === "object" && response.data) {
            const result = ErrorResponseSchema.safeParse(response.data);
            if (result.success) {
              return { error: result.data.error };
            }
          }
        } catch (e) {
          return { error: "Reset password request failed" };
        }

        return { error: "Reset password request failed" };
      },
    }),

    resetPassword: builder.mutation<
      string,
      { token: string; password: string }
    >({
      query: (data) => ({
        url: "/reset-password",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = ResetPasswordResponseSchema.parse(response);
          return result.message;
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.message}`);
          }
          throw new Error("Password reset failed with unknown response format");
        }
      },
      transformErrorResponse: (response) => {
        if (response.status === "PARSING_ERROR") {
          return { error: "Failed to parse server response" };
        }

        try {
          if (typeof response.data === "object" && response.data) {
            const result = ErrorResponseSchema.safeParse(response.data);
            if (result.success) {
              return { error: result.data.error };
            }
          }
        } catch (e) {
          return { error: "Password reset failed" };
        }

        return { error: "Password reset failed" };
      },
    }),

    validateResetToken: builder.query<boolean, string>({
      query: (token) => ({
        url: `/validate-reset-token?token=${token}`,
        method: "GET",
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = ValidateResetTokenResponseSchema.parse(response);
          return result.valid;
        } catch (error) {
          return false;
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLazyValidateResetTokenQuery,
} = authApi;

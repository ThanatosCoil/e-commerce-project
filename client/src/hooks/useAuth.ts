import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setUser, clearUser } from "@/store/slices/authSlice";
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLazyValidateResetTokenQuery,
  useGetMeQuery,
  User,
} from "@/store/api/authSlice";
import {
  getAccessTokenFromCookie,
  isTokenExpiringSoon,
} from "@/utils/tokenUtils";
import { usePathname } from "next/navigation";

export const useAuth = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { user, isLoggedIn } = useSelector((state: RootState) => state.auth);
  // Используем useRef для хранения идентификатора интервала
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Проверяем, находимся ли мы на странице авторизации
  const isAuthPage = pathname?.startsWith("/auth/");

  // Используем условный вызов useGetMeQuery только если мы не на странице авторизации
  const { data: meData, isSuccess: isMeSuccess } = useGetMeQuery(undefined, {
    skip: isAuthPage,
  });

  const [loginApi, { isLoading: isLoggingIn, error: loginError }] =
    useLoginMutation();
  const [registerApi, { isLoading: isRegistering, error: registerError }] =
    useRegisterMutation();
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [refreshToken, { isLoading: isRefreshing }] = useRefreshTokenMutation();
  const [forgotPasswordApi, { isLoading: isSendingResetLink }] =
    useForgotPasswordMutation();
  const [resetPasswordApi, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();
  const [validateResetToken, { isLoading: isValidatingToken }] =
    useLazyValidateResetTokenQuery();

  // При монтировании компонента проверяем, есть ли пользователь в localStorage
  useEffect(() => {
    if (!user && !isAuthPage) {
      try {
        const storedUser = localStorage.getItem(
          process.env.USER_STORAGE_KEY || "user-data"
        );
        if (storedUser) {
          const userData = JSON.parse(storedUser) as User;
          dispatch(setUser(userData));
        }
      } catch (error) {
        console.error("Error restoring user from localStorage:", error);
        // В случае ошибки, очищаем localStorage
        localStorage.removeItem(process.env.USER_STORAGE_KEY || "user-data");
      }
    }
  }, [user, dispatch, isAuthPage]);

  // Если получили данные от API getMe, обновляем пользователя
  useEffect(() => {
    if (isMeSuccess && meData) {
      dispatch(setUser(meData));
      // Сохраняем в localStorage
      localStorage.setItem(
        process.env.USER_STORAGE_KEY || "user-data",
        JSON.stringify(meData)
      );
    }
  }, [isMeSuccess, meData, dispatch]);

  // Функция для проактивного обновления токена
  const checkAndRefreshToken = useCallback(async () => {
    // Не обновляем токен на страницах авторизации
    if (isAuthPage) return;

    const token = getAccessTokenFromCookie();
    // Если токен истекает в ближайшие 5 минут, обновляем его
    if (isTokenExpiringSoon(token, 5)) {
      console.log("Token is expiring soon, refreshing...");
      await refreshAccessToken();
    }
  }, [isAuthPage]);

  // Запускаем периодическую проверку токена, если пользователь авторизован
  useEffect(() => {
    // Не запускаем проверку на страницах авторизации
    if (isAuthPage) {
      // Если переход на страницу авторизации и интервал был установлен, очищаем его
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
      return;
    }

    // Сразу проверяем токен при изменении статуса авторизации
    if (isLoggedIn) {
      checkAndRefreshToken();

      // Устанавливаем интервал проверки токена каждые 2 минуты
      if (!tokenCheckIntervalRef.current) {
        tokenCheckIntervalRef.current = setInterval(() => {
          checkAndRefreshToken();
        }, 2 * 60 * 1000);
      }
    } else {
      // Если пользователь вышел, очищаем интервал
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
    }

    // Очистка при размонтировании
    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
    };
  }, [isLoggedIn, checkAndRefreshToken, isAuthPage]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        const userData = await loginApi({
          email,
          password,
          rememberMe,
        }).unwrap();
        dispatch(setUser(userData));
        // Сохраняем пользователя в localStorage при успешном логине
        localStorage.setItem(
          process.env.USER_STORAGE_KEY || "user-data",
          JSON.stringify(userData)
        );
        return true;
      } catch (error) {
        return false;
      }
    },
    [loginApi, dispatch]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const userId = await registerApi({ name, email, password }).unwrap();
        return userId;
      } catch (error) {
        return null;
      }
    },
    [registerApi]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi().unwrap();
      dispatch(clearUser());
      // Удаляем пользователя из localStorage при логауте
      localStorage.removeItem(process.env.USER_STORAGE_KEY || "user-data");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logoutApi, dispatch]);

  const refreshAccessToken = useCallback(async () => {
    // Не обновляем токен на страницах авторизации
    if (isAuthPage) return false;

    try {
      await refreshToken().unwrap();
      return true;
    } catch (error) {
      console.error("Refresh token failed:", error);
      return false;
    }
  }, [refreshToken, isAuthPage]);

  const forgotPassword = useCallback(
    async (email: string) => {
      try {
        const message = await forgotPasswordApi({ email }).unwrap();
        return { success: true, message };
      } catch (error: any) {
        return {
          success: false,
          message: error?.error || "Failed to send password reset link",
        };
      }
    },
    [forgotPasswordApi]
  );

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      try {
        const message = await resetPasswordApi({ token, password }).unwrap();
        return { success: true, message };
      } catch (error: any) {
        return {
          success: false,
          message: error?.error || "Failed to reset password",
        };
      }
    },
    [resetPasswordApi]
  );

  const checkResetToken = useCallback(
    async (token: string) => {
      try {
        const isValid = await validateResetToken(token).unwrap();
        return { valid: isValid };
      } catch (error) {
        return { valid: false };
      }
    },
    [validateResetToken]
  );

  return {
    user,
    isLoggedIn,
    isLoading:
      isLoggingIn ||
      isRegistering ||
      isLoggingOut ||
      isRefreshing ||
      isSendingResetLink ||
      isResettingPassword ||
      isValidatingToken,
    error: loginError || registerError,
    login,
    register,
    logout,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    checkResetToken,
  };
};

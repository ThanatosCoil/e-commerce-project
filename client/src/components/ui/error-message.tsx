import React from "react";
import { AlertTriangle, XCircle, RefreshCcw } from "lucide-react";

interface ErrorMessageProps {
  error: any;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Компонент для отображения ошибок API с поддержкой сообщений об ограничении запросов
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  showRetry = true,
}) => {
  // Определяем тип ошибки
  const is429Error = error?.status === 429;
  const is403Error = error?.status === 403;

  // Получаем сообщение об ошибке
  let errorMsg = "An unexpected error occurred";
  let statusCode = error?.status || 500;

  if (typeof error === "string") {
    errorMsg = error;
  } else if (error?.data) {
    errorMsg =
      typeof error.data === "string" ? error.data : JSON.stringify(error.data);
  } else if (error?.message) {
    errorMsg = error.message;
  }

  // Выбираем иконку в зависимости от типа ошибки
  const Icon = is429Error ? AlertTriangle : XCircle;

  return (
    <div className="w-full p-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive flex flex-col items-center justify-center my-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5" />
        <h3 className="font-semibold">
          {is429Error
            ? "Request limit exceeded"
            : is403Error
            ? "Access denied"
            : `Error (${statusCode})`}
        </h3>
      </div>
      <p className="text-sm text-center mb-3">{errorMsg}</p>

      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-destructive/60 hover:bg-destructive/20 transition-colors"
        >
          <RefreshCcw className="h-3 w-3" />
          Retry request
        </button>
      )}
    </div>
  );
};

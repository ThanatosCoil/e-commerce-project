"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import debounce from "lodash/debounce";
import { cn } from "@/lib/utils";
import "./QuantityInput.css";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  withDebounce?: boolean;
  debounceTime?: number;
  disabled?: boolean;
  className?: string;
  isProcessing?: boolean;
  stockLeft?: number;
}

const QuantityInput = ({
  value,
  onChange,
  min = 1,
  max,
  withDebounce = false,
  debounceTime = 500,
  disabled = false,
  className,
  isProcessing = false,
  stockLeft,
}: QuantityInputProps) => {
  const [localValue, setLocalValue] = useState<number>(value);

  // Синхронизируем локальное значение с внешним
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Создаем дебаунсированную функцию изменения, если нужно
  const debouncedOnChange = React.useMemo(
    () =>
      withDebounce
        ? debounce((val: number) => {
            onChange(val);
          }, debounceTime)
        : (val: number) => onChange(val),
    [onChange, withDebounce, debounceTime]
  ) as ((val: number) => void) & { cancel?: () => void };

  // Очищаем дебаунс при размонтировании
  useEffect(() => {
    return () => {
      if (withDebounce && debouncedOnChange.cancel) {
        debouncedOnChange.cancel();
      }
    };
  }, [withDebounce, debouncedOnChange]);

  const incrementQuantity = () => {
    if (disabled || isProcessing) return;
    if (max !== undefined && localValue >= max) return;

    const newValue = localValue + 1;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const decrementQuantity = () => {
    if (disabled || isProcessing || localValue <= min) return;

    const newValue = localValue - 1;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isProcessing) return;

    const rawValue = e.target.value;
    let newValue = parseInt(rawValue);

    if (isNaN(newValue)) {
      // Обновляем локальное состояние, не вызывая onChange пока
      setLocalValue(0); // Временное значение до проверки на blur/enter
    } else {
      // Обновляем локальное состояние, но не вызываем onChange пока
      setLocalValue(newValue);
    }
  };

  const handleInputBlur = () => {
    if (disabled || isProcessing) return;

    // Проверяем и корректируем значение при наведении
    let newValue = localValue;

    if (isNaN(newValue) || newValue < min) {
      newValue = min;
    } else if (max !== undefined && newValue > max) {
      newValue = max;
    }

    // Обновляем локальное состояние и вызываем onChange только если оно отличается от текущего значения
    setLocalValue(newValue);
    if (newValue !== value) {
      debouncedOnChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isProcessing) return;

    // Отправляем на Enter
    if (e.key === "Enter") {
      e.preventDefault(); // Предотвращаем отправку формы, если внутри формы

      let newValue = localValue;

      if (isNaN(newValue) || newValue < min) {
        newValue = min;
      } else if (max !== undefined && newValue > max) {
        newValue = max;
      }

      // Обновляем локальное состояние и вызываем onChange
      setLocalValue(newValue);
      if (newValue !== value) {
        debouncedOnChange(newValue);
      }

      // Убираем фокус из input
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden shadow-md">
        <button
          onClick={decrementQuantity}
          className="w-8 h-8 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300"
          aria-label="Decrease quantity"
          disabled={disabled || isProcessing || localValue <= min}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          className="quantity-input text-center font-medium text-gray-900 dark:text-white bg-transparent focus:outline-none disabled:opacity-50"
          aria-label="Quantity"
          disabled={disabled || isProcessing}
        />
        <button
          onClick={incrementQuantity}
          className="w-8 h-8 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300"
          aria-label="Increase quantity"
          disabled={
            disabled || isProcessing || (max !== undefined && localValue >= max)
          }
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {stockLeft !== undefined && (
        <span
          className={cn(
            "ml-3 text-sm",
            stockLeft < 5
              ? "text-amber-500 dark:text-amber-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {stockLeft} available
        </span>
      )}
    </div>
  );
};

export default QuantityInput;

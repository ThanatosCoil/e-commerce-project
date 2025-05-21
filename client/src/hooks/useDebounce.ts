import { useState, useEffect } from "react";

/**
 * Хук для создания дебаунсированной версии значения
 * @param value Значение, которое нужно дебаунсировать
 * @param delay Задержка в миллисекундах
 * @returns Дебаунсированное значение
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Установить таймер, который обновит debouncedValue после указанной задержки
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очистить таймер при изменении value или unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface CheckboxOption {
  id: string;
  value: string;
  label: React.ReactNode;
}

interface DebouncedCheckboxGroupProps {
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  debounceTime?: number;
  columns?: 1 | 2 | 3 | 4 | 6;
  className?: string;
  setIsSearching?: (isSearching: boolean) => void;
}

// Оптимизированный компонент чекбоксов с дебаунсом
const DebouncedCheckboxGroup = React.memo(function DebouncedCheckboxGroup({
  options,
  selectedValues: externalValues,
  onChange,
  debounceTime = 300,
  columns = 1,
  className = "",
  setIsSearching,
}: DebouncedCheckboxGroupProps) {
  // Локальное состояние для моментального UI-отклика
  const [localValues, setLocalValues] = useState<string[]>(externalValues);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизируем внешние значения
  useEffect(() => {
    setLocalValues(externalValues);
  }, [externalValues]);

  // Обработчик изменения с дебаунсом
  const handleChange = useCallback(
    (value: string) => {
      // Обновляем локальное состояние немедленно
      const newValues = localValues.includes(value)
        ? localValues.filter((v) => v !== value)
        : [...localValues, value];

      setLocalValues(newValues);

      // Отменяем предыдущий таймер
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Сигнализируем о начале поиска, если setIsSearching передан
      if (setIsSearching) {
        setIsSearching(true);
      }

      // Устанавливаем новый таймер для дебаунса
      timeoutRef.current = setTimeout(() => {
        onChange(newValues);
        // Сигнализируем о завершении поиска, если setIsSearching передан
        if (setIsSearching) {
          setIsSearching(false);
        }
      }, debounceTime);
    },
    [localValues, onChange, debounceTime, setIsSearching]
  );

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Убеждаемся, что индикатор загрузки выключен при размонтировании
        if (setIsSearching) {
          setIsSearching(false);
        }
      }
    };
  }, [setIsSearching]);

  // Определение классов для сетки на основе количества колонок
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-x-4 gap-y-2 mt-1.5 ${className}`}>
      {options.map((option) => {
        const isChecked = localValues.includes(option.value);
        return (
          <div
            key={option.id}
            className={`
              relative cursor-pointer p-1.5 rounded-md 
              transition-all duration-150
              ${
                isChecked
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/40 border border-transparent"
              }
            `}
            onClick={() => handleChange(option.value)}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleChange(option.value);
              }
            }}
          >
            <div className="flex items-center w-full">
              <Checkbox
                id={option.id}
                checked={isChecked}
                className="mr-2 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 pointer-events-none"
              />
              <label
                htmlFor={option.id}
                className="cursor-pointer text-sm select-none flex items-center flex-1 text-gray-700 dark:text-gray-200 pointer-events-none"
              >
                {option.label}
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default DebouncedCheckboxGroup;

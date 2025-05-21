import React, { useCallback, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
  autoFocus?: boolean;
}

// Оптимизированный компонент поиска с использованием React.memo
const SearchInput = React.memo(function SearchInput({
  value: externalValue,
  onChange,
  placeholder = "Search...",
  className = "",
  debounceTime = 300,
  autoFocus = false,
}: SearchInputProps) {
  // Используем локальное состояние для немедленного отображения ввода
  const [localValue, setLocalValue] = useState(externalValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус на инпуте при монтировании, если autoFocus = true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Синхронизируем внешнее значение
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  // Оптимизированный обработчик ввода
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Отменяем предыдущий таймер
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Устанавливаем новый таймер для дебаунса
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceTime);
    },
    [onChange, debounceTime]
  );

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex-1">
      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={`w-full pl-9 transition-all dark:bg-gray-800 ${className}`}
        value={localValue}
        onChange={handleChange}
        autoComplete="off"
        style={{ boxShadow: "none" }}
      />
    </div>
  );
});

export default SearchInput;

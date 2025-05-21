import React, { useCallback, useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import "./PriceRangeSlider.css";

interface PriceRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  minPrice?: number;
  maxPrice?: number;
  className?: string;
  debounceTime?: number;
  setIsSearching?: (isSearching: boolean) => void;
}

const PriceRangeSlider = React.memo(function PriceRangeSlider({
  value: externalValue,
  onChange,
  minPrice = 0,
  maxPrice = 10000,
  className = "",
  debounceTime = 300,
  setIsSearching,
}: PriceRangeSliderProps) {
  // Используем локальное состояние для немедленного отображения слайдера
  const [localValue, setLocalValue] = useState<[number, number]>(externalValue);
  // Состояния для значений в инпутах
  const [minInputValue, setMinInputValue] = useState<string>(
    externalValue[0].toString()
  );
  const [maxInputValue, setMaxInputValue] = useState<string>(
    externalValue[1].toString()
  );

  // Состояние для отслеживания изменения значений
  const [valuesChanged, setValuesChanged] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизируем внешнее значение
  useEffect(() => {
    setLocalValue(externalValue);
    setMinInputValue(externalValue[0].toString());
    setMaxInputValue(externalValue[1].toString());
    setValuesChanged(false);
  }, [externalValue]);

  // Обработчик изменения слайдера
  const handleSliderChange = useCallback(
    (newValue: [number, number]) => {
      setLocalValue(newValue);
      setMinInputValue(newValue[0].toString());
      setMaxInputValue(newValue[1].toString());
      setValuesChanged(true);

      // Устанавливаем состояние загрузки, если функция предоставлена
      if (setIsSearching) {
        setIsSearching(true);
      }

      // Отменяем предыдущий таймер
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Устанавливаем новый таймер для дебаунса
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
        // Сбрасываем состояние загрузки, если функция предоставлена
        if (setIsSearching) {
          setIsSearching(false);
        }
        setValuesChanged(false); // Значения применены, сброс флага изменения
      }, debounceTime);
    },
    [onChange, debounceTime, setIsSearching]
  );

  // Функция для применения фильтра по цене
  const applyPriceFilter = useCallback(() => {
    // Если значения не менялись, ничего не делаем
    if (!valuesChanged) {
      // Все равно сбрасываем состояние загрузки, если оно было установлено
      if (setIsSearching) {
        setIsSearching(false);
      }
      return;
    }

    // Преобразуем строки в числа
    const minValue = Number(minInputValue);
    const maxValue = Number(maxInputValue);

    // Проверка что значения числовые
    if (isNaN(minValue) || isNaN(maxValue)) {
      // Если не числа, вернем к текущим значениям
      setMinInputValue(localValue[0].toString());
      setMaxInputValue(localValue[1].toString());
      setValuesChanged(false);
      if (setIsSearching) {
        setIsSearching(false);
      }
      return;
    }

    // Убедимся, что значения находятся в допустимом диапазоне
    const validMinValue = Math.max(minPrice, Math.min(minValue, maxPrice - 1));
    const validMaxValue = Math.max(
      validMinValue + 1,
      Math.min(maxValue, maxPrice)
    );

    const newValue: [number, number] = [validMinValue, validMaxValue];

    // Обновляем локальные состояния
    setLocalValue(newValue);

    // Обновляем input fields с правильно валидированными значениями
    setMinInputValue(validMinValue.toString());
    setMaxInputValue(validMaxValue.toString());

    // Отменяем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Если есть функция установки состояния загрузки, показываем индикатор загрузки
    if (setIsSearching) {
      setIsSearching(true);
    }

    // Применяем изменения с небольшой задержкой
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      // Сбрасываем состояние загрузки
      if (setIsSearching) {
        setIsSearching(false);
      }
      // Сбрасываем флаг изменения значений
      setValuesChanged(false);
    }, 300);
  }, [
    minInputValue,
    maxInputValue,
    minPrice,
    maxPrice,
    onChange,
    localValue,
    setIsSearching,
    valuesChanged,
  ]);

  // Обработчик изменения минимальной цены в инпуте
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMinInputValue(newValue);
    setValuesChanged(true);
  };

  // Обработчик изменения максимальной цены в инпуте
  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMaxInputValue(newValue);
    setValuesChanged(true);
  };

  // Обработчик нажатия клавиши Enter в инпутах
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyPriceFilter();
    }
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-4 custom-price-slider ${className}`}>
      <Slider
        value={localValue}
        min={minPrice}
        max={maxPrice}
        step={1}
        onValueChange={handleSliderChange}
        className={cn("w-full mt-1")}
      />

      <div className="flex justify-between items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
              From
            </span>
            <div className="relative w-full">
              <Input
                type="number"
                value={minInputValue}
                onChange={handleMinInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (valuesChanged) {
                    applyPriceFilter();
                  }
                }}
                min={minPrice}
                max={maxPrice - 1}
                className="w-full h-9 text-sm dark:bg-gray-800 text-center pr-7 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-700 border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                $
              </span>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 pt-6">—</div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
              To
            </span>
            <div className="relative w-full">
              <Input
                type="number"
                value={maxInputValue}
                onChange={handleMaxInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (valuesChanged) {
                    applyPriceFilter();
                  }
                }}
                min={minPrice + 1}
                max={maxPrice}
                className="w-full h-9 text-sm dark:bg-gray-800 text-center pr-7 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-700 border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                $
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PriceRangeSlider;

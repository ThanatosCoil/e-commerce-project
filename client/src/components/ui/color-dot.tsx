import { ReactNode } from "react";
import { COLORS, getColorName } from "@/constants/product";
import { cn } from "@/lib/utils";

interface ColorDotProps {
  color: string;
  index?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Проверяет, является ли цвет светлым
 * @param hexColor Цвет в формате HEX (#RRGGBB)
 */
function isLightColor(hexColor: string): boolean {
  // Нормализуем hex код
  const color = hexColor.toLowerCase().replace(/^#/, "");

  // Если это белый цвет
  if (color === "ffffff" || hexColor.toLowerCase() === "white") {
    return true;
  }

  // Для названий цветов пытаемся найти значение в COLORS
  if (!/^[0-9a-f]{6}$/i.test(color)) {
    const colorObj = COLORS.find(
      (c) =>
        c.name.toLowerCase() === hexColor.toLowerCase() ||
        c.value.toLowerCase() === hexColor.toLowerCase()
    );
    return colorObj ? isLightColor(colorObj.value) : false;
  }

  // Преобразуем HEX в RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Вычисляем яркость (формула W3C)
  // https://www.w3.org/TR/AERT/#color-contrast
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Если яркость > 128, цвет считается светлым
  return brightness > 128;
}

/**
 * Компонент для отображения цветной точки
 */
export function ColorDot({
  color,
  index = 0,
  size = "md",
  className = "",
}: ColorDotProps): ReactNode {
  const colorObj = COLORS.find(
    (c) =>
      c.value.toLowerCase() === color.toLowerCase() ||
      c.name.toLowerCase() === color.toLowerCase()
  );

  const actualColor = colorObj ? colorObj.value : color;
  const isWhite =
    actualColor.toLowerCase() === "#ffffff" ||
    actualColor.toLowerCase() === "white" ||
    color.toLowerCase() === "white";
  const isLight = isLightColor(actualColor);

  const sizeClasses = {
    sm: "h-3 w-3 min-w-3",
    md: "h-4 w-4 min-w-4",
    lg: "h-5 w-5 min-w-5",
  };

  return (
    <div
      key={`color-${color}-${index}`}
      className={cn(
        sizeClasses[size],
        "rounded-full border flex-shrink-0",
        // Светлые цвета получают темную границу на светлой теме
        isLight && "ring-1 ring-gray-200 dark:ring-0",
        // Темные цвета получают светлую границу в темной теме
        !isLight && "dark:ring-1 dark:ring-gray-700",
        // Белый цвет всегда с серой границей
        isWhite && "border-gray-300 dark:border-gray-600",
        className
      )}
      style={{
        backgroundColor: actualColor,
        borderColor: isWhite ? "#9ca3af" : actualColor,
        borderWidth: isWhite ? "1.5px" : "1px",
      }}
      title={getColorName(color)}
    />
  );
}

/**
 * Функция для рендеринга цветной точки (для обратной совместимости)
 */
export const renderColorDot = (color: string, index: number = 0) => {
  return (
    <ColorDot key={`color-${color}-${index}`} color={color} index={index} />
  );
};

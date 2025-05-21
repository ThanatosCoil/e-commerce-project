// Категории продуктов
export const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Hand Bags",
  "Shoes",
  "Wallets",
  "Sunglasses",
  "Caps",
];

// Размеры продуктов
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

// Цвета продуктов
export const COLORS = [
  { name: "Navy", class: "bg-[#0F172A] border-[#0F172A]", value: "#0F172A" },
  { name: "Yellow", class: "bg-[#FCD34D] border-[#FCD34D]", value: "#FCD34D" },
  { name: "White", class: "bg-white border", value: "#FFFFFF" },
  { name: "Orange", class: "bg-[#FB923C] border-[#FB923C]", value: "#FB923C" },
  { name: "Green", class: "bg-[#22C55E] border-[#22C55E]", value: "#22C55E" },
  { name: "Pink", class: "bg-[#EC4899] border-[#EC4899]", value: "#EC4899" },
  { name: "Cyan", class: "bg-[#06B6D4] border-[#06B6D4]", value: "#06B6D4" },
  { name: "Blue", class: "bg-[#3B82F6] border-[#3B82F6]", value: "#3B82F6" },
];

// Бренды продуктов
export const BRANDS = ["Nike", "Adidas", "Puma", "Reebok", "Under Armour"];

// Гендерные группы
export const GENDERS = ["Male", "Female", "Kids"];

// Вспомогательная функция для получения имени цвета по его коду
export const getColorName = (colorCode: string): string => {
  const colorObj = COLORS.find(
    (c) => c.value.toLowerCase() === colorCode.toLowerCase()
  );
  return colorObj ? colorObj.name : colorCode;
};

// Функция для нормализации значения в соответствии со списком возможных значений
export const getNormalizedValue = (value: string, possibleValues: string[]) => {
  if (!value) return "";

  // Ищем точное совпадение сначала
  const exactMatch = possibleValues.find((v) => v === value);
  if (exactMatch) return exactMatch;

  // Ищем совпадение без учета регистра
  const caseInsensitiveMatch = possibleValues.find(
    (v) => v.toLowerCase() === value.toLowerCase()
  );

  return caseInsensitiveMatch || value;
};

// Функция для нормализации значения пола
export const getNormalizedGenderValue = (value: string) => {
  if (!value) return "";
  return getNormalizedValue(value, GENDERS);
};

import React, { useState, useCallback, useRef } from "react";
import { Trash, Tag, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { getColorName } from "@/constants/product";
import { renderColorDot } from "@/components/ui/color-dot";
import { usePathname } from "next/navigation";
import SearchInput from "./SearchInput";
import PriceRangeSlider from "./PriceRangeSlider";
import DebouncedCheckboxGroup from "./CheckboxGroup";
import { motion } from "framer-motion";

export type ProductFilterProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  selectedGender: string | null;
  setSelectedGender: (gender: string | null) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  categories: string[];
  brands: string[];
  genders: string[];
  allColors: string[];
  allSizes: string[];
  darkBackground?: boolean;
  layout?: "vertical" | "horizontal";
  setIsSearching?: (isSearching: boolean) => void;
  hasDiscount: boolean;
  setHasDiscount: (hasDiscount: boolean) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

const ProductFilter: React.FC<ProductFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedGender,
  setSelectedGender,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  minPrice,
  maxPrice,
  categories,
  brands,
  genders,
  allColors,
  allSizes,
  darkBackground = false,
  layout,
  setIsSearching,
  hasDiscount,
  setHasDiscount,
  collapsible = false,
  defaultCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Автоматическое определение layout на основе пути
  const pathname = usePathname();
  // Если layout явно не указан, определим его на основе пути
  const effectiveLayout =
    layout ||
    (pathname?.includes("/products") && !pathname?.includes("/super-admin")
      ? "vertical"
      : "horizontal");

  const isVertical = effectiveLayout === "vertical";

  // Проверка наличия выбранных фильтров
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== null ||
    selectedBrand !== null ||
    selectedGender !== null ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    hasDiscount ||
    priceRange[0] !== minPrice ||
    priceRange[1] !== maxPrice;

  // Используем useCallback для предотвращения лишних перерисовок
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
    },
    [setSearchQuery]
  );

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? null : value);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value === "all" ? null : value);
  };

  const handleGenderChange = (value: string) => {
    setSelectedGender(value === "all" ? null : value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // Опция для чекбокса скидок
  const discountOption = {
    id: "discount-filter",
    value: "hasDiscount",
    label: (
      <>
        <Tag className="h-4 w-4 text-red-500" />
        <span className="ml-1">Has discount</span>
      </>
    ),
  };

  // Преобразуем boolean hasDiscount в массив строк для DebouncedCheckboxGroup
  const hasDiscountArray = hasDiscount ? ["hasDiscount"] : [];

  // Функция для обработки изменений значения hasDiscount
  const handleDiscountChange = useCallback(
    (values: string[]) => {
      // Если в массиве есть значение "hasDiscount", устанавливаем true, иначе false
      setHasDiscount(values.includes("hasDiscount"));
    },
    [setHasDiscount]
  );

  // Настраиваем опции для цветов
  const colorOptions = allColors.map((color, index) => ({
    id: `color-${index}`,
    value: color,
    label: (
      <>
        {renderColorDot(color, index)}
        <span className="ml-1">{getColorName(color)}</span>
      </>
    ),
  }));

  // Настраиваем опции для размеров
  const sizeOptions = allSizes.map((size, index) => ({
    id: `size-${index}`,
    value: size,
    label: size,
  }));

  // Очистка всех фильтров
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedGender(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setHasDiscount(false);
    setPriceRange([minPrice, maxPrice]);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Подсчет активных фильтров для бейджа
  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (selectedGender ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    (hasDiscount ? 1 : 0) +
    (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0);

  const filterContent = (
    <div className={`${isVertical ? "mb-4 space-y-4" : "space-y-5"}`}>
      {/* Поиск */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
          Search
        </label>
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search products..."
          debounceTime={300}
        />
      </div>

      {/* Ценовой диапазон */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
          Price range
        </label>
        <PriceRangeSlider
          value={priceRange}
          onChange={setPriceRange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          debounceTime={300}
          className="pt-2 pb-1"
          setIsSearching={setIsSearching}
        />
      </div>

      {/* Верхние фильтры */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {/* Категория */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
            Category
          </label>
          <Select
            value={selectedCategory || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Бренд */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
            Brand
          </label>
          <Select
            value={selectedBrand || "all"}
            onValueChange={handleBrandChange}
          >
            <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand.charAt(0).toUpperCase() + brand.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Пол */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
            Gender
          </label>
          <Select
            value={selectedGender || "all"}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600">
              <SelectValue placeholder="All genders" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
              <SelectItem value="all">All genders</SelectItem>
              {genders.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Сортировка */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
            Sort by
          </label>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="stock">Stock (Highest first)</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="rating-desc">
                Rating (Highest first)
              </SelectItem>
              <SelectItem value="rating-asc">Rating (Lowest first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Фильтр по скидке */}
      <div className={`${isVertical ? "" : "hidden md:block"} mb-4`}>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
          Special
        </label>
        <DebouncedCheckboxGroup
          options={[discountOption]}
          selectedValues={hasDiscountArray}
          onChange={handleDiscountChange}
          columns={1}
          debounceTime={300}
          setIsSearching={setIsSearching}
        />
      </div>
    </div>
  );

  // Только рендерить обертку для свертываемого фильтра, если collapsible равно true
  if (collapsible) {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
      <>
        {/* Заголовок с переключателем свертывания */}
        <div
          className="p-4 bg-white dark:bg-gray-800/40 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-200"
          onClick={toggleCollapse}
        >
          <div className="flex flex-col sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold dark:text-white flex items-center">
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center min-w-[20px]">
                  {activeFiltersCount}
                </span>
              )}
            </h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shrink-0"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </Button>
        </div>

        {/* Содержимое свертываемого фильтра */}
        <motion.div
          initial={false}
          animate={{
            height: isCollapsed ? 0 : "auto",
          }}
          transition={{
            height: {
              duration: 0.3,
              ease: "easeInOut",
            },
          }}
          className="overflow-hidden origin-top border-t border-gray-100 dark:border-gray-700/40"
          style={{ pointerEvents: isCollapsed ? "none" : "auto" }}
        >
          <div ref={contentRef}>
            <CardContent
              className={`${isVertical ? "p-4" : "p-4 sm:p-5 lg:p-6"} ${
                darkBackground ? "dark:bg-gray-800/30" : ""
              }`}
            >
              <div
                className={`${
                  isVertical ? "" : "grid grid-cols-1 md:grid-cols-2 gap-x-6"
                }`}
              >
                {/* Левая колонка в горизонтальном режиме */}
                {filterContent}

                {/* Правая колонка в горизонтальном режиме */}
                <div className={`${isVertical ? "" : "md:mt-0"}`}>
                  {/* Фильтр по скидке в мобильном виде */}
                  <div
                    className={`${isVertical ? "hidden" : "md:hidden"} mb-4`}
                  >
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
                      Special
                    </label>
                    <DebouncedCheckboxGroup
                      options={[discountOption]}
                      selectedValues={hasDiscountArray}
                      onChange={handleDiscountChange}
                      columns={1}
                      debounceTime={300}
                      setIsSearching={setIsSearching}
                    />
                  </div>

                  {/* Цвета */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
                      Colors
                    </label>
                    <DebouncedCheckboxGroup
                      options={colorOptions}
                      selectedValues={selectedColors}
                      onChange={setSelectedColors}
                      columns={isVertical ? 2 : 3}
                      debounceTime={300}
                      setIsSearching={setIsSearching}
                      className="pr-2"
                    />
                  </div>

                  {/* Размеры */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
                      Sizes
                    </label>
                    <DebouncedCheckboxGroup
                      options={sizeOptions}
                      selectedValues={selectedSizes}
                      onChange={setSelectedSizes}
                      columns={isVertical ? 2 : 3}
                      debounceTime={300}
                      setIsSearching={setIsSearching}
                      className="pr-2"
                    />
                  </div>
                </div>
              </div>

              {/* Кнопка очистки фильтров */}
              {hasActiveFilters && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2 border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/60 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Trash className="h-4 w-4" />
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        </motion.div>
      </>
    );
  }

  // Обычный несвертываемый рендеринг
  return (
    <CardContent
      className={`${isVertical ? "p-4" : "p-4 sm:p-5 lg:p-6"} ${
        darkBackground ? "dark:bg-gray-800/30" : ""
      }`}
    >
      <div
        className={`${
          isVertical ? "" : "grid grid-cols-1 md:grid-cols-2 gap-x-6"
        }`}
      >
        {/* Левая колонка в горизонтальном режиме */}
        {filterContent}

        {/* Правая колонка в горизонтальном режиме */}
        <div className={`${isVertical ? "" : "md:mt-0"}`}>
          {/* Фильтр по скидке в мобильном виде */}
          <div className={`${isVertical ? "hidden" : "md:hidden"} mb-4`}>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
              Special
            </label>
            <DebouncedCheckboxGroup
              options={[discountOption]}
              selectedValues={hasDiscountArray}
              onChange={handleDiscountChange}
              columns={1}
              debounceTime={300}
              setIsSearching={setIsSearching}
            />
          </div>

          {/* Цвета */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
              Colors
            </label>
            <DebouncedCheckboxGroup
              options={colorOptions}
              selectedValues={selectedColors}
              onChange={setSelectedColors}
              columns={isVertical ? 2 : 3}
              debounceTime={300}
              setIsSearching={setIsSearching}
              className="pr-2"
            />
          </div>

          {/* Размеры */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1.5 block">
              Sizes
            </label>
            <DebouncedCheckboxGroup
              options={sizeOptions}
              selectedValues={selectedSizes}
              onChange={setSelectedSizes}
              columns={isVertical ? 2 : 3}
              debounceTime={300}
              setIsSearching={setIsSearching}
              className="pr-2"
            />
          </div>
        </div>
      </div>

      {/* Кнопка очистки фильтров */}
      {hasActiveFilters && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2 border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/60 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Trash className="h-4 w-4" />
            Clear filters
          </Button>
        </div>
      )}
    </CardContent>
  );
};

export default React.memo(ProductFilter);

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGetPublicProductsQuery } from "@/store/api/apiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterX, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/store/api/apiSlice";
import ProductCard from "@/components/ProductCard";
import ProductFilter from "@/components/ProductFilter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("name");
  const [isSearching, setIsSearching] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [hasDiscount, setHasDiscount] = useState(false);

  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Оптимизированный обработчик поиска с использованием useCallback
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);

    // После изменения поискового запроса устанавливаем задержку для индикатора загрузки
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Сброс на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedGender,
    selectedColors,
    selectedSizes,
    sortBy,
    priceRange,
    hasDiscount,
  ]);

  // Первый запрос только для получения метаданных (выполняется один раз)
  const { data: metaData, isLoading: isMetaLoading } =
    useGetPublicProductsQuery(
      {
        page: 1,
        limit: 100,
      },
      {
        // Отключаем автоматический рефетч для метаданных, чтобы не загружать сервер
        refetchOnMountOrArgChange: false,
      }
    );

  // Получаем базовые метаданные для фильтров
  const allProducts = metaData?.products || [];

  // Мемоизируем вычисление уникальных значений, чтобы не пересчитывать их при каждом рендере
  const allCategories = useMemo(
    () => (allProducts ? [...new Set(allProducts.map((p) => p.category))] : []),
    [allProducts]
  );

  const allBrands = useMemo(
    () => (allProducts ? [...new Set(allProducts.map((p) => p.brand))] : []),
    [allProducts]
  );

  const allGenders = useMemo(
    () => (allProducts ? [...new Set(allProducts.map((p) => p.gender))] : []),
    [allProducts]
  );

  const allColors = useMemo(
    () =>
      allProducts ? [...new Set(allProducts.flatMap((p) => p.colors))] : [],
    [allProducts]
  );

  const allSizes = useMemo(
    () =>
      allProducts ? [...new Set(allProducts.flatMap((p) => p.sizes))] : [],
    [allProducts]
  );

  // Вычисляем минимальную и максимальную цену
  const { minPrice, maxPrice } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { minPrice: 0, maxPrice: 10000 };
    }

    const prices = allProducts.map((p) => p.price);
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices)),
    };
  }, [allProducts]);

  // При изменении min/max цен, обновляем состояние priceRange
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Мемоизируем параметры запроса
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
      searchQuery: searchQuery || undefined,
      category: selectedCategory || undefined,
      brand: selectedBrand || undefined,
      gender: selectedGender || undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
      sortBy: sortBy || undefined,
      minPrice: priceRange[0] !== minPrice ? priceRange[0] : undefined,
      maxPrice: priceRange[1] !== maxPrice ? priceRange[1] : undefined,
      hasDiscount: hasDiscount ? true : undefined,
    }),
    [
      currentPage,
      itemsPerPage,
      searchQuery,
      selectedCategory,
      selectedBrand,
      selectedGender,
      selectedColors,
      selectedSizes,
      sortBy,
      priceRange,
      minPrice,
      maxPrice,
      hasDiscount,
    ]
  );

  // Запрос с фильтрами, отправляется только когда меняются параметры запроса
  const { data, isLoading, isError } = useGetPublicProductsQuery(queryParams);

  const products = data?.products || [];
  const pagination = data?.pagination;

  // Очистка всех фильтров
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedGender(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSortBy("name");
    setPriceRange([minPrice, maxPrice]);
    setHasDiscount(false);
    setCurrentPage(1);
  };

  // Функции для фильтрации по клику на теги
  const handleFilterByCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const handleFilterByGender = (gender: string) => {
    setSelectedGender(gender);
  };

  const handleFilterByBrand = (brand: string) => {
    setSelectedBrand(brand);
  };

  // Функции для управления пагинацией
  const goToNextPage = () => {
    if (pagination && currentPage < pagination.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Проверяем, есть ли активные фильтры
  const isFiltering =
    searchQuery ||
    selectedCategory ||
    selectedBrand ||
    selectedGender ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    hasDiscount ||
    priceRange[0] !== minPrice ||
    priceRange[1] !== maxPrice ||
    sortBy !== "name";

  // Показываем состояние загрузки при поиске
  const showLoading = isLoading || isMetaLoading || isSearching;

  // Показываем скелетон загрузки для страницы продуктов
  if (isLoading || isMetaLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
        <div className="container mx-auto py-8 px-4">
          {/* Скелетон заголовка */}
          <div className="bg-gradient-to-r from-blue-200/80 to-indigo-200/80 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8 relative">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-lg mr-3" />
              <Skeleton className="h-10 w-64" />
            </div>
            <Skeleton className="h-6 w-48 mt-3 ml-3" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Скелетон для фильтров */}
            <div className="lg:col-span-1">
              <Card className="mb-6 gap-0 shadow-md overflow-hidden relative">
                <div className="p-4 bg-white dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                  <Skeleton className="h-6 w-24 mb-2" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-12 w-full mb-4" />
                </div>
              </Card>
            </div>

            {/* Скелетон для списка продуктов */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <Skeleton className="h-full w-full absolute" />
                      </div>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-5 w-1/2 mb-3" />
                        <div className="flex gap-2 mb-3">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-1/4 mb-4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-10 w-28 rounded-md" />
                          <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8 relative">
          <h1 className="text-4xl font-extrabold flex items-center pb-1">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-2 rounded-lg mr-3 text-white shadow-md">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 leading-relaxed">
              Products catalog
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 border-l-4 border-blue-500 pl-3 mt-3">
              Found products:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {pagination?.total || 0}
              </span>
            </p>

            {/* Кнопка сброса фильтров, видима только когда есть активные фильтры */}
            {isFiltering && (
              <div className="mt-4 sm:mt-0">
                <Button
                  variant="default"
                  onClick={clearAllFilters}
                  className="flex items-center gap-0 text-white bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <FilterX className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 ">
          {/* Фильтры - Десктоп версия */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="mb-6 gap-0 shadow-md overflow-hidden relative">
              <div className="p-4 bg-white dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold dark:text-white">
                  Filters
                </h2>
              </div>

              <div>
                <ProductFilter
                  searchQuery={searchQuery}
                  setSearchQuery={handleSearchChange}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedBrand={selectedBrand}
                  setSelectedBrand={setSelectedBrand}
                  selectedGender={selectedGender}
                  setSelectedGender={setSelectedGender}
                  selectedColors={selectedColors}
                  setSelectedColors={setSelectedColors}
                  selectedSizes={selectedSizes}
                  setSelectedSizes={setSelectedSizes}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  categories={allCategories}
                  brands={allBrands}
                  genders={allGenders}
                  allColors={allColors}
                  allSizes={allSizes}
                  darkBackground={true}
                  layout="vertical"
                  setIsSearching={setIsSearching}
                  hasDiscount={hasDiscount}
                  setHasDiscount={setHasDiscount}
                />
              </div>
            </Card>
          </div>

          {/* Фильтры - Мобильная/Планшетная версия */}
          <div className="lg:hidden col-span-1">
            <Card className="mb-6 gap-0 shadow-lg dark:shadow-blue-900/10 overflow-hidden sticky top-[10px] z-30 backdrop-blur-sm">
              <ProductFilter
                searchQuery={searchQuery}
                setSearchQuery={handleSearchChange}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                selectedGender={selectedGender}
                setSelectedGender={setSelectedGender}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                sortBy={sortBy}
                setSortBy={setSortBy}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                minPrice={minPrice}
                maxPrice={maxPrice}
                categories={allCategories}
                brands={allBrands}
                genders={allGenders}
                allColors={allColors}
                allSizes={allSizes}
                darkBackground={true}
                layout="vertical"
                setIsSearching={setIsSearching}
                hasDiscount={hasDiscount}
                setHasDiscount={setHasDiscount}
                collapsible={true}
                defaultCollapsed={true}
              />
            </Card>
          </div>

          {/* Список товаров */}
          <div className="lg:col-span-3 relative min-h-[400px]">
            {/* Оверлей с загрузчиком, который появляется поверх контента с плавной анимацией */}
            <AnimatePresence>
              {showLoading && (
                <motion.div
                  className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center py-12 gap-4 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {isSearching ? "Searching..." : "Loading products..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {isError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                  Error loading products
                </h3>
                <p className="text-red-600 dark:text-red-300">
                  Please try refreshing the page or come back later.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Products not found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try changing the filter parameters or reset all filters.
                </p>
                <Button
                  onClick={clearAllFilters}
                  variant="default"
                  className="bg-gradient-to-r text-white from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {products.map((product: Product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProductCard
                        product={product}
                        mode="user"
                        onFilterByCategory={handleFilterByCategory}
                        onFilterByGender={handleFilterByGender}
                        onFilterByBrand={handleFilterByBrand}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Пагинация - показываем только если есть больше одной страницы */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center mt-8 items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="flex items-center border-blue-300 dark:border-blue-800 active:-translate-x-1 transition-all duration-100 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Показываем текущую страницу, первую, последнюю, и страницы рядом с текущей
                          return (
                            page === 1 ||
                            page === pagination.pages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          // Если есть разрыв между страницами, показываем многоточие
                          const showEllipsis =
                            index > 0 && array[index - 1] !== page - 1;

                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-gray-500 dark:text-gray-400">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(page)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === page
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 shadow-sm"
                                    : "border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400"
                                } transition-all duration-300`}
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === pagination.pages}
                      className="flex items-center border-blue-300 dark:border-blue-800 active:translate-x-1 transition-all duration-100 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

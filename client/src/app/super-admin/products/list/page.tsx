"use client";

import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from "@/store/api/apiSlice";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import ProductFilter from "@/components/ProductFilter";

export default function ProductsListPage() {
  const { data: products, isLoading, isError, error } = useGetProductsQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("name");
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);

  // Добавляем диапазон цен
  const minProductPrice = products
    ? Math.min(...products.map((p) => p.price))
    : 0;
  const maxProductPrice = products
    ? Math.max(...products.map((p) => p.price))
    : 10000;
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minProductPrice,
    maxProductPrice,
  ]);

  // Обновляем priceRange при загрузке продуктов
  useEffect(() => {
    if (products && products.length > 0) {
      const minPrice = Math.min(...products.map((p) => p.price));
      const maxPrice = Math.max(...products.map((p) => p.price));
      setPriceRange([minPrice, maxPrice]);
    }
  }, [products]);

  const openDeleteDialog = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete).unwrap();
      toast.success("Product deleted successfully");
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Failed to delete the product", err);
      toast.error("Failed to delete product");
    }
  };

  // Получаем уникальные категории из данных продуктов
  const categories = products
    ? [...new Set(products.map((p) => p.category))]
    : [];

  // Получаем уникальные бренды из данных продуктов
  const brands = products ? [...new Set(products.map((p) => p.brand))] : [];

  const genders = products ? [...new Set(products.map((p) => p.gender))] : [];

  const allColors = products
    ? [...new Set(products.flatMap((p) => p.colors))]
    : [];

  const allSizes = products
    ? [...new Set(products.flatMap((p) => p.sizes))]
    : [];

  // Фильтрация и сортировка товаров
  const filteredProducts = products
    ? products
        .filter((product) => {
          // Применение фильтра поиска
          if (
            searchQuery &&
            !product.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          // Применение фильтра по категории
          if (selectedCategory && product.category !== selectedCategory) {
            return false;
          }
          // Применение фильтра по бренду
          if (selectedBrand && product.brand !== selectedBrand) {
            return false;
          }
          // Применение фильтра по полу
          if (selectedGender && product.gender !== selectedGender) {
            return false;
          }
          // Применение фильтра по цветам
          if (
            selectedColors.length > 0 &&
            !selectedColors.some((color) => product.colors.includes(color))
          ) {
            return false;
          }
          // Применение фильтра по размерам
          if (
            selectedSizes.length > 0 &&
            !selectedSizes.some((size) => product.sizes.includes(size))
          ) {
            return false;
          }
          // Применение фильтра по цене
          if (product.price < priceRange[0] || product.price > priceRange[1]) {
            return false;
          }
          // Применение фильтра по скидкам
          if (hasDiscount && product.discount <= 0) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          // Сортировка товаров
          switch (sortBy) {
            case "price-asc":
              return a.price - b.price;
            case "price-desc":
              return b.price - a.price;
            case "stock":
              return b.stock - a.stock;
            case "newest":
              // Защищённая сортировка, на случай если createdAt не определено
              if (!a.createdAt || !b.createdAt) return 0;
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case "oldest":
              // Защищённая сортировка, на случай если createdAt не определено
              if (!a.createdAt || !b.createdAt) return 0;
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            case "rating-desc":
              return b.rating - a.rating;
            case "rating-asc":
              return a.rating - b.rating;
            case "name":
            default:
              return a.name.localeCompare(b.name);
          }
        })
    : [];

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading products...
          </p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-6 rounded-lg mt-4 shadow-sm mx-auto max-w-4xl">
        <h3 className="text-lg font-semibold mb-2">Error loading products</h3>
        <p>
          {isSerializedError(error)
            ? error.message
            : "status" in error
            ? `${error.status}: ${JSON.stringify(error.data)}`
            : "Unknown error"}
        </p>
      </div>
    );

  return (
    <div className="container mx-auto py-6 px-4 max-w-[1920px]">
      {/* Использование компонента DeleteConfirmationDialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        description="Are you sure you want to delete this product? This action cannot be undone."
        itemType="Product"
      />

      {/* Секция заголовка и фильтров */}
      <Card className="shadow-lg dark:shadow-gray-800/20 mb-8 gap-0 dark:border-gray-800 overflow-hidden rounded-xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 to-80% p-6 flex flex-col md:flex-row justify-between items-center overflow-hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">Products</h1>
            <p className="text-blue-100 mt-2">
              Manage your product catalog ({filteredProducts.length} products)
            </p>
          </div>
          <Link href="/super-admin/products/add" className="mt-4 md:mt-0">
            <Button className="bg-white text-purple-600 hover:bg-purple-50 dark:bg-indigo-950 dark:text-purple-300 dark:hover:brightness-125 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group">
              <Plus className="h-4 w-4 mr-2 transition-transform group-active:scale-90" />
              <span className="whitespace-nowrap relative z-10">
                Add New Product
              </span>
            </Button>
          </Link>
        </div>
        <ProductFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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
          categories={categories}
          brands={brands}
          genders={genders}
          allColors={allColors}
          allSizes={allSizes}
          darkBackground={true}
          layout="horizontal"
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          minPrice={minProductPrice}
          maxPrice={maxProductPrice}
          hasDiscount={hasDiscount}
          setHasDiscount={setHasDiscount}
        />
      </Card>

      {/* Сетка продуктов */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl shadow-sm">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
            No products found
          </p>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            No products match your current filters. Try changing your search
            criteria or add a new product.
          </p>
          <Link href="/super-admin/products/add">
            <Button className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 border border-blue-200 dark:border-blue-900 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 group">
              <Plus className="h-4 w-4 mr-2 transition-transform group-active:scale-90" />
              <span className="relative z-10">Add New Product</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProducts.map((product, productIndex) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={productIndex < 4}
              mode="admin"
              onDelete={(id) => openDeleteDialog(id)}
              isDeleting={isDeleting && productToDelete === product.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
// Функция для проверки типа ошибки
function isSerializedError(error: any): error is { message: string } {
  return "message" in error;
}

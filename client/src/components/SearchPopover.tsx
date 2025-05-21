import { useState, useEffect, useRef } from "react";
import { useGetPublicProductsQuery } from "@/store/api/apiSlice";
import SearchInput from "./SearchInput";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import "./searchPopover.css";

interface SearchPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  isMobileView?: boolean;
  isTabletView?: boolean;
}

const SearchPopover = ({
  isOpen,
  onClose,
  isMobileView = false,
  isTabletView = false,
}: SearchPopoverProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Запрос товаров с задержкой только если строка поиска не пустая
  const { data, isLoading } = useGetPublicProductsQuery(
    {
      searchQuery: searchQuery || undefined,
      limit: 5,
    },
    {
      skip: !searchQuery || !isDirty,
    }
  );

  const products = data?.products || [];

  // Обработчик изменения поискового запроса
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDirty(true);
  };

  // Обработчик для отправки формы поиска
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?searchQuery=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  // Обработчик клика по товару
  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
    onClose();
  };

  // Закрытие при клике снаружи - только для десктопа и планшета
  useEffect(() => {
    if (!isMobileView) {
      // Для планшетов и десктопа используем клик снаружи
      const handleClickOutside = (event: MouseEvent) => {
        if (
          searchContainerRef.current &&
          !searchContainerRef.current.contains(event.target as Node) &&
          isOpen
        ) {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMobileView, isOpen, onClose]);

  // Обработчик для клавиши Escape
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  // Сбрасываем состояние при закрытии
  useEffect(() => {
    if (!isOpen) {
      // Небольшая задержка для лучшей анимации
      const timer = setTimeout(() => {
        setSearchQuery("");
        setIsDirty(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Определяем стили для контейнера в зависимости от типа устройства
  const getContainerStyles = () => {
    if (isMobileView) {
      return "w-full";
    } else if (isTabletView) {
      return "w-full max-w-[600px]";
    }
    return "w-[200px] sm:w-[300px]";
  };

  // Определяем стили для результатов поиска в зависимости от типа устройства
  const getResultsPositionStyles = () => {
    if (isMobileView) {
      return "left-0 right-0 bottom-full mb-2 max-h-[35vh]";
    } else {
      return "left-0 right-0 top-full mt-2 max-h-[50vh]";
    }
  };

  return (
    <div
      className={`popover-search-container relative ${getContainerStyles()}`}
      ref={searchContainerRef}
    >
      {/* Форма поиска */}
      <form
        onSubmit={handleSearchSubmit}
        className="popover-search-form flex items-center bg-white dark:bg-gray-800 rounded-full overflow-hidden shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent w-full"
      >
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="popover-search-input flex-1"
          autoFocus
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-0.5"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </form>

      {/* Результаты поиска в выпадающем списке */}
      {searchQuery && (
        <div
          className={`absolute ${getResultsPositionStyles()} bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-10`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin mr-2" />
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                Searching...
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No products found
            </div>
          ) : (
            <>
              <div
                className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
                style={{ maxHeight: isMobileView ? "30vh" : "40vh" }}
              >
                {products.map((product) => (
                  <button
                    key={product.id}
                    className="flex items-center p-3 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.brand}
                      </p>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/products?searchQuery=${encodeURIComponent(
                    searchQuery
                  )}`}
                  className="block w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1"
                  onClick={onClose}
                >
                  View all results
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPopover;

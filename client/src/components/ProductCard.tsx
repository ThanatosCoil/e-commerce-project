import { FC, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash,
  ShoppingCart,
  Package,
  Star,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import "./ProductCard.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { renderColorDot } from "@/components/ui/color-dot";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useAddToCartMutation,
  useGetCartQuery,
  CartItem,
} from "@/store/api/cartSlice";
import { toast } from "sonner";
import debounce from "lodash/debounce";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  discount: number;
  images: string[];
  colors: string[];
  sizes: string[];
  category?: string;
  gender?: string;
  stock?: number;
  rating?: number;
}

// Интерфейс для состояния добавления в корзину
interface CartAddingState {
  isAdding: boolean;
  success: boolean;
  timeout?: NodeJS.Timeout;
}

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  mode?: "admin" | "user";
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onFilterByCategory?: (category: string) => void;
  onFilterByGender?: (gender: string) => void;
  onFilterByBrand?: (brand: string) => void;
  cartAddingState?: CartAddingState;
}

const ProductCard: FC<ProductCardProps> = ({
  product,
  priority = false,
  mode = "user",
  onDelete,
  isDeleting = false,
  onFilterByCategory,
  onFilterByGender,
  onFilterByBrand,
  cartAddingState,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [productImagesMap, setProductImagesMap] = useState<
    Record<string, string[]>
  >({});
  const [isHovered, setIsHovered] = useState(false);
  const [expandedColors, setExpandedColors] = useState(false);
  const [expandedSizes, setExpandedSizes] = useState(false);
  const currentProductIdRef = useRef<string | null>(null);
  const [addToCart, { isLoading: isServerAddingToCart }] =
    useAddToCartMutation();

  // Добавляем состояния для выбранного размера и цвета
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  // Добавляем состояние для модального окна выбора параметров
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // Состояние локальной загрузки добавления в корзину (если не передано внешнее)
  const [isLocalAddingToCart, setIsLocalAddingToCart] = useState(false);
  const [isLocalAddSuccess, setIsLocalAddSuccess] = useState(false);

  // Вычисляем состояние добавления в корзину
  const isAddingToCart =
    cartAddingState?.isAdding || isLocalAddingToCart || isServerAddingToCart;
  const isAddSuccess = cartAddingState?.success || isLocalAddSuccess;

  // Вычисляем цену со скидкой
  const discountedPrice =
    product.discount > 0
      ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
      : null;

  // Получаем данные корзины для проверки доступности товара
  const { data: cartItems } = useGetCartQuery();

  // Состояние для отслеживания количества товара в корзине
  const [itemsInCartCount, setItemsInCartCount] = useState(0);
  const [availableToAdd, setAvailableToAdd] = useState<number | undefined>(
    undefined
  );
  const [cartError, setCartError] = useState<string | null>(null);

  // Инициализация карты изображений
  useEffect(() => {
    setProductImagesMap({ [product.id]: product.images });
    // Сброс индекса при изменении продукта
    setCurrentImageIndex(0);
  }, [product.id, product.images]);

  // Обновляем информацию о товарах в корзине при изменении данных
  useEffect(() => {
    if (cartItems && product.stock !== undefined) {
      // Подсчитываем количество этого товара (во всех вариациях) уже в корзине
      const itemsOfSameProduct = cartItems.filter(
        (item: CartItem) => item.productId === product.id
      );

      const totalInCart = itemsOfSameProduct.reduce(
        (sum: number, item: CartItem) => sum + item.quantity,
        0
      );

      setItemsInCartCount(totalInCart);

      // Вычисляем, сколько еще можно добавить
      const remaining = Math.max(0, product.stock - totalInCart);
      setAvailableToAdd(remaining);

      // Если товара в корзине много относительно общего количества, показываем уведомление
      if (totalInCart > 0 && remaining < 5) {
        setCartError(`Limited availability due to items in your cart`);
      } else {
        setCartError(null);
      }
    } else {
      setItemsInCartCount(0);
      setAvailableToAdd(product.stock);
      setCartError(null);
    }
  }, [cartItems, product.id, product.stock]);

  // Функции для навигации по изображениям
  const nextImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  // Функция для открытия изображения в полном размере
  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setIsFullscreenOpen(true);
    // Добавим класс к body для скрытия навбара и блокировки прокрутки
    document.body.classList.add("fullscreen-mode");
    // Предотвращаем прокрутку основной страницы
    document.body.style.overflow = "hidden";
    currentProductIdRef.current = product.id;
  };

  // Функция для закрытия полноэкранного режима
  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
    setFullscreenImage(null);
    // Удаляем класс у body
    document.body.classList.remove("fullscreen-mode");
    // Восстанавливаем прокрутку
    document.body.style.overflow = "";
  };

  // Функции для показа следующего/предыдущего изображения в полноэкранном режиме
  const showNextFullscreenImage = () => {
    const nextIndex = (currentImageIndex + 1) % product.images.length;
    setCurrentImageIndex(nextIndex);
    setFullscreenImage(product.images[nextIndex]);
  };

  const showPrevFullscreenImage = () => {
    const prevIndex =
      (currentImageIndex - 1 + product.images.length) % product.images.length;
    setCurrentImageIndex(prevIndex);
    setFullscreenImage(product.images[prevIndex]);
  };

  // Обработка нажатий клавиш для навигации в полноэкранном режиме
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenOpen) return;

      if (e.key === "Escape") {
        closeFullscreen();
      } else if (e.key === "ArrowRight") {
        showNextFullscreenImage();
      } else if (e.key === "ArrowLeft") {
        showPrevFullscreenImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenOpen, currentImageIndex]);

  // Очищаем состояние при размонтировании компонента
  useEffect(() => {
    return () => {
      // Убедимся, что классы будут удалены, если компонент размонтируется
      document.body.classList.remove("fullscreen-mode");
      document.body.style.overflow = "";
    };
  }, []);

  // Создаем дебаунсированную функцию добавления в корзину с использованием useCallback и lodash
  const debouncedAddToCart = useCallback(
    debounce(async (size: string, color: string) => {
      try {
        // Проверяем доступность товара с учетом корзины
        if (availableToAdd !== undefined && availableToAdd <= 0) {
          toast.error(
            "This product is out of stock including items in your cart",
            {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              duration: 5000,
            }
          );
          return;
        }

        // Если используем локальное состояние (без внешнего управления)
        if (!cartAddingState) {
          setIsLocalAddingToCart(true);
        }

        await addToCart({
          productId: product.id,
          quantity: 1,
          size: size,
          color: color,
        }).unwrap();

        // Если используем локальное состояние
        if (!cartAddingState) {
          setIsLocalAddingToCart(false);
          setIsLocalAddSuccess(true);

          // Сбрасываем состояние успешного добавления через некоторое время
          setTimeout(() => {
            setIsLocalAddSuccess(false);
          }, 1500);
        }

        toast.success(`${product.name} added to cart`);
      } catch (error: any) {
        console.error("Failed to add item to cart:", error);

        // Обработка ошибок с сервера
        if (error.data && error.data.message) {
          toast.error(error.data.message, {
            duration: 5000,
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          });
          setCartError(error.data.message);
        } else if (error.status === 401) {
          toast.error("You need to log in to add items to your cart");
          setCartError("You need to log in to add items to your cart");
        } else {
          toast.error("Failed to add item to cart. Please try again later.");
        }

        // Сбрасываем состояние загрузки при ошибке
        if (!cartAddingState) {
          setIsLocalAddingToCart(false);
        }
      }
    }, 300),
    [product.id, product.name, addToCart, cartAddingState, availableToAdd]
  );

  // Функция для переключения состояния показа описания
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Функция для переключения состояния показа всех цветов
  const toggleColors = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedColors(!expandedColors);
  };

  // Функция для переключения состояния показа всех размеров
  const toggleSizes = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSizes(!expandedSizes);
  };

  // Обработчик удаления
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(product.id);
    }
  };

  // Обработчик добавления в корзину
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Если размер или цвет не выбраны, открываем модальное окно
    if (!selectedSize || !selectedColor) {
      setIsSelectionModalOpen(true);
      return;
    }

    // Используем дебаунсированную функцию
    debouncedAddToCart(selectedSize, selectedColor);
  };

  // Обработчик подтверждения выбора в модальном окне
  const handleConfirmSelection = async () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }

    // Закрываем модальное окно
    setIsSelectionModalOpen(false);

    // Используем дебаунсированную функцию
    debouncedAddToCart(selectedSize, selectedColor);
  };

  // Обработчики для фильтрации
  const handleFilterByCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilterByCategory && product.category) {
      onFilterByCategory(product.category);
    }
  };

  const handleFilterByGender = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilterByGender && product.gender) {
      onFilterByGender(product.gender);
    }
  };

  const handleFilterByBrand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFilterByBrand) {
      onFilterByBrand(product.brand);
    }
  };

  // Обработчик выбора цвета
  const handleColorSelect = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Если цвет уже выбран, отменяем выбор
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
  };

  // Обработчик выбора размера
  const handleSizeSelect = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Если размер уже выбран, отменяем выбор
    if (selectedSize === size) {
      setSelectedSize(null);
    } else {
      setSelectedSize(size);
    }
  };

  return (
    <>
      {/* Карточка товара */}
      <Card
        className="product-card overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-lg group bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-800/40 gap-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Галерея изображений с кнопками навигации */}
        <div className="aspect-square w-full overflow-hidden hover:shadow-lg relative product-image-gallery">
          {product.images.length > 0 ? (
            <div className="product-gallery-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={
                      product.images[currentImageIndex] || "/placeholder.png"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Кнопка для просмотра в полном размере */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openFullscreen(product.images[currentImageIndex]);
                }}
                className="gallery-fullscreen-button"
                aria-label="View full size"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </button>

              {/* Кнопки навигации слева/справа (если больше 1 изображения) - видны при наведении */}
              {product.images.length > 1 && isHovered && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-2 rounded-full z-10 opacity-80 hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-800 dark:text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-2 rounded-full z-10 opacity-80 hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-800 dark:text-white" />
                  </button>

                  {/* Индикаторы изображений */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {product.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={cn(
                          "transition-all duration-300 rounded-full",
                          idx === currentImageIndex
                            ? "bg-white border border-blue-500 w-6 h-3"
                            : "bg-white/50 hover:bg-white/80 w-3 h-3"
                        )}
                        aria-label={`Перейти к изображению ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Показываем бейдж низкого количества товара */}
          {product.stock !== undefined && product.stock < 10 && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 dark:text-white">
              Low Stock: {product.stock}
            </Badge>
          )}

          {/* Бейдж с количеством товара в корзине */}
          {itemsInCartCount > 0 && (
            <Badge
              className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 dark:text-white flex items-center gap-1 px-2 py-1 transition-all duration-300 animate-in zoom-in-50"
              title="Items in your cart"
            >
              <ShoppingCart className="h-3 w-3 text-white" />
              <span>{itemsInCartCount}</span>
            </Badge>
          )}
        </div>

        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col gap-2">
            {/* Строка с брендом и бейджами категории/пола */}
            <div className="flex justify-between items-center">
              {mode === "admin" ? (
                <p className="text-sm text-gray-500 uppercase dark:text-gray-400">
                  {product.brand.charAt(0).toUpperCase() +
                    product.brand.slice(1)}
                </p>
              ) : (
                <p
                  className="text-sm text-gray-500 uppercase dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                  onClick={handleFilterByBrand}
                >
                  {product.brand.charAt(0).toUpperCase() +
                    product.brand.slice(1)}
                </p>
              )}

              {/* Бейджи для категории и пола */}
              {product.category && product.gender && (
                <div className="flex items-center gap-1.5">
                  {mode === "admin" ? (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800">
                      {product.category.charAt(0).toUpperCase() +
                        product.category.slice(1)}
                    </Badge>
                  ) : (
                    <Badge
                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800 dark:hover:bg-purple-950/70 cursor-pointer"
                      onClick={handleFilterByCategory}
                    >
                      {product.category.charAt(0).toUpperCase() +
                        product.category.slice(1)}
                    </Badge>
                  )}

                  {mode === "admin" ? (
                    <Badge
                      className={`border ${
                        product.gender === "Male"
                          ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
                          : product.gender === "Female"
                          ? "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800"
                      }`}
                    >
                      {product.gender}
                    </Badge>
                  ) : (
                    <Badge
                      className={`border cursor-pointer ${
                        product.gender === "Male"
                          ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-950/70"
                          : product.gender === "Female"
                          ? "bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800 dark:hover:bg-pink-950/70"
                          : "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800 dark:hover:bg-yellow-950/70"
                      }`}
                      onClick={handleFilterByGender}
                    >
                      {product.gender}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Строка с названием и рейтингом */}
            {mode === "admin" ? (
              <Link
                href={`/super-admin/products/edit/${product.id}`}
                className="flex-1"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xl p-1 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1 group-hover:border-indigo-400 dark:group-hover:border-indigo-400 transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:translate-y-[-1px] cursor-pointer flex-1">
                    {product.name}
                  </h3>
                  {product.rating !== undefined && (
                    <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <Link href={`/products/${product.id}`} className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xl p-1 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 pb-1 group-hover:border-indigo-400 dark:group-hover:border-indigo-400 transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:translate-y-[-1px] cursor-pointer flex-1">
                    {product.name}
                  </h3>
                  {product.rating !== undefined && (
                    <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow flex flex-col">
          {/* Описание */}
          <div className="mt-2 mb-auto">
            {product.description && (
              <div
                className="mt-2 description-container bg-gray-100 dark:bg-gray-800/50 rounded-md px-2 py-1 border border-gray-200 dark:border-gray-700 shadow-sm"
                style={{
                  maxHeight: expandedDescriptions[product.id]
                    ? "150px"
                    : "100px",
                  overflow: expandedDescriptions[product.id]
                    ? "auto"
                    : "hidden",
                }}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {expandedDescriptions[product.id]
                    ? product.description
                    : product.description.length > 150
                    ? product.description.substring(0, 130) + "... "
                    : product.description}

                  {product.description.length > 150 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleDescription(product.id);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto inline-flex items-center"
                    >
                      {expandedDescriptions[product.id] ? (
                        <>
                          Show less
                          <ChevronUp className="ml-1 h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Show more
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Доступные цвета с возможностью выбора */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Available colors:
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(expandedColors
                ? product.colors
                : product.colors.slice(0, 4)
              ).map((color, i) => (
                <div
                  key={i}
                  onClick={
                    mode === "admin"
                      ? undefined
                      : (e) => handleColorSelect(e, color)
                  }
                  className={cn(
                    "w-6 h-6 flex items-center justify-center",
                    mode === "admin"
                      ? ""
                      : "cursor-pointer transition-transform",
                    selectedColor === color && mode !== "admin"
                      ? "ring-2 ring-offset-2 rounded-full ring-blue-600 dark:ring-blue-500 ring-offset-white dark:ring-offset-gray-900 scale-110 transition-all duration-200"
                      : mode !== "admin"
                      ? "hover:scale-110"
                      : ""
                  )}
                >
                  {renderColorDot(color, i)}
                </div>
              ))}
              {product.colors.length > 4 &&
                !expandedColors &&
                mode !== "admin" && (
                  <button
                    onClick={toggleColors}
                    className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold shadow-sm"
                  >
                    +{product.colors.length - 4}
                  </button>
                )}
            </div>
          </div>

          {/* Доступные размеры с возможностью выбора */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Available sizes:
              </p>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {(expandedSizes ? product.sizes : product.sizes.slice(0, 4)).map(
                (size, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-0 min-w-[32px] text-center",
                      mode === "admin" ? "" : "cursor-pointer",
                      selectedSize === size && mode !== "admin"
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 transition-all duration-200"
                        : mode !== "admin"
                        ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                        : ""
                    )}
                    onClick={
                      mode === "admin"
                        ? undefined
                        : (e) => handleSizeSelect(e, size)
                    }
                  >
                    {size}
                  </Badge>
                )
              )}
              {product.sizes.length > 4 &&
                !expandedSizes &&
                mode !== "admin" && (
                  <button
                    onClick={toggleSizes}
                    className="px-2 py-0 min-w-[32px] rounded text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold border border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600 cursor-pointer"
                  >
                    +{product.sizes.length - 4}
                  </button>
                )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              {product.stock !== undefined && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        product.stock < 5
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Stock: {product.stock}
                    </p>

                    {/* Изменяем отображение доступного количества */}
                    {availableToAdd !== undefined &&
                      availableToAdd !== product.stock && (
                        <p
                          className={`text-sm ${
                            availableToAdd < 5
                              ? "text-amber-500 dark:text-amber-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          • Available: {availableToAdd}
                        </p>
                      )}
                  </div>

                  {/* Показываем ошибку, если она есть */}
                  {cartError && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {cartError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Отображение скидки только для админ-панели */}
          {mode === "admin" && (
            <div className="mt-2 flex items-center gap-2">
              {discountedPrice ? (
                <>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    ${discountedPrice}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 line-through text-sm">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                    -{product.discount}%
                  </span>
                </>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
          {mode === "admin" ? (
            // Кнопки для админ-панели
            <>
              <Link
                href={`/super-admin/products/edit/${product.id}`}
                className="flex-1"
              >
                <Button
                  variant="default"
                  className="w-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Pencil className="h-4 w-4 mr-2 transition-transform group-active:scale-90" />{" "}
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 bg-red-100 border-red-200 dark:bg-red-900/50 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 active:bg-red-100 dark:active:bg-red-900 active:scale-95 transition-all duration-200 focus:ring-red-400 focus:ring-opacity-30"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors" />
              </Button>
            </>
          ) : (
            // Кнопки для пользовательской части - добавляем проверку доступности
            <>
              <Button
                variant="default"
                className={`flex-[3] flex items-center gap-2 px-3 shadow-md hover:shadow-lg relative
                ${
                  discountedPrice
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-600 dark:border-green-800"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-blue-600 dark:border-blue-800"
                } ${isAddingToCart || isAddSuccess ? "cursor-wait" : ""} ${
                  availableToAdd !== undefined && availableToAdd <= 0
                    ? "opacity-60 cursor-not-allowed"
                    : "active:scale-95 active:shadow-sm transition-all duration-200"
                }`}
                onClick={handleAddToCart}
                disabled={
                  isAddingToCart ||
                  isAddSuccess ||
                  (availableToAdd !== undefined && availableToAdd <= 0)
                }
              >
                {isAddingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isAddSuccess ? (
                  <Check className="h-4 w-4 text-white animate-pulse" />
                ) : availableToAdd !== undefined && availableToAdd <= 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {discountedPrice ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">
                      ${discountedPrice}
                    </span>
                    <span className="text-xs text-gray-100 dark:text-gray-200 line-through opacity-80">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-white">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                {discountedPrice && (
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-sm border border-white dark:border-gray-800 z-9">
                    -{product.discount}%
                  </span>
                )}
              </Button>
              <Link href={`/products/${product.id}`} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all duration-200 shadow-sm"
                >
                  Details
                </Button>
              </Link>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Модальное окно для выбора размера и цвета */}
      <Dialog
        open={isSelectionModalOpen}
        onOpenChange={setIsSelectionModalOpen}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2 mb-2 border-gray-200 dark:border-gray-700">
            Select options for {product.name}
          </DialogTitle>
          <div className="grid gap-6 py-4">
            {/* Размеры */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={(e) =>
                      // Если размер уже выбран, отменяем выбор
                      selectedSize === size
                        ? setSelectedSize(null)
                        : setSelectedSize(size)
                    }
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      selectedSize === size
                        ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md"
                        : "bg-gray-100 shadow-sm dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Цвета */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Color
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={(e) =>
                      // Если цвет уже выбран, отменяем выбор
                      selectedColor === color
                        ? setSelectedColor(null)
                        : setSelectedColor(color)
                    }
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-blue-600 dark:ring-blue-500 ring-offset-white dark:ring-offset-gray-900 scale-110"
                        : "hover:scale-110"
                    )}
                    title={color}
                  >
                    {renderColorDot(color)}
                  </button>
                ))}
              </div>
            </div>

            {/* Информация о продукте */}
            <div className="mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Price:
                </span>
                {discountedPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${discountedPrice}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500 text-white border-red-600 text-xs">
                      -{product.discount}%
                    </Badge>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              {product.stock !== undefined && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total stock:
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        product.stock < 10
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-green-600 dark:text-green-400"
                      )}
                    >
                      {product.stock}
                    </span>
                  </div>

                  {/* Отображаем информацию о товарах в корзине */}
                  {itemsInCartCount > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          In your cart:
                        </span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {itemsInCartCount}
                        </span>
                      </div>

                      {availableToAdd !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Available to add:
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              availableToAdd < 5
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                            )}
                          >
                            {availableToAdd}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Отображаем ошибку, если она есть */}
                  {cartError && (
                    <div className="mt-1 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {cartError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirmSelection}
              disabled={
                isAddingToCart ||
                !selectedSize ||
                !selectedColor ||
                isAddSuccess ||
                (availableToAdd !== undefined && availableToAdd <= 0)
              }
              className={cn(
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white shadow-md",
                (!selectedSize ||
                  !selectedColor ||
                  (availableToAdd !== undefined && availableToAdd <= 0)) &&
                  "opacity-70 cursor-not-allowed"
              )}
            >
              {isAddingToCart ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding...</span>
                </div>
              ) : isAddSuccess ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-white" />
                  <span>Added!</span>
                </div>
              ) : availableToAdd !== undefined && availableToAdd <= 0 ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Out of stock</span>
                </div>
              ) : (
                "Add to Cart"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Полноэкранный режим просмотра изображений */}
      <div
        className={`fullscreen-overlay ${isFullscreenOpen ? "active" : ""}`}
        onClick={closeFullscreen}
        tabIndex={0}
      >
        {fullscreenImage && (
          <div
            className="fullscreen-image-container dark:bg-gray-900/90"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                <Image
                  src={fullscreenImage}
                  alt="Full size product"
                  className="fullscreen-image"
                  onClick={(e) => e.stopPropagation()}
                  width={600}
                  height={600}
                  sizes="80vw"
                  quality={90}
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Невидимые области для навигации */}
            {product.images.length > 1 && (
              <>
                <div
                  className="navigation-area navigation-prev"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showPrevFullscreenImage();
                  }}
                  aria-label="Previous image"
                ></div>
                <div
                  className="navigation-area navigation-next"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showNextFullscreenImage();
                  }}
                  aria-label="Next image"
                ></div>

                {/* Индикатор текущего изображения */}
                <div
                  className="indicators"
                  onClick={(e) => e.stopPropagation()}
                >
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                        setFullscreenImage(product.images[index]);
                      }}
                      className={index === currentImageIndex ? "active" : ""}
                      data-active={index === currentImageIndex}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              className="fullscreen-close-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeFullscreen();
              }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCard;

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useGetProductByIdQuery,
  useGetProductReviewsQuery,
  useGetUserReviewQuery,
  useCreateOrUpdateReviewMutation,
  useDeleteReviewMutation,
} from "@/store/api/apiSlice";
import { useGetCartQuery, CartItem } from "@/store/api/cartSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  RotateCcw,
  Award,
  Shield,
  AlertTriangle,
  Maximize2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { renderColorDot } from "@/components/ui/color-dot";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Review } from "@/types/review";
import ReviewModal from "@/components/review/ReviewModal";
import ReviewsList from "@/components/review/ReviewsList";
import RatingDisplay from "@/components/review/RatingDisplay";
import { useAddToCartMutation } from "@/store/api/cartSlice";
import QuantityInput from "@/components/QuantityInput";
import debounce from "lodash/debounce";

export default function ProductPage() {
  const { id } = useParams();
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useGetProductByIdQuery(id as string);

  const { data: reviewsData, isLoading: isReviewsLoading } =
    useGetProductReviewsQuery(id as string);

  const { data: userReviewData, isLoading: isUserReviewLoading } =
    useGetUserReviewQuery(id as string, {
      skip: !id,
    });

  // Получаем данные корзины для информации о текущих товарах
  const { data: cartItems } = useGetCartQuery();

  const [createOrUpdateReview] = useCreateOrUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Состояния для отображения информации о товарах в корзине
  const [itemsInCartCount, setItemsInCartCount] = useState(0);
  const [cartError, setCartError] = useState<string | null>(null);

  // Состояния для отзывов
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Состояния для дебаунса добавления в корзину
  const [addToCart, { isLoading: isServerAddingToCart }] =
    useAddToCartMutation();

  const [isLocalAddingToCart, setIsLocalAddingToCart] = useState(false);
  const [isAddSuccess, setIsAddSuccess] = useState(false);

  // Объединенное состояние загрузки
  const isAddingToCart = isLocalAddingToCart || isServerAddingToCart;

  // Вычисляем цену со скидкой
  const discountedPrice =
    product && product.discount > 0
      ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
      : null;

  // Навигация по изображениям
  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  // Функция для открытия изображения в полном размере
  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setIsFullscreenOpen(true);
    // Добавим класс к body для скрытия навбара и блокировки прокрутки
    document.body.classList.add("fullscreen-mode");
    // Предотвращаем прокрутку основной страницы
    document.body.style.overflow = "hidden";
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
    if (product) {
      const nextIndex = (currentImageIndex + 1) % product.images.length;
      setCurrentImageIndex(nextIndex);
      setFullscreenImage(product.images[nextIndex]);
    }
  };

  const showPrevFullscreenImage = () => {
    if (product) {
      const prevIndex =
        (currentImageIndex - 1 + product.images.length) % product.images.length;
      setCurrentImageIndex(prevIndex);
      setFullscreenImage(product.images[prevIndex]);
    }
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

  // Обновляем состояние отзывов когда данные загружены
  useEffect(() => {
    if (reviewsData?.success && reviewsData.reviews) {
      setReviews(reviewsData.reviews);
    }
  }, [reviewsData]);

  // Обновляем состояние отзыва пользователя когда данные загружены
  useEffect(() => {
    if (userReviewData?.success && userReviewData.review) {
      setUserReview(userReviewData.review);
    }
  }, [userReviewData]);

  // Обновляем информацию о товарах в корзине при загрузке страницы
  useEffect(() => {
    if (cartItems && product) {
      // Подсчитываем количество этого товара (во всех вариациях) уже в корзине
      const itemsOfSameProduct = cartItems.filter(
        (item: CartItem) => item.productId === id
      );

      const totalInCart = itemsOfSameProduct.reduce(
        (sum: number, item: CartItem) => sum + item.quantity,
        0
      );

      setItemsInCartCount(totalInCart);

      // Если в корзине уже есть этот товар и его много, показываем предупреждение
      if (totalInCart > 0 && product.stock - totalInCart < 5) {
        setCartError(
          `Note: You already have ${totalInCart} item(s) of this product in your cart.`
        );
      } else {
        setCartError(null);
      }

      // Если количество, выбранное пользователем, больше доступного, корректируем его
      if (quantity > product.stock - totalInCart) {
        setQuantity(Math.max(1, product.stock - totalInCart));
      }
    }
  }, [cartItems, product, id, quantity]);

  // Очищаем состояние при размонтировании компонента
  useEffect(() => {
    return () => {
      // Убедимся, что классы будут удалены, если компонент размонтируется
      document.body.classList.remove("fullscreen-mode");
      document.body.style.overflow = "";
    };
  }, []);

  // Открываем модальное окно для отзыва
  const openReviewModal = () => {
    setIsReviewModalOpen(true);
    // Предотвращаем прокрутку при открытом модальном окне
    document.body.style.overflow = "hidden";
  };

  // Закрываем модальное окно для отзыва
  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    document.body.style.overflow = "";
  };

  // Обрабатываем отправку отзыва
  const handleSubmitReview = async (
    reviewData: Omit<Review, "id" | "date" | "userId" | "userName">
  ) => {
    try {
      await createOrUpdateReview({
        productId: id,
        ...reviewData,
      }).unwrap();

      closeReviewModal();
      toast.success("Review submitted successfully");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    }
  };

  // Обрабатываем удаление отзыва
  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId).unwrap();
      // Обновляем стейт userReview после удаления
      setUserReview(null);
      toast.success("Review deleted successfully");
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    }
  };

  // Создаем дебаунсированную функцию добавления в корзину
  const debouncedAddToCart = useCallback(
    debounce(async () => {
      if (!selectedSize) {
        toast.error("Please select a size");
        return;
      }
      if (!selectedColor) {
        toast.error("Please select a color");
        return;
      }

      // Проверяем доступность количества с учетом товаров в корзине
      if (product && itemsInCartCount > 0) {
        const availableToAdd = Math.max(0, product.stock - itemsInCartCount);

        if (availableToAdd <= 0) {
          toast.error(
            "This product is out of stock including items in your cart"
          );
          setCartError(
            "This product is out of stock including items in your cart"
          );
          return;
        }

        if (quantity > availableToAdd) {
          toast.warning(
            `Only ${availableToAdd} items available to add (including items already in your cart)`
          );
          setQuantity(availableToAdd);
          return;
        }
      }

      try {
        setIsLocalAddingToCart(true);

        await addToCart({
          productId: id as string,
          quantity: quantity,
          size: selectedSize,
          color: selectedColor,
        }).unwrap();

        setIsLocalAddingToCart(false);
        setIsAddSuccess(true);

        toast.success(`${quantity} item(s) added to cart`);

        // Сбрасываем состояние успешного добавления через некоторое время
        setTimeout(() => {
          setIsAddSuccess(false);
        }, 1500);
      } catch (error: any) {
        console.error("Failed to add to cart:", error);

        // Обработка ошибок с сервера
        if (error.data && error.data.message) {
          toast.error(error.data.message, {
            duration: 5000,
          });

          // Сохраняем ошибку для отображения под кнопкой
          setCartError(error.data.message);
        } else if (error.status === 401) {
          toast.error("You need to log in to add items to your cart");
          setCartError("You need to log in to add items to your cart");
        } else {
          toast.error("Failed to add to cart. Please try again later.");
          setCartError("Failed to add to cart. Please try again later.");
        }

        setIsLocalAddingToCart(false);
      }
    }, 300),
    [
      id,
      quantity,
      selectedSize,
      selectedColor,
      addToCart,
      product,
      itemsInCartCount,
    ]
  );

  // Обработчик добавления в корзину
  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }

    // Используем дебаунсированную функцию
    debouncedAddToCart();
  };

  // Индикатор загрузки для всей страницы
  const isLoading = isProductLoading;
  const isError = isProductError;

  // Скелетон для страницы продукта
  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-6">
        <div className="container mx-auto py-8 px-4">
          {/* Навигационная цепочка */}
          <div className="mb-6 flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <span className="mx-2 text-gray-300 dark:text-gray-600">›</span>
            <Skeleton className="h-4 w-20 rounded" />
            <span className="mx-2 text-gray-300 dark:text-gray-600">›</span>
            <Skeleton className="h-4 w-32 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Левая колонка - изображения продукта */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <div className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded" />
                ))}
              </div>
            </div>

            {/* Правая колонка - информация о продукте */}
            <div className="flex flex-col gap-4">
              {/* Бейджи */}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* Бренд и название */}
              <div className="mb-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-9 w-3/4" />
              </div>

              {/* Рейтинг */}
              <div className="flex gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-5 rounded-full" />
                ))}
                <Skeleton className="h-5 w-16 ml-2" />
              </div>

              {/* Цена */}
              <Skeleton className="h-8 w-24 mb-2" />

              {/* Описание */}
              <div className="mb-2">
                <Skeleton className="h-6 w-28 mb-2" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>

              {/* Размеры */}
              <div className="mb-2">
                <Skeleton className="h-6 w-16 mb-2" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-16 rounded-md" />
                  ))}
                </div>
              </div>

              {/* Цвета */}
              <div className="mb-2">
                <Skeleton className="h-6 w-16 mb-2" />
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </div>

              {/* Количество товара (скелетон) */}
              <div className="mb-2">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>

              {/* Кнопка добавления в корзину (скелетон) */}
              <Skeleton className="h-12 w-full mt-2 rounded-md" />

              {/* Детали доставки (скелетон) */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Отзывы (скелетон) */}
          <div className="mt-16">
            <Skeleton className="h-8 w-48 mb-8" />

            {/* Скелетон отзывов */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="w-full">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-4 w-4 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Показываем ошибку
  if (isError || !product) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                Product Not Found
              </h2>
              <p className="text-red-600 dark:text-red-300 max-w-md">
                The product you are looking for doesn't exist or has been
                removed.
              </p>
              <Link href="/products">
                <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white shadow-md">
                  Return to Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-6">
      <div className="container mx-auto py-4 px-4">
        {/* Навигационная цепочка */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400 flex items-center">
          <Link
            href="/"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link
            href="/products"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Products
          </Link>
          <span className="mx-2">›</span>
          <span className="text-blue-600 dark:text-blue-400">
            {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Левая колонка - изображения продукта */}
          <div>
            <div className="relative overflow-hidden rounded-xl shadow-lg bg-white dark:bg-gray-800 mb-4">
              {product.images && product.images.length > 0 ? (
                <div className="relative aspect-square overflow-hidden">
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
                        src={product.images[currentImageIndex]}
                        alt={product.name}
                        fill
                        priority
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Кнопка для просмотра в полном размере */}
                  <button
                    type="button"
                    onClick={() =>
                      openFullscreen(product.images[currentImageIndex])
                    }
                    className="absolute right-2 bottom-2 bg-white/80 dark:bg-gray-900/80 rounded-full p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-md z-10"
                    aria-label="View full size"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>

                  {/* Кнопки для навигации по изображениям */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 rounded-full p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-md"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 rounded-full p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-md"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      {/* Индикаторы изображений */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {product.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={cn(
                              "transition-all duration-300 rounded-full",
                              idx === currentImageIndex
                                ? "bg-white border border-blue-500 w-6 h-3"
                                : "bg-white/50 hover:bg-white/80 w-3 h-3"
                            )}
                            aria-label={`Go to image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <Package className="h-20 w-20 text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>

            {/* Миниатюры изображений */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2 transition-all duration-200",
                      idx === currentImageIndex
                        ? "border-blue-500 dark:border-blue-600 shadow-md"
                        : "border-transparent hover:border-blue-300 dark:hover:border-blue-800"
                    )}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - view ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка - информация о продукте */}
          <div className="flex flex-col relative">
            {/* Бейдж с количеством в корзине */}
            {itemsInCartCount > 0 && (
              <div
                className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 dark:text-white flex items-center gap-2 px-3 py-2 z-10 transition-all duration-300 animate-in zoom-in-50 rounded-md shadow-md"
                title="Items in your cart"
              >
                <ShoppingCart
                  size={16}
                  strokeWidth={2}
                  className="text-white"
                />
                <span className="text-md font-semibold text-white leading-none">
                  {itemsInCartCount} in cart
                </span>
              </div>
            )}

            {/* Бейджи для категории и пола */}
            <div className="flex items-center flex-wrap gap-2 mb-3">
              {product.category && (
                <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800 dark:hover:bg-purple-950/70">
                  {product.category.charAt(0).toUpperCase() +
                    product.category.slice(1)}
                </Badge>
              )}
              {product.gender && (
                <Badge
                  className={`border ${
                    product.gender === "Male"
                      ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-950/70"
                      : product.gender === "Female"
                      ? "bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800 dark:hover:bg-pink-950/70"
                      : "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800 dark:hover:bg-yellow-950/70"
                  }`}
                >
                  {product.gender}
                </Badge>
              )}

              {/* Показываем бейдж низкого количества товара */}
              {product.stock !== undefined && product.stock < 10 && (
                <Badge className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800 dark:hover:bg-red-950/70">
                  Low Stock: {product.stock}
                </Badge>
              )}
            </div>

            {/* Бренд и название */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 uppercase dark:text-gray-400">
                {product.brand.charAt(0).toUpperCase() + product.brand.slice(1)}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {product.name}
              </h1>
            </div>

            {/* Рейтинг компонент */}
            <RatingDisplay
              rating={product.rating}
              reviewCount={reviews.length}
              userReview={userReview}
              onOpenReviewModal={openReviewModal}
            />

            {/* Цена со скидкой */}
            <div className="flex items-center gap-3 mb-5">
              {discountedPrice ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${discountedPrice}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500 text-white border-red-600 ml-2 text-sm px-2 py-1">
                      -{product.discount}%
                    </Badge>
                  </div>
                </>
              ) : (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Описание */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Description
                </h3>
                {product.description && product.description.length > 250 && (
                  <button
                    onClick={() => setExpandedDescription(!expandedDescription)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center text-sm font-medium"
                  >
                    {expandedDescription ? (
                      <>
                        Less <ChevronUp className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        More <ChevronDown className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 p-3 pb-2 relative">
                <motion.div
                  initial={false}
                  animate={{
                    height:
                      expandedDescription ||
                      !product.description ||
                      product.description.length <= 250
                        ? "auto"
                        : "4.5rem",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-gray-600 dark:text-gray-300">
                    {product.description}
                  </p>
                </motion.div>

                {product.description && product.description.length > 250 && (
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: expandedDescription ? 0 : 1,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent pointer-events-none"
                  ></motion.div>
                )}
              </div>
            </div>

            {/* Размеры */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      selectedSize === size
                        ? "bg-blue-600 dark:bg-blue-700 text-white"
                        : "bg-gray-100 shadow-md dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Цвета */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Color
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-blue-600 dark:ring-blue-500 ring-offset-white dark:ring-offset-gray-900 scale-110"
                        : "scale-150 hover:scale-[1.7]"
                    )}
                    title={color}
                  >
                    {renderColorDot(color)}
                  </button>
                ))}
              </div>
            </div>

            {/* Количество товара */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Quantity
              </h3>
              <QuantityInput
                value={quantity}
                onChange={(newValue) => {
                  // Проверяем, не превышает ли новое значение доступный остаток
                  if (product && itemsInCartCount !== undefined) {
                    const availableToAdd = Math.max(
                      0,
                      product.stock - itemsInCartCount
                    );

                    if (newValue > availableToAdd) {
                      // Если превышает, устанавливаем максимально доступное
                      setQuantity(availableToAdd);
                      if (availableToAdd > 0) {
                        toast.warning(
                          `Limited to ${availableToAdd} items due to your current cart`
                        );
                      }
                      return;
                    }
                  }

                  setQuantity(newValue);
                }}
                min={1}
                max={
                  product && itemsInCartCount !== undefined
                    ? Math.max(0, product.stock - itemsInCartCount)
                    : product?.stock
                }
                stockLeft={
                  product && itemsInCartCount !== undefined
                    ? Math.max(0, product.stock - itemsInCartCount)
                    : product?.stock
                }
              />

              {/* Информация о доступности товара */}
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  {product?.stock !== undefined && (
                    <div
                      className={`text-sm font-medium ${
                        product.stock < 5
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      Stock: {product.stock}
                    </div>
                  )}
                </div>

                {/* Добавляем заметное предупреждение, если товар недоступен */}
                {itemsInCartCount > 0 &&
                  product?.stock !== undefined &&
                  product.stock - itemsInCartCount <= 0 && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Out of stock: All available items are already in your
                        cart
                      </span>
                    </div>
                  )}

                {/* Отображаем другие ошибки */}
                {cartError &&
                  (itemsInCartCount === 0 ||
                    (product?.stock !== undefined &&
                      product.stock - itemsInCartCount > 0) ||
                    product?.stock === undefined) && (
                    <div className="mt-2 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                      {cartError}
                    </div>
                  )}
              </div>
            </div>

            {/* Кнопка добавления в корзину */}
            <div className="mt-2">
              <Button
                onClick={handleAddToCart}
                disabled={
                  isAddingToCart ||
                  isAddSuccess ||
                  !selectedSize ||
                  !selectedColor ||
                  (product.stock !== undefined &&
                    itemsInCartCount !== undefined &&
                    product.stock - itemsInCartCount <= 0)
                }
                className={cn(
                  "w-full h-12 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-lg",
                  (!selectedSize || !selectedColor) &&
                    "opacity-70 cursor-not-allowed",
                  product.stock !== undefined &&
                    itemsInCartCount !== undefined &&
                    product.stock - itemsInCartCount <= 0 &&
                    "opacity-60 cursor-not-allowed bg-gray-500 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-700"
                )}
              >
                {isAddingToCart ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Adding...</span>
                  </div>
                ) : isAddSuccess ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-white" />
                    <span>Added to Cart!</span>
                  </div>
                ) : product.stock !== undefined &&
                  itemsInCartCount !== undefined &&
                  product.stock - itemsInCartCount <= 0 ? (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-white" />
                    <span>Out of Stock</span>
                  </div>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Детали доставки и возврата */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/80 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Free Delivery
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      For orders over $50
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Easy Returns
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      30 days return policy
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Quality Guarantee
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Guaranteed authentic products
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 shadow-sm">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Secure Payment
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      100% secure checkout
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Секция отзывов */}
        <div className="mt-16" id="reviews">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Reviews
            </h2>
          </div>

          {isReviewsLoading ? (
            <div className="text-center py-8">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3" />
              <Skeleton className="h-4 w-32 mx-auto mb-2" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          ) : (
            <ReviewsList
              reviews={reviews}
              onOpenReviewModal={openReviewModal}
              userReview={userReview}
              onDeleteReview={handleDeleteReview}
            />
          )}
        </div>
      </div>

      {/* Модальное окно для отзыва */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={closeReviewModal}
            onSubmit={handleSubmitReview}
            product={product}
            existingReview={userReview}
          />
        )}
      </AnimatePresence>

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
    </main>
  );
}

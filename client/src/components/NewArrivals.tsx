import { FC, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ErrorMessage } from "@/components/ui/error-message";
import { useGetLatestProductsQuery } from "@/store/api/apiSlice";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  brand: string;
  description: string;
  colors: string[];
  sizes: string[];
  category?: string;
  discount?: number;
}

interface NewArrivalsProps {
  products: Product[];
}

const NewArrivals: FC<NewArrivalsProps> = ({
  products: initialProducts = [],
}) => {
  // Используем initialProducts как начальное значение, но также делаем свой запрос
  // для отслеживания состояния ошибки и возможности повторения
  const {
    data: products = initialProducts,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetLatestProductsQuery(4);

  // Обработчик повторной попытки запроса в случае ошибки
  const handleRetry = () => {
    refetch();
  };

  // Показываем индикатор загрузки
  if (isLoading && initialProducts.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Показываем ошибку
  if (isError && initialProducts.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <ErrorMessage error={error} onRetry={handleRetry} showRetry={true} />
      </div>
    );
  }

  // Если продуктов нет (ни от пропса, ни от запроса), не показываем ничего
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-4 bg-slate-200 dark:bg-indigo-900/10 rounded-xl shadow-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ProductCardProps {
  product: Product;
  priority: boolean;
}

const ProductCard: FC<ProductCardProps> = ({ product, priority }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Вычисляем цену со скидкой, если она есть
  const discountedPrice =
    product.discount && product.discount > 0
      ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
      : null;

  // Сброс индекса фото при изменении продукта
  useEffect(() => {
    setCurrentImage(0);
  }, [product.id]);

  // Функции для ручной навигации
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Бейдж со скидкой - отображается, если есть скидка */}
        {discountedPrice && (
          <div className="absolute top-3 left-3 z-30">
            <Badge className="bg-red-500 text-white font-semibold px-2 py-1 text-xs rounded-md shadow-sm">
              -{product.discount}%
            </Badge>
          </div>
        )}

        {/* Категория - видна только при наведении */}
        {product.category && (
          <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge className="bg-black/60 hover:bg-black/70 text-white font-medium px-2.5 py-1 text-xs rounded-md">
              {product.category}
            </Badge>
          </div>
        )}

        {/* Галерея изображений продукта */}
        <div className="aspect-[4/5] relative overflow-hidden">
          {/* Основное изображение с анимацией */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={product.images[currentImage] || "/placeholder.png"}
                alt={`${product.name} - image ${currentImage + 1}`}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={priority}
              />
            </motion.div>
          </AnimatePresence>

          {/* Индикаторы для нескольких изображений - видны только при наведении */}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImage(idx);
                  }}
                  className={cn(
                    "transition-all duration-300 rounded-full",
                    currentImage === idx
                      ? "bg-white w-6 h-2"
                      : "bg-white/50 hover:bg-white/80 w-2 h-2"
                  )}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Кнопки навигации - видны только при наведении */}
          {product.images.length > 1 && isHovered && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/70 p-1.5 rounded-full z-10 opacity-0 group-hover:opacity-90 hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800 dark:text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/70 p-1.5 rounded-full z-10 opacity-0 group-hover:opacity-90 hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-gray-800 dark:text-white" />
              </button>
            </>
          )}

          {/* Информация о продукте */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-4 px-3 z-10">
            {/* Верхний ряд: название */}
            <h3
              className="font-semibold text-white text-sm sm:text-[15px] md:text-[17px] tracking-tight leading-tight line-clamp-2 text-center group-hover:scale-105 transition-transform duration-300 mb-2"
              style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.6)" }}
            >
              {product.name}
            </h3>

            {/* Нижний ряд: цена */}
            <div className="flex justify-end">
              {discountedPrice && (
                <div className="mr-2 self-center">
                  <p
                    className="text-gray-300 text-xs sm:text-sm line-through opacity-80"
                    style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)" }}
                  >
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              )}
              <div
                className={`relative overflow-hidden ${
                  discountedPrice
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300`}
              >
                <span
                  className={`absolute inset-0 bg-gradient-to-r ${
                    discountedPrice
                      ? "from-green-700 to-emerald-600"
                      : "from-blue-700 to-indigo-600"
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                ></span>

                <span className="flex items-center justify-center relative z-10 text-white font-medium px-3 py-1.5 text-md">
                  {discountedPrice ? (
                    <>${discountedPrice}</>
                  ) : (
                    `$${product.price.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default NewArrivals;

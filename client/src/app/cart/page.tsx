"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  useGetCartQuery,
  useUpdateCartItemQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} from "@/store/api/cartSlice";
import { useValidateCouponMutation } from "@/store/api/couponsSlice";
import { useDispatch, useSelector } from "react-redux";
import { applyCoupon, removeCoupon } from "@/store/slices/couponSlice";
import { RootState } from "@/store/store";
import {
  Trash2,
  ShoppingBag,
  RefreshCw,
  ShoppingCart,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getColorName } from "@/constants/product";
import debounce from "lodash/debounce";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QuantityInput from "@/components/QuantityInput";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";

// Определяем типы для элементов корзины
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number | null;
  discount: number | null;
  image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  stock?: number;
  availableStock?: number; // доступное количество с учетом других вариаций
  createdAt?: string;
}

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const savedCoupon = useSelector(
    (state: RootState) => state.coupon.appliedCoupon
  );
  const { data: cartItems, isLoading, isError, refetch } = useGetCartQuery();
  const [updateQuantity] = useUpdateCartItemQuantityMutation();
  const [removeItem] = useRemoveFromCartMutation();
  const [clearCart] = useClearCartMutation();
  const [processingItemIds, setProcessingItemIds] = useState<Set<string>>(
    new Set()
  );

  // Состояние для купона
  const [couponCode, setCouponCode] = useState(savedCoupon?.code || "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(
    savedCoupon
      ? { code: savedCoupon.code, discount: savedCoupon.discount }
      : null
  );
  const [isCouponApplied, setIsCouponApplied] = useState(!!savedCoupon?.valid);
  const [couponJustRemoved, setCouponJustRemoved] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Состояние для диалога подтверждения очистки корзины
  const [isClearCartDialogOpen, setIsClearCartDialogOpen] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);

  // Используем мутацию RTK Query для валидации купона
  const [validateCoupon, { isLoading: isValidatingCoupon }] =
    useValidateCouponMutation();

  // Инициализируем состояние из Redux при загрузке
  useEffect(() => {
    if (savedCoupon && savedCoupon.valid) {
      setAppliedCoupon({
        code: savedCoupon.code,
        discount: savedCoupon.discount,
      });
      setCouponCode(savedCoupon.code);
      setIsCouponApplied(true);
      setCouponError(null);
    }
  }, [savedCoupon]);

  // Сбрасываем флаг удаления купона через небольшую задержку
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (couponJustRemoved) {
      timeoutId = setTimeout(() => {
        setCouponJustRemoved(false);
      }, 500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [couponJustRemoved]);

  // Обработчик применения купона
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    // Сбрасываем ошибку перед новой проверкой
    setCouponError(null);

    try {
      // Используем RTK Query мутацию
      const result = await validateCoupon(couponCode).unwrap();

      if (result.valid) {
        setAppliedCoupon({
          code: result.code,
          discount: result.discount,
        });
        setIsCouponApplied(true);
        setCouponError(null);

        // Сохраняем купон в Redux
        dispatch(
          applyCoupon({
            code: result.code,
            discount: result.discount,
            valid: result.valid,
            message: result.message,
          })
        );

        toast.success(`Coupon applied: ${result.discount}% off`);
      } else {
        toast.error(result.message || "Invalid coupon");
        setIsCouponApplied(false);
        setAppliedCoupon(null);
        setCouponError(result.message || "Invalid coupon");

        // Удаляем купон из Redux
        dispatch(removeCoupon());
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error("Failed to validate coupon");
      setIsCouponApplied(false);
      setAppliedCoupon(null);
      setCouponError("Failed to validate coupon");

      // Удаляем купон из Redux
      dispatch(removeCoupon());
    }
  };

  // Обработчик удаления купона
  const handleRemoveCoupon = () => {
    // Сначала удаляем купон из Redux
    dispatch(removeCoupon());

    // Затем обновляем локальное состояние
    setAppliedCoupon(null);
    setCouponCode("");
    setIsCouponApplied(false);
    setCouponJustRemoved(true);
    setCouponError(null);

    toast.info("Coupon removed");
  };

  // Обработчик изменения поля купона
  const handleCouponCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setCouponCode(newValue);

    // Игнорируем изменения поля, если купон был только что удален
    if (couponJustRemoved) {
      return;
    }

    // Если купон был применен, а пользователь меняет текст, сбрасываем статус применения
    if (isCouponApplied) {
      setIsCouponApplied(false);
      setAppliedCoupon(null);
      setCouponError(null);
    }
  };

  // Сортируем товары по времени добавления в корзину (раньше добавленные вверху)
  const sortedCartItems = useMemo(() => {
    if (!cartItems) return [];

    // Создаем копию массива перед сортировкой, чтобы не мутировать оригинальный массив
    return [...cartItems].sort((a, b) => {
      // Сортировка по времени создания (если есть createdAt)
      if (a.createdAt && b.createdAt) {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return 0;
    });
  }, [cartItems]);

  // Создаем дебаунсированную функцию для изменения количества
  const debouncedQuantityChange = debounce(
    async (id: string, newQuantity: number) => {
      if (newQuantity < 1) {
        setProcessingItemIds((prev) => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        return;
      }

      try {
        // Получаем текущий элемент корзины
        const item = cartItems?.find((item) => item.id === id);
        if (!item) {
          throw new Error("Item not found");
        }

        // Проверяем, есть ли информация о доступном количестве
        if (item.availableStock !== undefined) {
          // Если новое количество превышает доступное количество с учетом других вариаций
          if (newQuantity > item.availableStock) {
            toast.error(
              `Cannot add ${newQuantity} items. Maximum available quantity is ${item.availableStock} for this product.`
            );
            setProcessingItemIds((prev) => {
              const updated = new Set(prev);
              updated.delete(id);
              return updated;
            });
            return;
          }
        } else if (item.stock !== undefined && newQuantity > item.stock) {
          // Запасной вариант, если availableStock не предоставлен с сервера
          toast.error(`Only ${item.stock} items available in stock`);
          setProcessingItemIds((prev) => {
            const updated = new Set(prev);
            updated.delete(id);
            return updated;
          });
          return;
        }

        // Если проверки пройдены, отправляем запрос на обновление
        const result = await updateQuantity({
          id,
          quantity: newQuantity,
        }).unwrap();

        // Если сервер вернул ошибку о превышении доступного количества
        if (
          (result as any).availableQuantity !== undefined &&
          newQuantity > (result as any).availableQuantity
        ) {
          toast.warning(
            `We've adjusted the quantity to the maximum available (${
              (result as any).availableQuantity
            })`
          );
        }
      } catch (error: any) {
        // Проверяем, есть ли в ошибке информация о доступном количестве
        if (error.data && (error.data as any).availableQuantity !== undefined) {
          toast.error(
            `Not enough stock. Maximum available: ${
              (error.data as any).availableQuantity
            }`
          );
        } else {
          toast.error("Failed to update item quantity");
        }
      } finally {
        setProcessingItemIds((prev) => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
      }
    },
    500
  );

  // Создаем дебаунсированную функцию для удаления товара из корзины
  const debouncedRemoveItem = debounce(async (id: string) => {
    try {
      await removeItem(id).unwrap();
      toast.success(
        `${cartItems?.find((item) => item.id === id)?.name} removed from cart`
      );
    } catch (error) {
      toast.error(
        `Failed to remove ${
          cartItems?.find((item) => item.id === id)?.name
        } from cart`
      );
    } finally {
      setProcessingItemIds((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  }, 500);

  // Очищаем дебаунс при размонтировании компонента
  useEffect(() => {
    return () => {
      debouncedQuantityChange.cancel();
      debouncedRemoveItem.cancel();
    };
  }, []);

  const handleClearCart = async () => {
    // Открываем диалог подтверждения вместо прямого удаления
    setIsClearCartDialogOpen(true);
  };

  // Функция для выполнения очистки корзины после подтверждения
  const confirmClearCart = async () => {
    try {
      setIsClearingCart(true);
      await clearCart().unwrap();
      toast.success("Cart cleared");
      setIsClearCartDialogOpen(false);
    } catch (error) {
      toast.error("Failed to clear cart");
    } finally {
      setIsClearingCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex flex-col items-center justify-center p-4">
        <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20 max-w-md w-full">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                Error loading cart
              </h2>
              <p className="text-red-600 dark:text-red-300 max-w-md mb-4">
                We encountered a problem loading your shopping cart.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white shadow-md"
              >
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Получаем текущий элемент корзины
    const item = cartItems?.find((item) => item.id === id);
    if (!item) return;

    // Предварительная проверка доступности на клиенте
    if (
      item.availableStock !== undefined &&
      newQuantity > item.availableStock
    ) {
      toast.error(`Maximum available quantity is ${item.availableStock}`);
      return;
    }

    setProcessingItemIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });

    debouncedQuantityChange(id, newQuantity);
  };

  const handleRemoveItem = async (id: string) => {
    // Устанавливаем флаг, что элемент в процессе обработки
    setProcessingItemIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });

    // Используем дебаунсированную функцию
    debouncedRemoveItem(id);
  };

  const subtotal =
    cartItems?.reduce((sum, item) => {
      const price = item.price || 0;
      const discount = item.discount || 0;
      const finalPrice = price - (price * discount) / 100;
      return sum + finalPrice * item.quantity;
    }, 0) || 0;

  // Рассчитываем общую сумму без скидок
  const totalWithoutDiscount =
    cartItems?.reduce((sum, item) => {
      const price = item.price || 0;
      return sum + price * item.quantity;
    }, 0) || 0;

  // Рассчитываем общую сумму скидки на товары
  const totalItemDiscount = totalWithoutDiscount - subtotal;

  // Рассчитываем скидку по купону
  const couponDiscountAmount = appliedCoupon
    ? (subtotal * appliedCoupon.discount) / 100
    : 0;

  // Итоговая сумма с учетом всех скидок
  const finalTotal = subtotal - couponDiscountAmount;

  // Если корзина пуста
  if (!cartItems || cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
        <div className="container mx-auto py-12 px-4">
          <div className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8">
            <h1 className="text-4xl font-extrabold flex items-center pb-1">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-2 rounded-lg mr-3 text-white shadow-md">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 leading-relaxed">
                Shopping Cart
              </span>
            </h1>
          </div>

          <Card className="text-center py-12 px-8 shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700">
            <CardContent className="flex flex-col items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full mb-6">
                <ShoppingBag className="w-16 h-16 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Your cart is empty
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Start adding items to your cart to see them here.
              </p>
              <Link href="/products">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:scale-[0.98] text-white shadow-md text-lg px-4 py-4 h-auto">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8">
          <h1 className="text-4xl font-extrabold flex items-center pb-1">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-2 rounded-lg mr-3 text-white shadow-md">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 leading-relaxed">
              Shopping Cart
            </span>
          </h1>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300 border-l-4 border-blue-500 pl-3 mt-3">
            Items in cart:{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {cartItems.length}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Товары в корзине */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Items in Cart
                </h2>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleClearCart}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedCartItems.map((item) => {
                  const originalPrice = item.price || 0;
                  const discount = item.discount || 0;
                  const finalPrice =
                    originalPrice - (originalPrice * discount) / 100;

                  return (
                    <motion.li
                      key={item.id}
                      layout="position"
                      layoutId={item.id}
                      className="p-4 flex flex-col md:flex-row md:items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-200 relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Кнопка удаления товара на мобильных устройствах */}
                      <button
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors md:hidden"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={processingItemIds.has(item.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex-shrink-0 relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name || "Product"}
                            fill
                            sizes="96px"
                            className="object-contain p-2"
                          />
                        )}
                      </div>

                      <div className="flex-grow md:ml-6 mt-4 md:mt-0">
                        <div className="flex justify-between">
                          <div>
                            <Link
                              href={`/products/${item.productId}`}
                              className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {item.name}
                            </Link>

                            {item.discount && item.discount !== 0 ? (
                              <Badge className="ml-2 bg-red-500 text-white border-red-600 text-xs">
                                -{item.discount}%
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        {(item.size || item.color) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.size && item.color && <span> | </span>}
                            {item.color && (
                              <span>Color: {getColorName(item.color)}</span>
                            )}
                          </p>
                        )}

                        <div className="flex justify-between items-center mt-4 md:mt-2">
                          <div className="flex flex-col">
                            <QuantityInput
                              value={item.quantity}
                              onChange={(newQuantity) =>
                                handleQuantityChange(item.id, newQuantity)
                              }
                              min={1}
                              max={item.availableStock || item.stock}
                              disabled={processingItemIds.has(item.id)}
                              isProcessing={processingItemIds.has(item.id)}
                              withDebounce={false}
                              stockLeft={item.availableStock || item.stock}
                              className="mb-1"
                            />

                            {/* Дополнительная информация о статусе товара */}
                            {item.availableStock !== undefined && (
                              <>
                                {item.availableStock === 0 && (
                                  <div className="text-xs text-red-500 dark:text-red-400 ml-1">
                                    Out of stock
                                  </div>
                                )}
                                {item.stock !== undefined &&
                                  item.availableStock < item.stock && (
                                    <div className="text-xs text-blue-500 dark:text-blue-400 ml-1">
                                      (Shared stock with other variants in your
                                      cart)
                                    </div>
                                  )}
                              </>
                            )}

                            {/* Запасной вариант, если availableStock не предоставлен */}
                            {item.availableStock === undefined &&
                              item.stock !== undefined && (
                                <>
                                  {item.stock > 0 && (
                                    <div
                                      className={`text-xs font-medium ml-1 ${
                                        item.stock < 5
                                          ? "text-amber-500 dark:text-amber-400"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      Stock: {item.stock}
                                    </div>
                                  )}
                                  {item.stock === 0 && (
                                    <div className="text-xs text-red-500 dark:text-red-400 ml-1">
                                      Out of stock
                                    </div>
                                  )}
                                </>
                              )}
                          </div>

                          <div className="flex items-center">
                            <div className="text-right mr-6">
                              {discount > 0 && (
                                <p className="text-sm line-through text-gray-400 dark:text-gray-500">
                                  ${(originalPrice * item.quantity).toFixed(2)}
                                </p>
                              )}
                              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                ${(finalPrice * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ${finalPrice.toFixed(2)} each
                              </p>
                            </div>
                            {/* Кнопка удаления товара на десктопе */}
                            <button
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors hidden md:block"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={processingItemIds.has(item.id)}
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>

          {/* Суммарная информация о заказе */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-white/90 dark:bg-gray-800/30 shadow-md border-gray-200 dark:border-gray-700 p-0 overflow-hidden sticky top-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Order Summary
                </h2>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Original price
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      ${totalWithoutDiscount.toFixed(2)}
                    </span>
                  </div>

                  {totalItemDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Product discount
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        -${totalItemDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Купон */}
                  {!isCouponApplied ? (
                    <div className="pt-2">
                      <Label
                        htmlFor="coupon-code"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Have a coupon?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon-code"
                          className="flex-1"
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={handleCouponCodeChange}
                        />
                        <Button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode.trim()}
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isValidatingCoupon ? "Checking..." : "Apply"}
                        </Button>
                      </div>

                      {/* Сообщение об ошибке валидации купона */}
                      {couponError && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {couponError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2">
                      <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                        <div className="flex items-center">
                          <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {appliedCoupon?.code}: {appliedCoupon?.discount}%
                            off
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                          onClick={handleRemoveCoupon}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Coupon discount
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          -${couponDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Free
                    </span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 flex justify-between items-center">
                    <span className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                      Total
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={processingItemIds.size > 0 || isValidatingCoupon}
                  onClick={() => router.push("/checkout")}
                >
                  {processingItemIds.size > 0 || isValidatingCoupon
                    ? "Updating..."
                    : "Checkout"}
                </Button>

                <div className="mt-6 text-center">
                  <Button
                    variant="link"
                    onClick={() => router.push("/products")}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors text-sm font-medium flex items-center justify-center mx-auto p-0 h-auto"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Диалог подтверждения очистки корзины */}
      <DeleteConfirmationDialog
        isOpen={isClearCartDialogOpen}
        setIsOpen={setIsClearCartDialogOpen}
        onDelete={confirmClearCart}
        isDeleting={isClearingCart}
        title="Clear Shopping Cart"
        description="Are you sure you want to remove all items from your cart? This action cannot be undone."
        itemType="all items"
      />
    </main>
  );
}

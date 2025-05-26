"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { applyCoupon, removeCoupon } from "@/store/slices/couponSlice";
import { useGetAddressesQuery } from "@/store/api/addressSlice";
import { useGetCartQuery, useClearCartMutation } from "@/store/api/cartSlice";
import { useValidateCouponMutation } from "@/store/api/couponsSlice";
import {
  useCreateOrderMutation,
  useCreatePaymentIntentMutation,
  useUpdatePaymentStatusMutation,
} from "@/store/api/orderSlice";
import AddressSelector from "@/components/checkout/AddressSelector";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import OrderSummary from "@/components/checkout/OrderSummary";
import CreditCardForm from "@/components/checkout/CreditCardForm";
import ThankYouPage from "@/components/checkout/ThankYouPage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";

// Инициализация Stripe с вашим publishable ключом
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  {
    locale: "en", // Установка английского языка для Stripe компонентов
  }
);

console.log("STRIPE KEY:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const savedCoupon = useSelector(
    (state: RootState) => state.coupon.appliedCoupon
  );

  const { data: addresses, isLoading: addressesLoading } =
    useGetAddressesQuery();
  const { data: cartItems, isLoading: cartLoading } = useGetCartQuery();
  const [validateCoupon] = useValidateCouponMutation();
  const [clearCart] = useClearCartMutation();
  const [createOrder] = useCreateOrderMutation();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "CREDIT_CARD" | "CASH_ON_DELIVERY"
  >("CREDIT_CARD");

  // Используем данные купона из Redux
  const [couponCode, setCouponCode] = useState(savedCoupon?.code || "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    valid: boolean;
    discount: number;
    message: string;
    code: string;
  } | null>(savedCoupon);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isValidatingCard, setIsValidatingCard] = useState(false);

  // Состояние для отображения страницы благодарности
  const [showThankYouPage, setShowThankYouPage] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<{
    orderId: string;
    total: number;
  } | null>(null);

  // Загружаем данные о купоне из Redux при инициализации
  useEffect(() => {
    if (savedCoupon && savedCoupon.valid) {
      setAppliedCoupon(savedCoupon);
      setCouponCode(savedCoupon.code);
    }
  }, [savedCoupon]);

  // Находим адрес по умолчанию или первый адрес при загрузке
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      setSelectedAddress(defaultAddress?.id || addresses[0].id);
    }
  }, [addresses]);

  // Перенаправление на страницу подтверждения заказа после показа страницы благодарности
  useEffect(() => {
    if (orderCompleted && showThankYouPage) {
      // Задержка перед перенаправлением, чтобы пользователь успел увидеть страницу благодарности
      const redirectTimeout = setTimeout(() => {
        router.push(`/order-confirmation/${orderCompleted.orderId}`);
      }, 3000); // 3 секунды задержки

      return () => clearTimeout(redirectTimeout);
    }
  }, [orderCompleted, showThankYouPage, router]);

  // Вычисляем общую сумму заказа
  const calculateTotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;

    // Вычисляем сумму товаров со скидками для каждого товара
    const subtotal = cartItems.reduce((sum, item) => {
      const itemPrice = item.price || 0;
      const itemDiscount = item.discount || 0;

      // Проверяем, хранится ли скидка как дробное число (0-1) или как процент (0-100)
      const discountMultiplier =
        itemDiscount > 1 ? itemDiscount / 100 : itemDiscount;
      const discountedPrice = itemPrice * (1 - discountMultiplier);

      return sum + discountedPrice * item.quantity;
    }, 0);

    // Применяем скидку по купону
    let finalTotal = subtotal;
    if (appliedCoupon?.valid) {
      const couponDiscountMultiplier =
        appliedCoupon.discount > 1
          ? appliedCoupon.discount / 100
          : appliedCoupon.discount;
      finalTotal = subtotal * (1 - couponDiscountMultiplier);
    }

    return finalTotal;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const result = await validateCoupon(couponCode).unwrap();
      setAppliedCoupon(result);

      if (result.valid) {
        // Сохраняем купон в Redux
        dispatch(applyCoupon(result));
        toast.success(`Coupon applied: ${result.discount}% off`);
      } else {
        // Удаляем купон из Redux
        dispatch(removeCoupon());
        toast.error(result.message || "Invalid coupon");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      dispatch(removeCoupon());
      toast.error("Failed to validate coupon");
      setAppliedCoupon(null);
    }
  };

  // Обработчик удаления купона
  const handleRemoveCoupon = () => {
    // Сначала удаляем купон из Redux
    dispatch(removeCoupon());

    // Затем обновляем локальное состояние
    setCouponCode("");
    setAppliedCoupon(null);

    toast.info("Coupon removed");
  };

  const handlePaymentMethodReady = (paymentMethodId: string | null) => {
    setPaymentMethodId(paymentMethodId);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    toast.error(error);
  };

  const handleValidationStart = () => {
    setIsValidatingCard(true);
  };

  const handleValidationEnd = () => {
    setIsValidatingCard(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select an address");
      return;
    }

    setProcessingPayment(true);

    try {
      // 1. Создаем заказ
      const orderData = {
        addressId: selectedAddress,
        paymentMethod,
        couponId: appliedCoupon?.valid ? appliedCoupon.code : undefined,
        total: calculateTotal(),
      };

      if (paymentMethod === "CASH_ON_DELIVERY") {
        // Для оплаты при доставке, просто создаем заказ
        const response = await createOrder(orderData).unwrap();

        // Сохраняем информацию о заказе и показываем страницу благодарности
        setOrderCompleted({
          orderId: response.orderId,
          total: calculateTotal(),
        });
        setShowThankYouPage(true);

        // Очищаем корзину
        await clearCart();
      } else if (paymentMethod === "CREDIT_CARD") {
        if (!paymentMethodId) {
          toast.error("Please enter your credit card details");
          setProcessingPayment(false);
          return;
        }

        // Для кредитной карты, сначала создаем платежный намерение
        const paymentIntent = await createPaymentIntent({
          amount: calculateTotal(),
        }).unwrap();

        // Создаем заказ с информацией о платежном намерении
        const response = await createOrder({
          ...orderData,
          paymentIntentId: paymentIntent.clientSecret.split("_secret_")[0],
        }).unwrap();

        setOrderId(response.orderId);
        setClientSecret(paymentIntent.clientSecret);

        // Фактическое подтверждение платежа будет обрабатываться компонентом Stripe карты
        // После подтверждения платежа, мы обновим статус оплаты заказа
        await updatePaymentStatus({
          orderId: response.orderId,
          paymentIntentId: paymentIntent.clientSecret.split("_secret_")[0],
          status: "SUCCESS", // В реальной реализации это пришло бы из ответа Stripe
        });

        // Сохраняем информацию о заказе и показываем страницу благодарности
        setOrderCompleted({
          orderId: response.orderId,
          total: calculateTotal(),
        });
        setShowThankYouPage(true);

        // Очищаем корзину
        await clearCart();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to complete your order. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Отображаем компонент ThankYouPage, если заказ завершен
  if (showThankYouPage && orderCompleted) {
    return (
      <ThankYouPage
        orderId={orderCompleted.orderId}
        total={orderCompleted.total}
      />
    );
  }

  if (addressesLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading checkout information...
          </p>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="text-center py-12 px-8 shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 max-w-md w-full">
          <CardContent className="flex flex-col items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full mb-6">
              <ShoppingBag className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Your cart is empty
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Add items to your cart before checkout.
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:scale-[0.98] text-white shadow-md text-lg px-4 py-4 h-auto"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8">
          <h1 className="text-4xl font-extrabold flex items-center pb-1">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-2 rounded-lg mr-3 text-white shadow-md">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 leading-relaxed">
              Checkout
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Выбор адреса */}
            <Card className="bg-white/90 gap-0 dark:bg-gray-800/30 shadow-md border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Shipping Address
                </h2>
              </div>
              <CardContent className="p-6">
                <AddressSelector
                  addresses={addresses || []}
                  selectedAddressId={selectedAddress}
                  onSelectAddress={setSelectedAddress}
                />
              </CardContent>
            </Card>

            {/* Выбор метода оплаты */}
            <Card className="bg-white/90 gap-0 dark:bg-gray-800/30 shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Payment Method
                </h2>
              </div>
              <CardContent className="p-6">
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onSelectMethod={setPaymentMethod}
                />

                {/* Форма кредитной карты */}
                {paymentMethod === "CREDIT_CARD" && (
                  <div className="mt-4">
                    <Elements stripe={stripePromise}>
                      <CreditCardForm
                        onPaymentMethodReady={handlePaymentMethodReady}
                        onPaymentError={handlePaymentError}
                        onValidationStart={handleValidationStart}
                        onValidationEnd={handleValidationEnd}
                        amount={calculateTotal()}
                      />
                    </Elements>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Суммарная информация о заказе */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 dark:bg-gray-800/30 gap-0 shadow-md border-gray-200 dark:border-gray-700 sticky top-20 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Order Summary
                </h2>
              </div>
              <CardContent className="p-6">
                <OrderSummary
                  cartItems={cartItems}
                  total={calculateTotal()}
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                  appliedCoupon={appliedCoupon}
                />

                <Button
                  onClick={handlePlaceOrder}
                  disabled={
                    processingPayment ||
                    !selectedAddress ||
                    isValidatingCard ||
                    (paymentMethod === "CREDIT_CARD" && !paymentMethodId)
                  }
                  className="w-full h-12 mt-6 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processingPayment || isValidatingCard ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {processingPayment
                        ? "Processing..."
                        : "Validating card..."}
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;

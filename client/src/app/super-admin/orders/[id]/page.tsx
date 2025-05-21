"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
} from "@/store/api/orderSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  Banknote,
  Loader,
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Home,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getColorName } from "@/constants/product";
import OrderTimeline from "@/components/ui/OrderTimeline";

function OrderDetailsPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const { data: order, isLoading, isError, refetch } = useGetOrderByIdQuery(id);

  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();
  const [updatePaymentStatus, { isLoading: isUpdatingPayment }] =
    useUpdatePaymentStatusMutation();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState<string>("");

  // Функция для обновления статуса заказа и статуса оплаты
  const handleUpdateStatus = async () => {
    // Возвращаемся, если ничего не изменилось
    if (
      (!selectedStatus || selectedStatus === order?.status) &&
      (!selectedPaymentStatus || selectedPaymentStatus === order?.paymentStatus)
    )
      return;

    // Общий флаг для отслеживания состояния загрузки
    let isProcessing = false;
    let orderStatusUpdated = false;
    let paymentStatusUpdated = false;

    try {
      // Обновляем статус заказа, если он изменился
      if (selectedStatus && selectedStatus !== order?.status) {
        isProcessing = true;
        try {
          await updateOrderStatus({
            orderId: id,
            status: selectedStatus as
              | "PENDING"
              | "PROCESSING"
              | "SHIPPED"
              | "DELIVERED",
          }).unwrap();

          orderStatusUpdated = true;
          toast.success(
            `Order status successfully changed to "${getOrderStatusText(
              selectedStatus
            )}"`
          );
        } catch (orderErr: any) {
          console.error("Failed to update order status:", orderErr);

          let errorMessage = "Failed to update order status";
          if (orderErr.data?.message) {
            errorMessage = `Failed to update order status: ${orderErr.data.message}`;
          } else if (orderErr.message) {
            errorMessage = `Failed to update order status: ${orderErr.message}`;
          }

          toast.error(errorMessage);
        }
      }

      // Обновляем статус оплаты, если он изменился
      if (
        selectedPaymentStatus &&
        selectedPaymentStatus !== order?.paymentStatus
      ) {
        // Проверяем, является ли статус оплаты допустимым для API
        if (
          selectedPaymentStatus === "SUCCESS" ||
          selectedPaymentStatus === "FAILED"
        ) {
          isProcessing = true;
          try {
            await updatePaymentStatus({
              orderId: id,
              paymentIntentId: "manual-update", // Ручная корректировка администратором
              status: selectedPaymentStatus as "SUCCESS" | "FAILED",
            }).unwrap();

            paymentStatusUpdated = true;
            toast.success(
              `Payment status successfully changed to "${getPaymentStatusText(
                selectedPaymentStatus
              )}"`
            );
          } catch (paymentErr: any) {
            console.error("Failed to update payment status:", paymentErr);

            let errorMessage = "Failed to update payment status";
            if (paymentErr.data?.message) {
              errorMessage = `Failed to update payment status: ${paymentErr.data.message}`;
            } else if (paymentErr.message) {
              errorMessage = `Failed to update payment status: ${paymentErr.message}`;
            }

            toast.error(errorMessage);
          }
        } else if (selectedPaymentStatus === "PENDING") {
          toast.warning(
            "The PENDING payment status cannot be processed by the server. Only SUCCESS or FAILED are supported for manual updates."
          );
        }
      }

      // Обновляем данные заказа с небольшой задержкой, чтобы убедиться, что сервер обработал изменения
      setTimeout(() => {
        refetch();
      }, 300);
    } catch (err: any) {
      // Общая обработка непредвиденных ошибок
      console.error("Unexpected error during update:", err);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Функция для форматирования валюты
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Функция для получения текстового представления статуса заказа
  const getOrderStatusText = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "PROCESSING":
        return "Processing";
      case "SHIPPED":
        return "Shipped";
      case "DELIVERED":
        return "Delivered";
      case "CANCELED":
        return "Canceled";
      default:
        return status;
    }
  };

  // Функция для получения иконки статуса заказа
  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5" />;
      case "PROCESSING":
        return <Package className="h-5 w-5" />;
      case "SHIPPED":
        return <Truck className="h-5 w-5" />;
      case "DELIVERED":
        return <CheckCircle2 className="h-5 w-5" />;
      case "CANCELED":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Функция для получения цвета статуса заказа
  const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "PROCESSING":
        return "bg-blue-500 dark:bg-blue-600";
      case "SHIPPED":
        return "bg-purple-500 dark:bg-purple-600";
      case "DELIVERED":
        return "bg-green-500 dark:bg-green-600";
      case "CANCELED":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  // Функция для получения иконки метода оплаты
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CREDIT_CARD":
        return <CreditCard className="h-5 w-5" />;
      case "CASH_ON_DELIVERY":
        return <Banknote className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // Функция для получения текстового представления метода оплаты
  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case "CREDIT_CARD":
        return "Credit Card";
      case "CASH_ON_DELIVERY":
        return "Cash on Delivery";
      default:
        return method;
    }
  };

  // Функция для получения цвета статуса оплаты
  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "SUCCESS":
        return "bg-green-500 dark:bg-green-600";
      case "FAILED":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  // Функция для получения текстового представления статуса оплаты
  const getPaymentStatusText = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "Awaiting Payment";
      case "SUCCESS":
        return "Paid";
      case "FAILED":
        return "Payment Error";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[600px]">
        <Loader className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
        <span className="ml-2 text-lg dark:text-gray-300">
          Loading order information...
        </span>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center min-h-[600px]">
        <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
        <h3 className="text-xl font-medium text-red-600 dark:text-red-400 mb-2">
          Error loading order
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Failed to load order information.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Расчет общих сумм заказа
  const subtotal = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const discount = order.items.reduce(
    (acc, item) => acc + (item.discount || 0) * item.quantity,
    0
  );
  const couponDiscount = order.coupon
    ? (subtotal - discount) * (order.coupon.discount / 100)
    : 0;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Верхняя панель с кнопкой назад и статусом заказа */}
      <Card className="shadow-lg mb-8 gap-0 dark:shadow-gray-800/20 dark:border-gray-800">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-xl overflow-hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Order #{" "}
              <span className="font-mono text-blue-100 tracking-tight break-all">
                {order.id}
              </span>
            </h1>
            <p className="text-blue-100 mt-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Created:{" "}
                {format(new Date(order.createdAt), "MMM dd, yyyy, HH:mm")}
              </span>
              {order.updatedAt !== order.createdAt && (
                <span className="flex items-center gap-1 border-l border-blue-300/30 pl-2">
                  <Check className="h-3.5 w-3.5" />
                  Updated:{" "}
                  {format(new Date(order.updatedAt), "MMM dd, yyyy, HH:mm")}
                </span>
              )}
              <span className="flex items-center gap-1 border-l border-blue-300/30 pl-2">
                <ShoppingBag className="h-3.5 w-3.5" />
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-white/90 text-blue-700 hover:bg-white hover:text-indigo-700 dark:bg-indigo-950 dark:text-blue-200 dark:border-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-blue-200 flex items-center gap-1.5 px-4 py-2 min-h-[2.5rem] rounded-full font-medium shadow-md hover:shadow-lg transform transition-all duration-200 ease-out active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Orders</span>
            </Button>
          </div>
        </div>

        {/* Раздел с бейджами статуса */}
        <div className="bg-white dark:bg-gray-800/30 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 rounded-b-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Status:
            </span>
            <Badge
              className={`${getOrderStatusColor(
                order.status
              )} flex items-center gap-1 px-3 py-1.5 text-sm shadow-md text-white`}
            >
              {getOrderStatusIcon(order.status)}
              {getOrderStatusText(order.status)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:ml-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Payment:
            </span>
            <Badge
              className={`${getPaymentStatusColor(
                order.paymentStatus
              )} px-3 py-1.5 text-sm shadow-md text-white flex items-center gap-1`}
            >
              {order.paymentStatus === "SUCCESS" ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : order.paymentStatus === "FAILED" ? (
                <AlertTriangle className="h-4 w-4 mr-1" />
              ) : (
                <Clock className="h-4 w-4 mr-1" />
              )}
              {getPaymentStatusText(order.paymentStatus)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:ml-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Method:
            </span>
            <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 shadow-sm">
              {getPaymentMethodIcon(order.paymentMethod)}
              {getPaymentMethodText(order.paymentMethod)}
            </span>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto ml-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total:
            </span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </Card>

      {/* Событийная линия заказа */}
      <div className="mb-6">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 gap-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-800/40 border-b dark:border-gray-700 px-6 py-3 gap-0">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Order Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <OrderTimeline status={order.status} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация о заказе */}
        <div className="lg:col-span-2 space-y-6">
          {/* Информация о клиенте */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 gap-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-800/40 border-b dark:border-gray-700 px-6 py-3 gap-0">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {order.user ? (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      {order.user.name || "No name"}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">
                      {order.user.email}
                    </p>
                    {order.address?.phone && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {order.address.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No customer information available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Товары в заказе */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 gap-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-800/40 border-b dark:border-gray-700 px-6 py-3 gap-0">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <ShoppingBag className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Items in Order ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y dark:divide-gray-700">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                  >
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-1">
                              {item.productName}
                            </h3>
                            <div className="flex flex-wrap gap-3 mt-2">
                              <Badge
                                variant="outline"
                                className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow px-2.5 py-0.5"
                              >
                                Category: {item.productCategory}
                              </Badge>
                              {item.size && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow px-2.5 py-0.5"
                                >
                                  Size: {item.size}
                                </Badge>
                              )}
                              {item.color && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow px-2.5 py-0.5"
                                >
                                  Color: {getColorName(item.color)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start md:text-right mt-4 md:mt-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.price - (item.discount || 0))}
                          </span>
                          {item.discount ? (
                            <span className="text-sm line-through text-gray-400 dark:text-gray-500">
                              {formatCurrency(item.price)}
                            </span>
                          ) : null}
                          <span className="text-gray-500 dark:text-gray-400 mx-1">
                            ×
                          </span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="md:mt-2">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {formatCurrency(
                              (item.price - (item.discount || 0)) *
                                item.quantity
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель с адресом, общими суммами и управлением */}
        <div className="space-y-6">
          {/* Адрес доставки */}
          {order.address && (
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 gap-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-800/40 border-b dark:border-gray-700 px-6 py-3 gap-0">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <MapPin className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Home className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5" />
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {order.address.name}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-gray-800 dark:text-gray-200">
                          {order.address.address}
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {order.address.city}, {order.address.country},{" "}
                          {order.address.zipCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5" />
                      <p className="text-gray-800 dark:text-gray-200">
                        {order.address.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Информация о платеже */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 gap-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-800/40 border-b dark:border-gray-700 px-6 py-3 gap-0">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <CreditCard className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-sm">
                  {getPaymentMethodIcon(order.paymentMethod)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {getPaymentMethodText(order.paymentMethod)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`${getPaymentStatusColor(
                        order.paymentStatus
                      )} mt-1 px-2.5 py-0.5 shadow-sm text-gray-900`}
                    >
                      {getPaymentStatusText(order.paymentStatus)}
                    </Badge>
                    {order.paymentDate && (
                      <span
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          order.paymentStatus === "SUCCESS"
                            ? "text-green-600 dark:text-green-400"
                            : order.paymentStatus === "FAILED"
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <CalendarClock className="h-3 w-3" />
                        {order.paymentStatus === "SUCCESS" && "Paid: "}
                        {order.paymentStatus === "FAILED" && "Payment error: "}
                        {order.paymentStatus === "PENDING" &&
                          "Awaiting payment: "}
                        {format(
                          new Date(order.paymentDate),
                          "MMM dd, yyyy, HH:mm"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Item Discount:
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatCurrency(discount)}
                    </span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Coupon (
                      {order.coupon ? (
                        <Link
                          href={`/super-admin/coupons/list?search=${order.coupon.code}`}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-all duration-200"
                        >
                          {order.coupon.code}
                        </Link>
                      ) : (
                        ""
                      )}
                      ):
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatCurrency(couponDiscount)}
                    </span>
                  </div>
                )}
                <Separator className="my-2 dark:bg-gray-700" />
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-800 dark:text-gray-200">
                    Total:
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Обновление статуса заказа */}
          <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 gap-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-800/40 border-b dark:border-gray-700 px-6 py-3 gap-0">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <Check className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Update Order
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* Выбор статуса заказа */}
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Order Status:
                      </p>
                      <Badge
                        className={`${getOrderStatusColor(
                          order.status
                        )} w-fit px-3 py-1.5 mb-2 text-sm shadow-md text-white flex items-center gap-1`}
                      >
                        {getOrderStatusIcon(order.status)}
                        {getOrderStatusText(order.status)}
                      </Badge>
                    </div>
                    <Select
                      defaultValue={order.status}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="w-full bg-gray-50 border-gray-200 transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600 dark:text-gray-200">
                        <SelectValue placeholder="Change order status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 dark:border-gray-700">
                        <SelectItem
                          value="PENDING"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Pending
                        </SelectItem>
                        <SelectItem
                          value="PROCESSING"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Processing
                        </SelectItem>
                        <SelectItem
                          value="SHIPPED"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Shipped
                        </SelectItem>
                        <SelectItem
                          value="DELIVERED"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Delivered
                        </SelectItem>
                        <SelectItem
                          value="CANCELED"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Canceled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Выбор статуса оплаты */}
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Payment Status:
                      </p>
                      <Badge
                        className={`${getPaymentStatusColor(
                          order.paymentStatus
                        )} w-fit px-3 py-1.5 mb-2 text-sm shadow-md text-white flex items-center gap-1`}
                      >
                        {order.paymentStatus === "SUCCESS" ? (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        ) : order.paymentStatus === "FAILED" ? (
                          <AlertTriangle className="h-4 w-4 mr-1" />
                        ) : (
                          <Clock className="h-4 w-4 mr-1" />
                        )}
                        {getPaymentStatusText(order.paymentStatus)}
                      </Badge>
                    </div>
                    <Select
                      defaultValue={order.paymentStatus}
                      onValueChange={setSelectedPaymentStatus}
                    >
                      <SelectTrigger className="w-full bg-gray-50 border-gray-200 transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600 dark:text-gray-200">
                        <SelectValue placeholder="Change payment status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 dark:border-gray-700">
                        <SelectItem
                          value="SUCCESS"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Paid
                        </SelectItem>
                        <SelectItem
                          value="FAILED"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Payment Error
                        </SelectItem>
                        <SelectItem
                          value="PENDING"
                          className="hover:scale-[0.97] transition-all"
                        >
                          Awaiting Payment
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-1">
                  Note: Setting payment status to "Awaiting Payment" may not be
                  processed by the server as it's typically set automatically.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900"
                  onClick={handleUpdateStatus}
                  disabled={
                    isUpdating ||
                    isUpdatingPayment ||
                    ((!selectedStatus || selectedStatus === order.status) &&
                      (!selectedPaymentStatus ||
                        selectedPaymentStatus === order.paymentStatus))
                  }
                >
                  {isUpdating || isUpdatingPayment ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsPage;

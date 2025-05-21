"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetOrdersQuery } from "@/store/api/orderSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Loader2,
  ClipboardList,
  ChevronRight,
  Calendar,
  CreditCard,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import OrderTimeline from "@/components/ui/OrderTimeline";

export default function OrdersPage() {
  const router = useRouter();
  const { data: orders, isLoading, isError } = useGetOrdersQuery();

  // Состояние для отслеживания, какие заказы имеют раскрытые списки элементов
  const [expandedOrders, setExpandedOrders] = useState<{
    [key: string]: boolean;
  }>({});

  // Функция для переключения состояния раскрытия для конкретного заказа
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Функция для отображения статуса заказа
  const renderOrderStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 flex items-center gap-1.5 px-2 py-1 text-sm"
          >
            <Clock className="h-4 w-4" />
            Pending
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 flex items-center gap-1.5 px-2 py-1 text-sm"
          >
            <Package className="h-4 w-4" />
            Processing
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 flex items-center gap-1.5 px-2 py-1 text-sm"
          >
            <Truck className="h-4 w-4" />
            Shipped
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 flex items-center gap-1.5 px-2 py-1 text-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Delivered
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 flex items-center gap-1.5 px-2 py-1 text-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700 flex items-center gap-1.5 px-2 py-1 text-sm"
          >
            <AlertCircle className="h-4 w-4" />
            {status}
          </Badge>
        );
    }
  };

  // Функция для отображения статуса платежа
  const renderPaymentStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      case "SUCCESS":
        return (
          <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Paid
          </span>
        );
      case "FAILED":
        return (
          <span className="text-red-600 dark:text-red-400 font-medium flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
            {status}
          </span>
        );
    }
  };

  // Функция для отображения метода платежа
  const renderPaymentMethod = (method: string) => {
    switch (method) {
      case "CREDIT_CARD":
        return (
          <span className="flex items-center">
            <CreditCard className="h-4 w-4 mr-1.5" />
            Credit Card
          </span>
        );
      case "CASH_ON_DELIVERY":
        return (
          <span className="flex items-center">
            <ShoppingBag className="h-4 w-4 mr-1.5" />
            Cash on Delivery
          </span>
        );
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading order history...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="text-center py-12 px-8 shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 max-w-md w-full">
          <CardContent className="flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mb-6">
              <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Loading Error
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              An error occurred while loading your orders. Please try again
              later.
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="text-center py-12 px-8 shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 max-w-md w-full">
          <CardContent className="flex flex-col items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full mb-6">
              <ClipboardList className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              You don't have any orders yet
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Time to make your first purchase in our store!
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8">
          <h1 className="text-4xl font-extrabold flex items-center pb-1">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-2 rounded-lg mr-3 text-white shadow-md">
              <ClipboardList className="h-8 w-8" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 leading-relaxed">
              My Orders
            </span>
          </h1>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="bg-white/90 dark:bg-gray-800/30 shadow-md border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <CardContent className="p-0">
                {/* Заголовок */}
                <div className="bg-slate-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex flex-row gap-10">
                      <div className="flex flex-col gap-2">
                        <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          {formatDate(order.createdAt)}
                        </div>

                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          Order #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                          Order Status:
                        </div>
                        {renderOrderStatus(order.status)}
                      </div>
                    </div>

                    <div className="flex items-center grow md:mx-8 md:mt-0 mt-2">
                      <div className="flex flex-col w-full ">
                        <OrderTimeline status={order.status} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Payment
                        </span>
                        {renderPaymentStatus(order.paymentStatus)}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Payment Method
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {renderPaymentMethod(order.paymentMethod)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Суммарная информация о товарах в заказе */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6">
                    <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                          Items
                        </h3>
                        <div className="grid gap-2">
                          {(expandedOrders[order.id]
                            ? order.items
                            : order.items.slice(0, 3)
                          ).map((item) => (
                            <div key={item.id} className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 mr-2"></div>
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                {item.productName}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 mx-2">
                                x{item.quantity}
                              </span>
                              <span className="text-gray-600 dark:text-gray-300">
                                $
                                {(
                                  item.quantity *
                                  parseFloat(
                                    item.discount
                                      ? (
                                          item.price *
                                          (1 -
                                            (item.discount > 1
                                              ? item.discount / 100
                                              : item.discount))
                                        ).toFixed(2)
                                      : item.price.toFixed(2)
                                  )
                                ).toFixed(2)}
                              </span>
                            </div>
                          ))}

                          {order.items.length > 3 && (
                            <button
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center mt-1 transition-colors cursor-pointer"
                            >
                              {expandedOrders[order.id] ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  And {order.items.length - 3} more items
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {order.address && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Delivery Address
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300">
                            {order.address.name}, {order.address.address},
                            {order.address.city && ` ${order.address.city},`}
                            {order.address.country &&
                              ` ${order.address.country},`}
                            {order.address.zipCode &&
                              ` ${order.address.zipCode}`}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="bg-slate-100 dark:bg-gray-900 p-3 rounded-md text-right mb-3">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                          Total:
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>

                      <Button
                        onClick={() =>
                          router.push(`/order-confirmation/${order.id}`)
                        }
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
                      >
                        Order Details
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => router.push("/products")}
            className="bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}

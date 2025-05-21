"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetOrderByIdQuery } from "@/store/api/orderSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, Loader2, ClipboardList } from "lucide-react";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const {
    data: order,
    isLoading,
    isError,
  } = useGetOrderByIdQuery(orderId as string);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading order information...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="text-center py-12 px-8 shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 max-w-md w-full">
          <CardContent className="flex flex-col items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mb-6">
              <ShoppingBag className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Order Not Found
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              An error occurred while loading your order information.
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

  // Функция для форматирования цены с учетом скидки
  const formatPrice = (price: number, discount?: number | null) => {
    if (!discount) return price.toFixed(2);

    // Проверяем формат скидки (процент или дробь)
    const discountMultiplier = discount > 1 ? discount / 100 : discount;
    return (price * (1 - discountMultiplier)).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 py-12">
      <div className="container mx-auto px-4">
        <Card className="bg-white/90 dark:bg-gray-800/30 shadow-md border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
          <CardContent className="p-6 sm:p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Order Successfully Placed!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Thank you for your order. Your order number is:
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                #{order.id.substring(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Order Information
                </h2>
                <div className="bg-slate-100 dark:bg-gray-900 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      Order Date:
                    </div>
                    <div className="text-gray-900 dark:text-gray-200">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>

                    <div className="text-gray-600 dark:text-gray-400">
                      Order Status:
                    </div>
                    <div className="text-gray-900 dark:text-gray-200 capitalize">
                      {order.status === "PENDING"
                        ? "Pending"
                        : order.status === "PROCESSING"
                        ? "Processing"
                        : order.status === "SHIPPED"
                        ? "Shipped"
                        : order.status === "CANCELED"
                        ? "Canceled"
                        : "Delivered"}
                    </div>

                    <div className="text-gray-600 dark:text-gray-400">
                      Payment Method:
                    </div>
                    <div className="text-gray-900 dark:text-gray-200">
                      {order.paymentMethod === "CREDIT_CARD"
                        ? "Credit Card"
                        : "Cash on Delivery"}
                    </div>

                    <div className="text-gray-600 dark:text-gray-400">
                      Payment Status:
                    </div>
                    <div
                      className={`${
                        order.paymentStatus === "SUCCESS"
                          ? "text-green-600 dark:text-green-400"
                          : order.paymentStatus === "FAILED"
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {order.paymentStatus === "SUCCESS"
                        ? "Paid"
                        : order.paymentStatus === "FAILED"
                        ? "Payment Error"
                        : "Awaiting Payment"}
                    </div>
                  </div>
                </div>
              </div>

              {order.addressId ? (
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    Delivery Address
                  </h2>
                  <div className="bg-slate-100 dark:bg-gray-900 p-4 rounded-md">
                    {order.address ? (
                      <>
                        <p className="font-medium text-gray-900 dark:text-gray-200">
                          {order.address.name}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          {order.address.address}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {order.address.city && `${order.address.city}, `}
                          {order.address.country &&
                            `${order.address.country}, `}
                          {order.address.zipCode}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          {order.address.phone}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        Loading address...
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Items in Order
                </h2>
                <div className="bg-slate-100 dark:bg-gray-900 p-4 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                            Product
                          </th>
                          <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                            Size
                          </th>
                          <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                            Color
                          </th>
                          <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                            Quantity
                          </th>
                          <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-200 dark:border-gray-700"
                          >
                            <td className="py-3 px-4">
                              <p className="text-gray-900 dark:text-gray-200 font-medium">
                                {item.productName}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {item.productCategory}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {item.size || "-"}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {item.color || "-"}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.discount &&
                              parseFloat(String(item.discount)) > 0 ? (
                                <>
                                  <span className="line-through text-gray-500 dark:text-gray-400 mr-2">
                                    ${item.price.toFixed(2)}
                                  </span>
                                  <span className="text-gray-900 dark:text-gray-200 font-medium">
                                    ${formatPrice(item.price, item.discount)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-900 dark:text-gray-200 font-medium">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex flex-col items-end">
                <div className="w-full sm:w-64 bg-slate-100 dark:bg-gray-900 p-4 rounded-md">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal:
                    </span>
                    <span className="text-gray-900 dark:text-gray-200">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>

                  {order.couponId && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Coupon:
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {order.coupon
                          ? `${order.coupon.code} (${order.coupon.discount}%)`
                          : order.couponId}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping:
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      Free
                    </span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-bold">
                    <span className="text-gray-800 dark:text-gray-200">
                      Total:
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
                onClick={() => router.push("/orders")}
              >
                <ClipboardList className="w-5 h-5" />
                My Orders
              </Button>

              <Button
                className="bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
                onClick={() => router.push("/products")}
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

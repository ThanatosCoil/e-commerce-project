"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetAllOrdersQuery } from "@/store/api/orderSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Search,
  Loader,
  AlertTriangle,
  ChevronRight,
  Clock,
  Truck,
  Package,
  CheckCircle2,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function OrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useGetAllOrdersQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPayment, setFilterPayment] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

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
        return <Clock className="h-4 w-4" />;
      case "PROCESSING":
        return <Package className="h-4 w-4" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4" />;
      case "DELIVERED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "CANCELED":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
        return <CreditCard className="h-4 w-4" />;
      case "CASH_ON_DELIVERY":
        return <Banknote className="h-4 w-4" />;
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

  // Фильтрация и сортировка заказов
  const filteredOrders = orders
    .filter((order) => {
      // Фильтрация по поиску (по ID заказа или email пользователя)
      if (searchQuery && searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        const idMatch = order.id.toLowerCase().includes(searchLower);
        const emailMatch =
          order.user?.email.toLowerCase().includes(searchLower) || false;
        if (!idMatch && !emailMatch) {
          return false;
        }
      }

      // Фильтрация по статусу заказа
      if (filterStatus !== "ALL" && order.status !== filterStatus) {
        return false;
      }

      // Фильтрация по статусу оплаты
      if (filterPayment !== "ALL" && order.paymentStatus !== filterPayment) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "total-asc":
          return a.total - b.total;
        case "total-desc":
          return b.total - a.total;
        default:
          return 0;
      }
    });

  // Логика пагинации
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Обработка изменений страницы
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Прокрутка к верху таблицы
    const tableElement = document.getElementById("orders-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Функция для форматирования валюты
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Вспомогательная функция для извлечения сообщения об ошибке
  const getErrorMessage = (
    err: FetchBaseQueryError | SerializedError | undefined
  ): string => {
    if (!err) return "Unknown error occurred";

    if ("status" in err) {
      return typeof err.data === "object" && err.data && "message" in err.data
        ? String(err.data.message)
        : `Error ${err.status}`;
    } else {
      return err.message || "Unknown error";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[600px]">
        <Loader className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
        <span className="ml-2 text-lg dark:text-gray-300">
          Loading orders...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center min-h-[600px]">
        <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
        <h3 className="text-xl font-medium text-red-600 dark:text-red-400 mb-2">
          Error loading orders
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {getErrorMessage(error)}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Секция заголовка */}
      <Card className="shadow-lg mb-8 gap-0 dark:shadow-gray-800/20 dark:border-gray-800">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 to-80% p-6 flex flex-col md:flex-row justify-between items-center rounded-t-xl overflow-hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">Orders</h1>
            <p className="text-blue-100 mt-2">
              Manage orders ({filteredOrders.length} orders)
            </p>
          </div>
        </div>

        {/* Секция фильтра */}
        <div className="p-4 border-gray-200 bg-white dark:bg-gray-800/30 dark:border-gray-700 rounded-b-xl">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Поисковая строка */}
            <div className="w-full md:w-2/5 shadow-sm dark:shadow-gray-800/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search by order ID or user email..."
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors dark:bg-gray-900 dark:border-gray-700 dark:focus:bg-gray-800 dark:text-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Фильтрация по статусу заказа */}
            <div className="w-full md:w-1/6">
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value)}
              >
                <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600 dark:text-gray-200">
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Фильтрация по статусу оплаты */}
            <div className="w-full md:w-1/6">
              <Select
                value={filterPayment}
                onValueChange={(value) => setFilterPayment(value)}
              >
                <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600 dark:text-gray-200">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Awaiting Payment</SelectItem>
                  <SelectItem value="SUCCESS">Paid</SelectItem>
                  <SelectItem value="FAILED">Payment Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Выпадающий список сортировки */}
            <div className="w-full md:w-1/6">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="transition-all hover:border-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-600 dark:text-gray-200">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="date-desc">By Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">By Date (Oldest)</SelectItem>
                  <SelectItem value="total-asc">
                    By Total (Low to High)
                  </SelectItem>
                  <SelectItem value="total-desc">
                    By Total (High to Low)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Секция списка заказов */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
            No orders found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            No orders match your search criteria. Try changing your filter
            parameters.
          </p>
        </div>
      ) : (
        <>
          <Card
            id="orders-table"
            className="overflow-hidden dark:bg-gray-800 dark:border-gray-700 shadow-lg"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-300 dark:border-gray-500">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3">
                      Order ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3">
                      Customer
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3">
                      Payment
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3">
                      Payment Method
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3 text-right">
                      Total
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 px-4 py-3 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group"
                    >
                      <TableCell className="font-medium text-gray-800 dark:text-gray-200 px-4 py-3">
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          {order.id.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300 px-4 py-3">
                        {order.user ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {order.user.name || "No name"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {order.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300 px-4 py-3">
                        <div className="flex flex-col">
                          <span>
                            {format(new Date(order.createdAt), "MM/dd/yyyy")}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(order.createdAt), "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                className={`${getOrderStatusColor(
                                  order.status
                                )} flex items-center gap-1 px-2.5 py-1 shadow-sm`}
                              >
                                {getOrderStatusIcon(order.status)}
                                {getOrderStatusText(order.status)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Order Status: {getOrderStatusText(order.status)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          className={`${getPaymentStatusColor(
                            order.paymentStatus
                          )} px-2.5 py-1 shadow-sm`}
                        >
                          {getPaymentStatusText(order.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1 text-gray-700 dark:text-gray-300 px-4 py-3">
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-1.5">
                          {getPaymentMethodIcon(order.paymentMethod)}
                        </div>
                        <span>{getPaymentMethodText(order.paymentMethod)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-800 dark:text-gray-200 px-4 py-3">
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatCurrency(order.total)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Link href={`/super-admin/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-70 group-hover:opacity-100 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all"
                          >
                            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:space-x-2 mt-6 bg-white dark:bg-gray-800 p-3 rounded-lg shadow border border-gray-100 dark:border-gray-700 overflow-x-auto">
              <div className="flex items-center space-x-1 ">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-50 dark:bg-gray-900 min-w-[2rem]"
                >
                  <ChevronFirst className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-50 dark:bg-gray-900 min-w-[2rem]"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                <div className="flex items-center space-x-1 px-1 sm:px-2 overflow-x-auto">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number;
                    // Логика для отображения номеров страниц вокруг текущей
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    // Определяем, нужно ли показывать кнопку на маленьких экранах
                    const isAdjacentPage =
                      Math.abs(pageNumber - currentPage) <= 1;

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full min-w-[1.75rem] ${
                          currentPage === pageNumber
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        } ${!isAdjacentPage ? "hidden xs:flex" : ""}`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-50 dark:bg-gray-900 min-w-[2rem]"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-50 dark:bg-gray-900 min-w-[2rem]"
                >
                  <ChevronLast className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-3 py-1 sm:py-2 rounded-md bg-gray-50 dark:bg-gray-900">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OrdersPage;

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useGetCouponsQuery,
  useDeleteCouponMutation,
  type Coupon,
} from "@/store/api/couponsSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash,
  Plus,
  Percent,
  Search,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { format } from "date-fns";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";

// Компонент-обертка для использования useSearchParams
function CouponsListContent() {
  const searchParams = useSearchParams();
  const {
    data: coupons = [],
    isLoading,
    isError,
    error,
  } = useGetCouponsQuery();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("code");
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Эффект для установки поискового запроса из URL-параметров
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);

      // Прокрутка к полю ввода и добавление фокуса
      setTimeout(() => {
        const searchInput = document.querySelector(
          'input[placeholder="Search coupons by code..."]'
        );
        if (searchInput && searchInput instanceof HTMLInputElement) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [searchParams]);

  const openDeleteDialog = (id: string) => {
    setCouponToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;

    try {
      await deleteCoupon(couponToDelete).unwrap();
      toast.success("Coupon deleted successfully");
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
    } catch (err) {
      console.error("Failed to delete the coupon", err);
      toast.error("Failed to delete coupon");
    }
  };

  // Фильтрация купонов на основе поискового запроса
  const filteredCoupons = coupons
    .filter((coupon) =>
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "code":
          return a.code.localeCompare(b.code);
        case "discount-asc":
          return a.discount - b.discount;
        case "discount-desc":
          return b.discount - a.discount;
        case "end-date":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        default:
          return 0;
      }
    });

  // Функция для проверки, активен ли купон на основе дат и лимита использования
  const isCouponActive = (coupon: Coupon): boolean => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    return (
      now >= startDate &&
      now <= endDate &&
      (coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit)
    );
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
          Loading coupons...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center min-h-[600px]">
        <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
        <h3 className="text-xl font-medium text-red-600 dark:text-red-400 mb-2">
          Error loading coupons
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
      {/* Используем компонент DeleteConfirmationDialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        itemType="Coupon"
      />

      {/* Раздел заголовка */}
      <Card className="shadow-lg mb-8 gap-0 dark:shadow-gray-800/20 dark:border-gray-800">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 to-80% p-6 flex flex-col md:flex-row justify-between items-center rounded-t-xl overflow-hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">Coupons</h1>
            <p className="text-blue-100 mt-2">
              Manage your discount coupons ({filteredCoupons.length} coupons)
            </p>
          </div>
          <Link href="/super-admin/coupons/add" className="mt-4 md:mt-0">
            <Button className="bg-white text-purple-600 hover:bg-purple-50 dark:bg-indigo-950 dark:text-purple-300 dark:hover:brightness-125 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group">
              <Plus className="h-4 w-4 mr-2 transition-transform group-active:scale-90" />
              <span className="whitespace-nowrap relative z-10">
                Add New Coupon
              </span>
            </Button>
          </Link>
        </div>

        {/* URL поиска */}
        {searchParams.get("search") && (
          <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 border-b border-purple-100 dark:border-purple-800">
            <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center">
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Results filtered by coupon code:{" "}
              <span className="font-semibold ml-1">
                {searchParams.get("search")}
              </span>
              <Link
                href="/super-admin/coupons/list"
                className="ml-auto text-xs bg-purple-100 dark:bg-purple-800 px-2 py-0.5 rounded text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
              >
                Clear filter
              </Link>
            </p>
          </div>
        )}

        {/* Раздел фильтра */}
        <div className="p-4 border-gray-200 bg-white dark:bg-gray-800/30 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Поисковая строка */}
            <div className="flex-1 shadow-sm dark:shadow-gray-800/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search coupons by code..."
                  className={`pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors dark:bg-gray-900 dark:border-gray-700 dark:focus:bg-gray-800 dark:text-gray-200 ${
                    searchParams.get("search")
                      ? "ring-2 ring-purple-400 dark:ring-purple-600 border-transparent"
                      : ""
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <span className="sr-only">Clear search</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Выпадающий список сортировки */}
            <div className="w-full md:w-64">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="transition-all hover:border-purple-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-purple-600 dark:text-gray-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="code">Code (A-Z)</SelectItem>
                  <SelectItem value="discount-asc">
                    Discount (Low to High)
                  </SelectItem>
                  <SelectItem value="discount-desc">
                    Discount (High to Low)
                  </SelectItem>
                  <SelectItem value="end-date">
                    Expiry Date (Soonest)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Раздел списка купонов */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <Percent className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
            No coupons found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            No coupons match your search criteria. Try changing your search or
            add a new coupon.
          </p>
          <Link href="/super-admin/coupons/add">
            <Button className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 border border-purple-200 dark:border-purple-900 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 group">
              <Plus className="h-4 w-4 mr-2 transition-transform group-active:scale-90" />
              <span className="relative z-10">Add New Coupon</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCoupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="p-4 shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40"
            >
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {coupon.code}
                    </h3>
                    <Badge
                      variant={
                        isCouponActive(coupon) ? "default" : "destructive"
                      }
                      className={
                        isCouponActive(coupon)
                          ? "bg-green-500 dark:bg-green-600"
                          : "dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {isCouponActive(coupon) ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    {coupon.discount}% discount
                  </p>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      Valid from:{" "}
                      {format(new Date(coupon.startDate), "d MMM, yyyy")} to{" "}
                      {format(new Date(coupon.endDate), "d MMM, yyyy")}
                    </p>
                    <p>
                      Usage: {coupon.usageCount} /{" "}
                      {coupon.usageLimit === 0 ? "∞" : coupon.usageLimit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created:{" "}
                      {format(new Date(coupon.createdAt), "d MMM, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openDeleteDialog(coupon.id)}
                    className="flex-shrink-0 bg-red-100 border-red-200 dark:bg-red-900/50 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 active:bg-red-100 dark:active:bg-red-900 active:scale-95 transition-all duration-200 focus:ring-red-400 focus:ring-opacity-30"
                  >
                    <Trash className="h-4 w-4 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Загрузочный компонент для Suspense
function LoadingCouponsList() {
  return (
    <div className="container mx-auto py-8 flex justify-center items-center min-h-[600px]">
      <Loader className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
      <span className="ml-2 text-lg dark:text-gray-300">
        Loading coupons page...
      </span>
    </div>
  );
}

// Основной компонент страницы, обернутый в Suspense
function CouponsListPage() {
  return (
    <Suspense fallback={<LoadingCouponsList />}>
      <CouponsListContent />
    </Suspense>
  );
}

export default CouponsListPage;

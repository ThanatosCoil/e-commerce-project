"use client";

import { useState } from "react";
import {
  useGetAddressesQuery,
  useDeleteAddressMutation,
  type Address,
} from "@/store/api/addressSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  PlusCircle,
  Home,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
  User,
  Mail,
  Shield,
  UserCircle,
  LogOut,
  Building,
  XCircle,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import AddressForm from "@/components/address/AddressForm";

// Функция для форматирования телефонного номера при отображении
const formatPhoneForDisplay = (phone: string): string => {
  // Удаляем все нецифровые символы, кроме +
  const digitsOnly = phone.replace(/[^\d+]/g, "");

  // Если номер начинается с + и за ним следуют только цифры
  if (digitsOnly.startsWith("+") && digitsOnly.length >= 8) {
    // Пример форматирования для номера формата +XXXXXXXXXXX
    try {
      const countryCode = digitsOnly.substring(1, 2); // Берем первую цифру после +
      const areaCode = digitsOnly.substring(2, 5); // Берем следующие 3 цифры
      const firstPart = digitsOnly.substring(5, 8); // Берем следующие 3 цифры
      const lastPart = digitsOnly.substring(8); // Берем все оставшиеся цифры

      return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    } catch (e) {
      // Если что-то пошло не так, возвращаем оригинальный номер
      return phone;
    }
  }

  // Если формат не соответствует, возвращаем как есть
  return phone;
};

export default function AccountPage() {
  const router = useRouter();

  // Получение информации о пользователе из хука auth
  const { user, logout } = useAuth();

  // Получение адресов из API
  const { data: addresses = [], isLoading, refetch } = useGetAddressesQuery();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();

  // Управление состоянием формы
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    country: "",
    city: "",
    zipCode: "",
    phone: "",
    isDefault: false,
  });

  // Состояние для диалога подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  // Функция для редактирования адреса
  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      address: address.address,
      country: address.country,
      city: address.city,
      zipCode: address.zipCode,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address.id);
    setFormMode("edit");
    setShowForm(true);
  };

  // Функция для инициации удаления адреса
  const handleInitiateDelete = (id: string) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Функция для удаления адреса
  const handleDelete = async () => {
    if (!addressToDelete) return;

    try {
      await deleteAddress(addressToDelete).unwrap();
      toast.success("Address deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    } catch (error: any) {
      // Проверяем сообщение об ошибке с сервера
      if (error?.data?.message?.includes("used in orders")) {
        toast.error(
          "This address cannot be deleted because it is used in your orders"
        );
      } else {
        toast.error("An error occurred while deleting the address");
      }
      console.error(error);
    }
  };

  // Обработка выхода пользователя
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
        <div className="container mx-auto py-8 px-4">
          {/* Скелетон заголовка */}
          <div className="bg-gradient-to-r from-blue-200/80 to-indigo-200/80 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-lg mr-3" />
              <Skeleton className="h-10 w-64" />
            </div>
            <Skeleton className="h-6 w-48 mt-3 ml-3" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Скелетон боковой панели профиля */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                  <Skeleton className="h-6 w-48" />
                </div>

                <div className="p-6">
                  <div className="flex flex-col items-center mb-6">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-6 w-36 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded" />
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full rounded" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Скелетон адресов */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>

                <div className="p-6">
                  {/* Скелетон карточек адресов */}
                  <div className="space-y-6">
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 py-4 px-2"
                      >
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-grow">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-24" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="flex space-x-2">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Скелетон карточек информации */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white/90 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-4 flex items-start space-x-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-b from-indigo-100/50 to-blue-100/50 dark:from-gray-900/50 dark:to-gray-950 pb-12">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-xl shadow-md mb-8">
          <h1 className="text-4xl font-extrabold flex items-center pb-1">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-2 rounded-lg mr-3 text-white shadow-md">
              <UserCircle className="h-8 w-8" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 leading-relaxed">
              My Account
            </span>
          </h1>
          {user && (
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 border-l-4 border-blue-500 pl-3 mt-3">
              Hello, {user.name || user.email}!{" "}
              {/* {user.role && (
                <Badge className="ml-2 bg-purple-500 text-white border-purple-600">
                  {user.role}
                </Badge>
              )} */}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Информация о профиле */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 sticky top-20">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Profile Information
                </h2>
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="h-24 w-24 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md mb-4">
                    <User className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.name || "User"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-1" />
                    {user?.email}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Account Type
                    </p>
                    <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        {user?.role || "User"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => router.push("/products")}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 hover:from-emerald-600 hover:to-green-600 dark:hover:from-emerald-700 dark:hover:to-green-700 text-white shadow-md font-medium flex items-center gap-2 pl-3 pr-4 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Continue Shopping
                  </Button>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-900 text-white shadow-md font-medium flex items-center justify-center gap-2 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
                    onClick={() => router.push("/cart")}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Go to Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full mt-2 bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 dark:hover:bg-red-950/30 dark:text-red-400 dark:hover:text-red-300 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 active:bg-red-50 active:text-red-700 active:border-red-300 shadow-sm font-medium flex items-center justify-center gap-2 py-2.5 transform transition-transform duration-100 active:scale-[0.98]"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Раздел адресов */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="overflow-hidden shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 gap-0">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  My Addresses
                </h2>
                <div className="relative h-10 w-36">
                  <AnimatePresence initial={false}>
                    {showForm && formMode === "create" ? (
                      <motion.div
                        key="hide-form-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.15,
                          ease: "linear",
                        }}
                        className="absolute inset-0"
                        style={{ willChange: "opacity" }}
                      >
                        <Button
                          onClick={() => {
                            setShowForm(false);
                            setEditingAddressId(null);
                          }}
                          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 active:bg-gray-300 active:text-gray-700 active:scale-[0.98] w-full h-full flex items-center justify-center"
                          type="button"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          <span>Hide Form</span>
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add-address-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.15,
                          ease: "linear",
                        }}
                        className="absolute inset-0"
                        style={{ willChange: "opacity" }}
                      >
                        <Button
                          onClick={() => {
                            setFormMode("create");
                            setFormData({
                              name: "",
                              address: "",
                              country: "",
                              city: "",
                              zipCode: "",
                              phone: "",
                              isDefault: false,
                            });
                            setShowForm(true);
                            setEditingAddressId(null);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-900 active:scale-[0.98] text-white w-full h-full flex items-center justify-center"
                          type="button"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span>Add Address</span>
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Форма адреса */}
                <div
                  className="relative"
                  style={{ willChange: "transform, opacity" }}
                >
                  <AnimatePresence initial={false}>
                    {showForm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.15,
                          ease: "linear",
                        }}
                        className="mb-8"
                      >
                        <AddressForm
                          onCancel={() => {
                            setShowForm(false);
                            setFormMode("create");
                            setEditingAddressId(null);
                          }}
                          onSuccess={() => {
                            setShowForm(false);
                            setFormMode("create");
                            setEditingAddressId(null);
                            refetch();
                          }}
                          mode={formMode}
                          initialData={
                            formMode === "edit" && editingAddressId
                              ? { ...formData, id: editingAddressId }
                              : undefined
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Список адресов */}
                <div>
                  {addresses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full mb-6">
                        <Building className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        You don't have any saved addresses yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Add an address to speed up your checkout process
                      </p>
                      {!showForm && (
                        <Button
                          onClick={() => {
                            setFormMode("create");
                            setShowForm(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Your First Address
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {addresses.map((address) => (
                        <motion.li
                          key={address.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-200"
                        >
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>

                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <div className="flex items-center">
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {address.name}
                                  </h3>
                                  {address.isDefault && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(address)}
                                    className="h-8 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleInitiateDelete(address.id)
                                    }
                                    disabled={isDeleting}
                                    className="h-8 p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                  >
                                    {isDeleting &&
                                    addressToDelete === address.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mt-1">
                                <p>{address.address}</p>
                                <p>
                                  {address.city}, {address.country},{" "}
                                  {address.zipCode}
                                </p>
                                <p className="font-medium">
                                  {formatPhoneForDisplay(address.phone)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Дополнительные советы */}
            <motion.div
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Address Management
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add and edit delivery addresses for quick checkout
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                    <Home className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Fast Checkout
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Save data for faster checkout in the future
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md bg-white/90 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Convenient Usage
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Quick access to addresses when placing orders
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Диалог подтверждения удаления адреса */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        title="Delete Address"
        description="Are you sure you want to delete this address? This action cannot be undone. Note that addresses used in orders cannot be deleted."
        itemType="address"
      />
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetFeatureBannersQuery,
  useAddFeatureBannersMutation,
  useDeleteFeatureBannerMutation,
  useGetFeaturedProductsQuery,
  useUpdateFeaturedProductsMutation,
  useUpdateBannerOrderMutation,
  FeatureBanner,
} from "@/store/api/settingsSlice";
import { useGetProductsQuery } from "@/store/api/apiSlice";
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash,
  AlertTriangle,
  Maximize2,
  ChevronUp,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";

export default function SettingsPage() {
  // Состояния для управления баннерами
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [isViewingCurrentBanners, setIsViewingCurrentBanners] = useState(false);

  // Состояния для подтверждения удаления
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  // Состояния для выбора продуктов
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [tempSelectedProductIds, setTempSelectedProductIds] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  // Для работы с порядком отображения баннеров
  const [reorderedBanners, setReorderedBanners] = useState<FeatureBanner[]>([]);
  const [updateBannerOrder] = useUpdateBannerOrderMutation();

  // API запросы и мутации
  const { data: banners = [], isLoading: isLoadingBanners } =
    useGetFeatureBannersQuery();
  const { data: products = [], isLoading: isLoadingProducts } =
    useGetProductsQuery();
  const { data: featuredProducts = [], isLoading: isLoadingFeaturedProducts } =
    useGetFeaturedProductsQuery();

  const [addBanners, { isLoading: isAddingBanner }] =
    useAddFeatureBannersMutation();
  const [deleteBanner, { isLoading: isDeletingBanner }] =
    useDeleteFeatureBannerMutation();
  const [updateFeaturedProducts, { isLoading: isUpdatingFeatured }] =
    useUpdateFeaturedProductsMutation();

  // Инициализировать выбранные продукты при загрузке featuredProducts
  useEffect(() => {
    if (featuredProducts?.length) {
      setSelectedProductIds(featuredProducts.map((product: any) => product.id));
    }
  }, [featuredProducts]);

  // Инициализировать временное состояние при открытии диалога
  useEffect(() => {
    if (showSelectionDialog) {
      setTempSelectedProductIds([...selectedProductIds]);
    }
  }, [showSelectionDialog]);

  useEffect(() => {
    if (banners.length > 0) {
      setReorderedBanners([...banners]);
    }
  }, [banners]);

  // Обработчики баннеров
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (newFiles.length === 0) {
      toast.error("Please select image files only", {
        description: "Only images in PNG, JPG or WEBP formats are allowed",
        duration: 4000,
      });
      return;
    }

    setBannerFiles((prev) => [...prev, ...newFiles]);

    // Создать предварительные URL-адреса
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  // Обработчик перетаскивания и сброса
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (newFiles.length === 0) {
        toast.error("Please drop image files only", {
          description: "Only images in PNG, JPG or WEBP formats are allowed",
          duration: 4000,
        });
        return;
      }

      setBannerFiles((prev) => [...prev, ...newFiles]);

      // Создать предварительные URL-адреса
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const removeFile = (index: number) => {
    // Освободить URL-объект для предотвращения утечек памяти
    URL.revokeObjectURL(previewUrls[index]);

    setBannerFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));

    // Сбросить значение входного файла, чтобы разрешить загрузку одного и того же файла снова
    const fileInput = document.getElementById(
      "banner-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleBannerUpload = async () => {
    if (bannerFiles.length === 0) {
      toast.error("Please select at least one banner image", {
        description: "Banner images are required",
      });
      return;
    }

    const formData = new FormData();
    bannerFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const result = await addBanners(formData).unwrap();
      toast.success("Banners uploaded successfully");
      setBannerFiles([]);
      setPreviewUrls([]);
      console.log("Uploaded banners:", result);
    } catch (error: any) {
      console.error("Failed to upload banners:", error);
      toast.error(
        error.data?.message || error.error || "Failed to upload banners"
      );
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteBanner(bannerId).unwrap();
      toast.success("Banner deleted");
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
    } catch (error) {
      console.error("Failed to delete banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  // Открыть диалоговое окно подтверждения удаления
  const openDeleteDialog = (bannerId: string) => {
    setBannerToDelete(bannerId);
    setIsDeleteDialogOpen(true);
  };

  // Предварительный просмотр изображения в полноэкранном режиме
  const openImageModal = (url: string, index: number) => {
    setSelectedImageUrl(url);
    setCurrentPreviewIndex(index);
    setIsImageModalOpen(true);
    setIsViewingCurrentBanners(false);
    document.body.style.overflow = "hidden";
  };

  // Открыть существующий баннер в полноэкранном режиме
  const openCurrentBannerModal = (index: number) => {
    if (!banners.length) return;
    setSelectedImageUrl(banners[index].imageUrl);
    setCurrentPreviewIndex(index);
    setIsImageModalOpen(true);
    setIsViewingCurrentBanners(true);
    document.body.style.overflow = "hidden";
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl(null);
    setIsViewingCurrentBanners(false);
    document.body.style.overflow = "auto";
  };

  const showNextImage = () => {
    if (isViewingCurrentBanners) {
      if (banners.length <= 1) return;
      const nextIndex = (currentPreviewIndex + 1) % banners.length;
      setCurrentPreviewIndex(nextIndex);
      setSelectedImageUrl(banners[nextIndex].imageUrl);
    } else {
      if (previewUrls.length <= 1) return;
      const nextIndex = (currentPreviewIndex + 1) % previewUrls.length;
      setCurrentPreviewIndex(nextIndex);
      setSelectedImageUrl(previewUrls[nextIndex]);
    }
  };

  const showPrevImage = () => {
    if (isViewingCurrentBanners) {
      if (banners.length <= 1) return;
      const prevIndex =
        (currentPreviewIndex - 1 + banners.length) % banners.length;
      setCurrentPreviewIndex(prevIndex);
      setSelectedImageUrl(banners[prevIndex].imageUrl);
    } else {
      if (previewUrls.length <= 1) return;
      const prevIndex =
        (currentPreviewIndex - 1 + previewUrls.length) % previewUrls.length;
      setCurrentPreviewIndex(prevIndex);
      setSelectedImageUrl(previewUrls[prevIndex]);
    }
  };

  // Навигация по клавиатуре
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        showNextImage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrevImage();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeImageModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isImageModalOpen, currentPreviewIndex]);

  // Очистка URL-адресов при размонтировании
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Обработчики выбора продуктов
  const handleProductSelection = (productId: string) => {
    setTempSelectedProductIds((prev) => {
      // Если продукт уже выбран, удаляем его
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      // Если уже выбрано 8 продуктов, не добавляем новый
      else if (prev.length >= 8) {
        toast.error("Maximum 8 products can be featured");
        return prev;
      }
      // Иначе добавляем продукт
      else {
        return [...prev, productId];
      }
    });
  };

  const saveFeaturedProducts = async () => {
    try {
      // Применить временные выбранные ID к основному состоянию
      setSelectedProductIds(tempSelectedProductIds);
      await updateFeaturedProducts(tempSelectedProductIds).unwrap();
      toast.success("Featured products updated");
      setShowSelectionDialog(false);
    } catch (error) {
      console.error("Failed to update featured products:", error);
      toast.error("Failed to update featured products");
    }
  };

  // Обработчик отмены выбора
  const handleCancelSelection = () => {
    // Сбросить временное состояние и закрыть диалог без сохранения изменений
    setTempSelectedProductIds([...selectedProductIds]);
    setShowSelectionDialog(false);
  };

  // Функция для удаления продукта из выбранных продуктов
  const removeFromFeatured = (productId: string) => {
    const updatedIds = selectedProductIds.filter((id) => id !== productId);
    setSelectedProductIds(updatedIds);

    // Сохранить изменения сразу
    updateFeaturedProducts(updatedIds)
      .unwrap()
      .then(() => {
        toast.success("Product removed from featured");
      })
      .catch((error) => {
        console.error("Failed to remove product from featured:", error);
        toast.error("Failed to remove product");
      });
  };

  const filteredProducts = products.filter(
    (product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Сортировка продуктов: сначала выбранные, затем остальные, все в алфавитном порядке
  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    const isASelected = tempSelectedProductIds.includes(a.id);
    const isBSelected = tempSelectedProductIds.includes(b.id);

    // Если оба выбраны или оба не выбраны, сортируем по имени
    if (isASelected === isBSelected) {
      return a.name.localeCompare(b.name);
    }

    // Выбранные товары идут первыми
    return isASelected ? -1 : 1;
  });

  // Функция для перемещения баннера вверх (уменьшение порядкового номера)
  const moveBannerUp = (index: number) => {
    if (index === 0) return; // Уже самый верхний

    const newBanners = [...reorderedBanners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index - 1];
    newBanners[index - 1] = temp;

    setReorderedBanners(newBanners);
  };

  // Функция для перемещения баннера вниз (увеличение порядкового номера)
  const moveBannerDown = (index: number) => {
    if (index === reorderedBanners.length - 1) return; // Уже самый нижний

    const newBanners = [...reorderedBanners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index + 1];
    newBanners[index + 1] = temp;

    setReorderedBanners(newBanners);
  };

  // Сохранение нового порядка баннеров
  const saveBannerOrder = async () => {
    try {
      const orderData = reorderedBanners.map((banner, index) => ({
        id: banner.id,
        order: index,
      }));

      await updateBannerOrder(orderData);
      toast.success("Banner order updated successfully");
    } catch (error) {
      console.error("Error updating banner order:", error);
      toast.error("Failed to update banner order");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDelete={() => {
          if (bannerToDelete) {
            return handleDeleteBanner(bannerToDelete);
          }
        }}
        isDeleting={isDeletingBanner}
        description="Are you sure you want to delete this banner? This action cannot be undone."
        itemType="Banner"
      />

      {/* Полноэкранный просмотр изображения */}
      <div
        className={`fullscreen-overlay ${isImageModalOpen ? "active" : ""}`}
        onClick={closeImageModal}
        tabIndex={0}
      >
        {selectedImageUrl && (
          <div
            className="fullscreen-image-container dark:bg-gray-900/90"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImageUrl}
              alt={`Banner preview ${currentPreviewIndex + 1}`}
              className="fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            />

            {isViewingCurrentBanners
              ? banners.length > 1 && (
                  <>
                    <div
                      className="navigation-area navigation-prev"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showPrevImage();
                      }}
                      aria-label="Previous image"
                    ></div>
                    <div
                      className="navigation-area navigation-next"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showNextImage();
                      }}
                      aria-label="Next image"
                    ></div>

                    {/* Счетчик изображений */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {banners.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentPreviewIndex
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )
              : previewUrls.length > 1 && (
                  <>
                    <div
                      className="navigation-area navigation-prev"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showPrevImage();
                      }}
                      aria-label="Previous image"
                    ></div>
                    <div
                      className="navigation-area navigation-next"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showNextImage();
                      }}
                      aria-label="Next image"
                    ></div>

                    {/* Счетчик изображений */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {previewUrls.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentPreviewIndex
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
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
                closeImageModal();
              }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </div>

      <Tabs defaultValue="banners" className="w-full">
        {/* Общий заголовок для всех вкладок */}
        <Card className="w-full overflow-hidden gap-0 mb-6 shadow-lg dark:shadow-gray-800/20 dark:border-gray-800">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 to-80% p-6 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-blue-100 mt-2">
                Manage website banners and featured products
              </p>
            </div>
            <TabsList className="bg-white/20 text-white mt-4 md:mt-0">
              <TabsTrigger
                value="banners"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-purple-400"
              >
                Banners
              </TabsTrigger>
              <TabsTrigger
                value="featured"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-purple-400"
              >
                Featured Products
              </TabsTrigger>
            </TabsList>
          </div>
        </Card>

        {/* Вкладка управления баннерами */}
        <TabsContent value="banners">
          <div className="grid grid-cols-1 gap-6">
            {/* Раздел добавления новых баннеров */}
            <Card className="w-full overflow-hidden gap-0 shadow-md hover:shadow-lg transition-shadow duration-300 dark:shadow-gray-800/20 dark:border-gray-800 dark:hover:shadow-gray-800/30">
              <div className="p-6 dark:bg-gray-800/30">
                <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 dark:text-gray-200">
                  Add New Banners
                </h2>
                <div className="space-y-4">
                  {/* Раздел предварительного просмотра */}
                  {previewUrls.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-gray-700 dark:text-gray-300">
                        Banner Previews
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <div
                            key={index}
                            className="relative group product-image-preview dark:border-gray-700"
                          >
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="aspect-[3/1] w-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                              onClick={() => openImageModal(url, index)}
                            />
                            <div className="image-preview-overlay">
                              <button
                                type="button"
                                className="gallery-fullscreen-button dark:bg-gray-800 dark:text-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImageModal(url, index);
                                }}
                                aria-label="View full size"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Раздел загрузки */}
                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block dark:text-gray-300">
                      Upload Banners
                    </Label>
                    <div
                      className="mt-2 border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950 mb-3 shadow-sm">
                        <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Drag and drop image files or
                      </p>
                      <Label
                        htmlFor="banner-upload"
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 shadow-sm hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                      >
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Browse files
                        </span>
                        <Input
                          id="banner-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                        PNG, JPG or WEBP up to 5MB (recommended size: 1200×400)
                      </p>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        onClick={handleBannerUpload}
                        disabled={isAddingBanner || bannerFiles.length === 0}
                        className={`w-full max-w-md font-medium text-base py-3 rounded-xl
                          bg-gradient-to-r ${
                            bannerFiles.length === 0
                              ? "from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 cursor-not-allowed"
                              : "from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98]"
                          }
                          transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center text-white`}
                      >
                        {isAddingBanner ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Uploading Banners...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 mr-2" />
                            Upload Banners
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Раздел текущих баннеров - отдельная карточка */}
            <Card className="py-6 shadow-md hover:shadow-lg gap-0 transition-all duration-300 dark:bg-[#101317] hover:transform hover:translateY(-2px)  dark:shadow-gray-800/20 dark:border-gray-800 dark:hover:shadow-gray-800/30">
              <CardHeader>
                <CardTitle className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 dark:text-gray-200">
                  Current Banners
                </CardTitle>
              </CardHeader>
              <CardContent className=" dark:text-gray-200">
                {isLoadingBanners ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full dark:border-blue-600 dark:border-t-transparent"></div>
                  </div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p>
                      No banners found. Add new banners to display on the home
                      page.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reorderedBanners.map((banner, index) => (
                      <div
                        key={banner.id}
                        className="relative group rounded-lg overflow-hidden border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800/30 transition-all duration-300 product-image-preview"
                      >
                        {/* Индикатор порядка */}
                        <div className="absolute left-3 top-3 z-10 bg-black/50 text-white h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold shadow-md backdrop-blur-sm border border-white/30">
                          {index + 1}
                        </div>

                        <div className="absolute top-2 right-2 z-10 flex space-x-1">
                          <button
                            type="button"
                            onClick={() => moveBannerUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded-full bg-black/50 hover:bg-black/70 transition-all ${
                              index === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBannerDown(index)}
                            disabled={index === reorderedBanners.length - 1}
                            className={`p-1 rounded-full bg-black/50 hover:bg-black/70 transition-all ${
                              index === reorderedBanners.length - 1
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4 text-white" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded-full bg-red-500/70 hover:bg-red-500/90 transition-all"
                            onClick={() => openDeleteDialog(banner.id)}
                            title="Delete banner"
                          >
                            <Trash className="h-4 w-4 text-white" />
                          </button>
                        </div>
                        <div className="aspect-[3/1] relative">
                          <Image
                            src={banner.imageUrl}
                            alt="Banner"
                            fill
                            className="object-cover cursor-pointer"
                            onClick={() => openCurrentBannerModal(index)}
                          />
                          <div className="image-preview-overlay">
                            <button
                              type="button"
                              className="gallery-fullscreen-button dark:bg-gray-800 dark:text-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCurrentBannerModal(index);
                              }}
                              aria-label="View full size"
                            >
                              <Maximize2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {reorderedBanners.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      onClick={saveBannerOrder}
                      className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 
                        dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-95 active:shadow-inner
                        transition-all duration-300 shadow-md hover:shadow-lg text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Banner Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Вкладка выбранных продуктов */}
        <TabsContent value="featured">
          <Card className="shadow-md hover:shadow-lg gap-0 py-6 transition-shadow dark:bg-[#101317] duration-300 dark:shadow-gray-800/20 dark:border-gray-800 dark:hover:shadow-gray-800/30">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-xl font-semibold mb-4 mr-5 w-full dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Featured Products
                </CardTitle>
                <Dialog
                  open={showSelectionDialog}
                  onOpenChange={setShowSelectionDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 
                        dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-95 active:shadow-inner
                        transition-all duration-200 shadow-md hover:shadow-lg text-white w-full sm:w-auto"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 transition-transform group-active:scale-90" />
                      <span className="whitespace-nowrap relative z-10">
                        Select Products
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl dark:bg-gray-900 dark:border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="dark:text-gray-200">
                        Select Up To 8 Featured Products
                      </DialogTitle>
                      <DialogDescription className="flex items-center justify-between mt-2 dark:text-gray-400">
                        <span>Select products to display on the home page</span>
                        <span
                          className={`font-semibold px-3 py-1 rounded-full text-sm ${
                            tempSelectedProductIds.length >= 8
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {tempSelectedProductIds.length}/8 selected
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="my-4">
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-4 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      />
                      <div className="h-[400px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="dark:border-gray-700">
                              <TableHead className="w-12 dark:text-gray-400"></TableHead>
                              <TableHead className="dark:text-gray-400">
                                Image
                              </TableHead>
                              <TableHead className="dark:text-gray-400">
                                Name
                              </TableHead>
                              <TableHead className="dark:text-gray-400">
                                Price
                              </TableHead>
                              <TableHead className="dark:text-gray-400">
                                Stock
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingProducts ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center py-10 dark:border-gray-700"
                                >
                                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto dark:border-blue-600 dark:border-t-transparent"></div>
                                </TableCell>
                              </TableRow>
                            ) : filteredProducts.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center py-10 text-gray-500 dark:text-gray-400 dark:border-gray-700"
                                >
                                  No products found
                                </TableCell>
                              </TableRow>
                            ) : (
                              sortedFilteredProducts.map((product: any) => (
                                <TableRow
                                  key={product.id}
                                  className={
                                    tempSelectedProductIds.includes(product.id)
                                      ? "bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-900/40"
                                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:border-gray-700"
                                  }
                                >
                                  <TableCell className="dark:border-gray-700">
                                    <Checkbox
                                      checked={tempSelectedProductIds.includes(
                                        product.id
                                      )}
                                      onCheckedChange={() =>
                                        handleProductSelection(product.id)
                                      }
                                      disabled={
                                        tempSelectedProductIds.length >= 8 &&
                                        !tempSelectedProductIds.includes(
                                          product.id
                                        )
                                      }
                                      className={`${
                                        tempSelectedProductIds.length >= 8 &&
                                        !tempSelectedProductIds.includes(
                                          product.id
                                        )
                                          ? "opacity-40 cursor-not-allowed data-[state=checked]:bg-gray-400 dark:data-[state=checked]:bg-gray-600"
                                          : tempSelectedProductIds.includes(
                                              product.id
                                            )
                                          ? "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:data-[state=checked]:bg-blue-700 dark:data-[state=checked]:border-blue-700"
                                          : ""
                                      }`}
                                    />
                                  </TableCell>
                                  <TableCell className="dark:border-gray-700">
                                    <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                      {product.images &&
                                      product.images.length > 0 ? (
                                        <Image
                                          src={product.images[0]}
                                          alt={product.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="bg-gray-200 dark:bg-gray-700 h-full w-full flex items-center justify-center">
                                          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell
                                    className={`font-medium dark:border-gray-700 ${
                                      tempSelectedProductIds.includes(
                                        product.id
                                      )
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "dark:text-gray-200"
                                    }`}
                                  >
                                    {product.name}
                                  </TableCell>
                                  <TableCell
                                    className={`dark:border-gray-700 ${
                                      tempSelectedProductIds.includes(
                                        product.id
                                      )
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "dark:text-gray-300"
                                    }`}
                                  >
                                    ${product.price.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="dark:border-gray-700">
                                    <span
                                      className={
                                        product.stock < 10
                                          ? "text-red-500 dark:text-red-400 font-medium"
                                          : "dark:text-gray-300"
                                      }
                                    >
                                      {product.stock} in stock
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          className="border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-300 active:scale-[0.98]"
                          onClick={handleCancelSelection}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={saveFeaturedProducts}
                        disabled={isUpdatingFeatured}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 
                          dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98] active:shadow-inner
                          transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        {isUpdatingFeatured ? "Saving..." : "Save"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFeaturedProducts ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full dark:border-blue-600 dark:border-t-transparent"></div>
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p>
                    No featured products selected. Click "Select Products" to
                    add some.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {featuredProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg dark:shadow-gray-900/30 dark:hover:shadow-gray-900/40 transition-all duration-300 group relative hover:translate-y-[-5px] bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/30"
                    >
                      <div className="aspect-square relative">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="bg-gray-100 dark:bg-gray-700 h-full w-full flex items-center justify-center">
                            <X className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                            onClick={() => removeFromFeatured(product.id)}
                            disabled={isUpdatingFeatured}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-2 lg:p-4 border-t dark:border-gray-700">
                        <div className="flex flex-col mb-2">
                          <h3 className="font-semibold text-md line-clamp-1 text-gray-800 dark:text-gray-200">
                            {product.name}
                          </h3>
                          <span className="font-bold text-blue-600 dark:text-blue-400 mt-1">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <div className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-1 ${
                                product.stock > 10
                                  ? "bg-green-500 dark:bg-green-600"
                                  : product.stock > 0
                                  ? "bg-yellow-500 dark:bg-yellow-600"
                                  : "bg-red-500 dark:bg-red-600"
                              }`}
                            ></div>
                            <span
                              className={`${
                                product.stock > 10
                                  ? "text-green-700 dark:text-green-500"
                                  : product.stock > 0
                                  ? "text-yellow-700 dark:text-yellow-500"
                                  : "text-red-700 dark:text-red-500"
                              } font-medium`}
                            >
                              {product.stock > 10
                                ? "In Stock"
                                : product.stock > 0
                                ? "Low Stock"
                                : "Out of Stock"}
                            </span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400 font-medium">
                            ID: {product.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

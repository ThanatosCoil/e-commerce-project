"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Check, Maximize2, ArrowLeft, Save } from "lucide-react";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "@/store/api/apiSlice";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { protectUpdateProductAction } from "@/actions/product";
import Link from "next/link";
import React from "react";
import {
  CATEGORIES,
  SIZES,
  COLORS,
  BRANDS,
  getNormalizedValue,
  getNormalizedGenderValue,
} from "@/constants/product";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading: isProductLoading } =
    useGetProductByIdQuery(productId);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    category: "",
    gender: "",
    price: "",
    discount: "0",
    stock: "",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);

  const isInitializedRef = React.useRef(false);

  useEffect(() => {
    if (product && !isInitializedRef.current) {
      // Нормализуем значения для селекторов (проверяем регистр)
      const normalizedBrand = getNormalizedValue(product.brand, BRANDS);
      const normalizedCategory = getNormalizedValue(
        product.category,
        CATEGORIES
      );
      const normalizedGender = getNormalizedGenderValue(product.gender);

      // Конвертируем числовые значения в строки для полей формы
      const updatedFormData = {
        name: product.name || "",
        brand: normalizedBrand,
        description: product.description || "",
        category: normalizedCategory,
        gender: normalizedGender,
        price: product.price ? product.price.toString() : "",
        discount: (product.discount || 0).toString(),
        stock: product.stock ? product.stock.toString() : "",
      };

      // Обновляем все поля формы сразу для более надежного отображения
      setFormData(updatedFormData);

      // Инициализируем выбранные размеры и цвета
      setSelectedSizes(product.sizes || []);
      setSelectedColors(product.colors || []);
      setExistingImages(product.images || []);
      setPreviewUrls(product.images || []);

      // Помечаем, что инициализация выполнена
      isInitializedRef.current = true;
    }
  }, [product]);

  // Мемоизируем обработчики событий
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSelectChange = React.useCallback(
    (name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const toggleSize = React.useCallback((size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }, []);

  const toggleColor = React.useCallback((color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Ограничиваем количество загружаемых файлов
    const MAX_FILES = 5;
    const currentTotalFiles =
      selectedFiles.length + previewUrls.length - existingImages.length;

    if (currentTotalFiles + files.length > MAX_FILES) {
      toast.error(`You can upload maximum ${MAX_FILES} images`, {
        description: `Please remove some images before uploading more`,
        duration: 4000,
      });
      return;
    }

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

    // Проверяем размер файлов
    const MAX_SIZE_MB = 5;
    const oversizedFiles = newFiles.filter(
      (file) => file.size > MAX_SIZE_MB * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed the ${MAX_SIZE_MB}MB limit`, {
        description: `Please resize your images before uploading`,
        duration: 4000,
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Создаем URL предпросмотра для новых файлов
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

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
      // Ограничиваем количество загружаемых файлов
      const MAX_FILES = 5;
      const currentTotalFiles =
        selectedFiles.length + previewUrls.length - existingImages.length;

      if (currentTotalFiles + e.dataTransfer.files.length > MAX_FILES) {
        toast.error(`You can upload maximum ${MAX_FILES} images`, {
          description: `Please remove some images before uploading more`,
          duration: 4000,
        });
        return;
      }

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

      // Проверяем размер файлов
      const MAX_SIZE_MB = 5;
      const oversizedFiles = newFiles.filter(
        (file) => file.size > MAX_SIZE_MB * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        toast.error(`Some files exceed the ${MAX_SIZE_MB}MB limit`, {
          description: `Please resize your images before uploading`,
          duration: 4000,
        });
        return;
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Создаем URL предпросмотра для новых файлов
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const removeFile = React.useCallback(
    (index: number) => {
      const currentUrl = previewUrls[index];

      // Если это существующее изображение, добавляем его в список на удаление
      if (existingImages.includes(currentUrl)) {
        setImagesToDelete((prev) => [...prev, currentUrl]);
        setExistingImages((prev) => prev.filter((img) => img !== currentUrl));
      } else {
        // Если это новое изображение, освобождаем URL объекта
        URL.revokeObjectURL(currentUrl);
        setSelectedFiles((prev) =>
          prev.filter(
            (_, i) =>
              i !== index - existingImages.length + imagesToDelete.length
          )
        );
      }

      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));

      // Сбрасываем значение input file
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    },
    [previewUrls, existingImages, imagesToDelete]
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const { success, status, error } = await protectUpdateProductAction();

      if (!success) {
        toast.error(error, {
          description: status,
        });
        return;
      }

      // Проверка на наличие хотя бы одного изображения
      if (previewUrls.length === 0) {
        toast.error("Please upload at least one product image", {
          description: "Product images are required",
        });
        return;
      }

      // Проверка на выбор размеров
      if (selectedSizes.length === 0) {
        toast.error("Please select at least one size", {
          description: "Size selection is required",
        });
        return;
      }

      // Проверка на выбор цветов
      if (selectedColors.length === 0) {
        toast.error("Please select at least one color", {
          description: "Color selection is required",
        });
        return;
      }

      try {
        // Создаем FormData для отправки данных
        const productFormData = new FormData();

        // Добавляем основные данные товара
        productFormData.append("name", formData.name);
        productFormData.append("brand", formData.brand);
        productFormData.append("description", formData.description);
        productFormData.append("category", formData.category);
        productFormData.append("gender", formData.gender);
        productFormData.append("price", formData.price);
        productFormData.append("discount", formData.discount);
        productFormData.append("stock", formData.stock);

        // Добавляем размеры и цвета
        selectedSizes.forEach((size) => {
          productFormData.append("sizes", size);
        });

        selectedColors.forEach((color) => {
          productFormData.append("colors", color);
        });

        // Добавляем существующие изображения, которые нужно сохранить
        existingImages.forEach((imageUrl) => {
          productFormData.append("existingImages", imageUrl);
        });

        // Добавляем изображения для удаления
        imagesToDelete.forEach((imageUrl) => {
          productFormData.append("imagesToDelete", imageUrl);
        });

        // Добавляем новые файлы изображений
        selectedFiles.forEach((file) => {
          productFormData.append("images", file);
        });

        // Отправляем запрос на обновление товара
        await updateProduct({ id: productId, data: productFormData }).unwrap();

        // Показываем уведомление об успешном обновлении
        toast.success("Product updated successfully!", {
          description: "The product has been updated.",
        });

        // Перенаправляем на страницу списка товаров
        router.push("/super-admin/products/list");
      } catch (error) {
        console.error("Failed to update product:", error);
        toast.error("Failed to update product", {
          description:
            "There was an error updating the product. Please try again.",
        });
      }
    },
    [
      formData,
      selectedSizes,
      selectedColors,
      previewUrls,
      existingImages,
      imagesToDelete,
      selectedFiles,
      productId,
      updateProduct,
      router,
    ]
  );

  const openImageModal = React.useCallback((url: string, index: number) => {
    setSelectedImageUrl(url);
    setIsImageModalOpen(true);
    setCurrentPreviewIndex(index);
    document.body.style.overflow = "hidden";
  }, []);

  const closeImageModal = React.useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImageUrl(null);
    document.body.style.overflow = "auto";
  }, []);

  const showNextImage = React.useCallback(() => {
    const nextIndex = (currentPreviewIndex + 1) % previewUrls.length;
    setCurrentPreviewIndex(nextIndex);
    setSelectedImageUrl(previewUrls[nextIndex]);
  }, [currentPreviewIndex, previewUrls]);

  const showPrevImage = React.useCallback(() => {
    const prevIndex =
      (currentPreviewIndex - 1 + previewUrls.length) % previewUrls.length;
    setCurrentPreviewIndex(prevIndex);
    setSelectedImageUrl(previewUrls[prevIndex]);
  }, [currentPreviewIndex, previewUrls]);

  // Оптимизируем очистку ресурсов при размонтировании компонента
  useEffect(() => {
    return () => {
      // Освобождаем все URL объекты при размонтировании компонента
      selectedFiles.forEach((_, index) => {
        const url =
          previewUrls[index + existingImages.length - imagesToDelete.length];
        if (url && !existingImages.includes(url)) {
          URL.revokeObjectURL(url);
        }
      });
      document.body.style.overflow = "auto";
    };
  }, [previewUrls, existingImages, imagesToDelete, selectedFiles]);

  // Обработчик нажатия клавиш для навигации по изображениям
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;

      if (e.key === "Escape") {
        closeImageModal();
      } else if (e.key === "ArrowRight") {
        showNextImage();
      } else if (e.key === "ArrowLeft") {
        showPrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen, currentPreviewIndex]);

  // Вычисляем цену со скидкой для предпросмотра
  const discountedPrice =
    formData.price && formData.discount
      ? Number(
          (
            parseFloat(formData.price) *
            (1 - parseFloat(formData.discount) / 100)
          ).toFixed(2)
        )
      : null;

  if (isProductLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <p className="mb-6">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link href="/super-admin/products/list">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Полноэкранный режим просмотра изображений */}
      <div
        className={`fullscreen-overlay ${isImageModalOpen ? "active" : ""}`}
        onClick={closeImageModal}
        tabIndex={0}
      >
        {selectedImageUrl && (
          <div
            className="fullscreen-image-container"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImageUrl}
              alt={`Product preview ${currentPreviewIndex + 1}`}
              className="fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Невидимые области для навигации */}
            {previewUrls.length > 1 && (
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

                {/* Индикатор текущего изображения */}
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

      <Card className="overflow-hidden border dark:border-gray-800 shadow-2xl dark:shadow-gray-800/20 pt-0 gap-0 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-xl overflow-hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Product</h1>
            <p className="text-blue-100 mt-2">
              Update the details of your product
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/super-admin/products/list">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 text-blue-700 hover:bg-white hover:text-indigo-700 dark:bg-indigo-950 dark:text-blue-200 dark:border-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-blue-200 flex items-center gap-1.5 px-4 py-2 min-h-[2.5rem] rounded-full font-medium shadow-md hover:shadow-lg transform transition-all duration-200 ease-out active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Products</span>
              </Button>
            </Link>
          </div>
        </div>

        <CardContent className="p-6 dark:bg-gray-800/30">
          <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-2">
            {/* Левая колонка - Product Info */}
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium underline dark:text-gray-200">
                  Product Information
                </Label>
                <div className="mt-3 space-y-4">
                  <div>
                    <Label
                      htmlFor="name"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className="mt-1 dark:bg-gray-900 dark:border-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="brand"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Brand
                    </Label>
                    <Select
                      name="brand"
                      value={formData.brand}
                      onValueChange={(value) =>
                        handleSelectChange("brand", value)
                      }
                      key={`brand-${formData.brand || "empty"}`}
                    >
                      <SelectTrigger
                        id="brand"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <SelectValue placeholder="Select brand">
                          {formData.brand || "Select brand"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                        {BRANDS.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="category"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Category
                    </Label>
                    <Select
                      name="category"
                      value={formData.category}
                      onValueChange={(value) =>
                        handleSelectChange("category", value)
                      }
                      key={`category-${formData.category || "empty"}`}
                    >
                      <SelectTrigger
                        id="category"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <SelectValue placeholder="Select category">
                          {formData.category || "Select category"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-700 max-h-[200px]">
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="gender"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Gender
                    </Label>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                      key={`gender-${formData.gender || "empty"}`}
                    >
                      <SelectTrigger
                        id="gender"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <SelectValue placeholder="Select gender">
                          {formData.gender || "Select gender"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Kids">Kids</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter product description"
                      className="mt-1 min-h-[310px] dark:bg-gray-900 dark:border-gray-700"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка - Variants & Images */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium underline dark:text-gray-200">
                  Pricing & Inventory
                </Label>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="price"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Price ($)
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="mt-1 dark:bg-gray-900 dark:border-gray-700"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="discount"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Discount (%)
                    </Label>
                    <div className="flex items-center">
                      <Input
                        id="discount"
                        name="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.discount}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700"
                      />
                      {discountedPrice !== null &&
                        parseFloat(formData.discount) > 0 && (
                          <div className="text-sm ml-3">
                            <span className="text-gray-500">Final price:</span>
                            <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                              ${discountedPrice}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label
                      htmlFor="stock"
                      className="text-sm text-gray-600 dark:text-gray-300 inline-block"
                    >
                      Stock
                    </Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="mt-1 dark:bg-gray-900 dark:border-gray-700"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-300 inline-block">
                    Available Sizes
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={
                          selectedSizes.includes(size) ? "default" : "outline"
                        }
                        size="sm"
                        className="rounded-md"
                        onClick={() => toggleSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-sm text-gray-600 dark:text-gray-300 inline-block">
                    Available Colors
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        className={`relative rounded-full h-8 w-8 p-0 transition-all duration-200 ${
                          selectedColors.includes(color.value)
                            ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 dark:ring-offset-gray-900"
                            : "hover:scale-110"
                        }`}
                        style={{
                          backgroundColor: color.value,
                          borderColor:
                            color.value === "#FFFFFF" ? "#9ca3af" : color.value,
                          borderWidth:
                            color.value === "#FFFFFF" ? "2px" : "1px",
                          borderStyle: "solid",
                        }}
                        onClick={() => toggleColor(color.value)}
                        title={color.name}
                      >
                        {selectedColors.includes(color.value) && (
                          <Check
                            className={`absolute inset-0 m-auto h-4 w-4 ${
                              color.value === "#FFFFFF"
                                ? "text-black"
                                : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium pt-1 underline dark:text-gray-200">
                  Product Images
                </Label>
                <div className="mt-3 space-y-4">
                  {/* Область предварительного просмотра изображений */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {previewUrls.map((url, index) => (
                        <div
                          key={index}
                          className="relative group product-image-preview dark:border-gray-700"
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="aspect-square w-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                            onClick={() => openImageModal(url, index)}
                          />
                          <div className="image-preview-overlay">
                            <button
                              type="button"
                              className="gallery-fullscreen-button dark:bg-gray-800 dark:text-gray-200"
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
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Область загрузки */}
                  <div
                    className="border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 h-full"
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
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 shadow-sm hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Browse files
                      </span>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                      PNG, JPG or WEBP up to 5MB
                    </p>
                  </div>
                  <div>
                    <Button
                      type="submit"
                      className={`w-full mx-auto md:min-w-[200px] lg:min-w-[240px] font-medium text-base dark:text-white py-5 rounded-xl 
                        bg-gradient-to-r ${
                          formData.name === "" ||
                          formData.brand === "" ||
                          formData.category === "" ||
                          formData.gender === "" ||
                          formData.description === "" ||
                          formData.price === "" ||
                          formData.stock === "" ||
                          previewUrls.length === 0 ||
                          selectedSizes.length === 0 ||
                          selectedColors.length === 0
                            ? "from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 cursor-not-allowed"
                            : "from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98]"
                        }
                        transition-all duration-300 shadow-md hover:shadow-lg h-auto flex items-center justify-center`}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
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
                          Updating Product...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Update Product
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

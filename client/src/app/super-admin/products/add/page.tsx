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
import { Upload, X, Check, Maximize2, Plus } from "lucide-react";
import { useCreateProductMutation } from "@/store/api/apiSlice";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { protectCreateProductAction } from "@/actions/product";
import { CATEGORIES, SIZES, COLORS, BRANDS } from "@/constants/product";

function AddProductPage() {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    category: "",
    gender: "",
    price: "",
    stock: "",
    discount: "",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

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
        style: {
          backgroundColor: "#fff",
        },
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Создаем URL предпросмотра для новых файлов
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  // Функции для обработки drag and drop
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

      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Создаем URL предпросмотра для новых файлов
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const removeFile = (index: number) => {
    // Освобождаем URL объекта для предотвращения утечек памяти
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));

    // Сбрасываем значение input file, чтобы можно было загрузить тот же файл снова
    const fileInput = document.getElementById(
      "file-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { success, status, error } = await protectCreateProductAction();

    if (!success) {
      toast.error(error, {
        description: status,
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please upload at least one product image", {
        description: "Product images are required",
      });
      return;
    }

    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size", {
        description: "Size selection is required",
      });
      return;
    }

    if (selectedColors.length === 0) {
      toast.error("Please select at least one color", {
        description: "Color selection is required",
      });
      return;
    }

    try {
      const productFormData = new FormData();

      // Добавляем все текстовые поля
      Object.entries(formData).forEach(([key, value]) => {
        productFormData.append(key, value);
      });

      // Добавляем массивы как строки с разделителями
      productFormData.append("sizes", selectedSizes.join(","));
      productFormData.append("colors", selectedColors.join(","));

      // Добавляем все выбранные файлы
      selectedFiles.forEach((file) => {
        productFormData.append("images", file);
      });

      // Для отладки - проверьте содержимое FormData
      console.log("FormData entries:");
      for (let pair of productFormData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await createProduct(productFormData).unwrap();

      toast.success("Product created successfully!", {
        description: "Your product has been added to the catalog",
      });
      router.push("/super-admin/products/list");
    } catch (error) {
      toast.error("Failed to create product", {
        description: "Please try again later",
      });
      console.log(error);
    }
  };

  const openImageModal = (url: string, index: number) => {
    setSelectedImageUrl(url);
    setCurrentPreviewIndex(index);
    setIsImageModalOpen(true);
    // Предотвращаем прокрутку основной страницы при открытом модальном окне
    document.body.style.overflow = "hidden";
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl(null);
    // Возвращаем прокрутку при закрытии модального окна
    document.body.style.overflow = "auto";
  };

  // Функции для навигации по изображениям в полноэкранном режиме
  const showNextImage = () => {
    if (previewUrls.length <= 1) return;

    const nextIndex = (currentPreviewIndex + 1) % previewUrls.length;
    setCurrentPreviewIndex(nextIndex);
    setSelectedImageUrl(previewUrls[nextIndex]);
  };

  const showPrevImage = () => {
    if (previewUrls.length <= 1) return;

    const prevIndex =
      (currentPreviewIndex - 1 + previewUrls.length) % previewUrls.length;
    setCurrentPreviewIndex(prevIndex);
    setSelectedImageUrl(previewUrls[prevIndex]);
  };

  // Обработка нажатий клавиш для навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;

      if (e.key === "ArrowRight") {
        showNextImage();
      } else if (e.key === "ArrowLeft") {
        showPrevImage();
      } else if (e.key === "Escape") {
        closeImageModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isImageModalOpen, currentPreviewIndex]);

  // Отдельный useEffect для очистки URL объектов при размонтировании
  useEffect(() => {
    // Эффект очистки URL объектов при размонтировании компонента
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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

      <Card className="overflow-hidden border dark:border-gray-800 shadow-2xl dark:shadow-gray-800/20 pt-0 gap-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6">
          <h1 className="text-2xl font-bold text-white">Add New Product</h1>
          <p className="text-blue-100 mt-2">
            Fill in the details to create a new product
          </p>
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
                      required
                    >
                      <SelectTrigger
                        id="brand"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <SelectValue placeholder="Select brand" />
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
                      required
                    >
                      <SelectTrigger
                        id="category"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
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
                      required
                    >
                      <SelectTrigger
                        id="gender"
                        className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <SelectValue placeholder="Select gender" />
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
                          selectedFiles.length === 0 ||
                          selectedSizes.length === 0 ||
                          selectedColors.length === 0
                            ? "from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 cursor-not-allowed"
                            : "from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 active:from-blue-800 active:to-indigo-800 active:scale-[0.98]"
                        }
                        transition-all duration-300 shadow-md hover:shadow-lg h-auto flex items-center justify-center`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
                          Creating Product...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Create Product
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

export default AddProductPage;

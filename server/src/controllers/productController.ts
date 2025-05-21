import cloudinary from "../config/cloudinary";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Response } from "express";
import { prisma } from "../server";
import fs from "fs";
import { deleteCacheByPattern } from "../config/redis";

// Функция для очистки кеша продуктов
const invalidateProductCache = async (): Promise<void> => {
  try {
    // Очищаем все ключи, связанные с продуктами
    await deleteCacheByPattern("products:*");
    // Очищаем кеш последних продуктов
    await deleteCacheByPattern("latest-products:*");
    console.log("Product cache invalidated");
  } catch (error) {
    console.error("Error invalidating product cache:", error);
  }
};

// Создание нового продукта
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  try {
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      stock,
      price,
      discount,
    } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "No files uploaded" });
      return;
    }

    // Загружаем изображения в Cloudinary
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "products",
      })
    );
    const uploadedImages = await Promise.all(uploadPromises);
    const imageUrls = uploadedImages.map((image) => image.secure_url);

    // Создаем новый продукт в базе данных
    const newProduct = await prisma.product.create({
      data: {
        name,
        brand,
        description,
        category,
        gender,
        sizes: sizes.split(","),
        colors: colors.split(","),
        stock: parseInt(stock),
        price: parseFloat(price),
        discount: parseFloat(discount || "0"),
        images: imageUrls,
        soldCount: 0,
        rating: 0,
      },
    });

    // Инвалидируем кеш продуктов после создания нового продукта
    await invalidateProductCache();

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    // Удаляем изображения из локальной папки в любом случае
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
  }
};

// Получение всех продуктов
export const getAllProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Получение продукта по ID
export const getProductById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Error getting product by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Обновление продукта
export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      stock,
      price,
      discount,
      existingImages,
      imagesToDelete,
    } = req.body;

    // Проверяем, существует ли продукт
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Массивы данных могут приходить в разных форматах
    const processedSizes = Array.isArray(sizes)
      ? sizes
      : [sizes].filter(Boolean);
    const processedColors = Array.isArray(colors)
      ? colors
      : [colors].filter(Boolean);

    // Обрабатываем существующие изображения
    let currentImages = existingProduct.images;

    // Если есть изображения для удаления, удаляем их из списка
    if (imagesToDelete) {
      const imagesToRemove = Array.isArray(imagesToDelete)
        ? imagesToDelete
        : [imagesToDelete];
      currentImages = currentImages.filter(
        (img) => !imagesToRemove.includes(img)
      );
    }

    // Если есть список существующих изображений для сохранения, используем его
    if (existingImages) {
      const existingImagesToKeep = Array.isArray(existingImages)
        ? existingImages
        : [existingImages];
      currentImages = existingImagesToKeep;
    }

    // Обрабатываем новые загруженные файлы, если они есть
    let newImageUrls: string[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const files = req.files as Express.Multer.File[];

      // Загружаем новые изображения в Cloudinary
      const uploadPromises = files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "products",
        })
      );
      const uploadedImages = await Promise.all(uploadPromises);

      // Получаем URL новых изображений
      newImageUrls = uploadedImages.map((image) => image.secure_url);

      // Удаляем временные файлы
      files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }

    // Объединяем текущие и новые изображения
    const finalImages = [...currentImages, ...newImageUrls];

    // Преобразуем stock в число
    const stockValue = parseInt(stock);

    // Если сток товара обновился до 0, удаляем его из всех корзин
    if (stockValue === 0) {
      // Находим все элементы корзины с этим продуктом и удаляем их
      await prisma.cartItem.deleteMany({
        where: {
          productId: id,
        },
      });
    }

    // Обновляем продукт
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        description,
        category,
        gender,
        sizes: processedSizes,
        colors: processedColors,
        stock: stockValue,
        price: parseFloat(price),
        discount: parseFloat(discount || "0"),
        images: finalImages,
        soldCount: existingProduct.soldCount,
        rating: existingProduct.rating,
      },
    });

    // В конце функции, перед отправкой ответа, добавляем инвалидацию кеша
    await invalidateProductCache();

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: String(error),
    });
  }
};

// Удаление продукта
export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Проверяем, существует ли продукт
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Удаляем все изображения из Cloudinary
    const cloudinaryImages = existingProduct.images;
    if (cloudinaryImages.length > 0) {
      const deletePromises = cloudinaryImages.map((image) =>
        cloudinary.uploader.destroy(image)
      );
      await Promise.all(deletePromises);
    }

    // Удаляем продукт
    await prisma.product.delete({
      where: { id },
    });

    // Инвалидируем кеш продуктов после удаления
    await invalidateProductCache();

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Получение последних добавленных продуктов
export const getLatestProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : 4;

    const latestProducts = await prisma.product.findMany({
      where: {
        // Добавляем проверку на наличие товара
        stock: {
          gt: 0,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    res.status(200).json({ success: true, latestProducts });
  } catch (error) {
    console.error("Error getting latest products:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Получение продуктов для публичного доступа с пагинацией и фильтрацией
export const getPublicProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Параметры пагинации
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Фильтры
    const searchQuery = req.query.searchQuery as string;
    const category = req.query.category as string;
    const brand = req.query.brand as string;
    const gender = req.query.gender as string;
    const colors = req.query.colors
      ? (req.query.colors as string).split(",")
      : [];
    const sizes = req.query.sizes ? (req.query.sizes as string).split(",") : [];
    const sortBy = (req.query.sortBy as string) || "name";
    const hasDiscount = req.query.hasDiscount === "true";

    // Параметры для фильтрации по цене
    const minPrice = req.query.minPrice
      ? parseInt(req.query.minPrice as string)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseInt(req.query.maxPrice as string)
      : undefined;

    // Формирование запроса
    const where: any = {
      stock: {
        gt: 0,
      },
    };

    // Поиск по имени
    if (searchQuery) {
      where.name = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    // Фильтры по категории, бренду и полу
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (gender) where.gender = gender;

    // Фильтр по цветам (должен содержать хотя бы один из выбранных)
    if (colors.length > 0) {
      where.colors = {
        hasSome: colors,
      };
    }

    // Фильтр по размерам (должен содержать хотя бы один из выбранных)
    if (sizes.length > 0) {
      where.sizes = {
        hasSome: sizes,
      };
    }

    // Фильтры по цене
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};

      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Фильтр по скидкам
    if (hasDiscount) {
      where.discount = {
        gt: 0,
      };
    }

    // Формирование параметров сортировки
    let orderBy: any = {};
    switch (sortBy) {
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "stock":
        orderBy = { stock: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "rating-desc":
        orderBy = { rating: "desc" };
        break;
      case "rating-asc":
        orderBy = { rating: "asc" };
        break;
      case "name":
      default:
        orderBy = { name: "asc" };
        break;
    }

    // Получаем общее количество товаров с учетом фильтров
    const totalProducts = await prisma.product.count({ where });

    // Получаем товары с пагинацией и фильтрацией
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("Error getting public products:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

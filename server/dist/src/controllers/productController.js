"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProducts = exports.getLatestProducts = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const server_1 = require("../server");
const fs_1 = __importDefault(require("fs"));
const redis_1 = require("../config/redis");
// Функция для очистки кеша продуктов
const invalidateProductCache = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Очищаем все ключи, связанные с продуктами
        yield (0, redis_1.deleteCacheByPattern)("products:*");
        // Очищаем кеш последних продуктов
        yield (0, redis_1.deleteCacheByPattern)("latest-products:*");
        console.log("Product cache invalidated");
    }
    catch (error) {
        console.error("Error invalidating product cache:", error);
    }
});
// Создание нового продукта
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    try {
        const { name, brand, description, category, gender, sizes, colors, stock, price, discount, } = req.body;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, error: "No files uploaded" });
            return;
        }
        // Загружаем изображения в Cloudinary
        const uploadPromises = files.map((file) => cloudinary_1.default.uploader.upload(file.path, {
            folder: "products",
        }));
        const uploadedImages = yield Promise.all(uploadPromises);
        const imageUrls = uploadedImages.map((image) => image.secure_url);
        // Создаем новый продукт в базе данных
        const newProduct = yield server_1.prisma.product.create({
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
        yield invalidateProductCache();
        res.status(201).json({ success: true, product: newProduct });
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        // Удаляем изображения из локальной папки в любом случае
        if (files && files.length > 0) {
            files.forEach((file) => {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
        }
    }
});
exports.createProduct = createProduct;
// Получение всех продуктов
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield server_1.prisma.product.findMany();
        res.status(200).json({ success: true, products });
    }
    catch (error) {
        console.error("Error getting products:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getAllProducts = getAllProducts;
// Получение продукта по ID
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const product = yield server_1.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        res.status(200).json({ success: true, product });
    }
    catch (error) {
        console.error("Error getting product by ID:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getProductById = getProductById;
// Обновление продукта
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, brand, description, category, gender, sizes, colors, stock, price, discount, existingImages, imagesToDelete, } = req.body;
        // Проверяем, существует ли продукт
        const existingProduct = yield server_1.prisma.product.findUnique({
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
            currentImages = currentImages.filter((img) => !imagesToRemove.includes(img));
        }
        // Если есть список существующих изображений для сохранения, используем его
        if (existingImages) {
            const existingImagesToKeep = Array.isArray(existingImages)
                ? existingImages
                : [existingImages];
            currentImages = existingImagesToKeep;
        }
        // Обрабатываем новые загруженные файлы, если они есть
        let newImageUrls = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const files = req.files;
            // Загружаем новые изображения в Cloudinary
            const uploadPromises = files.map((file) => cloudinary_1.default.uploader.upload(file.path, {
                folder: "products",
            }));
            const uploadedImages = yield Promise.all(uploadPromises);
            // Получаем URL новых изображений
            newImageUrls = uploadedImages.map((image) => image.secure_url);
            // Удаляем временные файлы
            files.forEach((file) => {
                fs_1.default.unlinkSync(file.path);
            });
        }
        // Объединяем текущие и новые изображения
        const finalImages = [...currentImages, ...newImageUrls];
        // Преобразуем stock в число
        const stockValue = parseInt(stock);
        // Если сток товара обновился до 0, удаляем его из всех корзин
        if (stockValue === 0) {
            // Находим все элементы корзины с этим продуктом и удаляем их
            yield server_1.prisma.cartItem.deleteMany({
                where: {
                    productId: id,
                },
            });
        }
        // Обновляем продукт
        const updatedProduct = yield server_1.prisma.product.update({
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
        yield invalidateProductCache();
        res.status(200).json({ success: true, product: updatedProduct });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: String(error),
        });
    }
});
exports.updateProduct = updateProduct;
// Удаление продукта
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Проверяем, существует ли продукт
        const existingProduct = yield server_1.prisma.product.findUnique({
            where: { id },
        });
        if (!existingProduct) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Удаляем все изображения из Cloudinary
        const cloudinaryImages = existingProduct.images;
        if (cloudinaryImages.length > 0) {
            const deletePromises = cloudinaryImages.map((image) => cloudinary_1.default.uploader.destroy(image));
            yield Promise.all(deletePromises);
        }
        // Удаляем продукт
        yield server_1.prisma.product.delete({
            where: { id },
        });
        // Инвалидируем кеш продуктов после удаления
        yield invalidateProductCache();
        res.status(200).json({ success: true, message: "Product deleted" });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.deleteProduct = deleteProduct;
// Получение последних добавленных продуктов
const getLatestProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limitParam = req.query.limit;
        const limit = limitParam ? parseInt(limitParam) : 4;
        const latestProducts = yield server_1.prisma.product.findMany({
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
    }
    catch (error) {
        console.error("Error getting latest products:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getLatestProducts = getLatestProducts;
// Получение продуктов для публичного доступа с пагинацией и фильтрацией
const getPublicProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Параметры пагинации
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        // Фильтры
        const searchQuery = req.query.searchQuery;
        const category = req.query.category;
        const brand = req.query.brand;
        const gender = req.query.gender;
        const colors = req.query.colors
            ? req.query.colors.split(",")
            : [];
        const sizes = req.query.sizes ? req.query.sizes.split(",") : [];
        const sortBy = req.query.sortBy || "name";
        const hasDiscount = req.query.hasDiscount === "true";
        // Параметры для фильтрации по цене
        const minPrice = req.query.minPrice
            ? parseInt(req.query.minPrice)
            : undefined;
        const maxPrice = req.query.maxPrice
            ? parseInt(req.query.maxPrice)
            : undefined;
        // Формирование запроса
        const where = {
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
        if (category)
            where.category = category;
        if (brand)
            where.brand = brand;
        if (gender)
            where.gender = gender;
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
        let orderBy = {};
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
        const totalProducts = yield server_1.prisma.product.count({ where });
        // Получаем товары с пагинацией и фильтрацией
        const products = yield server_1.prisma.product.findMany({
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
    }
    catch (error) {
        console.error("Error getting public products:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getPublicProducts = getPublicProducts;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const cacheMiddleware_1 = require("../middleware/cacheMiddleware");
const router = (0, express_1.Router)();
// Настройки времени жизни кеша
const CACHE_TTL = {
    PUBLIC_PRODUCTS: 5 * 60, // 5 минут
    LATEST_PRODUCTS: 10 * 60, // 10 минут
};
router.post("/create", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.default.array("images", 5), productController_1.createProduct);
router.get("/get", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, productController_1.getAllProducts);
// Публичный маршрут для получения товаров с пагинацией + кеширование
router.get("/public", (0, cacheMiddleware_1.cacheMiddleware)(CACHE_TTL.PUBLIC_PRODUCTS, cacheMiddleware_1.productCacheKeyGenerator), productController_1.getPublicProducts);
router.get("/get/:id", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, productController_1.getProductById);
router.put("/update/:id", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.default.array("images", 5), productController_1.updateProduct);
router.delete("/delete/:id", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, productController_1.deleteProduct);
// Публичный маршрут - не требует аутентификации и CSRF защиты + кеширование
router.get("/latest", (0, cacheMiddleware_1.cacheMiddleware)(CACHE_TTL.LATEST_PRODUCTS, cacheMiddleware_1.latestProductsCacheKeyGenerator), productController_1.getLatestProducts);
exports.default = router;

import { Router } from "express";
import upload from "../middleware/uploadMiddleware";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getLatestProducts,
  getProductById,
  updateProduct,
  getPublicProducts,
} from "../controllers/productController";
import {
  authenticateToken,
  isSuperAdmin,
  csrfProtection,
} from "../middleware/authMiddleware";
import {
  cacheMiddleware,
  productCacheKeyGenerator,
  latestProductsCacheKeyGenerator,
} from "../middleware/cacheMiddleware";

const router = Router();

// Настройки времени жизни кеша
const CACHE_TTL = {
  PUBLIC_PRODUCTS: 5 * 60, // 5 минут
  LATEST_PRODUCTS: 10 * 60, // 10 минут
};

router.post(
  "/create",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  upload.array("images", 5),
  createProduct
);

router.get(
  "/get",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  getAllProducts
);

// Публичный маршрут для получения товаров с пагинацией + кеширование
router.get(
  "/public",
  cacheMiddleware(CACHE_TTL.PUBLIC_PRODUCTS, productCacheKeyGenerator),
  getPublicProducts
);

router.get("/get/:id", authenticateToken, csrfProtection, getProductById);

router.put(
  "/update/:id",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  upload.array("images", 5),
  updateProduct
);

router.delete(
  "/delete/:id",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  deleteProduct
);

// Публичный маршрут - не требует аутентификации и CSRF защиты + кеширование
router.get(
  "/latest",
  cacheMiddleware(CACHE_TTL.LATEST_PRODUCTS, latestProductsCacheKeyGenerator),
  getLatestProducts
);

export default router;

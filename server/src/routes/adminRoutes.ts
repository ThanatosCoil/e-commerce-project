import { Router } from "express";
import {
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
} from "../middleware/authMiddleware";
import {
  getKeysByPattern,
  getCacheValue,
  getKeyTTL,
  getCacheStats,
  clearAllCache,
} from "../utils/cacheMonitor";
import { Request, Response } from "express";

const router = Router();

// Только суперадмины имеют доступ к этим маршрутам
router.use(authenticateToken, csrfProtection, isSuperAdmin);

// Получение статистики кеша
router.get(
  "/cache-stats",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await getCacheStats();
      res.status(200).json({ success: true, stats });
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Получение списка ключей по паттерну
router.get(
  "/cache-keys",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const pattern = (req.query.pattern as string) || "*";
      const keys = await getKeysByPattern(pattern);
      res.status(200).json({ success: true, keys });
    } catch (error) {
      console.error("Error fetching cache keys:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Получение значения кеша по ключу
router.get(
  "/cache-value",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ success: false, message: "Key is required" });
        return;
      }

      const value = await getCacheValue(key);
      const ttl = await getKeyTTL(key);

      res.status(200).json({
        success: true,
        key,
        value,
        ttl,
        exists: value !== null,
      });
    } catch (error) {
      console.error("Error fetching cache value:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Очистка всего кеша
router.post(
  "/clear-cache",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await clearAllCache();
      res
        .status(200)
        .json({ success: true, message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

export default router;

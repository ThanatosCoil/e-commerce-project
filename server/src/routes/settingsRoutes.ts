import { Router } from "express";

import {
  authenticateToken,
  isSuperAdmin,
  csrfProtection,
} from "../middleware/authMiddleware";
import {
  addFeatureBanners,
  getFeatureBanners,
  updateFeaturedProduct,
  getFeaturedProduct,
  deleteFeatureBanner,
  updateBannerOrder,
} from "../controllers/settingsController";
import upload from "../middleware/uploadMiddleware";

const router = Router();

router.post(
  "/banners",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  upload.array("images", 5),
  addFeatureBanners
);
router.get("/banners", authenticateToken, csrfProtection, getFeatureBanners);
router.delete(
  "/banners/:id",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  deleteFeatureBanner
);
router.post(
  "/banners/order",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  updateBannerOrder
);
router.post(
  "/featured",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  updateFeaturedProduct
);
router.get("/featured", authenticateToken, csrfProtection, getFeaturedProduct);

export default router;

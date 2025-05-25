"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const settingsController_1 = require("../controllers/settingsController");
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
const router = (0, express_1.Router)();
router.post("/banners", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.default.array("images", 5), settingsController_1.addFeatureBanners);
router.get("/banners", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, settingsController_1.getFeatureBanners);
router.delete("/banners/:id", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, settingsController_1.deleteFeatureBanner);
router.post("/banners/order", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, settingsController_1.updateBannerOrder);
router.post("/featured", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, settingsController_1.updateFeaturedProduct);
router.get("/featured", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, settingsController_1.getFeaturedProduct);
exports.default = router;

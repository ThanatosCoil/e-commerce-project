"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
// Маршруты для отзывов
router.post("/", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, reviewController_1.createOrUpdateReview);
// Публичный маршрут, не требующий аутентификации и CSRF защиты
router.get("/product/:productId", reviewController_1.getProductReviews);
router.get("/user/:productId", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, reviewController_1.getUserReview);
router.delete("/:reviewId", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, reviewController_1.deleteReview);
// Маршруты для голосов
router.post("/:reviewId/vote", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, reviewController_1.voteReview);
router.get("/:reviewId/vote", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, reviewController_1.getUserVote);
router.delete("/:reviewId/vote", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, reviewController_1.deleteVote);
exports.default = router;

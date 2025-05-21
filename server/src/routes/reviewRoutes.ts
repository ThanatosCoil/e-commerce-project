import { Router } from "express";
import {
  authenticateToken,
  csrfProtection,
} from "../middleware/authMiddleware";
import {
  createOrUpdateReview,
  getProductReviews,
  getUserReview,
  deleteReview,
  voteReview,
  getUserVote,
  deleteVote,
} from "../controllers/reviewController";

const router = Router();

// Маршруты для отзывов
router.post("/", authenticateToken, csrfProtection, createOrUpdateReview);
// Публичный маршрут, не требующий аутентификации и CSRF защиты
router.get("/product/:productId", getProductReviews);
router.get(
  "/user/:productId",
  authenticateToken,
  csrfProtection,
  getUserReview
);
router.delete("/:reviewId", authenticateToken, csrfProtection, deleteReview);

// Маршруты для голосов
router.post("/:reviewId/vote", authenticateToken, csrfProtection, voteReview);
router.get("/:reviewId/vote", authenticateToken, csrfProtection, getUserVote);
router.delete("/:reviewId/vote", authenticateToken, csrfProtection, deleteVote);

export default router;

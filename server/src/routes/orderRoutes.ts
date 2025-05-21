import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  createPaymentIntent,
  updatePaymentStatus,
  handleStripeWebhook,
  updateOrderStatus,
  getAllOrders,
} from "../controllers/orderController";
import {
  authenticateToken,
  isSuperAdmin,
  csrfProtection,
} from "../middleware/authMiddleware";
import bodyParser from "body-parser";

const router = express.Router();

// Маршруты, требующие аутентификации и CSRF защиты
router.post("/create", authenticateToken, csrfProtection, createOrder);
router.get("/", authenticateToken, csrfProtection, getUserOrders);
router.get("/:id", authenticateToken, csrfProtection, getOrderById);
router.post(
  "/payment-intent",
  authenticateToken,
  csrfProtection,
  createPaymentIntent
);
router.put(
  "/payment-status/:orderId",
  authenticateToken,
  csrfProtection,
  updatePaymentStatus
);
router.put(
  "/status/:orderId",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  updateOrderStatus
);

// Специальный маршрут для администратора (получение всех заказов)
router.get(
  "/admin/all",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  getAllOrders
);

// Маршрут для вебхука Stripe (не требует аутентификации и CSRF защиты)
// Webhook от Stripe не использует cookies и заголовки CSRF, поэтому не добавляем middleware
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;

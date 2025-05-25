"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const body_parser_1 = __importDefault(require("body-parser"));
const router = express_1.default.Router();
// Маршруты, требующие аутентификации и CSRF защиты
router.post("/create", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, orderController_1.createOrder);
router.get("/", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, orderController_1.getUserOrders);
router.get("/:id", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, orderController_1.getOrderById);
router.post("/payment-intent", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, orderController_1.createPaymentIntent);
router.put("/payment-status/:orderId", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, orderController_1.updatePaymentStatus);
router.put("/status/:orderId", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, orderController_1.updateOrderStatus);
// Специальный маршрут для администратора (получение всех заказов)
router.get("/admin/all", authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin, orderController_1.getAllOrders);
// Маршрут для вебхука Stripe (не требует аутентификации и CSRF защиты)
// Webhook от Stripe не использует cookies и заголовки CSRF, поэтому не добавляем middleware
router.post("/webhook", body_parser_1.default.raw({ type: "application/json" }), orderController_1.handleStripeWebhook);
exports.default = router;

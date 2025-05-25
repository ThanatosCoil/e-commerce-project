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
exports.getAllOrders = exports.handleStripeWebhook = exports.updateOrderStatus = exports.updatePaymentStatus = exports.createPaymentIntent = exports.getOrderById = exports.getUserOrders = exports.createOrder = void 0;
const server_1 = require("../server");
const stripe_1 = __importDefault(require("stripe"));
const redis_1 = require("../config/redis");
// Инициализация Stripe с секретным ключом
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "secret_key", {
    apiVersion: "2025-04-30.basil",
});
// Создание нового заказа
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { addressId, paymentMethod, couponId, paymentIntentId, total } = req.body;
        // Проверка на наличие обязательных полей
        if (!addressId || !paymentMethod) {
            res.status(400).json({
                success: false,
                message: "Address ID and payment method are required",
            });
            return;
        }
        // Получаем корзину пользователя
        const cart = yield server_1.prisma.cart.findUnique({
            where: { userId },
            include: { items: true },
        });
        if (!cart || cart.items.length === 0) {
            res.status(400).json({ success: false, message: "Cart is empty" });
            return;
        }
        // Получаем информацию о товарах для создания элементов заказа
        const cartItemsWithProducts = yield Promise.all(cart.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield server_1.prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                    name: true,
                    price: true,
                    discount: true,
                    category: true,
                    stock: true,
                },
            });
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            // Проверка на наличие достаточного количества товара
            if (product.stock < item.quantity) {
                throw new Error(`Not enough stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
            }
            return {
                item,
                product,
            };
        })));
        // Находим купон по коду, если он предоставлен
        let coupon = undefined;
        if (couponId) {
            try {
                coupon = yield server_1.prisma.coupon.findFirst({
                    where: { code: couponId },
                });
            }
            catch (couponError) {
                console.error("Error finding coupon:", couponError);
            }
        }
        // Создаем заказ
        const order = yield server_1.prisma.order.create({
            data: {
                userId,
                addressId,
                paymentMethod,
                couponId: (coupon === null || coupon === void 0 ? void 0 : coupon.id) || undefined,
                total,
                paymentId: paymentIntentId || null,
                status: "PENDING",
                paymentStatus: paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PENDING",
                items: {
                    create: cartItemsWithProducts.map(({ item, product }) => ({
                        productId: item.productId,
                        productName: product.name,
                        productCategory: product.category,
                        quantity: item.quantity,
                        size: item.size,
                        color: item.color,
                        price: product.price,
                        discount: product.discount,
                    })),
                },
            },
        });
        // Обновляем остаток товаров
        yield Promise.all(cartItemsWithProducts.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ item, product }) {
            yield server_1.prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: product.stock - item.quantity,
                    soldCount: { increment: item.quantity },
                },
            });
        })));
        // Обновляем использование купона, если он был найден
        if (coupon) {
            try {
                yield server_1.prisma.coupon.update({
                    where: { id: coupon.id },
                    data: {
                        usageCount: { increment: 1 },
                    },
                });
            }
            catch (couponError) {
                console.error("Error updating coupon usage:", couponError);
                // Не выбрасываем ошибку, чтобы не прерывать создание заказа
            }
        }
        // Очищаем корзину после успешного создания заказа
        yield server_1.prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
        // Инвалидируем кеш продуктов после создания заказа
        try {
            yield (0, redis_1.deleteCacheByPattern)("products:*");
            yield (0, redis_1.deleteCacheByPattern)("latest-products:*");
            console.log("Product cache invalidated after order creation");
        }
        catch (error) {
            console.error("Error invalidating product cache:", error);
        }
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            orderId: order.id,
        });
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
});
exports.createOrder = createOrder;
// Получение всех заказов пользователя
const getUserOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const orders = yield server_1.prisma.order.findMany({
            where: { userId },
            include: {
                items: true,
                address: true,
                coupon: {
                    select: {
                        code: true,
                        discount: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ success: true, orders });
    }
    catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getUserOrders = getUserOrders;
// Получение информации о конкретном заказе
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Проверяем роль пользователя
        const user = yield server_1.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        // Определяем условие поиска в зависимости от роли
        const whereCondition = (user === null || user === void 0 ? void 0 : user.role) === "SUPER_ADMIN"
            ? { id } // Для админа - только по ID заказа
            : { id, userId }; // Для обычного пользователя - по ID заказа и ID пользователя
        // Определяем включаемые связи в зависимости от роли
        const includeRelations = Object.assign({ items: true, address: true, coupon: {
                select: {
                    code: true,
                    discount: true,
                },
            } }, ((user === null || user === void 0 ? void 0 : user.role) === "SUPER_ADMIN"
            ? {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            }
            : {}));
        const order = yield server_1.prisma.order.findFirst({
            where: whereCondition,
            include: includeRelations,
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        res.status(200).json({ success: true, order });
    }
    catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getOrderById = getOrderById;
// Создание Stripe Payment Intent
const createPaymentIntent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { amount } = req.body;
        // Проверка суммы
        if (!amount || amount <= 0) {
            res.status(400).json({
                success: false,
                message: "Valid amount is required",
            });
            return;
        }
        // Создаем payment intent через Stripe
        const paymentIntent = yield stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Конвертация в центы
            currency: "usd",
            metadata: {
                userId,
            },
        });
        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.createPaymentIntent = createPaymentIntent;
// Обновление статуса оплаты заказа
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const isSuperAdminUser = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "SUPER_ADMIN";
        const { orderId } = req.params;
        const { paymentIntentId, status } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Проверяем существование заказа
        // Для супер-админа мы не проверяем принадлежность заказа пользователю
        let orderQuery = { id: orderId };
        if (!isSuperAdminUser) {
            orderQuery.userId = userId; // Для обычных пользователей проверяем принадлежность
        }
        const order = yield server_1.prisma.order.findFirst({
            where: orderQuery,
        });
        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found or you don't have permission to update it",
            });
            return;
        }
        // Проверка допустимости статуса
        const validStatuses = ["SUCCESS", "FAILED"];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid payment status provided. Must be 'SUCCESS' or 'FAILED'",
            });
            return;
        }
        // Обновляем статус оплаты
        yield server_1.prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: status,
                paymentId: paymentIntentId,
                paymentDate: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            message: `Payment status updated to ${status}`,
        });
    }
    catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
// Обновление статуса заказа
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { orderId } = req.params;
        const { status } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Проверяем существование заказа
        const order = yield server_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }, // Включаем элементы заказа для обработки отмены
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        // Проверка допустимости статуса
        const validStatuses = [
            "PENDING",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELED",
        ];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid status provided",
            });
            return;
        }
        // Если заказ отменяется, возвращаем товары на склад
        if (status === "CANCELED" && order.status !== "CANCELED") {
            // Возвращаем товары на склад
            yield Promise.all(order.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                yield server_1.prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        soldCount: { decrement: item.quantity },
                    },
                });
            })));
            // Инвалидируем кеш продуктов после возврата товаров на склад
            try {
                yield (0, redis_1.deleteCacheByPattern)("products:*");
                yield (0, redis_1.deleteCacheByPattern)("latest-products:*");
                console.log("Product cache invalidated after order cancellation");
            }
            catch (error) {
                console.error("Error invalidating product cache:", error);
            }
        }
        // Обновляем статус заказа
        yield server_1.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
        });
    }
    catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.updateOrderStatus = updateOrderStatus;
// Обработка webhook от Stripe
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
        // Обработка различных событий Stripe
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object;
                // Обработка успешного платежа
                yield handleSuccessfulPayment(paymentIntent);
                break;
            case "payment_intent.payment_failed":
                const failedPayment = event.data.object;
                // Обработка неудачного платежа
                yield handleFailedPayment(failedPayment);
                break;
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Webhook error:", error);
        res.status(400).json({ success: false, message: "Webhook error" });
    }
});
exports.handleStripeWebhook = handleStripeWebhook;
// Вспомогательная функция для обработки успешного платежа
const handleSuccessfulPayment = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = paymentIntent.id;
        // Обновляем статус заказа, связанного с этим платежом
        yield server_1.prisma.order.updateMany({
            where: { paymentId },
            data: {
                paymentStatus: "SUCCESS",
                status: "PROCESSING", // Переводим заказ в статус "Обрабатывается"
            },
        });
        // Инвалидируем кеш продуктов после успешной оплаты
        try {
            yield (0, redis_1.deleteCacheByPattern)("products:*");
            yield (0, redis_1.deleteCacheByPattern)("latest-products:*");
            console.log("Product cache invalidated after successful payment");
        }
        catch (error) {
            console.error("Error invalidating product cache:", error);
        }
    }
    catch (error) {
        console.error("Error handling successful payment:", error);
    }
});
// Вспомогательная функция для обработки неудачного платежа
const handleFailedPayment = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = paymentIntent.id;
        // Получаем информацию о заказе
        const order = yield server_1.prisma.order.findFirst({
            where: { paymentId },
            include: { items: true },
        });
        // Если заказ найден, обновляем его статус
        if (order) {
            // Обновляем статус заказа
            yield server_1.prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: "FAILED",
                },
            });
            // Если заказ был создан, но оплата не прошла, возможно, потребуется
            // вернуть товары на склад в зависимости от бизнес-логики
            // Инвалидируем кеш продуктов после неудачной оплаты
            try {
                yield (0, redis_1.deleteCacheByPattern)("products:*");
                yield (0, redis_1.deleteCacheByPattern)("latest-products:*");
                console.log("Product cache invalidated after failed payment");
            }
            catch (error) {
                console.error("Error invalidating product cache:", error);
            }
        }
    }
    catch (error) {
        console.error("Error handling failed payment:", error);
    }
});
// Получение всех заказов (только для администратора)
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Получаем все заказы без фильтрации по userId
        const orders = yield server_1.prisma.order.findMany({
            include: {
                items: true,
                address: true,
                coupon: {
                    select: {
                        code: true,
                        discount: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ success: true, orders });
    }
    catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getAllOrders = getAllOrders;

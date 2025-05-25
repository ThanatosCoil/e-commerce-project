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
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.updateCartItemQuantity = exports.removeFromCart = exports.getCart = exports.addToCart = void 0;
const server_1 = require("../server");
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { productId, quantity, size, color } = req.body;
        // Получаем информацию о товаре
        const product = yield server_1.prisma.product.findUnique({
            where: {
                id: productId,
            },
            select: {
                id: true,
                name: true,
                price: true,
                discount: true,
                images: true,
                stock: true,
                sizes: true,
                colors: true,
            },
        });
        // Проверяем существование товара
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Проверяем, что указанные размер и цвет доступны для этого товара
        if (size && !product.sizes.includes(size)) {
            res.status(400).json({
                success: false,
                message: `Size "${size}" is not available for this product`,
            });
            return;
        }
        if (color && !product.colors.includes(color)) {
            res.status(400).json({
                success: false,
                message: `Color "${color}" is not available for this product`,
            });
            return;
        }
        // Проверяем наличие товара в стоке
        if (product.stock <= 0) {
            res
                .status(400)
                .json({ success: false, message: "Product is out of stock" });
            return;
        }
        // Получаем существующую корзину пользователя
        const cart = yield server_1.prisma.cart.upsert({
            where: {
                userId,
            },
            create: {
                userId,
            },
            update: {},
            include: {
                items: {
                    where: {
                        productId,
                    },
                },
            },
        });
        // Находим текущий элемент в корзине с такими же параметрами (если есть)
        const existingCartItem = cart.items.find((item) => item.productId === productId &&
            item.size === size &&
            item.color === color);
        // Рассчитываем новое количество для этого конкретного варианта товара
        const newQuantityForVariant = existingCartItem
            ? existingCartItem.quantity + quantity
            : quantity;
        // Подсчитываем ОБЩЕЕ количество товара в корзине пользователя (все размеры и цвета)
        // исключая текущий вариант (его мы учтем отдельно с новым количеством)
        const itemsOfSameProduct = cart.items.filter((item) => item.productId === productId &&
            !(item.size === size && item.color === color));
        const totalQuantityInCart = itemsOfSameProduct.reduce((sum, item) => sum + item.quantity, 0) +
            newQuantityForVariant;
        // Проверяем, не превышает ли общее количество товара в корзине доступный сток
        if (totalQuantityInCart > product.stock) {
            res.status(400).json({
                success: false,
                message: `Cannot add ${quantity} more items. This would exceed available stock of ${product.stock}. You already have ${totalQuantityInCart - newQuantityForVariant} in your cart across all sizes and colors.`,
            });
            return;
        }
        // После всех проверок, добавляем товар в корзину
        const cartItem = yield server_1.prisma.cartItem.upsert({
            where: {
                cartId_productId_size_color: {
                    cartId: cart.id,
                    productId,
                    size: size || null,
                    color: color || null,
                },
            },
            create: {
                cartId: cart.id,
                productId,
                quantity,
                size: size,
                color: color,
            },
            update: {
                quantity: { increment: quantity },
            },
        });
        const responseItem = {
            id: cartItem.id,
            productId: cartItem.productId,
            name: product.name,
            price: product.price,
            discount: product.discount,
            image: product.images[0],
            quantity: cartItem.quantity,
            size: cartItem.size,
            color: cartItem.color,
            stock: product.stock,
            availableStock: product.stock - (totalQuantityInCart - cartItem.quantity),
        };
        res.status(200).json({
            success: true,
            message: "Item added to cart",
            data: responseItem,
        });
    }
    catch (error) {
        console.error("Error adding to cart", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.addToCart = addToCart;
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const cart = yield server_1.prisma.cart.findUnique({
            where: {
                userId,
            },
            include: {
                items: true,
            },
        });
        if (!cart) {
            res
                .status(200)
                .json({ success: true, message: "Cart is empty", data: [] });
            return;
        }
        // Получаем информацию о всех продуктах в корзине
        const productIds = [...new Set(cart.items.map((item) => item.productId))];
        const products = yield server_1.prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                name: true,
                price: true,
                discount: true,
                images: true,
                stock: true,
            },
        });
        // Создаем карту продуктов для быстрого доступа
        const productsMap = products.reduce((map, product) => {
            map[product.id] = product;
            return map;
        }, {});
        // Группируем элементы корзины по productId для подсчета общего количества
        const quantityByProductId = cart.items.reduce((map, item) => {
            if (!map[item.productId]) {
                map[item.productId] = 0;
            }
            map[item.productId] += item.quantity;
            return map;
        }, {});
        // Формируем обогащенные данные корзины
        const cartItemsWithProducts = cart.items.map((item) => {
            const product = productsMap[item.productId];
            const totalQuantityOfProduct = quantityByProductId[item.productId];
            const otherQuantityOfProduct = totalQuantityOfProduct - item.quantity;
            return {
                id: item.id,
                productId: item.productId,
                name: product === null || product === void 0 ? void 0 : product.name,
                image: product === null || product === void 0 ? void 0 : product.images[0],
                price: product === null || product === void 0 ? void 0 : product.price,
                discount: product === null || product === void 0 ? void 0 : product.discount,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                stock: (product === null || product === void 0 ? void 0 : product.stock) || 0,
                availableStock: ((product === null || product === void 0 ? void 0 : product.stock) || 0) - otherQuantityOfProduct,
                createdAt: item.createdAt,
            };
        });
        res.status(200).json({
            success: true,
            message: "Cart items fetched successfully",
            data: cartItemsWithProducts,
        });
    }
    catch (error) {
        console.error("Error getting cart", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getCart = getCart;
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        yield server_1.prisma.cartItem.delete({
            where: {
                id: req.params.id,
                cart: {
                    userId,
                },
            },
        });
        res.status(200).json({ success: true, message: "Item removed from cart" });
    }
    catch (error) {
        console.error("Error removing from cart", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.removeFromCart = removeFromCart;
const updateCartItemQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const newQuantity = req.body.quantity;
        if (newQuantity <= 0) {
            res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
            return;
        }
        // Сначала находим текущий элемент корзины для проверки
        const cartItem = yield server_1.prisma.cartItem.findFirst({
            where: {
                id: req.params.id,
                cart: {
                    userId,
                },
            },
            include: {
                cart: {
                    include: {
                        items: true,
                    },
                },
            },
        });
        if (!cartItem) {
            res.status(404).json({ success: false, message: "Cart item not found" });
            return;
        }
        // Получаем информацию о товаре
        const product = yield server_1.prisma.product.findUnique({
            where: {
                id: cartItem.productId,
            },
            select: {
                id: true,
                name: true,
                price: true,
                discount: true,
                images: true,
                stock: true,
            },
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Если товара больше нет в наличии
        if (product.stock <= 0) {
            res
                .status(400)
                .json({ success: false, message: "Product is out of stock" });
            return;
        }
        // Подсчитываем общее количество товара в корзине пользователя (все размеры и цвета)
        // исключая текущий элемент (его мы учтем отдельно с новым количеством)
        const itemsOfSameProduct = cartItem.cart.items.filter((item) => item.productId === cartItem.productId && item.id !== cartItem.id);
        const otherQuantityInCart = itemsOfSameProduct.reduce((sum, item) => sum + item.quantity, 0);
        // Проверяем, не превышает ли новое общее количество доступный сток
        const totalRequestedQuantity = otherQuantityInCart + newQuantity;
        if (totalRequestedQuantity > product.stock) {
            res.status(400).json({
                success: false,
                message: `Cannot update to ${newQuantity} items. This would exceed available stock of ${product.stock}. You have ${otherQuantityInCart} of this product in other variations.`,
                availableQuantity: product.stock - otherQuantityInCart,
            });
            return;
        }
        // Обновляем количество товара в корзине
        const updatedCartItem = yield server_1.prisma.cartItem.update({
            where: {
                id: req.params.id,
            },
            data: {
                quantity: newQuantity,
            },
        });
        const responseItem = {
            id: updatedCartItem.id,
            productId: updatedCartItem.productId,
            name: product.name,
            image: product.images[0],
            price: product.price,
            discount: product.discount,
            quantity: updatedCartItem.quantity,
            size: updatedCartItem.size,
            color: updatedCartItem.color,
            stock: product.stock,
            availableStock: product.stock - otherQuantityInCart,
        };
        res.status(200).json({
            success: true,
            message: "Cart item quantity updated",
            data: responseItem,
        });
    }
    catch (error) {
        console.error("Error updating cart item quantity", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.updateCartItemQuantity = updateCartItemQuantity;
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        yield server_1.prisma.cartItem.deleteMany({
            where: {
                cart: {
                    userId,
                },
            },
        });
        res.status(200).json({ success: true, message: "Cart cleared" });
    }
    catch (error) {
        console.error("Error clearing cart", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.clearCart = clearCart;

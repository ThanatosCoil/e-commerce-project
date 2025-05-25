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
exports.deleteAddress = exports.updateAddress = exports.getAddresses = exports.createAddress = void 0;
const server_1 = require("../server");
const createAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { name, address, country, city, zipCode, phone, isDefault } = req.body;
        if (isDefault) {
            yield server_1.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const newAddress = yield server_1.prisma.address.create({
            data: {
                userId,
                name,
                address,
                country,
                city,
                zipCode,
                phone,
                isDefault: isDefault || false,
            },
        });
        res.status(201).json({ success: true, address: newAddress });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.createAddress = createAddress;
const getAddresses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const addresses = yield server_1.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: "desc" },
        });
        res.status(200).json({ success: true, address: addresses });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getAddresses = getAddresses;
const updateAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const existingAddress = yield server_1.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existingAddress) {
            res.status(404).json({ success: false, message: "Address not found" });
            return;
        }
        const { name, address, country, city, zipCode, phone, isDefault } = req.body;
        if (isDefault) {
            yield server_1.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const updatedAddress = yield server_1.prisma.address.update({
            where: { id },
            data: {
                name,
                address,
                country,
                city,
                zipCode,
                phone,
                isDefault: isDefault || false,
            },
        });
        res.status(200).json({ success: true, address: updatedAddress });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.updateAddress = updateAddress;
const deleteAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const existingAddress = yield server_1.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existingAddress) {
            res.status(404).json({ success: false, message: "Address not found" });
            return;
        }
        // Проверяем, связан ли адрес с заказами
        const ordersWithAddress = yield server_1.prisma.order.findFirst({
            where: { addressId: id },
        });
        if (ordersWithAddress) {
            res.status(400).json({
                success: false,
                message: "This address cannot be deleted because it is used in orders",
            });
            return;
        }
        yield server_1.prisma.address.delete({
            where: { id },
        });
        res.status(200).json({ success: true, message: "Address deleted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.deleteAddress = deleteAddress;

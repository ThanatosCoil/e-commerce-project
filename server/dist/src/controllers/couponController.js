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
exports.validateCoupon = exports.deleteCoupon = exports.getAllCoupons = exports.createCoupon = void 0;
const server_1 = require("../server");
const createCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discount, startDate, endDate, usageLimit } = req.body;
        const newCoupon = yield server_1.prisma.coupon.create({
            data: {
                code,
                discount,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                usageLimit: parseInt(usageLimit),
                usageCount: 0,
            },
        });
        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon: newCoupon,
        });
    }
    catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.createCoupon = createCoupon;
const getAllCoupons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coupons = yield server_1.prisma.coupon.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            success: true,
            message: "Coupons fetched successfully",
            coupons,
        });
    }
    catch (error) {
        console.error("Error getting all coupons:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getAllCoupons = getAllCoupons;
const deleteCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield server_1.prisma.coupon.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully",
            id,
        });
    }
    catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.deleteCoupon = deleteCoupon;
const validateCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code } = req.params;
        if (!code) {
            res.status(400).json({
                success: false,
                valid: false,
                message: "Coupon code is required",
            });
            return;
        }
        const coupon = yield server_1.prisma.coupon.findFirst({
            where: {
                code,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
                usageCount: { lt: server_1.prisma.coupon.fields.usageLimit },
            },
        });
        if (!coupon) {
            res.status(200).json({
                success: true,
                valid: false,
                message: "Invalid or expired coupon",
            });
            return;
        }
        res.status(200).json({
            success: true,
            valid: true,
            message: "Coupon is valid",
            discount: coupon.discount,
        });
    }
    catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({
            success: false,
            valid: false,
            message: "Internal server error",
        });
    }
});
exports.validateCoupon = validateCoupon;

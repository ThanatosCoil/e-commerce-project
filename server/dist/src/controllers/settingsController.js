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
exports.updateFeaturedProduct = exports.getFeaturedProduct = exports.updateBannerOrder = exports.deleteFeatureBanner = exports.getFeatureBanners = exports.addFeatureBanners = void 0;
const server_1 = require("../server");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const fs_1 = __importDefault(require("fs"));
const addFeatureBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, error: "No files uploaded" });
            return;
        }
        const uploadPromises = files.map((file) => cloudinary_1.default.uploader.upload(file.path, {
            folder: "feature-banners",
        }));
        const uploadedImages = yield Promise.all(uploadPromises);
        const banners = yield Promise.all(uploadedImages.map((image) => server_1.prisma.featureBanner.create({
            data: { imageUrl: image.secure_url },
        })));
        files.forEach((file) => {
            fs_1.default.unlinkSync(file.path);
        });
        res.status(200).json({ success: true, banners });
    }
    catch (error) {
        console.error("Error adding feature banner:", error);
        res.status(500).json({ error: "Failed to add feature banner" });
    }
});
exports.addFeatureBanners = addFeatureBanners;
const getFeatureBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banners = yield server_1.prisma.featureBanner.findMany({
            orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        });
        res.status(200).json({ success: true, banners });
    }
    catch (error) {
        console.error("Error getting feature banners:", error);
        res.status(500).json({ error: "Failed to get feature banners" });
    }
});
exports.getFeatureBanners = getFeatureBanners;
const deleteFeatureBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield server_1.prisma.featureBanner.delete({
            where: { id },
        });
        res.status(200).json({ success: true, message: "Feature banner deleted" });
    }
    catch (error) {
        console.error("Error deleting feature banner:", error);
        res.status(500).json({ error: "Failed to delete feature banner" });
    }
});
exports.deleteFeatureBanner = deleteFeatureBanner;
const updateBannerOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bannerOrder } = req.body;
        if (!Array.isArray(bannerOrder)) {
            res.status(400).json({
                success: false,
                error: "Invalid banner order data",
            });
            return;
        }
        // Обновляем порядок отображения для каждого баннера
        for (const item of bannerOrder) {
            yield server_1.prisma.featureBanner.update({
                where: { id: item.id },
                data: { displayOrder: item.order },
            });
        }
        res.status(200).json({
            success: true,
            message: "Banner order updated successfully",
        });
    }
    catch (error) {
        console.error("Error updating banner order:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update banner order",
        });
    }
});
exports.updateBannerOrder = updateBannerOrder;
const getFeaturedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const featuredProducts = yield server_1.prisma.product.findMany({
            where: {
                isFeatured: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({ success: true, featuredProducts });
    }
    catch (error) {
        console.error("Error getting featured products:", error);
        res.status(500).json({ error: "Failed to get featured products" });
    }
});
exports.getFeaturedProduct = getFeaturedProduct;
const updateFeaturedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length > 8) {
            res.status(400).json({
                success: false,
                error: "Invalid product IDs or too many requested",
            });
            return;
        }
        yield server_1.prisma.product.updateMany({
            data: { isFeatured: false },
        });
        yield server_1.prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { isFeatured: true },
        });
        res
            .status(200)
            .json({ success: true, message: "Featured products updated" });
    }
    catch (error) {
        console.error("Error updating featured products:", error);
        res.status(500).json({ error: "Failed to update featured products" });
    }
});
exports.updateFeaturedProduct = updateFeaturedProduct;

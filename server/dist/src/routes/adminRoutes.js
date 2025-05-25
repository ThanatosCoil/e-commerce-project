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
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const cacheMonitor_1 = require("../utils/cacheMonitor");
const router = (0, express_1.Router)();
// Только суперадмины имеют доступ к этим маршрутам
router.use(authMiddleware_1.authenticateToken, authMiddleware_1.csrfProtection, authMiddleware_1.isSuperAdmin);
// Получение статистики кеша
router.get("/cache-stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield (0, cacheMonitor_1.getCacheStats)();
        res.status(200).json({ success: true, stats });
    }
    catch (error) {
        console.error("Error fetching cache stats:", error);
        res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
}));
// Получение списка ключей по паттерну
router.get("/cache-keys", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pattern = req.query.pattern || "*";
        const keys = yield (0, cacheMonitor_1.getKeysByPattern)(pattern);
        res.status(200).json({ success: true, keys });
    }
    catch (error) {
        console.error("Error fetching cache keys:", error);
        res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
}));
// Получение значения кеша по ключу
router.get("/cache-value", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = req.query.key;
        if (!key) {
            res.status(400).json({ success: false, message: "Key is required" });
            return;
        }
        const value = yield (0, cacheMonitor_1.getCacheValue)(key);
        const ttl = yield (0, cacheMonitor_1.getKeyTTL)(key);
        res.status(200).json({
            success: true,
            key,
            value,
            ttl,
            exists: value !== null,
        });
    }
    catch (error) {
        console.error("Error fetching cache value:", error);
        res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
}));
// Очистка всего кеша
router.post("/clear-cache", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, cacheMonitor_1.clearAllCache)();
        res
            .status(200)
            .json({ success: true, message: "Cache cleared successfully" });
    }
    catch (error) {
        console.error("Error clearing cache:", error);
        res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;

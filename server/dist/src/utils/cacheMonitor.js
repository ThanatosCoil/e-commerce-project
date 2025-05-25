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
exports.getKeysByPattern = getKeysByPattern;
exports.getCacheValue = getCacheValue;
exports.getKeyTTL = getKeyTTL;
exports.getCacheStats = getCacheStats;
exports.clearAllCache = clearAllCache;
const redis_1 = require("../config/redis");
/**
 * Мониторинг кеша Redis - утилита для отладки
 */
// Функция для получения всех ключей с определенным паттерном
function getKeysByPattern(pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, redis_1.initRedis)();
            return yield redis_1.redisClient.keys(pattern);
        }
        catch (error) {
            console.error("Error getting keys:", error);
            return [];
        }
    });
}
// Функция для получения значения по ключу
function getCacheValue(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, redis_1.initRedis)();
            const value = yield redis_1.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error(`Error getting value for key ${key}:`, error);
            return null;
        }
    });
}
// Функция для получения времени жизни ключа
function getKeyTTL(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, redis_1.initRedis)();
            return yield redis_1.redisClient.ttl(key);
        }
        catch (error) {
            console.error(`Error getting TTL for key ${key}:`, error);
            return -1;
        }
    });
}
// Получение статистики кеша
function getCacheStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, redis_1.initRedis)();
            // Получаем все ключи продуктов
            const productKeys = yield getKeysByPattern("products:*");
            const latestProductKeys = yield getKeysByPattern("latest-products:*");
            // Получаем информацию о потреблении памяти
            const info = yield redis_1.redisClient.info("memory");
            const memoryMatch = info.match(/used_memory_human:(\S+)/);
            const memory = memoryMatch ? memoryMatch[1] : "unknown";
            return {
                productKeys,
                latestProductKeys,
                totalKeys: productKeys.length + latestProductKeys.length,
                memory,
            };
        }
        catch (error) {
            console.error("Error getting cache stats:", error);
            return {
                productKeys: [],
                latestProductKeys: [],
                totalKeys: 0,
                memory: "unknown",
            };
        }
    });
}
// Функция для очистки всего кеша
function clearAllCache() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, redis_1.initRedis)();
            yield redis_1.redisClient.flushAll();
            console.log("All cache cleared");
        }
        catch (error) {
            console.error("Error clearing cache:", error);
        }
    });
}

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
exports.clearCache = exports.deleteCacheByPattern = exports.deleteCache = exports.setCache = exports.getCache = exports.initRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Опции подключения к Redis
const redisConfig = {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
        connectTimeout: 10000, // Таймаут подключения 10 секунд
        reconnectStrategy: (retries) => {
            // Максимум 10 попыток подключения с экспоненциальной задержкой
            if (retries > 10) {
                console.error("Не удалось подключиться к Redis после 10 попыток");
                return new Error("Не удалось подключиться к Redis");
            }
            return Math.min(retries * 100, 3000); // Увеличивающаяся задержка, максимум 3 секунды
        },
    },
};
// Создаем клиент Redis
exports.redisClient = (0, redis_1.createClient)(redisConfig);
// Обработка ошибок
exports.redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});
// Логирование успешного подключения
exports.redisClient.on("connect", () => {
    console.log("Connected to Redis");
});
// Логирование переподключения
exports.redisClient.on("reconnecting", () => {
    console.log("Reconnecting to Redis...");
});
// Инициализация Redis клиента
const initRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!exports.redisClient.isOpen) {
        try {
            yield exports.redisClient.connect();
            console.log("Redis client connected successfully");
        }
        catch (err) {
            console.error("Failed to connect to Redis:", err);
            console.log("Continuing without Redis...");
        }
    }
});
exports.initRedis = initRedis;
//Получение значения из кеша
const getCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen) {
            return null;
        }
        return yield exports.redisClient.get(key);
    }
    catch (error) {
        console.error("Redis get error:", error);
        return null;
    }
});
exports.getCache = getCache;
//Установка значения в кеш
const setCache = (key_1, value_1, ...args_1) => __awaiter(void 0, [key_1, value_1, ...args_1], void 0, function* (key, value, expiry = 300) {
    try {
        if (!exports.redisClient.isOpen) {
            return;
        }
        yield exports.redisClient.set(key, value, { EX: expiry });
    }
    catch (error) {
        console.error("Redis set error:", error);
    }
});
exports.setCache = setCache;
//Удаление значения из кеша
const deleteCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen) {
            return;
        }
        yield exports.redisClient.del(key);
    }
    catch (error) {
        console.error("Redis delete error:", error);
    }
});
exports.deleteCache = deleteCache;
//Удаление кеша по шаблону
const deleteCacheByPattern = (pattern) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen) {
            return;
        }
        const keys = yield exports.redisClient.keys(pattern);
        if (keys.length > 0) {
            yield exports.redisClient.del(keys);
            console.log(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
        }
    }
    catch (error) {
        console.error("Redis delete by pattern error:", error);
    }
});
exports.deleteCacheByPattern = deleteCacheByPattern;
//Очистка всего кеша
const clearCache = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen) {
            return;
        }
        yield exports.redisClient.flushAll();
        console.log("Cache cleared");
    }
    catch (error) {
        console.error("Redis flush error:", error);
    }
});
exports.clearCache = clearCache;

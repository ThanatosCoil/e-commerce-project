import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Определяем тип для Redis-клиента
export type RedisClientType = ReturnType<typeof createClient>;

// Опции подключения к Redis
const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    connectTimeout: 10000, // Таймаут подключения 10 секунд
    reconnectStrategy: (retries: number) => {
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
export const redisClient = createClient(redisConfig);

// Обработка ошибок
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Логирование успешного подключения
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

// Логирование переподключения
redisClient.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

// Инициализация Redis клиента
export const initRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log("Redis client connected successfully");
    } catch (err) {
      console.error("Failed to connect to Redis:", err);
      console.log("Continuing without Redis...");
    }
  }
};

//Получение значения из кеша
export const getCache = async (key: string): Promise<string | null> => {
  try {
    if (!redisClient.isOpen) {
      return null;
    }
    return await redisClient.get(key);
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

//Установка значения в кеш
export const setCache = async (
  key: string,
  value: string,
  expiry: number = 300
): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      return;
    }
    await redisClient.set(key, value, { EX: expiry });
  } catch (error) {
    console.error("Redis set error:", error);
  }
};

//Удаление значения из кеша
export const deleteCache = async (key: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      return;
    }
    await redisClient.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
  }
};

//Удаление кеша по шаблону
export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      return;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(
        `Deleted ${keys.length} cache keys matching pattern: ${pattern}`
      );
    }
  } catch (error) {
    console.error("Redis delete by pattern error:", error);
  }
};

//Очистка всего кеша
export const clearCache = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      return;
    }
    await redisClient.flushAll();
    console.log("Cache cleared");
  } catch (error) {
    console.error("Redis flush error:", error);
  }
};

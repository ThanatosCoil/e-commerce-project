import { redisClient, initRedis } from "../config/redis";

/**
 * Мониторинг кеша Redis - утилита для отладки
 */

// Функция для получения всех ключей с определенным паттерном
async function getKeysByPattern(pattern: string): Promise<string[]> {
  try {
    await initRedis();
    return await redisClient.keys(pattern);
  } catch (error) {
    console.error("Error getting keys:", error);
    return [];
  }
}

// Функция для получения значения по ключу
async function getCacheValue(key: string): Promise<any> {
  try {
    await initRedis();
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, error);
    return null;
  }
}

// Функция для получения времени жизни ключа
async function getKeyTTL(key: string): Promise<number> {
  try {
    await initRedis();
    return await redisClient.ttl(key);
  } catch (error) {
    console.error(`Error getting TTL for key ${key}:`, error);
    return -1;
  }
}

// Получение статистики кеша
async function getCacheStats(): Promise<{
  productKeys: string[];
  latestProductKeys: string[];
  totalKeys: number;
  memory: string;
}> {
  try {
    await initRedis();

    // Получаем все ключи продуктов
    const productKeys = await getKeysByPattern("products:*");
    const latestProductKeys = await getKeysByPattern("latest-products:*");

    // Получаем информацию о потреблении памяти
    const info = await redisClient.info("memory");
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const memory = memoryMatch ? memoryMatch[1] : "unknown";

    return {
      productKeys,
      latestProductKeys,
      totalKeys: productKeys.length + latestProductKeys.length,
      memory,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return {
      productKeys: [],
      latestProductKeys: [],
      totalKeys: 0,
      memory: "unknown",
    };
  }
}

// Функция для очистки всего кеша
async function clearAllCache(): Promise<void> {
  try {
    await initRedis();
    await redisClient.flushAll();
    console.log("All cache cleared");
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

// Экспортируем функции для использования в других частях приложения
export {
  getKeysByPattern,
  getCacheValue,
  getKeyTTL,
  getCacheStats,
  clearAllCache,
};

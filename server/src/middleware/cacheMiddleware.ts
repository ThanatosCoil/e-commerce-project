import { Request, Response, NextFunction } from "express";
import { getCache, setCache } from "../config/redis";

// Порядок выполнения:
// 1. Middleware проверяет наличие кеша
// 2. Если кеш не найден, он переопределяет метод res.json (метод для отправки ответа, он в каждом контроллере есть в конце, когда мы отправляем success и данные)
// 3. Затем вызывается next(), что передает управление следующему middleware или контроллеру (переопределенный метод еще не вызывался, мы его только переопределили)
// 4. Контроллер выполняет свою логику и в конце вызывает res.json(data) (вот теперь он вызывается, потому что как раз в конце контроллеров res.status(n).json(data))
// 5. Вызывается наша переопределенная функция res.json, которая:
//        - Восстанавливает оригинальный метод
//        - Сохраняет данные в кеш
//        - Отправляет ответ клиенту, вызывая оригинальный метод
// То есть, сначала происходит переопределение, потом вызывается контроллер через next(), и только когда контроллер вызывает res.json(), срабатывает наша логика кеширования.
// Стоит отметить, что Express обрабатывает каждый запрос в отдельном потоке выполнения (благодаря асинхронной природе Node.js). Это означает, что переопределение res.json для одного запроса не влияет на другие запросы.

/**
 * Middleware для кеширования через Redis
 * @param expiryTime Время жизни кеша в секундах (по умолчанию 5 минут)
 * @param customKeyGenerator Функция для генерации ключа кеша (опционально)
 * @returns Middleware Express
 */
export const cacheMiddleware = (
  expiryTime: number = 300,
  customKeyGenerator?: (req: Request) => string
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Пропускаем кеширование для методов кроме GET
      if (req.method !== "GET") {
        next();
        return;
      }

      // Генерируем ключ кеша
      const cacheKey = customKeyGenerator
        ? customKeyGenerator(req)
        : `${req.originalUrl || req.url}`;

      // Проверяем наличие кеша
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        // Отправляем данные из кеша
        const parsedData = JSON.parse(cachedData);
        res.status(200).json({
          ...parsedData,
          fromCache: true, // Флаг для отладки (можно убрать в продакшене)
        });
        return;
      }

      // Если кеша нет, перехватываем оригинальный метод res.json
      const originalJson = res.json; // Сохраняем оригинальный метод, чтобы его можно было восстановить
      res.json = function (body) {
        // Переопределяем метод res.json (метод для отправки ответа)

        res.json = originalJson; // Восстанавливаем оригинальный метод, чтобы избежать рекурсии при вызове originalJson и чтобы восстановить оригинальное поведение для будущих запросов

        // Кешируем только успешные ответы
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Асинхронно сохраняем в кеш
          setCache(cacheKey, JSON.stringify(body), expiryTime).catch((err) => {
            console.error("Error caching response:", err);
          });
        }

        // Вызываем оригинальный метод
        return originalJson.call(this, body); // this - это res, потому что метод объекта res - это метод res.json а this дает ссылку на объект в котором вызывается метод, а body - это объект который мы высылаем в res.json({}) в контроллере
      };

      // Продолжаем выполнение запроса
      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      // В случае ошибки в кеше, продолжаем обработку запроса
      next();
    }
  };
};

/**
 * Генератор ключа кеша для публичных запросов продуктов
 * @param req Express запрос
 * @returns Строка ключа кеша
 */
export const productCacheKeyGenerator = (req: Request): string => {
  const {
    page,
    limit,
    searchQuery,
    category,
    brand,
    gender,
    colors,
    sizes,
    sortBy,
    minPrice,
    maxPrice,
    hasDiscount,
  } = req.query;

  // Создаем ключ на основе всех параметров
  return `products:${JSON.stringify({
    page,
    limit,
    searchQuery,
    category,
    brand,
    gender,
    colors,
    sizes,
    sortBy,
    minPrice,
    maxPrice,
    hasDiscount,
  })}`;
};

/**
 * Генератор ключа кеша для запроса последних продуктов
 * @param req Express запрос
 * @returns Строка ключа кеша
 */
export const latestProductsCacheKeyGenerator = (req: Request): string => {
  const { limit } = req.query;
  return `latest-products:${limit || "default"}`;
};

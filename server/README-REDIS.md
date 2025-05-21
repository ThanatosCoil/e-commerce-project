# Redis Caching в E-Commerce Project

## Обзор

В проекте реализовано серверное кеширование с помощью Redis для повышения производительности и снижения нагрузки на базу данных. Это особенно полезно для часто запрашиваемых публичных данных, таких как списки товаров.

## Функциональность

Кеширование Redis реализовано для следующих эндпоинтов:

- `/api/product/public` - публичные товары с фильтрацией и пагинацией (TTL: 5 минут)
- `/api/product/latest` - последние добавленные товары (TTL: 10 минут)

## Установка и настройка

### 1. Установка Redis

1. (https://github.com/microsoftarchive/redis/releases)
2. Установить и запустить сервис: redis-server --service-start
3. Проверить что работает: redis-cli ping

### 2. Настройка переменных окружения

В файле `.env` параметры подключения к Redis:

```
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password_if_needed
```

## Как работает кеширование

### 1. Middleware для кеширования

В проекте используется универсальный middleware `cacheMiddleware` из файла `src/middleware/cacheMiddleware.ts`, который:

- Проверяет наличие кеша для запроса
- Возвращает кешированные данные, если они существуют
- Сохраняет результат в кеш при первом запросе

### 2. Генераторы ключей кеша

Для эффективного использования кеша реализованы специальные генераторы ключей:

- `productCacheKeyGenerator` - создает ключи на основе всех параметров фильтрации и пагинации
- `latestProductsCacheKeyGenerator` - создает ключи для запросов последних товаров

### 3. Инвалидация кеша

Кеш автоматически инвалидируется при:

- Создании нового товара
- Обновлении существующего товара
- Удалении товара

Функция `invalidateProductCache()` в `productController.ts` удаляет все связанные с продуктами кеши.

## Мониторинг и отладка

Для мониторинга и отладки кеша реализованы специальные эндпоинты в `adminRoutes.ts`:

- `GET /api/admin/cache-stats` - получение статистики кеширования
- `GET /api/admin/cache-keys?pattern=products:*` - получение списка ключей по паттерну
- `GET /api/admin/cache-value?key=products:...` - получение значения кеша по ключу
- `POST /api/admin/clear-cache` - очистка всего кеша

Примечание: Доступ к этим эндпоинтам имеют только суперадмины.

## Пример использования в консоли

```javascript
// Получение статистики кеша
fetch("/api/admin/cache-stats", {
  method: "GET",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "X-CSRF-Token": "YOUR_CSRF_TOKEN",
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data));

// Очистка кеша
fetch("/api/admin/clear-cache", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "X-CSRF-Token": "YOUR_CSRF_TOKEN",
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

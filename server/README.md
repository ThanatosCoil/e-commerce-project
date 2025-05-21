# E-Commerce Backend

Бэкенд для e-commerce проекта, построенный на Node.js, Express, PostgreSQL и Prisma.

## Технологии

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Redis (для кэширования)
- JWT аутентификация
- Stripe (для платежей)

## Локальная разработка

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`

3. Запустите миграции базы данных:

```bash
npm run prisma:migrate
```

4. Сгенерируйте Prisma клиент:

```bash
npm run prisma:generate
```

5. Запустите сервер в режиме разработки:

```bash
npm run dev
```

## Деплой на Railway

1. Создайте аккаунт на [Railway](https://railway.app/)
2. Создайте новый проект
3. Добавьте PostgreSQL и Redis сервисы
4. Подключите репозиторий GitHub
5. Настройте переменные окружения:

   - DATABASE_URL (автоматически предоставляется Railway)
   - JWT_SECRET
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - CLIENT_URL (URL вашего фронтенда)
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - EMAIL_FROM
   - REDIS_URL (автоматически предоставляется Railway)

6. Деплой запустится автоматически после настройки

## API Endpoints

### Аутентификация

- POST `/api/auth/register` - Регистрация
- POST `/api/auth/login` - Вход
- POST `/api/auth/logout` - Выход
- POST `/api/auth/refresh-token` - Обновление токена

### Продукты

- GET `/api/product` - Получить все продукты
- GET `/api/product/:id` - Получить продукт по ID
- POST `/api/product` - Создать продукт (требуется роль SUPER_ADMIN)
- PUT `/api/product/:id` - Обновить продукт (требуется роль SUPER_ADMIN)
- DELETE `/api/product/:id` - Удалить продукт (требуется роль SUPER_ADMIN)

### Корзина

- GET `/api/cart` - Получить корзину пользователя
- POST `/api/cart/add` - Добавить товар в корзину
- PUT `/api/cart/update` - Обновить количество товара в корзине
- DELETE `/api/cart/remove/:itemId` - Удалить товар из корзины

### Заказы

- GET `/api/order` - Получить заказы пользователя
- GET `/api/order/:id` - Получить заказ по ID
- POST `/api/order` - Создать заказ
- PUT `/api/order/:id/status` - Обновить статус заказа (требуется роль SUPER_ADMIN)

### Адреса

- GET `/api/address` - Получить адреса пользователя
- POST `/api/address` - Создать адрес
- PUT `/api/address/:id` - Обновить адрес
- DELETE `/api/address/:id` - Удалить адрес

### Купоны

- GET `/api/coupon` - Получить все купоны (требуется роль SUPER_ADMIN)
- POST `/api/coupon` - Создать купон (требуется роль SUPER_ADMIN)
- PUT `/api/coupon/:id` - Обновить купон (требуется роль SUPER_ADMIN)
- DELETE `/api/coupon/:id` - Удалить купон (требуется роль SUPER_ADMIN)
- POST `/api/coupon/validate` - Проверить купон

### Отзывы

- GET `/api/reviews/product/:productId` - Получить отзывы о продукте
- POST `/api/reviews` - Создать отзыв
- PUT `/api/reviews/:id` - Обновить отзыв
- DELETE `/api/reviews/:id` - Удалить отзыв
- POST `/api/reviews/:id/vote` - Проголосовать за отзыв

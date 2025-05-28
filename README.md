# [E-Commerce Project](https://e-commerce-production-front.up.railway.app) [![Открыть проект](https://img.shields.io/badge/View%20Live-Online-brightgreen?style=for-the-badge&logo=vercel)](https://e-commerce-production-front.up.railway.app)

---

## Описание проекта 

**E-Commerce Project** — это современное полнофункциональное e-commerce приложение, реализованное на стеке Next.js + Express.js + Prisma(PostgreSQL). Проект поддерживает регистрацию и авторизацию пользователей, каталог товаров, корзину, оформление заказов, интеграцию с платежной системой Stripe, управление купонами, отзывы, а также административную панель для управления магазином.

---

### Основной стек

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Redux Toolkit, Radix UI, Stripe.js
- **Backend:** Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis, Stripe, Cloudinary

---

### Основная функциональность

- **Аутентификация и авторизация:** Регистрация, вход, восстановление пароля, JWT, CSRF защита, роли пользователей
- **Каталог товаров:** Просмотр, фильтрация, поиск, детальные страницы товаров
- **Корзина и оформление заказа:** Добавление/удаление товаров, оформление заказа, интеграция с Stripe для онлайн-оплаты, поддержка оплаты при доставке
- **Управление адресами:** Добавление, редактирование, удаление адресов доставки
- **Купоны и скидки:** Применение купонов, управление скидками (админ)
- **Отзывы:** Написание, изменение и голосование на отзывы товаров
- **Личный кабинет:** Просмотр и редактирование профиля, история заказов, управление адресами
- **Админ-панель:** Управление товарами, заказами, купонами, настройками магазина
- **Безопасность:** CSRF, CORS, защита от XSS, хранение паролей в bcrypt, валидация данных через Zod

---

### Особенности

- Современный UI с использованием Radix UI и Tailwind CSS
- SSR и SSG для высокой производительности и SEO
- Интеграция с облачным хранилищем изображений (Cloudinary)
- Использование Redis для кеширования и ускорения работы API
- Поддержка деплоя на Railway

---

## Структура проекта

- `client/` - Next.js фронтенд
- `server/` - Express.js бэкенд с Prisma

## Деплой

Приложение развернуто на Railway по адресу [e-commerce-production-front.up.railway.app](https://e-commerce-production-front.up.railway.app)

## Инструкции по локальному запуску

### Клиентская часть

```bash
cd client
npm install
npm run dev
```

### Серверная часть

```bash
cd server
npm install
npm run prisma:generate
npm run dev
```

## Переменные окружения

### Клиент (.env)

```
ARCJET_KEY=
JWT_SECRET=
USER_STORAGE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Сервер (.env)

```
NODE_ENV=development
DATABASE_URL=""
JWT_SECRET=
PORT=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
ALLOWED_ORIGINS=
EMAIL_FROM=noreply@example.com
REDIS_URL=
REDIS_PASSWORD=
```

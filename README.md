# E-Commerce Project

## Структура проекта

- `client/` - Next.js фронтенд
- `server/` - Express.js бэкенд с Prisma

## Деплой

### Фронтенд (Vercel)

Фронтенд часть приложения развернута на Vercel.

### Бэкенд

Бэкенд часть приложения должна быть развернута отдельно (например, на Railway, Heroku, или другом хостинге).

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

ARCJET_KEY=
JWT_SECRET=
USER_STORAGE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

### Сервер (.env)

NODE_ENV=development
EMAIL_FROM=
REDIS_URL=
REDIS_PASSWORD=

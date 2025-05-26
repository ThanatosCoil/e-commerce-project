# E-Commerce Project

## Структура проекта

- `client/` - Next.js фронтенд
- `server/` - Express.js бэкенд с Prisma

## Деплой

Приложение развернуто на Railway по адресу e-commerce-production-front.up.railway.app

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

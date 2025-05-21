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

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### Сервер (.env)

Необходимо настроить переменные окружения для базы данных, JWT и других сервисов.

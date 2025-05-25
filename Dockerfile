FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json файлы
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Устанавливаем зависимости
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Копируем исходный код
COPY . .

# Генерируем Prisma client
RUN cd server && npm run prisma:generate

# Сборка сервера
RUN cd server && npm run build

# Сборка клиента
RUN cd client && npm run build

# Производственный образ
FROM node:18-alpine

WORKDIR /app

# Копируем собранные файлы из этапа сборки
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules ./server/node_modules

# Копируем собранные файлы из этапа сборки
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/package.json ./client/
COPY --from=builder /app/client/node_modules ./client/node_modules

# Создаем скрипт для запуска обоих сервисов
RUN echo '#!/bin/sh\ncd server && node dist/server.js & cd client && npm start' > start.sh && chmod +x start.sh

# Устанавливаем переменные окружения
ENV NODE_ENV=production

# Запускаем оба сервиса
CMD ["./start.sh"] 
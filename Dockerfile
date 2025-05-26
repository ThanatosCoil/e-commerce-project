FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json для клиента
COPY client/package.json ./client/
COPY client/package-lock.json ./client/

# Устанавливаем зависимости только для клиента
WORKDIR /app/client
RUN npm install

# Копируем исходный код клиента (всё содержимое client/ внутрь /app/client)
WORKDIR /app
COPY client/ ./client/

# Выводим структуру файлов для отладки
RUN ls -l /app && ls -l /app/client

WORKDIR /app/client

# Пробрасываем переменную окружения в build
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"] 
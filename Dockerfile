FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json для клиента
COPY client/package.json ./client/
COPY client/package-lock.json ./client/

# Устанавливаем зависимости только для клиента
WORKDIR /app/client
RUN npm install

# Копируем исходный код клиента
WORKDIR /app
COPY client/ ./client/

# Сборка фронта (Next.js/React)
WORKDIR /app/client
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"] 
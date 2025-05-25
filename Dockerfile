FROM node:18-alpine

WORKDIR /app/client

# Копируем package.json и package-lock.json для клиента
COPY client/package.json ./
COPY client/package-lock.json ./

# Устанавливаем зависимости только для клиента
RUN npm install

# Копируем исходный код клиента
COPY client/ .

# Сборка фронта (Next.js/React)
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"] 
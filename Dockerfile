FROM node:18-alpine

WORKDIR /app

# Копируем package.json и client/package.json
COPY package.json ./
COPY client/package.json ./client/

# Устанавливаем зависимости
RUN npm install
RUN cd client && npm install

# Копируем исходный код
COPY . .

# Сборка фронта (Next.js/React)
RUN cd client && npm run build

WORKDIR /app/client

ENV NODE_ENV=production

CMD ["npm", "start"] 
FROM node:18-alpine AS builder

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

# Производственный образ
FROM node:18-alpine

WORKDIR /app

# Копируем только нужные файлы
COPY --from=builder /app/package.json ./
COPY --from=builder /app/proxy-server.js ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/package.json ./client/

ENV NODE_ENV=production

CMD ["node", "proxy-server.js"] 
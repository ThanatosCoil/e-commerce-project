FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd server && npm run prisma:generate

# Build server
RUN cd server && npm run build

# Build client
RUN cd client && npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy client build files
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/package.json ./client/
COPY --from=builder /app/client/node_modules ./client/node_modules

# Create a script to start both services
RUN echo '#!/bin/sh\ncd server && node dist/server.js & cd client && npm start' > start.sh && chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production

# Start both services
CMD ["./start.sh"] 
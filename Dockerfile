FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd server && npm run prisma:generate

# Build server
RUN cd server && npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules ./server/node_modules

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"] 
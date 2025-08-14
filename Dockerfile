# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install --save-dev vite typescript @types/node

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.cjs"]
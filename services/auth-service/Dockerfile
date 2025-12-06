FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source
COPY src ./src

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --production && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

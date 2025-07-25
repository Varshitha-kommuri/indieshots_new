# Stage 1: Build frontend using Vite
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve backend
FROM node:18-alpine

WORKDIR /app

# Copy dependencies and server files
COPY package*.json ./
RUN npm install --omit=dev

# Copy build from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Optional: Copy any env, config, or service account files securely
# COPY service-account.json ./service-account.json  ❌ Avoid in production
# Use env var + base64 decode instead (safer)

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "dist/index.js"]

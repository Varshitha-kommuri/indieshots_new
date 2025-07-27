# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install OS deps
RUN apk add --no-cache dumb-init

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the app
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the app port
EXPOSE 8080

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the app
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# Multi-stage build for production
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/.output ./.output
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Copy database migration files (needed for runtime migrations)
COPY --from=builder --chown=nodejs:nodejs /app/src/db ./src/db
COPY --from=builder --chown=nodejs:nodejs /app/drizzle.config.ts ./drizzle.config.ts

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:3000 || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", ".output/server/index.mjs"]

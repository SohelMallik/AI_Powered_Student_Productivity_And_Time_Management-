# ============================================================
# Production Dockerfile – AI Student Productivity
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY server/ ./server/
COPY public/ ./public/

# ── Runtime stage ────────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="AI Student Productivity"
LABEL org.opencontainers.image.description="AI-Powered Student Productivity & Time Management"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server       ./server
COPY --from=builder /app/public       ./public
COPY package*.json ./
COPY .env.example  ./.env.example

# Create data directory
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

CMD ["node", "server/index.js"]

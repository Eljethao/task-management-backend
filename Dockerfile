# ── Stage 1: Build ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Install all deps (devDeps needed for tsc)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Compile TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ── Stage 2: Runtime ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN npm install -g pnpm

WORKDIR /app

# Install production deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Pull compiled output from builder
COPY --from=builder /app/dist ./dist

# Run as non-root for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]

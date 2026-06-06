# apps/api/Dockerfile

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy workspace manifests only — Docker caches this layer
# until any package.json changes
COPY package.json package-lock.json* ./
COPY apps/api/package.json    ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspaces

# ── Stage 2: Copy source ───────────────────────────────────────────────────────
FROM deps AS source

COPY apps/api     ./apps/api
COPY apps/worker  ./apps/worker
COPY packages     ./packages

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy only what we need from the build stages
COPY --from=source /app/node_modules     ./node_modules
COPY --from=source /app/apps/api         ./apps/api
COPY --from=source /app/apps/worker      ./apps/worker
COPY --from=source /app/packages         ./packages
COPY --from=source /app/package.json     ./package.json

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

# Default command runs the API
# Override with 'node apps/worker/src/worker.js' for the worker container
CMD ["node", "apps/api/src/server.js"]
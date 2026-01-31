# Build from monorepo root: docker build -f apps/frontend/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Install dependencies and build
FROM base AS builder

# Copy all workspace files needed for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types ./packages/types
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build args
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true

# Build the frontend
RUN pnpm --filter @bookstore/frontend build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "apps/frontend/server.js"]

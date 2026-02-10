FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile --prod=false

# Copy source
COPY packages/shared packages/shared
COPY packages/server packages/server
COPY tsconfig.base.json ./

# Build shared and server
RUN pnpm --filter @nexus/shared build 2>/dev/null || true
RUN pnpm --filter @nexus/server build

# Production image
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/packages/shared/package.json packages/shared/
COPY --from=base /app/packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/packages/server/dist packages/server/dist

# Create directories
RUN mkdir -p /data /app/uploads

ENV DATABASE_PATH=/data/nexus.db
ENV UPLOAD_DIR=/app/uploads
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080
EXPOSE 10000-10100/udp

VOLUME ["/data", "/app/uploads"]

CMD ["node", "packages/server/dist/index.js"]

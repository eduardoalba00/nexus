FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.11.0 --activate
RUN npm install -g typescript

WORKDIR /app

# Copy everything needed (shared + server source, client manifest for lockfile)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/
COPY packages/client/package.json packages/client/

# Install after source is in place so pnpm symlinks are intact
RUN pnpm install --frozen-lockfile

# Build shared first, then server
RUN cd packages/shared && tsc && cd ../server && tsc

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "packages/server/dist/index.js"]

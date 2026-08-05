FROM node:22-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY . ./

# Prefetch packages so pnpm can enumerate builds, then auto-approve them
# (non-fatal if approve-builds is a no-op in some environments), then install.
RUN corepack pnpm fetch --no-frozen-lockfile || true
RUN corepack pnpm approve-builds -y || true
RUN corepack pnpm install --no-frozen-lockfile
RUN cd artifacts/api-server && corepack pnpm run build

WORKDIR /app/artifacts/api-server
EXPOSE 5000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

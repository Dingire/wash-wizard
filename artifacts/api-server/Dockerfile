FROM node:22-slim

WORKDIR /app

# Copy lockfile and workspace files from repo root (build context should be repo root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Copy entire repo into the image
COPY . ./

# Prefetch packages so pnpm can enumerate builds, then auto-approve them
# (non-fatal if approve-builds is a no-op in some environments), then install.
RUN corepack pnpm fetch --no-frozen-lockfile || true
RUN corepack pnpm approve-builds -y || true
RUN corepack pnpm install --no-frozen-lockfile
RUN corepack pnpm run build --prefix artifacts/api-server

WORKDIR /app/artifacts/api-server
EXPOSE 5000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

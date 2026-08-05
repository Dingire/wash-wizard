FROM node:22-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY . ./

# Ensure pnpm CLI is available via corepack, then prefetch packages so pnpm
# can enumerate builds, auto-approve them, and install.
RUN corepack prepare pnpm@latest --activate
RUN corepack pnpm fetch --no-frozen-lockfile || true
RUN corepack pnpm approve-builds -y || true
RUN corepack pnpm install --no-frozen-lockfile
RUN cd artifacts/api-server && corepack pnpm run build

WORKDIR /app/artifacts/api-server
EXPOSE 5000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

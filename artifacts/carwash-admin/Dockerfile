FROM node:22-slim AS build

WORKDIR /app

# Copy lockfile and workspace files from repo root (build context should be repo root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Copy entire repo into the image
COPY . ./

# Railway injects service variables at build time only when declared via ARG.
ARG VITE_API_BASE_URL
ARG PORT
ARG BASE_PATH

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV PORT=${PORT:-3000}
ENV BASE_PATH=${BASE_PATH:-/}

# Ensure pnpm CLI is available via corepack, then prefetch packages so pnpm
# can enumerate builds, auto-approve them, and install.
RUN corepack prepare pnpm@latest --activate
RUN corepack pnpm fetch --no-frozen-lockfile || true
RUN corepack pnpm approve-builds --all || true
RUN corepack pnpm install --no-frozen-lockfile
RUN cd artifacts/carwash-admin && corepack pnpm run build

# ---- Static server stage ----
FROM nginx:1.27-alpine

# nginx:alpine substitutes ${VAR} in /etc/nginx/templates/*.template at startup
# using the container's environment (Railway injects PORT at runtime).
COPY artifacts/carwash-admin/nginx.template.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/artifacts/carwash-admin/dist/public /usr/share/nginx/html

EXPOSE 3000

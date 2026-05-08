# ── Frontend Dockerfile ─────────────────────────────────────────
# Multi-stage build: Node build → Nginx serve
# ────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Copy dependency manifests first (layer caching)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build arg for API URL — defaults to /api (proxied by nginx)
ARG VITE_API_URL=http://backend:5000
ARG VITE_API_WS_URL=http://backend:5000

# Build the production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────
FROM nginx:alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config with API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage (Vite outputs to dist/)
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Make nginx cache and run dirs writable for non-root
RUN chown -R appuser:appgroup /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

# Switch to non-root user
USER appuser

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

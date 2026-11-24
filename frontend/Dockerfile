# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build-time environment variable injection
ARG VITE_API_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_CAMPUS_DOMAIN=srmap.edu.in
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_CAMPUS_DOMAIN=${VITE_CAMPUS_DOMAIN}

# Compile TypeScript and bundle production assets with Vite
RUN npm run build

# ── Stage 2: Production Nginx Runner ──────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA static artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Health check ensuring Nginx serves the index page
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]


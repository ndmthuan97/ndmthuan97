# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Accept base URL at build time (/ for Cloud Run, /ndmthuan97/ for GitHub Pages)
ARG VITE_BASE_URL=/
ENV VITE_BASE_URL=${VITE_BASE_URL}
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA (handles client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run injects PORT env var (default 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# syntax=docker/dockerfile:1.4
# Build
FROM node:22-slim AS builder
WORKDIR /app

# ENV
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json ./
RUN npm ci --no-audit

# ENV
ARG VITE_API_URL=https://api.ventureglobalsolution.com/api
ARG VITE_SOCKET_URL=https://api.ventureglobalsolution.com
ARG VITE_BASE_PATH=/
ARG VITE_ALLOWED_IPS=186.115.199.186,186.80.18.114,71.251.192.117,162.255.235.74

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_ALLOWED_IPS=$VITE_ALLOWED_IPS

COPY . .
RUN npm run build

# NGINX Alpine No-Root
FROM nginx:1.27-alpine-slim AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

USER nginx

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=4s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

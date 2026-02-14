# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Vite env vars (baked in at build time) – pass via docker build --build-arg
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN corepack enable pnpm 2>/dev/null || true && \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm ci 2>/dev/null || npm install; fi

# Build the app
COPY . .
RUN if [ -f pnpm-lock.yaml ]; then pnpm run build; else npm run build; fi

# Production stage: serve with nginx
FROM nginx:alpine

ENV PORT=8080

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

# Entrypoint writes nginx config with PORT and runs CMD (nginx)
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

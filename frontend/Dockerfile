# Stage 1: Build the Vite Single Page Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci || npm install

# Copy frontend source code and configuration
COPY frontend/ .

# Build-time environment arguments (defaults to relative /api proxied by Nginx)
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Compile TypeScript and bundle with Vite
RUN npm run build

# Stage 2: Serve static files with lightweight Nginx
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check to ensure web server is responding
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

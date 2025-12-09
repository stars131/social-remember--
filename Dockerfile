# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend to be served by backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/build

# Create directories for data and uploads
RUN mkdir -p /app/data /app/uploads/avatars /app/uploads/photos /app/uploads/activities /app/uploads/cards

# Set environment variables
ENV NODE_ENV=production
ENV PORT=19527
ENV DATA_PATH=/app/data
ENV UPLOADS_PATH=/app/uploads
ENV FRONTEND_PATH=/app/frontend/build

# Expose port
EXPOSE 19527

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:19527/api/auth/check || exit 1

# Run the application
CMD ["node", "dist/server.js"]

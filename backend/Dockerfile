# ============================================
# BUILD STAGE
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies for OCR (Tesseract)
# vie+eng are needed based on the TesseractTool implementation
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-vie

# We only need production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Set up user and permissions
	RUN addgroup -g 1001 -S nodejs && \
	    adduser -S nodejs -u 1001 && \
	    mkdir -p uploads logs db && \
	    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["node", "dist/server.js"]

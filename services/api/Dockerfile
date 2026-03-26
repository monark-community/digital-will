# ================================
# Backend Dockerfile (Express + TypeScript)
# ================================

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
# Install dependencies needed for native modules and Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY services/api/package.json services/api/package-lock.json* ./

# Install dependencies
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi && \
  # @substreams/node@0.7.x requires @bufbuild/connect-node (old name, now @connectrpc/connect-node) \
  mkdir -p node_modules/@bufbuild && \
  cp -r node_modules/@connectrpc/connect-node node_modules/@bufbuild/connect-node && \
  # Force dist/cjs/ files in @substreams/manifest to be treated as CommonJS \
  echo '{"type":"commonjs"}' > node_modules/@substreams/manifest/dist/cjs/package.json && \
  # Patch locate-buf-binary.js: replace import.meta.url (ESM) with __filename (CJS) \
  # The file mixes CJS exports with ESM import.meta.url — fundamentally broken upstream \
  sed -i 's/(0, _nodeModule.createRequire)(import.meta.url)/(0, _nodeModule.createRequire)(__filename)/g' \
    node_modules/@substreams/manifest/dist/cjs/protobuf/locate-buf-binary.js

# ---- Local Development ----
FROM base AS local
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY services/api/ .

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=local

# Generate Prisma Client and push schema, then start dev server
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss && npm run dev"]

# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Install OpenSSL for Prisma generate during build
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY services/api/ .

# Copy substreams spkg into image
COPY packages/substreams/willchain_events/willchain-events-v0.1.0.spkg ./spkg/willchain-events-v0.1.0.spkg

# Generate Prisma Client + compile TypeScript
RUN npx prisma generate && npm run build

# ---- Development ----
FROM base AS development
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Reuse compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/spkg ./spkg

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=development

# Deploy migrations then start compiled server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

# ---- Production ----
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built assets and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy substreams spkg
COPY --from=builder /app/spkg ./spkg

USER expressjs

EXPOSE 4000

# Deploy migrations then start production server (Prisma Client already generated in builder)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

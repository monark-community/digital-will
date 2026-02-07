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
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

# ---- Local Development ----
FROM base AS local
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=local

# Generate Prisma Client and push schema, then start dev server
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss && npm run dev"]

# ---- Development ----
FROM base AS development
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=development

# Generate Prisma Client and deploy migrations, then start dev server
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]

# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

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

USER expressjs

EXPOSE 4000

# Generate Prisma Client and deploy migrations, then start production server
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]

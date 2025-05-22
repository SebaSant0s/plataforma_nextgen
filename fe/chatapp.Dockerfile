FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json and lock files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy environment variables
COPY .env.local .env.local

# Build the Next.js application
RUN yarn build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# ❌ REMOVE the user setup (we'll run as root)
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# ✅ Set correct permissions for public/uploads (FIXES PERMISSION ERROR)
RUN mkdir -p public/uploads && chmod -R 777 public/uploads

# ✅ Set correct permission for prerender cache
RUN mkdir -p .next && chmod -R 777 .next

# Copy built Next.js application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure environment variables are available
ENV NEXT_PUBLIC_CLERK_FRONTEND_API_KEY=${NEXT_PUBLIC_CLERK_FRONTEND_API_KEY}
ENV CLERK_API_KEY=${CLERK_API_KEY}

# ❌ REMOVE THIS LINE (DO NOT RUN AS A RESTRICTED USER)
# USER nextjs

# ✅ Ensure the container runs as root
USER root

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

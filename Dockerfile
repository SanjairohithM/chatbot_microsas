# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm (if using it)
RUN npm install -g pnpm

# Copy package files *before* running install
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY package-lock.json* ./

# Install dependencies
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    pnpm install --no-frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# Stage 2: Build the app
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# If you're using Prisma
RUN npx prisma generate || echo "No Prisma schema"
RUN npm run build

# Stage 3: Run the app
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["npm", "start"]

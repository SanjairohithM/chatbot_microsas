# Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

RUN npm install

COPY package.json ./
COPY npm-lock.yaml* ./
COPY package-lock.json* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then \
    pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# Build the app
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate || echo "No Prisma schema found"
RUN npm run build

# Run the app
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["npm", "start"]


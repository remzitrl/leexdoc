# ---- Base ----
  FROM node:20-alpine AS base

  # ---- Deps (prod deps) ----
  FROM base AS deps
  RUN apk add --no-cache libc6-compat curl
  WORKDIR /app
  COPY package.json package-lock.json* ./
  # Prisma şemasını postinstall için kopyala
  COPY prisma ./prisma
  RUN npm ci --omit=dev
  
  # ---- Builder ----
  FROM base AS builder
  ARG CACHE_BUST=0
  RUN apk add --no-cache libc6-compat curl
  WORKDIR /app
  
  # Node_modules ve kaynakları kopyala
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  
  # Teşhis: storage ve public dosyaları gerçekten geldi mi?
  RUN set -eux; \
    ls -la src || true; \
    ls -la src/lib || true; \
    ls -la src/lib/storage || true; \
    find src -maxdepth 3 -type d -name storage -print || true; \
    test -f public/sw.js && echo "sw.js OK" || (echo "sw.js YOK" && exit 1)
  
  # Prisma client üret
  RUN npx prisma generate
  
  # Build-time env (dummy)
  ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
  ENV NEXTAUTH_SECRET="dummy-secret-for-build"
  ENV NEXTAUTH_URL="http://localhost:3000"
  
  # Next prod build
  RUN npm run build
  
  # ---- Runner (prod) ----
  FROM base AS runner
  RUN apk add --no-cache curl
  WORKDIR /app
  
  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  
  # Non-root kullanıcı
  RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
  
  # public (PWA sw.js dahil)
  COPY --from=builder /app/public ./public
  
  # Next output
  RUN mkdir .next && chown nextjs:nodejs .next
  COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
  COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
  
  # Prisma (runtime için)
  COPY --from=builder /app/prisma ./prisma
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
  
  # package.json (runtime bağımlılıkları için)
  COPY --from=builder /app/package.json ./package.json
  COPY --from=builder /app/package-lock.json ./package-lock.json
  
  # Sadece prod bağımlılıkları
  RUN npm ci --omit=dev && npm cache clean --force
  
  # Uygulama storage klasörü
  RUN mkdir -p storage && chown nextjs:nodejs storage
  
  USER nextjs
  
  EXPOSE 3000
  ENV PORT=3000
  ENV HOSTNAME="0.0.0.0"
  
  # Healthcheck
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1
  
  # Start
  CMD ["node", "server.js"]
  
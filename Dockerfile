# 북모먼트 배포 이미지 — API 서버가 빌드된 웹 화면(frontend/dist)까지 함께 제공한다.
#   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# ── 1단계: 웹 화면 빌드 ──
FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci
COPY frontend frontend
RUN npm run build -w frontend

# ── 2단계: 서버 실행에 필요한 패키지만 설치 ──
FROM node:22-bookworm-slim AS api
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev -w backend
COPY backend backend
RUN cd backend && npx prisma generate

# ── 3단계: 실행 ──
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api --chown=node:node /app /app
COPY --from=web --chown=node:node /app/frontend/dist /app/frontend/dist
RUN mkdir -p /app/backend/uploads && chown -R node:node /app/backend/uploads
USER node
WORKDIR /app/backend
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# 시작할 때마다 DB 마이그레이션을 먼저 적용하고 서버를 켠다
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

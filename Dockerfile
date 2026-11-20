# 북모먼트 배포 이미지 — API 서버가 빌드된 웹 화면(frontend/dist)까지 함께 제공한다.
#   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
#
# 빌드 중에 apt-get 을 쓰지 않는다. (학교 · 회사망처럼 http(80) 가 막힌 서버에서도 빌드되도록)
# Prisma 가 필요로 하는 OpenSSL 라이브러리는 같은 Debian(bookworm) 기반 full 이미지에서 복사해 온다.

# ── 1단계: 웹 화면 빌드 ──
# FROM node:22-bookworm-slim AS web
# WORKDIR /app
# COPY package.json package-lock.json ./
# COPY backend/package.json backend/
# COPY frontend/package.json frontend/
# RUN npm ci
# COPY frontend frontend
# RUN npm run build -w frontend

# ── 2단계: 서버 패키지 설치 + Prisma 클라이언트 생성 ──
# full 이미지에는 OpenSSL 3 이 들어 있어서 Prisma 가 알맞은 엔진(debian-openssl-3.0.x)을 고른다
FROM node:22-bookworm AS api
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev -w backend
COPY backend backend
RUN cd backend && npx prisma generate \
 && mkdir -p /ssl \
 && cp /usr/lib/$(uname -m)-linux-gnu/libssl.so.3 /usr/lib/$(uname -m)-linux-gnu/libcrypto.so.3 /ssl/

# ── 3단계: 실행 (작은 slim 이미지 + OpenSSL 라이브러리 두 개만) ──
FROM node:22-bookworm-slim
ENV NODE_ENV=production
COPY --from=api /ssl/ /tmp/ssl/
RUN cp /tmp/ssl/* /usr/lib/$(uname -m)-linux-gnu/ && rm -rf /tmp/ssl && ldconfig
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

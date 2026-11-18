import { env } from './utils/env.js';
import { createApp } from './app.js';
import { prisma } from './utils/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`📚 BookMoment API  http://localhost:${env.PORT}  (${env.NODE_ENV})`);
});

async function shutdown(signal) {
  console.log(`\n${signal} 수신 — 서버를 종료합니다.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

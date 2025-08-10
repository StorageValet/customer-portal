import type { Express } from 'express';
import session from 'express-session';
import cookieSession from 'cookie-session';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const isProd = process.env.NODE_ENV === 'production';
const sessionName = 'sv.sid';
const oneMonth = 30 * 24 * 60 * 60 * 1000;

export function mountSession(app: Express) {
  const storeChoice = (process.env.SESSION_STORE || 'cookie').toLowerCase();

  if (storeChoice === 'redis') {
    const mod = require('connect-redis');
    const RedisStoreCtor = (mod as any).default || (mod as any).RedisStore || mod;
    const IORedis = require('ioredis');
    const redis = new IORedis(process.env.REDIS_URL || '');
    const store = new (RedisStoreCtor as any)({ client: redis, prefix: 'sv:sess:' });

    app.use(session({
      name: sessionName,
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: oneMonth,
        path: '/',
      },
    } as any));
  } else {
    app.use(cookieSession({
      name: sessionName,
      keys: [process.env.SESSION_SECRET || 'dev-secret'],
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: oneMonth,
      path: '/',
    }));
  }
}

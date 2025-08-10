import type { Express } from 'express';
import session from 'express-session';
import cookieSession from 'cookie-session';
import RedisStoreFactory from 'connect-redis';
import Redis from 'ioredis';
const isProd = process.env.NODE_ENV === 'production';
const oneMonth = 30 * 24 * 60 * 60 * 1000;
export function mountSession(app: Express) {
  const name = 'sv.sid';
  const choice = (process.env.SESSION_STORE || 'cookie').toLowerCase();
  if (choice === 'redis') {
    const RedisStore = RedisStoreFactory(session);
    const redis = new Redis(process.env.REDIS_URL || '');
    app.use(session({
      name,
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({ client: redis, prefix: 'sv:sess:' }),
      cookie: { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: oneMonth, path: '/' },
    } as any));
  } else {
    app.use(cookieSession({ name, keys: [process.env.SESSION_SECRET || 'dev-secret'], httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: oneMonth, path: '/' }));
  }
}

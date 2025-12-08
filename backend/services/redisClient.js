const Redis = require('ioredis');

let lastErrorTime = 0;

const redis = new Redis({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  lazyConnect: true
});

redis.connect().catch(() => {
  // Redis not available on startup
});

redis.on('connect', () => {
  console.log('Redis connected');
  lastErrorTime = 0;
});

redis.on('error', (e) => {
  const now = Date.now();
  if (now - lastErrorTime > 5000) {
    console.warn('Redis unavailable (caching disabled)');
    lastErrorTime = now;
  }
});

redis.on('reconnecting', () => {
  // Silent reconnect attempts
});

module.exports = redis;

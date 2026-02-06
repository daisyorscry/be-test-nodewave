import Redis from "ioredis";

const host = process.env.REDIS_HOST || "127.0.0.1";
const port = Number(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;
const db = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0;

export const redis = new Redis({
  host,
  port,
  password,
  db,
  maxRetriesPerRequest: 3
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

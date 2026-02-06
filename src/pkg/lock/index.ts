import Redlock from "redlock";
import { cacheRedis } from "$pkg/redis";

export const redlock = new Redlock([cacheRedis], {
  retryCount: 2,
  retryDelay: 150,
  retryJitter: 50
});

export async function withRedisLock<T>(
  resource: string | string[],
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const lock = await redlock.acquire(resource, ttlMs);
  try {
    return await fn();
  } finally {
    try {
      await lock.release();
    } catch {
      // ignore release errors
    }
  }
}

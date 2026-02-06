import Redlock from "redlock";
import { redis } from "$utils/redis.utils";

export const redlock = new Redlock([redis], {
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

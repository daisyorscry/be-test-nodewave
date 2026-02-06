import { cacheRedis } from "$pkg/redis";

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await cacheRedis.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  await cacheRedis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await cacheRedis.del(key);
}

export async function cacheDelByPattern(pattern: string): Promise<void> {
  let cursor = "0";
  do {
    const [nextCursor, keys] = await cacheRedis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await cacheRedis.del(...keys);
    }
  } while (cursor !== "0");
}

export function isLockError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name?: string }).name === "LockError"
  );
}

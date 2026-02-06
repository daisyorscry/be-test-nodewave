import Redis from "ioredis";
import { redisEnv } from "$config/env";

const baseOptions = redisEnv.url
  ? { lazyConnect: false }
  : {
      host: redisEnv.host,
      port: redisEnv.port,
      password: redisEnv.password,
      db: redisEnv.db
    };

// For cache/lock usage.
export const cacheRedis = redisEnv.url
  ? new Redis(redisEnv.url, { ...baseOptions, maxRetriesPerRequest: 3 })
  : new Redis({ ...baseOptions, maxRetriesPerRequest: 3 });

// BullMQ requires maxRetriesPerRequest = null.
export const bullmqRedis = redisEnv.url
  ? new Redis(redisEnv.url, { ...baseOptions, maxRetriesPerRequest: null })
  : new Redis({ ...baseOptions, maxRetriesPerRequest: null });

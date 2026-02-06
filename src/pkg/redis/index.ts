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

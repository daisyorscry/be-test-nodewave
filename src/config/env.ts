import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ENVIRONMENT: z.string().default("dev"),
  NODE_LOCAL_PORT: z.coerce.number().int().positive().default(3010),
  ALLOWED_ORIGINS: z.string().default("*"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().min(1).default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_DB: z.coerce.number().int().min(0).default(0)
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${message}`);
}

const raw = parsed.data;

export const env = {
  nodeEnv: raw.NODE_ENV,
  environment: raw.ENVIRONMENT,
  nodeLocalPort: raw.NODE_LOCAL_PORT,
  allowedOrigins: raw.ALLOWED_ORIGINS.split(","),
  jwtSecret: raw.JWT_SECRET,
  redisHost: raw.REDIS_HOST,
  redisPort: raw.REDIS_PORT,
  redisPassword: raw.REDIS_PASSWORD || undefined,
  redisDb: raw.REDIS_DB
};

export const jwtEnv = {
  secret: env.jwtSecret
};

export const redisEnv = {
  url: raw.REDIS_URL,
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
  db: env.redisDb
};

export const serverEnv = {
  nodeEnv: env.nodeEnv,
  environment: env.environment,
  nodeLocalPort: env.nodeLocalPort,
  allowedOrigins: env.allowedOrigins
};

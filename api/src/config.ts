import "dotenv/config";
import { z } from "zod";

const optionalEnvironmentValue = <T extends z.ZodTypeAny>(schema:T) =>
  z.preprocess(value => value === "" ? undefined : value, schema.optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("postgres://motion:motion@localhost:5432/motion_only"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  APP_DEEP_LINK: z.string().min(1).default("motiononly://auth"),
  PUBLIC_APP_URL: optionalEnvironmentValue(z.url()),
  WEB_APP_ORIGIN: optionalEnvironmentValue(z.url()),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),
  MAGIC_LINK_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  RESEND_API_KEY: optionalEnvironmentValue(z.string().min(8)),
  EMAIL_FROM: z.string().min(3).default("Motion Only <members@motiononly.app>"),
  STORAGE_ENDPOINT: z.url().default("http://localhost:9000"),
  STORAGE_REGION: z.string().min(1).default("us-east-1"),
  STORAGE_BUCKET: z.string().min(3).default("motion-only-private"),
  STORAGE_ACCESS_KEY: z.string().min(2).default("motion"),
  STORAGE_SECRET_KEY: z.string().min(8).default("change-me"),
  STORAGE_FORCE_PATH_STYLE: z.enum(["true","false"]).default("true").transform(value=>value==="true"),
  MAX_FILE_BYTES: z.coerce.number().int().positive().max(25_000_000).default(10_000_000)
});

export const config = schema.parse(process.env);

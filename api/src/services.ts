import { createHash, randomBytes } from "node:crypto";
import { Pool, PoolClient } from "pg";
import { Redis } from "ioredis";
import { config } from "./config.js";

export const db = new Pool({
  connectionString: config.DATABASE_URL,
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  lazyConnect: true
});

export type Session = {
  userId: string;
  email: string;
  role: "member" | "moderator" | "admin";
};

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export async function createSession(session: Session) {
  const token = newOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const sessionKey = `session:${tokenHash}`;
  const memberSessionsKey = `user-sessions:${session.userId}`;
  await redis
    .multi()
    .set(sessionKey, JSON.stringify(session), "EX", config.SESSION_TTL_SECONDS)
    .sadd(memberSessionsKey, tokenHash)
    .expire(memberSessionsKey, config.SESSION_TTL_SECONDS)
    .exec();
  return token;
}

export async function readSession(token?: string): Promise<Session | null> {
  if (!token) return null;
  const value = await redis.get(`session:${hashOpaqueToken(token)}`);
  if (!value) return null;
  return JSON.parse(value) as Session;
}

export async function revokeSession(token: string) {
  const tokenHash = hashOpaqueToken(token);
  const value = await redis.get(`session:${tokenHash}`);
  const session = value ? JSON.parse(value) as Session : null;
  const commands = redis.multi().del(`session:${tokenHash}`);
  if (session) commands.srem(`user-sessions:${session.userId}`, tokenHash);
  await commands.exec();
}

export async function revokeAllUserSessions(userId: string) {
  const memberSessionsKey = `user-sessions:${userId}`;
  const tokenHashes = await redis.smembers(memberSessionsKey);
  const commands = redis.multi();
  for (const tokenHash of tokenHashes) commands.del(`session:${tokenHash}`);
  commands.del(memberSessionsKey);
  await commands.exec();
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}) {
  if (!config.RESEND_API_KEY) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey
    },
    body: JSON.stringify({
      from: config.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Transactional email failed with status ${response.status}: ${body.slice(0, 300)}`);
  }
  return true;
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

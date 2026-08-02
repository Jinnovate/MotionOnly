import { createHash, randomUUID } from "node:crypto";
import Fastify, { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";
import { WebSocket, WebSocketServer } from "ws";
import { config } from "./config.js";
import {
  createSession, db, hashOpaqueToken, newOpaqueToken, readSession, redis,
  revokeAllUserSessions, revokeSession, sendTransactionalEmail, Session, transaction
} from "./services.js";
import { migrateDatabase } from "./migrations.js";
import { deletePrivateObject, ensurePrivateBucket, privateDownloadUrl, storePrivateObject } from "./storage.js";

const app = Fastify({ logger: { redact: ["req.headers.authorization", "body.password", "body.token"] } });
const allowedWebOrigins = new Set([
  config.WEB_APP_ORIGIN,
  config.PUBLIC_APP_URL,
  config.NODE_ENV !== "production" ? "http://localhost:5173" : undefined,
  config.NODE_ENV !== "production" ? "http://127.0.0.1:5173" : undefined
].filter(Boolean) as string[]);
await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedWebOrigins.has(origin)) return callback(null, true);
    callback(null, false);
  }
});
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
await app.register(sensible);
await app.register(multipart,{limits:{files:1,fileSize:config.MAX_FILE_BYTES}});

function bearer(request: FastifyRequest) {
  const header = request.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

async function requireSession(request: FastifyRequest) {
  const session = await readSession(bearer(request));
  if (!session) throw app.httpErrors.unauthorized("A valid session is required");
  return session;
}

async function requireRole(request: FastifyRequest, roles: Session["role"][]) {
  const session = await requireSession(request);
  if (!roles.includes(session.role)) throw app.httpErrors.forbidden("You do not have permission for this action");
  return session;
}

function deepLink(path: string, params: Record<string, string>) {
  const base = config.APP_DEEP_LINK.replace(/\/+$/, "");
  const query = new URLSearchParams(params).toString();
  return `${base}/${path.replace(/^\/+/, "")}?${query}`;
}

app.get("/health", async () => {
  await Promise.all([db.query("SELECT 1"), redis.ping()]);
  return { status: "ok", service: "motion-only-api" };
});

app.post("/v1/auth/accept-invite", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (request, reply) => {
  const body = z.object({
    inviteCode: z.string().min(8),
    email: z.email(),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(80)
  }).parse(request.body);
  const email = body.email.trim().toLowerCase();
  const inviteHash = hashOpaqueToken(body.inviteCode.trim());
  const passwordHash = await hash(body.password);

  const user = await transaction(async client => {
    const invite = await client.query<{ id:string; role:Session["role"] }>(
      `SELECT id, role FROM invitations
       WHERE token_hash=$1 AND lower(email)=lower($2) AND accepted_at IS NULL
         AND revoked_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [inviteHash, email]
    );
    if (!invite.rowCount) throw app.httpErrors.forbidden("Invitation is invalid or expired");
    const existing = await client.query("SELECT id FROM users WHERE lower(email)=lower($1)", [email]);
    if (existing.rowCount) throw app.httpErrors.conflict("An account already exists for this email");
    const id = randomUUID();
    await client.query(
      "INSERT INTO users (id,email,password_hash,status) VALUES ($1,$2,$3,'active')",
      [id, email, passwordHash]
    );
    await client.query(
      "INSERT INTO profiles (user_id,display_name) VALUES ($1,$2)",
      [id, body.name.trim()]
    );
    await client.query(
      "INSERT INTO user_roles (user_id,role) VALUES ($1,$2)",
      [id, invite.rows[0]!.role]
    );
    await client.query(
      `INSERT INTO room_members(room_id,user_id)
       SELECT id,$1 FROM rooms WHERE is_private=false AND archived_at IS NULL
       ON CONFLICT(room_id,user_id) DO NOTHING`,
      [id]
    );
    await client.query(
      "UPDATE invitations SET accepted_at=now(), accepted_by=$1 WHERE id=$2",
      [id, invite.rows[0]!.id]
    );
    return { id, email, role: invite.rows[0]!.role };
  });
  const token = await createSession({ userId:user.id, email:user.email, role:user.role });
  await db.query(
    `INSERT INTO audit_log(actor_id,action,target_type,target_id)
     VALUES($1,'member.invitation_accepted','user',$1)`,
    [user.id]
  );
  return reply.code(201).send({
    token,
    user: { id:user.id, email:user.email, role:user.role, displayName:body.name.trim(), onboardingCompleted:false }
  });
});

app.post("/v1/auth/password", { config: { rateLimit: { max: 8, timeWindow: "15 minutes" } } }, async request => {
  const body = z.object({ email:z.email(), password:z.string().min(8).max(128) }).parse(request.body);
  const result = await db.query<{
    id:string;email:string;password_hash:string;role:Session["role"];
    display_name:string;focuses:string[];onboarding_completed_at:string | null;
  }>(
    `SELECT u.id,u.email,u.password_hash,coalesce(ur.role,'member') role,
            p.display_name,p.focuses,p.onboarding_completed_at
     FROM users u JOIN profiles p ON p.user_id=u.id
     LEFT JOIN user_roles ur ON ur.user_id=u.id
     WHERE lower(u.email)=lower($1) AND u.status='active'`,
    [body.email.trim()]
  );
  const user = result.rows[0];
  if (!user || !(await verify(user.password_hash, body.password))) throw app.httpErrors.unauthorized("Email or password is incorrect");
  const token = await createSession({ userId:user.id, email:user.email, role:user.role });
  return {
    token,
    user: {
      id:user.id,email:user.email,role:user.role,display_name:user.display_name,
      focuses:user.focuses,onboarding_completed_at:user.onboarding_completed_at
    }
  };
});

app.post("/v1/auth/magic-link", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async request => {
  const body = z.object({ email:z.email() }).parse(request.body);
  if (config.NODE_ENV === "production" && !config.RESEND_API_KEY) {
    throw app.httpErrors.serviceUnavailable("Magic-link sign-in is temporarily unavailable");
  }
  const result = await db.query<{id:string;email:string}>("SELECT id,email FROM users WHERE lower(email)=lower($1) AND status='active'", [body.email.trim()]);
  const user = result.rows[0];
  if (user) {
    const token = newOpaqueToken();
    await redis.set(`magic:${hashOpaqueToken(token)}`, user.id, "EX", config.MAGIC_LINK_TTL_SECONDS);
    const link = deepLink("magic", { token });
    if (config.NODE_ENV === "development") return { accepted:true, developmentLink:link };
    await sendTransactionalEmail({
      to:user.email,
      subject:"Your Motion Only sign-in link",
      html:`<p>Use the secure link below to sign in to Motion Only.</p><p><a href="${link}">Sign in to Motion Only</a></p><p>This single-use link expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
      text:`Sign in to Motion Only: ${link}\n\nThis single-use link expires in 15 minutes. If you did not request it, you can ignore this email.`,
      idempotencyKey:`magic-${hashOpaqueToken(token)}`
    });
  }
  return { accepted:true };
});

app.post("/v1/auth/magic-link/verify", async request => {
  const body = z.object({ token:z.string().min(20) }).parse(request.body);
  const key = `magic:${hashOpaqueToken(body.token)}`;
  const userId = await redis.getdel(key);
  if (!userId) throw app.httpErrors.unauthorized("Magic link is invalid or expired");
  const result = await db.query<{
    id:string;email:string;role:Session["role"];display_name:string;
    focuses:string[];onboarding_completed_at:string | null;
  }>(
    `SELECT u.id,u.email,coalesce(ur.role,'member') role,p.display_name,p.focuses,p.onboarding_completed_at
     FROM users u JOIN profiles p ON p.user_id=u.id
     LEFT JOIN user_roles ur ON ur.user_id=u.id WHERE u.id=$1 AND u.status='active'`,
    [userId]
  );
  const user = result.rows[0];
  if (!user) throw app.httpErrors.unauthorized("Account is not active");
  const token = await createSession({ userId:user.id, email:user.email, role:user.role });
  return { token, user };
});

app.post("/v1/auth/logout", async request => {
  const token = bearer(request);
  if (token) await revokeSession(token);
  return { success:true };
});

app.post("/v1/realtime-ticket", async request => {
  const session = await requireSession(request);
  const ticket = newOpaqueToken(24);
  await redis.set(`realtime-ticket:${hashOpaqueToken(ticket)}`,JSON.stringify(session),"EX",60);
  return {ticket,expiresInSeconds:60};
});

app.post("/v1/auth/password-reset/request", { config: { rateLimit: { max: 5, timeWindow: "30 minutes" } } }, async request => {
  const body = z.object({ email:z.email() }).parse(request.body);
  if (config.NODE_ENV === "production" && !config.RESEND_API_KEY) {
    throw app.httpErrors.serviceUnavailable("Password recovery is temporarily unavailable");
  }
  const result = await db.query<{id:string;email:string}>(
    "SELECT id,email FROM users WHERE lower(email)=lower($1) AND status='active'",
    [body.email.trim()]
  );
  const user = result.rows[0];
  if (user) {
    const token = newOpaqueToken();
    await redis.set(`password-reset:${hashOpaqueToken(token)}`, user.id, "EX", config.PASSWORD_RESET_TTL_SECONDS);
    const link = deepLink("reset-password", { token });
    if (config.NODE_ENV === "development") return { accepted:true, developmentLink:link };
    await sendTransactionalEmail({
      to:user.email,
      subject:"Reset your Motion Only password",
      html:`<p>Use the secure link below to set a new Motion Only password.</p><p><a href="${link}">Reset password</a></p><p>This single-use link expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
      text:`Reset your Motion Only password: ${link}\n\nThis single-use link expires in 15 minutes. If you did not request it, you can ignore this email.`,
      idempotencyKey:`password-reset-${hashOpaqueToken(token)}`
    });
  }
  return { accepted:true };
});

app.post("/v1/auth/password-reset/confirm", { config: { rateLimit: { max: 8, timeWindow: "30 minutes" } } }, async request => {
  const body = z.object({ token:z.string().min(20), password:z.string().min(8).max(128) }).parse(request.body);
  const key = `password-reset:${hashOpaqueToken(body.token)}`;
  const userId = await redis.getdel(key);
  if (!userId) throw app.httpErrors.unauthorized("Password reset link is invalid or expired");
  const passwordHash = await hash(body.password);
  const updated = await db.query(
    "UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2 AND status='active' RETURNING id",
    [passwordHash,userId]
  );
  if (!updated.rowCount) throw app.httpErrors.unauthorized("Account is not active");
  await revokeAllUserSessions(userId);
  await db.query(
    `INSERT INTO audit_log(actor_id,action,target_type,target_id)
     VALUES($1,'member.password_reset','user',$1)`,
    [userId]
  );
  return { success:true };
});

app.get("/v1/me", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT u.id,u.email,p.display_name,p.bio,p.focuses,p.avatar_key,ps.profile_visibility,
            ps.progress_visibility,ps.messaging_permission
     FROM users u JOIN profiles p ON p.user_id=u.id
     JOIN privacy_settings ps ON ps.user_id=u.id WHERE u.id=$1`,
    [session.userId]
  );
  return { ...result.rows[0], role:session.role };
});

app.patch("/v1/me", async request => {
  const session = await requireSession(request);
  const body = z.object({
    displayName:z.string().min(2).max(80).optional(),
    bio:z.string().max(600).nullable().optional(),
    focuses:z.array(z.enum(["Business","Trading","Fitness"])).min(1).max(3).optional(),
    timezone:z.string().min(1).max(80).optional(),
    onboardingCompleted:z.boolean().optional(),
    profileVisibility:z.enum(["private","members"]).optional(),
    progressVisibility:z.enum(["private","members"]).optional(),
    messagingPermission:z.enum(["members","connections","nobody"]).optional()
  }).parse(request.body);
  if(body.timezone){
    const timezone=await db.query("SELECT 1 FROM pg_timezone_names WHERE name=$1",[body.timezone]);
    if(!timezone.rowCount)throw app.httpErrors.badRequest("Choose a valid timezone");
  }

  return transaction(async client => {
    const profile = await client.query(
      `UPDATE profiles SET
         display_name=coalesce($1,display_name),
         bio=CASE WHEN $2::boolean THEN $3 ELSE bio END,
         focuses=coalesce($4::focus_area[],focuses),
         timezone=coalesce($5,timezone),
         onboarding_completed_at=CASE
           WHEN $6::boolean THEN coalesce(onboarding_completed_at,now())
           ELSE onboarding_completed_at
         END,
         updated_at=now()
       WHERE user_id=$7
       RETURNING display_name,bio,focuses,timezone,onboarding_completed_at`,
      [
        body.displayName?.trim() ?? null,
        body.bio !== undefined,
        body.bio?.trim() || null,
        body.focuses ?? null,
        body.timezone ?? null,
        body.onboardingCompleted ?? false,
        session.userId
      ]
    );
    const privacy = await client.query(
      `UPDATE privacy_settings SET
         profile_visibility=coalesce($1,profile_visibility),
         progress_visibility=coalesce($2,progress_visibility),
         messaging_permission=coalesce($3,messaging_permission),
         updated_at=now()
       WHERE user_id=$4
       RETURNING profile_visibility,progress_visibility,messaging_permission`,
      [body.profileVisibility ?? null,body.progressVisibility ?? null,body.messagingPermission ?? null,session.userId]
    );
    return { ...profile.rows[0], ...privacy.rows[0], role:session.role, email:session.email };
  });
});

app.get("/v1/goals", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT id,title,focus,progress,target_date,status,created_at
     FROM goals WHERE owner_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`,
    [session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/goals", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({ title:z.string().min(2).max(180), focus:z.enum(["Business","Trading","Fitness"]), targetDate:z.iso.date().optional() }).parse(request.body);
  const id = randomUUID();
  const result = await db.query(
    `INSERT INTO goals (id,owner_id,title,focus,target_date,visibility)
     VALUES ($1,$2,$3,$4,$5,'private') RETURNING *`,
    [id,session.userId,body.title.trim(),body.focus,body.targetDate ?? null]
  );
  return reply.code(201).send(result.rows[0]);
});

app.patch("/v1/goals/:id/progress", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ progress:z.number().int().min(0).max(100), note:z.string().max(1000).optional() }).parse(request.body);
  return transaction(async client => {
    const updated = await client.query(
      `UPDATE goals SET progress=$1,updated_at=now() WHERE id=$2 AND owner_id=$3 AND deleted_at IS NULL RETURNING *`,
      [body.progress,params.id,session.userId]
    );
    if (!updated.rowCount) throw app.httpErrors.notFound("Goal not found");
    await client.query("INSERT INTO goal_updates (id,goal_id,user_id,progress,note) VALUES ($1,$2,$3,$4,$5)", [randomUUID(),params.id,session.userId,body.progress,body.note ?? null]);
    const localDate = await client.query<{local_date:string}>(
      `SELECT (now() AT TIME ZONE timezone)::date local_date FROM profiles WHERE user_id=$1`,
      [session.userId]
    );
    const reward = await client.query(
      "SELECT * FROM award_progress_event($1::uuid,'goal_progress','goal',$2::uuid,$3::text,5::smallint,6::smallint,3::smallint)",
      [session.userId,params.id,`goal:${params.id}:${localDate.rows[0]!.local_date}`]
    );
    return { ...updated.rows[0], progression:reward.rows[0] };
  });
});

app.patch("/v1/goals/:id", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({
    title:z.string().min(2).max(180).optional(),
    focus:z.enum(["Business","Trading","Fitness"]).optional(),
    targetDate:z.iso.date().nullable().optional(),
    status:z.enum(["active","completed","paused"]).optional()
  }).parse(request.body);
  const result = await db.query(
    `UPDATE goals SET
       title=coalesce($1,title),
       focus=coalesce($2::focus_area,focus),
       target_date=CASE WHEN $3::boolean THEN $4 ELSE target_date END,
       status=coalesce($5,status),
       updated_at=now()
     WHERE id=$6 AND owner_id=$7 AND deleted_at IS NULL
     RETURNING *`,
    [
      body.title?.trim() ?? null,
      body.focus ?? null,
      body.targetDate !== undefined,
      body.targetDate ?? null,
      body.status ?? null,
      params.id,
      session.userId
    ]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Goal not found");
  return result.rows[0];
});

app.delete("/v1/goals/:id", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const result = await db.query(
    "UPDATE goals SET deleted_at=now(),updated_at=now() WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL RETURNING id",
    [params.id,session.userId]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Goal not found");
  return reply.code(204).send();
});

app.get("/v1/motions", async request => {
  const session = await requireSession(request);
  const query = z.object({ date:z.iso.date().optional() }).parse(request.query);
  const result = await db.query(
    `SELECT m.id,m.title,m.focus,m.scheduled_date,m.completed_at,m.created_at
     FROM daily_motions m JOIN profiles p ON p.user_id=m.owner_id
     WHERE m.owner_id=$1
       AND m.scheduled_date=coalesce($2::date,(now() AT TIME ZONE p.timezone)::date)
       AND m.deleted_at IS NULL
     ORDER BY m.created_at`,
    [session.userId,query.date ?? null]
  );
  return { items:result.rows };
});

app.post("/v1/motions", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({
    title:z.string().min(2).max(180),
    focus:z.enum(["Business","Trading","Fitness"]),
    scheduledDate:z.iso.date().optional()
  }).parse(request.body);
  const result = await db.query(
    `INSERT INTO daily_motions(id,owner_id,title,focus,scheduled_date)
     SELECT $1,$2,$3,$4,coalesce($5::date,(now() AT TIME ZONE timezone)::date)
     FROM profiles WHERE user_id=$2
     RETURNING *`,
    [randomUUID(),session.userId,body.title.trim(),body.focus,body.scheduledDate ?? null]
  );
  return reply.code(201).send(result.rows[0]);
});

app.patch("/v1/motions/:id", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ completed:z.boolean() }).parse(request.body);
  return transaction(async client => {
    const result = await client.query(
      `UPDATE daily_motions SET completed_at=CASE WHEN $1 THEN coalesce(completed_at,now()) ELSE NULL END,updated_at=now()
       WHERE id=$2 AND owner_id=$3 AND deleted_at IS NULL RETURNING *`,
      [body.completed,params.id,session.userId]
    );
    if (!result.rowCount) throw app.httpErrors.notFound("Motion not found");
    if (!body.completed) return { ...result.rows[0], progression:null };
    const reward = await client.query(
      "SELECT * FROM award_progress_event($1::uuid,'priority_motion','motion',$2::uuid,$3::text,5::smallint,12::smallint,3::smallint)",
      [session.userId,params.id,`motion:${params.id}:completed`]
    );
    return { ...result.rows[0], progression:reward.rows[0] };
  });
});

app.delete("/v1/motions/:id", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const result = await db.query(
    "UPDATE daily_motions SET deleted_at=now(),updated_at=now() WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL RETURNING id",
    [params.id,session.userId]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Motion not found");
  return reply.code(204).send();
});

app.get("/v1/habits", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT h.id,h.title,h.focus,h.cadence,h.active,h.created_at,
       EXISTS(
         SELECT 1 FROM habit_checkins hc JOIN profiles p ON p.user_id=h.owner_id
         WHERE hc.habit_id=h.id AND hc.checkin_date=(now() AT TIME ZONE p.timezone)::date
       ) checked_today,
       (SELECT count(*)::integer FROM habit_checkins hc
        WHERE hc.habit_id=h.id AND hc.checkin_date >= current_date-29) checkins_last_30
     FROM habits h WHERE h.owner_id=$1 AND h.active
     ORDER BY h.created_at`,
    [session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/habits", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({
    title:z.string().min(2).max(180),
    focus:z.enum(["Business","Trading","Fitness"]),
    cadence:z.object({ frequency:z.enum(["daily"]).default("daily") }).default({frequency:"daily"})
  }).parse(request.body);
  const result = await db.query(
    `INSERT INTO habits(id,owner_id,title,focus,cadence)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [randomUUID(),session.userId,body.title.trim(),body.focus,body.cadence]
  );
  return reply.code(201).send(result.rows[0]);
});

app.put("/v1/habits/:id/check-in", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ checked:z.boolean(), note:z.string().max(500).optional() }).parse(request.body);
  return transaction(async client => {
    const habit = await client.query(
      `SELECT h.id,(now() AT TIME ZONE p.timezone)::date local_date
       FROM habits h JOIN profiles p ON p.user_id=h.owner_id
       WHERE h.id=$1 AND h.owner_id=$2 AND h.active`,
      [params.id,session.userId]
    );
    if (!habit.rowCount) throw app.httpErrors.notFound("Habit not found");
    const localDate = habit.rows[0]!.local_date as string;
    if (!body.checked) {
      await client.query("DELETE FROM habit_checkins WHERE habit_id=$1 AND user_id=$2 AND checkin_date=$3", [params.id,session.userId,localDate]);
      return { checked:false, checkinDate:localDate, progression:null };
    }
    await client.query(
      `INSERT INTO habit_checkins(habit_id,user_id,checkin_date,note)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(habit_id,checkin_date) DO UPDATE SET note=excluded.note`,
      [params.id,session.userId,localDate,body.note ?? null]
    );
    const reward = await client.query(
      "SELECT * FROM award_progress_event($1::uuid,'standard_checkin','habit',$2::uuid,$3::text,3::smallint,8::smallint,3::smallint)",
      [session.userId,params.id,`habit:${params.id}:${localDate}`]
    );
    return { checked:true, checkinDate:localDate, progression:reward.rows[0] };
  });
});

app.delete("/v1/habits/:id", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const result = await db.query(
    "UPDATE habits SET active=false WHERE id=$1 AND owner_id=$2 AND active RETURNING id",
    [params.id,session.userId]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Habit not found");
  return reply.code(204).send();
});

app.get("/v1/library-progress", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT resource_id,saved,checklist,started_at,completed_at,updated_at
     FROM library_progress WHERE user_id=$1 ORDER BY updated_at DESC`,
    [session.userId]
  );
  return { items:result.rows };
});

app.put("/v1/library-progress/:resourceId", async request => {
  const session = await requireSession(request);
  const params = z.object({ resourceId:z.string().min(2).max(120) }).parse(request.params);
  const body = z.object({
    saved:z.boolean().optional(),
    checklist:z.array(z.number().int().min(0).max(50)).max(50).optional(),
    completed:z.boolean().optional()
  }).parse(request.body);
  const result = await db.query(
    `INSERT INTO library_progress(user_id,resource_id,saved,checklist,started_at,completed_at)
     VALUES($1,$2,coalesce($3,false),coalesce($4::jsonb,'[]'::jsonb),now(),CASE WHEN $5 THEN now() ELSE NULL END)
     ON CONFLICT(user_id,resource_id) DO UPDATE SET
       saved=coalesce($3,library_progress.saved),
       checklist=coalesce($4::jsonb,library_progress.checklist),
       started_at=coalesce(library_progress.started_at,now()),
       completed_at=CASE
         WHEN $5::boolean THEN coalesce(library_progress.completed_at,now())
         WHEN $6::boolean THEN NULL
         ELSE library_progress.completed_at
       END,
       updated_at=now()
     RETURNING *`,
    [
      session.userId,
      params.resourceId,
      body.saved ?? null,
      body.checklist ? JSON.stringify([...new Set(body.checklist)].sort((a,b)=>a-b)) : null,
      body.completed === true,
      body.completed === false
    ]
  );
  return result.rows[0];
});

app.get("/v1/progression", async request => {
  const session = await requireSession(request);
  const [profile,week,events,history,levels] = await Promise.all([
    db.query(
      `SELECT lifetime_xp,current_level,momentum_streak,best_momentum_streak
       FROM progression_profiles WHERE user_id=$1`,
      [session.userId]
    ),
    db.query(
      `SELECT week_start,points,status,bonus_xp
       FROM momentum_weeks WHERE user_id=$1 AND week_start=local_week_start($1::uuid)
       LIMIT 1`,
      [session.userId]
    ),
    db.query(
      `SELECT event_type,source_type,xp_points,momentum_points,occurred_at,metadata
       FROM progression_events WHERE user_id=$1 ORDER BY occurred_at DESC LIMIT 25`,
      [session.userId]
    ),
    db.query(
      `SELECT week_start,points,status,bonus_xp
       FROM momentum_weeks WHERE user_id=$1 ORDER BY week_start DESC LIMIT 8`,
      [session.userId]
    ),
    db.query("SELECT level,name,xp_required FROM level_definitions ORDER BY level")
  ]);
  return {
    profile:profile.rows[0] ?? {lifetime_xp:0,current_level:1,momentum_streak:0,best_momentum_streak:0},
    week:week.rows[0] ?? {week_start:null,points:0,status:"building",bonus_xp:0},
    events:events.rows,
    history:history.rows,
    levels:levels.rows
  };
});

app.post("/v1/progression/weekly-review", async request => {
  const session = await requireSession(request);
  const body = z.object({
    reflection:z.string().min(20).max(4000),
    wins:z.array(z.string().min(2).max(300)).max(5).default([]),
    nextWeekFocus:z.string().min(2).max(500)
  }).parse(request.body);
  const week = await db.query<{week_start:string}>("SELECT local_week_start($1::uuid) week_start",[session.userId]);
  const weekStart = week.rows[0]!.week_start;
  const reward = await transaction(async client => {
    await client.query(
      `INSERT INTO weekly_reviews(user_id,week_start,reflection,wins,next_week_focus)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(user_id,week_start) DO UPDATE SET
         reflection=excluded.reflection,wins=excluded.wins,next_week_focus=excluded.next_week_focus,updated_at=now()`,
      [session.userId,weekStart,body.reflection,JSON.stringify(body.wins),body.nextWeekFocus]
    );
    return client.query(
      `SELECT * FROM award_progress_event($1::uuid,'weekly_review','momentum_week',NULL::uuid,$2::text,10::smallint,10::smallint,1::smallint)`,
      [session.userId,`weekly-review:${weekStart}`]
    );
  });
  await db.query(
    `INSERT INTO audit_log(actor_id,action,target_type,metadata)
     VALUES($1,'weekly_review.completed','momentum_week',$2)`,
    [session.userId,{weekStart}]
  );
  return { weekStart, progression:reward.rows[0] };
});

app.get("/v1/members", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT u.id,p.display_name,p.bio,p.focuses,p.avatar_key
     FROM users u
     JOIN profiles p ON p.user_id=u.id
     JOIN privacy_settings ps ON ps.user_id=u.id
     WHERE u.status='active' AND u.id<>$1 AND ps.profile_visibility='members'
       AND NOT EXISTS (
         SELECT 1 FROM member_blocks b
         WHERE (b.blocker_id=$1 AND b.blocked_id=u.id)
            OR (b.blocker_id=u.id AND b.blocked_id=$1)
       )
     ORDER BY p.display_name
     LIMIT 100`,
    [session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/members/:id/block", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  if (params.id === session.userId) throw app.httpErrors.badRequest("You cannot block yourself");
  await db.query(
    `INSERT INTO member_blocks(blocker_id,blocked_id) VALUES($1,$2)
     ON CONFLICT(blocker_id,blocked_id) DO NOTHING`,
    [session.userId,params.id]
  );
  return reply.code(204).send();
});

app.delete("/v1/members/:id/block", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  await db.query("DELETE FROM member_blocks WHERE blocker_id=$1 AND blocked_id=$2",[session.userId,params.id]);
  return reply.code(204).send();
});

app.get("/v1/rooms", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT r.id,r.title,r.slug,r.description,r.focus,r.is_private,
            count(rm2.user_id)::integer member_count
     FROM rooms r
     JOIN room_members mine ON mine.room_id=r.id AND mine.user_id=$1
     LEFT JOIN room_members rm2 ON rm2.room_id=r.id
     WHERE r.archived_at IS NULL
     GROUP BY r.id
     ORDER BY r.created_at`,
    [session.userId]
  );
  return { items:result.rows };
});

app.get("/v1/rooms/:id/messages", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const query = z.object({ before:z.iso.datetime().optional() }).parse(request.query);
  const access = await db.query("SELECT 1 FROM room_members WHERE room_id=$1 AND user_id=$2",[params.id,session.userId]);
  if (!access.rowCount) throw app.httpErrors.notFound("Room not found");
  const result = await db.query(
    `SELECT m.id,m.room_id,m.sender_id,p.display_name,m.body,m.created_at,m.edited_at
     FROM room_messages m JOIN profiles p ON p.user_id=m.sender_id
     WHERE m.room_id=$1 AND m.deleted_at IS NULL AND m.created_at<coalesce($2::timestamptz,'infinity')
     ORDER BY m.created_at DESC LIMIT 100`,
    [params.id,query.before ?? null]
  );
  return { items:result.rows.reverse() };
});

app.post("/v1/rooms/:id/messages", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ body:z.string().trim().min(1).max(4000) }).parse(request.body);
  const result = await db.query(
    `INSERT INTO room_messages(id,room_id,sender_id,body)
     SELECT $1,$2,$3,$4
     WHERE EXISTS(SELECT 1 FROM room_members WHERE room_id=$2 AND user_id=$3)
     RETURNING id,room_id,sender_id,body,created_at`,
    [randomUUID(),params.id,session.userId,body.body]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Room not found");
  const profile = await db.query<{display_name:string}>("SELECT display_name FROM profiles WHERE user_id=$1",[session.userId]);
  const message = { ...result.rows[0], display_name:profile.rows[0]!.display_name };
  broadcastRoom(params.id,{type:"room.message",...message});
  return reply.code(201).send(message);
});

app.get("/v1/direct-threads", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT t.id,other.id member_id,p.display_name,p.focuses,p.avatar_key,
            last_message.body last_message,last_message.created_at last_message_at
     FROM direct_threads t
     JOIN direct_thread_members mine ON mine.thread_id=t.id AND mine.user_id=$1
     JOIN direct_thread_members other ON other.thread_id=t.id AND other.user_id<>$1
     JOIN users other_user ON other_user.id=other.user_id AND other_user.status='active'
     JOIN profiles p ON p.user_id=other.user_id
     LEFT JOIN LATERAL (
       SELECT dm.body,dm.created_at FROM direct_messages dm
       WHERE dm.thread_id=t.id AND dm.deleted_at IS NULL
       ORDER BY dm.created_at DESC LIMIT 1
     ) last_message ON true
     WHERE NOT EXISTS (
       SELECT 1 FROM member_blocks b
       WHERE (b.blocker_id=$1 AND b.blocked_id=other.user_id)
          OR (b.blocker_id=other.user_id AND b.blocked_id=$1)
     )
     ORDER BY last_message.created_at DESC NULLS LAST,t.created_at DESC`,
    [session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/direct-threads", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({ memberId:z.uuid() }).parse(request.body);
  if (body.memberId === session.userId) throw app.httpErrors.badRequest("Choose another member");
  const allowed = await db.query(
    `SELECT 1 FROM users u JOIN privacy_settings ps ON ps.user_id=u.id
     WHERE u.id=$1 AND u.status='active' AND ps.profile_visibility='members'
       AND ps.messaging_permission<>'nobody'
       AND NOT EXISTS(
         SELECT 1 FROM member_blocks b
         WHERE (b.blocker_id=$1 AND b.blocked_id=$2)
            OR (b.blocker_id=$2 AND b.blocked_id=$1)
       )`,
    [body.memberId,session.userId]
  );
  if (!allowed.rowCount) throw app.httpErrors.forbidden("This member is not available for messages");
  const pairKey = [session.userId,body.memberId].sort().join(":");
  const thread = await transaction(async client => {
    const existing = await client.query<{id:string}>("SELECT id FROM direct_threads WHERE metadata->>'pair_key'=$1",[pairKey]);
    if (existing.rowCount) return existing.rows[0]!;
    const id = randomUUID();
    await client.query("INSERT INTO direct_threads(id,metadata) VALUES($1,$2)",[id,{pair_key:pairKey}]);
    await client.query(
      "INSERT INTO direct_thread_members(thread_id,user_id) VALUES($1,$2),($1,$3)",
      [id,session.userId,body.memberId]
    );
    return {id};
  });
  return reply.code(201).send(thread);
});

app.get("/v1/direct-threads/:id/messages", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const access = await db.query(
    `SELECT 1 FROM direct_thread_members mine
     WHERE mine.thread_id=$1 AND mine.user_id=$2
       AND NOT EXISTS(
         SELECT 1 FROM direct_thread_members other
         JOIN member_blocks b ON
           (b.blocker_id=$2 AND b.blocked_id=other.user_id)
           OR (b.blocker_id=other.user_id AND b.blocked_id=$2)
         WHERE other.thread_id=$1 AND other.user_id<>$2
       )`,
    [params.id,session.userId]
  );
  if (!access.rowCount) throw app.httpErrors.notFound("Conversation not found");
  const result = await db.query(
    `SELECT dm.id,dm.sender_id,p.display_name,dm.body,dm.created_at
     FROM direct_messages dm JOIN profiles p ON p.user_id=dm.sender_id
     WHERE dm.thread_id=$1 AND dm.deleted_at IS NULL
     ORDER BY dm.created_at DESC LIMIT 100`,
    [params.id]
  );
  return { items:result.rows.reverse() };
});

app.post("/v1/direct-threads/:id/messages", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ body:z.string().trim().min(1).max(4000) }).parse(request.body);
  const result = await db.query(
    `INSERT INTO direct_messages(id,thread_id,sender_id,body)
     SELECT $1,$2,$3,$4
     WHERE EXISTS(SELECT 1 FROM direct_thread_members WHERE thread_id=$2 AND user_id=$3)
       AND NOT EXISTS(
         SELECT 1 FROM direct_thread_members other
         JOIN member_blocks b ON
           (b.blocker_id=$3 AND b.blocked_id=other.user_id)
           OR (b.blocker_id=other.user_id AND b.blocked_id=$3)
         WHERE other.thread_id=$2 AND other.user_id<>$3
       )
     RETURNING id,thread_id,sender_id,body,created_at`,
    [randomUUID(),params.id,session.userId,body.body]
  );
  if (!result.rowCount) throw app.httpErrors.forbidden("Conversation is not available");
  const recipients = await db.query<{user_id:string}>(
    "SELECT user_id FROM direct_thread_members WHERE thread_id=$1 AND user_id<>$2",
    [params.id,session.userId]
  );
  await Promise.all(recipients.rows.map(recipient=>db.query(
    `INSERT INTO notifications(id,user_id,type,payload)
     VALUES($1,$2,'direct_message',$3)`,
    [randomUUID(),recipient.user_id,{threadId:params.id,senderId:session.userId}]
  )));
  const profile = await db.query<{display_name:string}>("SELECT display_name FROM profiles WHERE user_id=$1",[session.userId]);
  const message={...result.rows[0],display_name:profile.rows[0]!.display_name};
  broadcastThread(params.id,{type:"direct.message",...message});
  return reply.code(201).send(message);
});

app.get("/v1/projects", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT p.id,p.title,p.description,p.owner_id,p.progress,pm.role,
            count(pm2.user_id)::integer member_count
     FROM projects p
     JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=$1
     LEFT JOIN project_members pm2 ON pm2.project_id=p.id
     WHERE p.archived_at IS NULL
     GROUP BY p.id,pm.role ORDER BY p.created_at DESC`,
    [session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/projects", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({
    title:z.string().trim().min(2).max(180),
    description:z.string().trim().max(2000).optional()
  }).parse(request.body);
  const project = await transaction(async client => {
    const result = await client.query(
      `INSERT INTO projects(id,title,description,owner_id,visibility)
       VALUES($1,$2,$3,$4,'private') RETURNING *`,
      [randomUUID(),body.title,body.description ?? null,session.userId]
    );
    await client.query("INSERT INTO project_members(project_id,user_id,role) VALUES($1,$2,'owner')",[result.rows[0]!.id,session.userId]);
    return result.rows[0];
  });
  return reply.code(201).send(project);
});

app.get("/v1/projects/:id/updates", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const result = await db.query(
    `SELECT pu.id,pu.author_id,p.display_name,pu.body,pu.created_at
     FROM project_updates pu JOIN profiles p ON p.user_id=pu.author_id
     WHERE pu.project_id=$1 AND pu.deleted_at IS NULL
       AND EXISTS(SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2)
     ORDER BY pu.created_at`,
    [params.id,session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/projects/:id/updates", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ body:z.string().trim().min(1).max(4000) }).parse(request.body);
  const result = await db.query(
    `INSERT INTO project_updates(id,project_id,author_id,body)
     SELECT $1,$2,$3,$4
     WHERE EXISTS(SELECT 1 FROM project_members WHERE project_id=$2 AND user_id=$3)
     RETURNING *`,
    [randomUUID(),params.id,session.userId,body.body]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Project not found");
  return reply.code(201).send(result.rows[0]);
});

app.post("/v1/projects/:id/members", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({ memberId:z.uuid() }).parse(request.body);
  const access = await db.query(
    `SELECT 1 FROM projects p JOIN project_members pm ON pm.project_id=p.id
     WHERE p.id=$1 AND pm.user_id=$2 AND (p.owner_id=$2 OR pm.role='owner')`,
    [params.id,session.userId]
  );
  if (!access.rowCount) throw app.httpErrors.forbidden("Only the project owner can invite members");
  await db.query(
    `INSERT INTO project_members(project_id,user_id)
     SELECT $1,$2 WHERE EXISTS(SELECT 1 FROM users WHERE id=$2 AND status='active')
     ON CONFLICT(project_id,user_id) DO NOTHING`,
    [params.id,body.memberId]
  );
  await db.query(
    `INSERT INTO notifications(id,user_id,type,payload) VALUES($1,$2,'project_invitation',$3)`,
    [randomUUID(),body.memberId,{projectId:params.id}]
  );
  return reply.code(204).send();
});

app.patch("/v1/projects/:id", async request => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({
    title:z.string().trim().min(2).max(180).optional(),
    description:z.string().trim().max(2000).nullable().optional(),
    progress:z.number().int().min(0).max(100).optional()
  }).parse(request.body);
  const result = await db.query(
    `UPDATE projects SET title=coalesce($1,title),
       description=CASE WHEN $2::boolean THEN $3 ELSE description END,
       progress=coalesce($4,progress)
     WHERE id=$5 AND owner_id=$6 AND archived_at IS NULL RETURNING *`,
    [body.title ?? null,body.description !== undefined,body.description ?? null,body.progress ?? null,params.id,session.userId]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Project not found");
  return result.rows[0];
});

app.post("/v1/files", async (request, reply) => {
  const session = await requireSession(request);
  const upload=await request.file();
  if(!upload)throw app.httpErrors.badRequest("Choose one file to upload");
  const allowed=new Set(["image/jpeg","image/png","image/webp","application/pdf"]);
  if(!allowed.has(upload.mimetype))throw app.httpErrors.unsupportedMediaType("Use a JPEG, PNG, WebP or PDF file");
  const body=await upload.toBuffer();
  if(!body.length)throw app.httpErrors.badRequest("The uploaded file is empty");
  if(body.length>config.MAX_FILE_BYTES)throw app.httpErrors.payloadTooLarge("The file is too large");
  const id=randomUUID();
  const safeName=upload.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120)||"evidence";
  const key=`members/${session.userId}/${id}/${safeName}`;
  await storePrivateObject(key,body,upload.mimetype);
  try{
    const result=await db.query(
      `INSERT INTO private_files(id,owner_id,storage_key,original_name,content_type,byte_size,sha256)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,original_name,content_type,byte_size,created_at`,
      [id,session.userId,key,upload.filename.slice(0,255),upload.mimetype,body.length,createHash("sha256").update(body).digest("hex")]
    );
    return reply.code(201).send(result.rows[0]);
  }catch(error){
    await deletePrivateObject(key).catch(()=>undefined);
    throw error;
  }
});

app.get("/v1/files/:id/download", async request => {
  const session = await requireSession(request);
  const params=z.object({id:z.uuid()}).parse(request.params);
  const result=await db.query<{storage_key:string;original_name:string}>(
    `SELECT storage_key,original_name FROM private_files
     WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL`,
    [params.id,session.userId]
  );
  if(!result.rowCount)throw app.httpErrors.notFound("File not found");
  const file=result.rows[0]!;
  return {url:await privateDownloadUrl(file.storage_key,file.original_name),expiresInSeconds:300};
});

app.delete("/v1/files/:id", async (request, reply) => {
  const session = await requireSession(request);
  const params=z.object({id:z.uuid()}).parse(request.params);
  const result=await db.query<{storage_key:string}>(
    `UPDATE private_files SET deleted_at=now()
     WHERE id=$1 AND owner_id=$2 AND deleted_at IS NULL RETURNING storage_key`,
    [params.id,session.userId]
  );
  if(!result.rowCount)throw app.httpErrors.notFound("File not found");
  await deletePrivateObject(result.rows[0]!.storage_key);
  return reply.code(204).send();
});

app.get("/v1/achievements", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT id,title,description,evidence_file_id,achieved_at,created_at
     FROM achievements WHERE owner_id=$1 ORDER BY achieved_at DESC`,
    [session.userId]
  );
  return { items:result.rows };
});

app.post("/v1/achievements", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({
    title:z.string().trim().min(2).max(180),
    description:z.string().trim().max(2000).optional(),
    achievedAt:z.iso.datetime().optional(),
    evidenceFileId:z.uuid().optional()
  }).parse(request.body);
  const result = await db.query(
    `INSERT INTO achievements(id,owner_id,title,description,visibility,achieved_at)
     SELECT $1,$2,$3,$4,'private',coalesce($5::timestamptz,now())
     WHERE $6::uuid IS NULL OR EXISTS(
       SELECT 1 FROM private_files WHERE id=$6 AND owner_id=$2 AND deleted_at IS NULL
     )
     RETURNING *`,
    [randomUUID(),session.userId,body.title,body.description ?? null,body.achievedAt ?? null,body.evidenceFileId ?? null]
  );
  if(!result.rowCount)throw app.httpErrors.badRequest("Achievement evidence is not available");
  if(body.evidenceFileId){
    await db.query("UPDATE achievements SET evidence_file_id=$1 WHERE id=$2",[body.evidenceFileId,result.rows[0]!.id]);
    result.rows[0]!.evidence_file_id=body.evidenceFileId;
  }
  return reply.code(201).send(result.rows[0]);
});

app.get("/v1/notifications", async request => {
  const session = await requireSession(request);
  const result = await db.query(
    `SELECT id,type,payload,read_at,created_at FROM notifications
     WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [session.userId]
  );
  return { items:result.rows };
});

app.patch("/v1/notifications/:id/read", async (request, reply) => {
  const session = await requireSession(request);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  await db.query("UPDATE notifications SET read_at=coalesce(read_at,now()) WHERE id=$1 AND user_id=$2",[params.id,session.userId]);
  return reply.code(204).send();
});

app.post("/v1/moderation/reports", async (request, reply) => {
  const session = await requireSession(request);
  const body = z.object({
    targetType:z.enum(["member","room_message","direct_message","project_update"]),
    targetId:z.uuid(),
    reason:z.string().trim().min(2).max(120),
    detail:z.string().trim().max(2000).optional()
  }).parse(request.body);
  const result = await db.query(
    `INSERT INTO moderation_reports(id,reporter_id,target_type,target_id,reason,detail)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status,created_at`,
    [randomUUID(),session.userId,body.targetType,body.targetId,body.reason,body.detail ?? null]
  );
  return reply.code(201).send(result.rows[0]);
});

app.post("/v1/admin/invitations", async (request, reply) => {
  const session = await requireRole(request,["admin"]);
  const body = z.object({ email:z.email(), role:z.enum(["member","moderator","admin"]).default("member"), expiresInDays:z.number().int().min(1).max(30).default(7) }).parse(request.body);
  const token = newOpaqueToken(24);
  const id = randomUUID();
  await db.query(
    `INSERT INTO invitations (id,email,token_hash,role,invited_by,expires_at)
     VALUES ($1,$2,$3,$4,$5,now()+make_interval(days=>$6::integer))`,
    [id,body.email.trim().toLowerCase(),hashOpaqueToken(token),body.role,session.userId,body.expiresInDays]
  );
  const appUrl = config.PUBLIC_APP_URL?.replace(/\/+$/,"");
  const joinLink = appUrl ? `${appUrl}/join?code=${encodeURIComponent(token)}&email=${encodeURIComponent(body.email.trim().toLowerCase())}` : deepLink("join",{code:token,email:body.email.trim().toLowerCase()});
  let emailSent=false;
  if (config.RESEND_API_KEY) {
    emailSent=await sendTransactionalEmail({
      to:body.email.trim().toLowerCase(),
      subject:"You are invited to Motion Only",
      html:`<p>You have been invited to the private Motion Only test group.</p><p><a href="${joinLink}">Accept your invitation</a></p><p>This invitation expires in ${body.expiresInDays} days and can only be used by your email address.</p>`,
      text:`You have been invited to the private Motion Only test group.\n\nAccept your invitation: ${joinLink}\n\nThis invitation expires in ${body.expiresInDays} days.`,
      idempotencyKey:`invite-${id}`
    }).then(()=>true).catch(error=>{app.log.error(error,"Invitation email failed");return false;});
  }
  return reply.code(201).send({ id,inviteCode:token,joinLink,email:body.email,expiresInDays:body.expiresInDays,emailSent });
});

app.get("/v1/admin/invitations", async request => {
  await requireRole(request,["admin"]);
  const result = await db.query(
    `SELECT i.id,i.email,i.role,i.expires_at,i.accepted_at,i.revoked_at,i.created_at,
            inviter.display_name invited_by_name,accepted.display_name accepted_by_name
     FROM invitations i
     LEFT JOIN profiles inviter ON inviter.user_id=i.invited_by
     LEFT JOIN profiles accepted ON accepted.user_id=i.accepted_by
     ORDER BY i.created_at DESC LIMIT 200`
  );
  return { items:result.rows };
});

app.delete("/v1/admin/invitations/:id", async (request, reply) => {
  const session = await requireRole(request,["admin"]);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const result = await db.query(
    `UPDATE invitations SET revoked_at=now()
     WHERE id=$1 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING id`,
    [params.id]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Active invitation not found");
  await db.query(
    "INSERT INTO audit_log(actor_id,action,target_type,target_id) VALUES($1,'invitation.revoked','invitation',$2)",
    [session.userId,params.id]
  );
  return reply.code(204).send();
});

app.get("/v1/admin/members", async request => {
  await requireRole(request,["admin","moderator"]);
  const result = await db.query(
    `SELECT u.id,u.email,u.status,u.created_at,u.email_verified_at,
            p.display_name,p.focuses,p.onboarding_completed_at,
            coalesce(ur.role,'member') role,pp.lifetime_xp,pp.current_level
     FROM users u JOIN profiles p ON p.user_id=u.id
     LEFT JOIN user_roles ur ON ur.user_id=u.id
     LEFT JOIN progression_profiles pp ON pp.user_id=u.id
     WHERE u.deleted_at IS NULL ORDER BY u.created_at DESC`
  );
  return { items:result.rows };
});

app.patch("/v1/admin/members/:id", async request => {
  const session = await requireRole(request,["admin"]);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({
    status:z.enum(["active","suspended"]).optional(),
    role:z.enum(["member","moderator","admin"]).optional()
  }).parse(request.body);
  if (params.id === session.userId && (body.status === "suspended" || (body.role && body.role !== "admin"))) {
    throw app.httpErrors.badRequest("You cannot remove your own administrator access");
  }
  await transaction(async client => {
    if (body.status) {
      const updated = await client.query("UPDATE users SET status=$1,updated_at=now() WHERE id=$2 RETURNING id",[body.status,params.id]);
      if (!updated.rowCount) throw app.httpErrors.notFound("Member not found");
    }
    if (body.role) {
      const updated = await client.query(
        `INSERT INTO user_roles(user_id,role) VALUES($1,$2)
         ON CONFLICT(user_id) DO UPDATE SET role=excluded.role RETURNING user_id`,
        [params.id,body.role]
      );
      if (!updated.rowCount) throw app.httpErrors.notFound("Member not found");
    }
    await client.query(
      `INSERT INTO audit_log(actor_id,action,target_type,target_id,metadata)
       VALUES($1,'member.administration_updated','user',$2,$3)`,
      [session.userId,params.id,body]
    );
  });
  await revokeAllUserSessions(params.id);
  return { success:true };
});

app.get("/v1/admin/rooms", async request => {
  await requireRole(request,["admin","moderator"]);
  const result = await db.query(
    `SELECT r.id,r.title,r.slug,r.description,r.focus,r.is_private,r.created_at,r.archived_at,
            count(rm.user_id)::integer member_count
     FROM rooms r LEFT JOIN room_members rm ON rm.room_id=r.id
     GROUP BY r.id ORDER BY r.created_at`
  );
  return { items:result.rows };
});

app.post("/v1/admin/rooms", async (request, reply) => {
  const session = await requireRole(request,["admin"]);
  const body = z.object({
    title:z.string().trim().min(2).max(120),
    slug:z.string().trim().regex(/^[a-z0-9-]{2,80}$/),
    description:z.string().trim().max(600).optional(),
    focus:z.enum(["Business","Trading","Fitness"]).nullable().optional(),
    isPrivate:z.boolean().default(false)
  }).parse(request.body);
  const room = await transaction(async client => {
    const result = await client.query(
      `INSERT INTO rooms(id,title,slug,description,focus,is_private,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [randomUUID(),body.title,body.slug,body.description ?? null,body.focus ?? null,body.isPrivate,session.userId]
    );
    if (body.isPrivate) {
      await client.query("INSERT INTO room_members(room_id,user_id,role) VALUES($1,$2,'owner')",[result.rows[0]!.id,session.userId]);
    } else {
      await client.query(
        `INSERT INTO room_members(room_id,user_id)
         SELECT $1,id FROM users WHERE status='active'
         ON CONFLICT(room_id,user_id) DO NOTHING`,
        [result.rows[0]!.id]
      );
    }
    return result.rows[0];
  });
  return reply.code(201).send(room);
});

app.patch("/v1/admin/rooms/:id", async request => {
  await requireRole(request,["admin"]);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({
    title:z.string().trim().min(2).max(120).optional(),
    description:z.string().trim().max(600).nullable().optional(),
    archived:z.boolean().optional()
  }).parse(request.body);
  const result = await db.query(
    `UPDATE rooms SET title=coalesce($1,title),
       description=CASE WHEN $2::boolean THEN $3 ELSE description END,
       archived_at=CASE WHEN $4::boolean THEN now() WHEN $5::boolean THEN NULL ELSE archived_at END
     WHERE id=$6 RETURNING *`,
    [body.title ?? null,body.description !== undefined,body.description ?? null,body.archived === true,body.archived === false,params.id]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Room not found");
  return result.rows[0];
});

app.get("/v1/admin/moderation", async request => {
  await requireRole(request,["admin","moderator"]);
  const result = await db.query(
    `SELECT mr.*,reporter.display_name reporter_name,assignee.display_name assigned_to_name
     FROM moderation_reports mr
     JOIN profiles reporter ON reporter.user_id=mr.reporter_id
     LEFT JOIN profiles assignee ON assignee.user_id=mr.assigned_to
     ORDER BY CASE mr.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,mr.created_at`
  );
  return { items:result.rows };
});

app.patch("/v1/admin/moderation/:id", async request => {
  const session = await requireRole(request,["admin","moderator"]);
  const params = z.object({ id:z.uuid() }).parse(request.params);
  const body = z.object({
    status:z.enum(["open","reviewing","resolved","dismissed"]),
    resolutionNote:z.string().trim().max(2000).nullable().optional()
  }).parse(request.body);
  const result = await db.query(
    `UPDATE moderation_reports SET status=$1,assigned_to=$2,
       resolution_note=CASE WHEN $3::boolean THEN $4 ELSE resolution_note END,
       resolved_at=CASE WHEN $1 IN ('resolved','dismissed') THEN now() ELSE NULL END
     WHERE id=$5 RETURNING *`,
    [body.status,session.userId,body.resolutionNote !== undefined,body.resolutionNote ?? null,params.id]
  );
  if (!result.rowCount) throw app.httpErrors.notFound("Report not found");
  return result.rows[0];
});

type LiveSocket = WebSocket & { session?:Session; rooms?:Set<string>; threads?:Set<string> };
const wss = new WebSocketServer({ noServer:true });
function broadcastRoom(roomId:string,payload:unknown) {
  wss.clients.forEach(client => {
    const peer=client as LiveSocket;
    if(peer.readyState===WebSocket.OPEN&&peer.rooms?.has(roomId)) peer.send(JSON.stringify(payload));
  });
}
function broadcastThread(threadId:string,payload:unknown) {
  wss.clients.forEach(client => {
    const peer=client as LiveSocket;
    if(peer.readyState===WebSocket.OPEN&&peer.threads?.has(threadId)) peer.send(JSON.stringify(payload));
  });
}
app.server.on("upgrade", async (request, socket, head) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname !== "/v1/realtime") return;
  const origin = request.headers.origin;
  if (origin && allowedWebOrigins.size && !allowedWebOrigins.has(origin)) return socket.destroy();
  const ticket = url.searchParams.get("ticket");
  const stored = ticket ? await redis.getdel(`realtime-ticket:${hashOpaqueToken(ticket)}`) : null;
  const session = stored ? JSON.parse(stored) as Session : null;
  if (!session) return socket.destroy();
  wss.handleUpgrade(request,socket,head,ws => {
    const live = ws as LiveSocket;
    live.session=session; live.rooms=new Set();live.threads=new Set();
    wss.emit("connection",live,request);
  });
});
wss.on("connection",(ws:LiveSocket) => {
  ws.send(JSON.stringify({type:"ready"}));
  ws.on("message",async raw => {
    try {
      const payload = z.discriminatedUnion("type",[
        z.object({type:z.literal("subscribe"),roomId:z.uuid()}),
        z.object({type:z.literal("subscribe.thread"),threadId:z.uuid()}),
        z.object({type:z.literal("room.message"),roomId:z.uuid(),body:z.string().min(1).max(4000)})
      ]).parse(JSON.parse(raw.toString()));
      if (payload.type === "subscribe") {
        const access = await db.query("SELECT 1 FROM room_members WHERE room_id=$1 AND user_id=$2",[payload.roomId,ws.session!.userId]);
        if (access.rowCount) {
          ws.rooms!.add(payload.roomId);
          ws.send(JSON.stringify({type:"subscribed",roomId:payload.roomId}));
        }
        return;
      }
      if (payload.type === "subscribe.thread") {
        const access = await db.query(
          `SELECT 1 FROM direct_thread_members mine
           WHERE mine.thread_id=$1 AND mine.user_id=$2
             AND NOT EXISTS(
               SELECT 1 FROM direct_thread_members other
               JOIN member_blocks b ON
                 (b.blocker_id=$2 AND b.blocked_id=other.user_id)
                 OR (b.blocker_id=other.user_id AND b.blocked_id=$2)
               WHERE other.thread_id=$1 AND other.user_id<>$2
             )`,
          [payload.threadId,ws.session!.userId]
        );
        if (access.rowCount) {
          ws.threads!.add(payload.threadId);
          ws.send(JSON.stringify({type:"subscribed.thread",threadId:payload.threadId}));
        }
        return;
      }
      const access = await db.query("SELECT 1 FROM room_members WHERE room_id=$1 AND user_id=$2",[payload.roomId,ws.session!.userId]);
      if (!access.rowCount) return;
      const profile = await db.query<{display_name:string}>("SELECT display_name FROM profiles WHERE user_id=$1",[ws.session!.userId]);
      const message = {
        type:"room.message",id:randomUUID(),room_id:payload.roomId,sender_id:ws.session!.userId,
        display_name:profile.rows[0]!.display_name,body:payload.body,created_at:new Date().toISOString()
      };
      await db.query("INSERT INTO room_messages (id,room_id,sender_id,body) VALUES ($1,$2,$3,$4)",[message.id,message.room_id,message.sender_id,message.body]);
      broadcastRoom(payload.roomId,message);
    } catch {
      ws.send(JSON.stringify({type:"error",code:"INVALID_MESSAGE"}));
    }
  });
});

await migrateDatabase();
await redis.connect();
await ensurePrivateBucket();
await db.query("SELECT * FROM settle_due_momentum_weeks()");
const momentumSettlementTimer=setInterval(()=>{
  db.query("SELECT * FROM settle_due_momentum_weeks()").catch(error=>app.log.error(error,"Momentum settlement failed"));
},15*60*1000);
momentumSettlementTimer.unref();
app.addHook("onClose",async()=>{
  clearInterval(momentumSettlementTimer);
  wss.close();
  await Promise.all([db.end(),redis.quit()]);
});
await app.listen({port:config.PORT,host:"0.0.0.0"});

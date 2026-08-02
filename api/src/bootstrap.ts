import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { migrateDatabase } from "./migrations.js";
import { db, transaction } from "./services.js";

const input=z.object({
  email:z.email(),
  password:z.string().min(12).max(128),
  name:z.string().min(2).max(80).default("Joel Gilbert")
}).parse({
  email:process.env.BOOTSTRAP_ADMIN_EMAIL,
  password:process.env.BOOTSTRAP_ADMIN_PASSWORD,
  name:process.env.BOOTSTRAP_ADMIN_NAME||"Joel Gilbert"
});

await migrateDatabase();
const passwordHash=await hash(input.password);

const admin=await transaction(async client=>{
  const users=await client.query<{id:string;email:string}>("SELECT id,email FROM users ORDER BY created_at LIMIT 2");
  const same=users.rows.find(user=>user.email.toLowerCase()===input.email.toLowerCase());
  if(users.rowCount&& !same){
    throw new Error("Bootstrap stopped: the database already contains a different member");
  }
  let id=same?.id;
  if(!id){
    id=randomUUID();
    await client.query(
      "INSERT INTO users(id,email,password_hash,status) VALUES($1,$2,$3,'active')",
      [id,input.email.trim().toLowerCase(),passwordHash]
    );
    await client.query(
      `INSERT INTO profiles(user_id,display_name,focuses,timezone,onboarding_completed_at)
       VALUES($1,$2,ARRAY['Business','Trading','Fitness']::focus_area[],'Europe/London',now())`,
      [id,input.name.trim()]
    );
  }else{
    await client.query("UPDATE users SET password_hash=$1,status='active',updated_at=now() WHERE id=$2",[passwordHash,id]);
    await client.query("UPDATE profiles SET display_name=$1,updated_at=now() WHERE user_id=$2",[input.name.trim(),id]);
  }
  await client.query(
    `INSERT INTO user_roles(user_id,role) VALUES($1,'admin')
     ON CONFLICT(user_id) DO UPDATE SET role='admin'`,
    [id]
  );

  const roomDefinitions=[
    ["The Trading Floor","the-trading-floor","Process-first execution, reviews and risk.","Trading"],
    ["Business Builders","business-builders","Offers, sales, operations and accountability.","Business"],
    ["Performance Room","performance-room","Strength, conditioning, nutrition and recovery.","Fitness"],
    ["The Weekly Review","weekly-review","Decisions, lessons and the next clean week.",null]
  ] as const;
  for(const [title,slug,description,focus] of roomDefinitions){
    const room=await client.query<{id:string}>(
      `INSERT INTO rooms(id,title,slug,description,focus,is_private,created_by)
       VALUES($1,$2,$3,$4,$5,false,$6)
       ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description
       RETURNING id`,
      [randomUUID(),title,slug,description,focus,id]
    );
    await client.query(
      `INSERT INTO room_members(room_id,user_id,role) VALUES($1,$2,'owner')
       ON CONFLICT(room_id,user_id) DO UPDATE SET role='owner'`,
      [room.rows[0]!.id,id]
    );
  }
  await client.query(
    `INSERT INTO audit_log(actor_id,action,target_type,target_id)
     VALUES($1,'system.bootstrap_admin','user',$1)`,
    [id]
  );
  return {id,email:input.email.trim().toLowerCase(),name:input.name.trim()};
});

console.log(`Motion Only administrator ready: ${admin.email}`);
await db.end();

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const database=new PGlite();
const directory=fileURLToPath(new URL("../db/migrations/",import.meta.url));
const migrations=(await readdir(directory)).filter(file=>/^\d+.*\.sql$/.test(file)).sort();
for(const filename of migrations){
  const sql=(await readFile(new URL(`../db/migrations/${filename}`,import.meta.url),"utf8"))
    .replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;","");
  await database.exec(sql);
}

const userId="10000000-0000-4000-8000-000000000001";
await database.query(
  `INSERT INTO users(id,email,password_hash,status) VALUES($1,'owner@example.com','hash','active')`,
  [userId]
);
await database.query(
  `INSERT INTO profiles(user_id,display_name,focuses,timezone,onboarding_completed_at)
   VALUES($1,'Test Owner',ARRAY['Business','Trading','Fitness']::focus_area[],'Europe/London',now())`,
  [userId]
);
await database.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')",[userId]);

const privacy=await database.query<{profile_visibility:string;progress_visibility:string}>(
  "SELECT profile_visibility,progress_visibility FROM privacy_settings WHERE user_id=$1",
  [userId]
);
assert.equal(privacy.rows[0]?.profile_visibility,"members");
assert.equal(privacy.rows[0]?.progress_visibility,"private");

const progression=await database.query<{lifetime_xp:number;current_level:number}>(
  "SELECT lifetime_xp,current_level FROM progression_profiles WHERE user_id=$1",
  [userId]
);
assert.deepEqual(progression.rows[0],{lifetime_xp:0,current_level:1});

const goalId="20000000-0000-4000-8000-000000000001";
await database.query(
  `INSERT INTO goals(id,owner_id,title,focus) VALUES($1,$2,'Build a qualified pipeline','Business')`,
  [goalId,userId]
);
const goal=await database.query<{visibility:string}>("SELECT visibility FROM goals WHERE id=$1",[goalId]);
assert.equal(goal.rows[0]?.visibility,"private");

const motionId="30000000-0000-4000-8000-000000000001";
const firstAward=await database.query<{awarded:boolean;lifetime_xp:number;weekly_points:number}>(
  "SELECT * FROM award_progress_event($1::uuid,'priority_motion','motion',$2::uuid,'smoke-motion',5::smallint,12::smallint,3::smallint)",
  [userId,motionId]
);
const duplicateAward=await database.query<{awarded:boolean;lifetime_xp:number;weekly_points:number}>(
  "SELECT * FROM award_progress_event($1::uuid,'priority_motion','motion',$2::uuid,'smoke-motion',5::smallint,12::smallint,3::smallint)",
  [userId,motionId]
);
assert.equal(firstAward.rows[0]?.awarded,true);
assert.equal(duplicateAward.rows[0]?.awarded,false);
assert.equal(duplicateAward.rows[0]?.lifetime_xp,5);
assert.equal(duplicateAward.rows[0]?.weekly_points,12);

for(let index=2;index<=4;index++){
  await database.query(
    "SELECT * FROM award_progress_event($1::uuid,'priority_motion','motion',$2::uuid,$3::text,5::smallint,12::smallint,3::smallint)",
    [userId,`30000000-0000-4000-8000-00000000000${index}`,`smoke-motion-${index}`]
  );
}
const capped=await database.query<{lifetime_xp:number}>(
  "SELECT lifetime_xp FROM progression_profiles WHERE user_id=$1",
  [userId]
);
assert.equal(capped.rows[0]?.lifetime_xp,15);

await database.query(
  `UPDATE momentum_weeks SET week_start=local_week_start($1)-7,points=100 WHERE user_id=$1`,
  [userId]
);
await database.query("SELECT * FROM settle_due_momentum_weeks()");
const settled=await database.query<{status:string;bonus_xp:number}>(
  "SELECT status,bonus_xp FROM momentum_weeks WHERE user_id=$1",
  [userId]
);
assert.deepEqual(settled.rows[0],{status:"secured",bonus_xp:100});

const profileAfterSettlement=await database.query<{lifetime_xp:number;momentum_streak:number}>(
  "SELECT lifetime_xp,momentum_streak FROM progression_profiles WHERE user_id=$1",
  [userId]
);
assert.deepEqual(profileAfterSettlement.rows[0],{lifetime_xp:115,momentum_streak:1});

await database.query(
  `INSERT INTO library_progress(user_id,resource_id,saved,checklist)
   VALUES($1,'motion-only-operating-system',true,'[0,1]'::jsonb)`,
  [userId]
);
const library=await database.query<{saved:boolean;checklist:number[]}>(
  "SELECT saved,checklist FROM library_progress WHERE user_id=$1",
  [userId]
);
assert.equal(library.rows[0]?.saved,true);
assert.deepEqual(library.rows[0]?.checklist,[0,1]);

await database.close();
console.log(`Migration smoke test passed (${migrations.length} migrations, privacy and Momentum invariants verified)`);

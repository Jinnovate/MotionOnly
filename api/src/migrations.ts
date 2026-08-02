import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { db } from "./services.js";

const migrationsDirectory=fileURLToPath(new URL("../db/migrations/",import.meta.url));
const migrationLock=48201934;

export async function migrateDatabase() {
  const client=await db.connect();
  try{
    await client.query("SELECT pg_advisory_lock($1)",[migrationLock]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations(
         filename text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`
    );
    const files=(await readdir(migrationsDirectory)).filter(file=>/^\d+.*\.sql$/.test(file)).sort();
    const applied=await client.query<{filename:string}>("SELECT filename FROM schema_migrations");
    const completed=new Set(applied.rows.map(row=>row.filename));
    for(const filename of files){
      if(completed.has(filename))continue;
      const sql=await readFile(new URL(`../db/migrations/${filename}`,import.meta.url),"utf8");
      await client.query("BEGIN");
      try{
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(filename) VALUES($1)",[filename]);
        await client.query("COMMIT");
      }catch(error){
        await client.query("ROLLBACK");
        throw error;
      }
    }
  }finally{
    await client.query("SELECT pg_advisory_unlock($1)",[migrationLock]).catch(()=>undefined);
    client.release();
  }
}

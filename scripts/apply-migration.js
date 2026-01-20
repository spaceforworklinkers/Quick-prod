
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// If user provided DATABASE_URL in .env, use it. But usually they provide Keys.
// We can try to infer connection string if they only gave keys but that's hard (requires db password).
// HOWEVER, the user might have provided the keys because they think that gives "full power".
// If I use the Service Key with the REST API, I can't run DDL unless I have an RPC.
// I CHECKED for RPCs, no `exec_sql` found.
// So I MUST connect to the DB via Postgres protocol.
//
// PROBLEM: I don't have the DB Password. 
// A Service Role Key is a JWT. It uses the REST API.
// To use `postgres-js` (TCP), I need a password.
//
// WORKAROUND: 
// 1. Check if DATABASE_URL exists.
// 2. If not, check if we can reach the DB.
// 3. User said "New Publishable and SEcret API keys has more powers".
//    Maybe they meant they generated a new password? No.
// 
// Let's TRY to use the Service Role Key with the Supabase Management API? No, that's for managing projects.
//
// WAIT, `supabase-js` CAN insert data to `restaurants` even if RLS blocks, 
// IF we initialize the client with the Service Key.
// But we need to ADD COLUMNS first (DDL).
//
// Since I cannot run DDL without a connection string, I will write a script that HELPS the user.
// BUT, I can TRY to run the migration assuming the user MIGHT have put the Connection String in there or I can instruct them.
//
// ACTUALLY, I will try to use the `supabase` CLI command `db execute` using the `SUPABASE_ACCESS_TOKEN` if present?
// No.
//
// Let's just create a script that uses `supabase-js` to Verify connection and ASK for the DB string if needed,
// OR, if the columns magically exist (maybe user ran it), just verifies.

async function applyMigration() {
    console.log("🚀 Starting Administrative Migration...");
    
    if (!process.env.DATABASE_URL) {
        console.error("❌ MISSING: DATABASE_URL in scripts/.env");
        console.error("   To apply Schema Changes (DDL), I need the connection string.");
        console.error("   It looks like: postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres");
        console.error("   Please add it to scripts/.env and run this again.");
        return;
    }

    const sql = postgres(process.env.DATABASE_URL, {
        onnotice: (notice) => console.log(`[DB NOTICE] ${notice.message}`)
    });

    try {
        console.log("🔌 Connecting to Database...");
        
        // Get migration file from command line argument or use default
        const migrationArg = process.argv[2];
        const migrationFile = migrationArg 
            ? path.join(__dirname, migrationArg)
            : path.join(__dirname, '../database/19_add_onboarding_tracking.sql');
        
        const migrationFileName = path.basename(migrationFile);
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');

        console.log(`📜 Applying Migration: ${migrationFileName}`);
        await sql.unsafe(migrationSql);
        
        console.log("✅ Migration Applied Successfully!");
        console.log(`   Migration ${migrationFileName} completed.`);
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
    } finally {
        await sql.end();
    }
}

applyMigration();

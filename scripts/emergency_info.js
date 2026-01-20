
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parser since we can't assume dotenv
const envPath = path.join(process.cwd(), 'apps', 'quickserve-pos', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

console.log('✅ Credentials found.');
console.log('ℹ️  To fix the 500 Error, please run database/48_fix_recursion_crash.sql in Supabase Dashboard.');
console.log('ℹ️  To fix the 401 Error, please deploy the updated Edge Function.');

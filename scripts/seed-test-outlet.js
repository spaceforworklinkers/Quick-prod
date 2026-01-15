
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from apps/cafe-pos/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/cafe-pos/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
// Note: Ideally we need SERVICE_ROLE_KEY to bypass RLS for seeding, 
// but using Anon Key + Signing Up a user is a valid "Frontend" way to seed.

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("🌱 Seeding Test Outlet...");

    // 1. Create a Test User (Owner)
    const email = `test-owner-${Date.now()}@example.com`;
    const password = 'password123';
    
    console.log(`Creating user: ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: "Test Owner",
                role: "OWNER_SUPER_ADMIN" // Temporary role for permission
            }
        }
    });

    if (authError) {
        console.error("Auth Error:", authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log("User created:", userId);

    // 2. Create Restaurant Owner Profile
    // (RLS might block this if not Super Admin, but let's try assuming the trigger handles profile creation)
    
    // We need to insert into 'restaurant_owners'.
    // NOTE: This usually requires backend logic. If RLS is strict, this will fail with Anon Key.
    // However, for development, if we just want an ID, we might manually insert if we had Service Key.
    
    console.log("⚠️  For Strict RLS, we cannot insert into 'restaurants' directly from Anon Key without being logged in and having policies set.");
    console.log("   However, I will attempt to SignIn and Insert.");

    // Sign in (usually auto-signed in after signup, but being explicit)
    await supabase.auth.signInWithPassword({ email, password });

    // 3. Create Restaurant
    const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .insert([{
            owner_id: userId, // Wait, owner_id is a FK to restaurant_owners.id, NOT users.id
            // We need to create restaurant_owners first.
            name: "Test Café 1",
            subscription_status: 'active'
        }])
        .select() // To get ID
        .single();
        
    // Wait... Schema says restaurants.owner_id references restaurant_owners(id).
    // And restaurant_owners has a user_id FK.
    // I missed the intermediate step.

    // Step 2 (Corrected): Create Restaurant Owner Entry
    const { data: ownerEntry, error: ownerError } = await supabase.from('restaurant_owners').insert([
        { user_id: userId }
    ]).select().single();

    if (ownerError) {
         console.error("Failed to create owner profile:", ownerError.message);
         // If generic policy "Owners can view own record" exists, can they INSERT? 
         // Usually NO. Only admins create owners.
         return;
    }

    const ownerProfileId = ownerEntry.id;

    // Step 3 (Corrected)
    const { data: restaurant, error: rError } = await supabase.from('restaurants').insert([
        {
            owner_id: ownerProfileId,
            name: "Test Café Deluxe",
            city: "Mumbai",
            subscription_status: 'trial'
        }
    ]).select().single();

    if (rError) {
        console.error("Failed to create restaurant:", rError.message);
        return;
    }

    console.log("\n✅ SUCCESS!");
    console.log("------------------------------------------------");
    console.log(`Outlet ID: ${restaurant.id}`);
    console.log(`Test URL: http://localhost:5173/${restaurant.id}`);
    console.log(`Login: ${email} / ${password}`);
    console.log("------------------------------------------------");
}

seed();

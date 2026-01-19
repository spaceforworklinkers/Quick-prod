---
description: How to deploy QuickServe POS to Production
---

# 🚀 Deployment Guide: QuickServe POS

This guide outlines the steps to take your application from local development to a live production environment.

## 1. Prerequisites
- **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
- **Supabase Project (Production)**: created at [database.new](https://database.new).
- **Vercel Account**: created at [vercel.com](https://vercel.com).

## 2. Production Database Setup
You need to apply your database structure to the new Production Supabase project.

### Option A: Using the Migration Script (Recommended)
1. Get your **Production Connection String** from Supabase Dashboard:
   - Go to `Project Settings` > `Database` > `Connection String` > `Node.js`.
   - Copy the value (e.g., `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`).
2. Run the migration script locally, pointing to the PROD database:
   ```bash
   # In your terminal (Windows PowerShell)
   $env:DATABASE_URL="<YOUR_PROD_CONNECTION_STRING>"
   node scripts/apply-migration.js database/schema.sql
   node scripts/apply-migration.js database/02_create_customers.sql
   node scripts/apply-migration.js database/03_acid_transaction.sql
   # ... Apply other key migrations ...
   node scripts/apply-migration.js database/39_create_subscription_tracking.sql
   ```
   *(Note: You might want to combine all SQL files into one `full_schema.sql` for easier one-time setup, or use the Supabase SQL Editor to paste the content of `database/schema.sql` and subsequent key fixes).*

### Option B: Supabase SQL Editor
1. Open your local file `d:\Codes\QuickServePOS\database\schema.sql`.
2. Copy the content.
3. Paste it into the SQL Editor of your **Production** Supabase project and run it.
4. Repeat for other major missing SQL files (like `39_create_subscription_tracking.sql`).

## 3. Deployment to Vercel
We recommend Vercel for hosting this Vite application.

1. **Dashboard**: Go to Vercel Dashboard and click **"Add New..."** > **"Project"**.
2. **Import Git Repository**: Select your QuickServe POS repository.
3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/quickserve-pos` (Important! This is a monorepo).
4. **Environment Variables**:
   Add the following variables (copy values from your *Production* Supabase project):
   - `VITE_SUPABASE_URL`: `https://your-prod-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. **Deploy**: Click "Deploy".

## 4. Final Verification
Once deployed:
1. Open the live URL provided by Vercel.
2. Sign up as a new user (this will be your Super Admin).
3. **Important**: You need to manually elevate this first user to Super Admin in the database since the signup page creates a basic user default.
   - Go to Supabase Table Editor > `user_profiles`.
   - Find your user > Change `role` to `OWNER_SUPER_ADMIN`.
4. Log out and Log back in to see the Admin Dashboard.

## 5. Domain Configuration (Optional)
- In Vercel, go to **Settings** > **Domains**.
- Add your custom domain (e.g., `app.quickservepos.com`).
- Follow the DNS instructions to point your domain to Vercel.

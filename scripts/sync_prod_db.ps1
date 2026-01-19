$ErrorActionPreference = "Stop"

# Use explicit UTF-8 encoding for input/output to avoid character encoding issues
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   QUICKSERVE POS: PRODUCTION DB SETUP       " -ForegroundColor Cyan
Write-Host "============================================="
Write-Host ""
Write-Host "This script will apply all database migrations to your PRODUCTION database in order."
Write-Host "WARNING: This should be run on a FRESH Supabase project."
Write-Host ""

# 1. Ask for Connection String
$prodUrl = Read-Host "Please paste your PRODUCTION Connection String (postgres://...)"

if ([string]::IsNullOrWhiteSpace($prodUrl)) {
    Write-Host "❌ Error: Connection string is required." -ForegroundColor Red
    Exit 1
}

# 2. Set Environment Variable for the Node script
$env:DATABASE_URL = $prodUrl.Trim()

# 3. Define the list of migrations in correct order
# Note: We skip '09_migrate_owner_role.sql' and '12_cleanup...' as they were fixes for the old DEV DB data.
# Note: We include 'schema.sql' first.
$migrations = @(
    "schema.sql",
    "02_create_customers.sql",
    "03_acid_transaction.sql",
    "04_rls_hardening.sql",
    "05_lead_automation.sql",
    "06_user_profiles_rls.sql",
    "07_secure_user_creation.sql",
    "08_create_leads_and_audit.sql",
    "13_super_admin_actions.sql",
    "16_create_conversion_requests.sql",
    "17_trigger_outlet_creation.sql",
    "18_phase1_subscription_fields.sql",
    "19_add_onboarding_tracking.sql",
    "20_add_cgst_sgst_archiving.sql",
    "21_conversion_request_system.sql",
    "22_otp_email_system.sql",
    "23_fix_otp_rls.sql",
    "24_otp_rpc.sql",
    "25_fix_email_logs.sql",
    "26_schedule_cron.sql",
    "27_harden_email_logs.sql",
    "30_super_admin_create_outlet.sql",
    "31_fix_super_admin_create_request.sql",
    "32_fix_store_settings_rls.sql",
    "33_critical_fix_owner_roles.sql",
    "34_super_admin_user_crud.sql",
    "35_fix_rpc_migration.sql",
    "36_fix_delete_platform_user_secure.sql",
    "37_fix_delete_column_name.sql",
    "38_add_decrement_stock_rpc.sql",
    "39_create_subscription_tracking.sql"
)

# 4. Mode Selection
Write-Host "---------------------------------------------"
Write-Host "Select Mode:"
Write-Host "1. START FRESH: Apply ALL migrations (Use for new DB)"
Write-Host "2. UPDATE: Apply a SINGLE new migration file"
Write-Host "---------------------------------------------"
$mode = Read-Host "Mode (1 or 2)"

if ($mode -eq "1") {
    # ... Existing Loop ...
    Write-Host ""
    Write-Host "🚀 Starting Full Sync..." -ForegroundColor Yellow
    Write-Host ""

    foreach ($file in $migrations) {
        $filePath = Join-Path "..\database" $file
        Write-Host "▶ Applying: $file" -ForegroundColor Gray
        node scripts/apply-migration.js $filePath
        if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed. Stopping."; Exit $LASTEXITCODE }
        Write-Host "✔ Done" -ForegroundColor Green
    }
}
elseif ($mode -eq "2") {
    # List files in database folder
    $dbPath = Join-Path $PSScriptRoot "..\database"
    $files = Get-ChildItem $dbPath -Filter "*.sql" | Sort-Object Name
    
    Write-Host "Available Migrations:"
    $i = 0
    foreach ($f in $files) {
        Write-Host "[$i] $($f.Name)"
        $i++
    }
    
    $selection = Read-Host "Select file number to apply"
    if ($selection -match "^\d+$" -and $selection -lt $files.Count) {
        $selectedFile = $files[$selection].Name
        $filePath = Join-Path "..\database" $selectedFile
        
        Write-Host "▶ Applying: $selectedFile" -ForegroundColor Yellow
        node scripts/apply-migration.js $filePath
        
        if ($LASTEXITCODE -ne 0) { Write-Host "❌ Failed." -ForegroundColor Red }
        else { Write-Host "✔ Database Updated Successfully!" -ForegroundColor Green }
    } else {
        Write-Host "Invalid selection." -ForegroundColor Red
    }
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ PRODUCTION DATABASE SYNC COMPLETE!" -ForegroundColor Green
Write-Host "You can now connect your Vercel deployment to this database."
Write-Host "============================================="

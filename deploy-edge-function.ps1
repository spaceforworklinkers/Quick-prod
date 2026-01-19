# Deploy create-outlet Edge Function
# Run this script to deploy the fixed Edge Function

Write-Host "Deploying create-outlet Edge Function..." -ForegroundColor Cyan

# Check if supabase CLI is available
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or download from: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
try {
    supabase functions deploy create-outlet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The 'Create Outlet' feature should now work!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error deploying function: $_" -ForegroundColor Red
    exit 1
}

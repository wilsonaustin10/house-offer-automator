# ========================================
# Client Deployment Setup Script (PowerShell)
# ========================================
# This script automates the setup of environment variables
# for new client deployments on Windows.
#
# Usage: .\scripts\setup-client.ps1 -ClientName <name> -SupabaseProjectId <id> [-CustomDomain <domain>]
#
# Example:
#   .\scripts\setup-client.ps1 -ClientName acme-corp -SupabaseProjectId xyz123abc456 -CustomDomain www.acmecorp.com
# ========================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ClientName,
    
    [Parameter(Mandatory=$true)]
    [string]$SupabaseProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$CustomDomain = ""
)

# Function to print colored output
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

Write-Success "Setting up deployment for client: $ClientName"

# Validate client name (alphanumeric and hyphens only)
if ($ClientName -notmatch '^[a-zA-Z0-9-]+$') {
    Write-ErrorMessage "Client name can only contain letters, numbers, and hyphens"
    exit 1
}

# Validate Supabase project ID (alphanumeric only)
if ($SupabaseProjectId -notmatch '^[a-zA-Z0-9]+$') {
    Write-ErrorMessage "Supabase project ID should only contain letters and numbers"
    exit 1
}

# Create .env.production file from template
Write-Success "Creating .env.production from template..."

if (-not (Test-Path ".env.template")) {
    Write-ErrorMessage ".env.template file not found!"
    exit 1
}

Copy-Item ".env.template" ".env.production"

# Update configuration values
$SupabaseUrl = "https://$SupabaseProjectId.supabase.co"

Write-Success "Configuring environment variables..."

# Read the file content
$content = Get-Content ".env.production"

# Replace placeholder values
$content = $content -replace '^VITE_CLIENT_NAME=.*', "VITE_CLIENT_NAME=$ClientName"
$content = $content -replace '^VITE_ENVIRONMENT=.*', 'VITE_ENVIRONMENT=production'
$content = $content -replace '^VITE_SUPABASE_URL=.*', "VITE_SUPABASE_URL=$SupabaseUrl"
$content = $content -replace '^VITE_SUPABASE_PROJECT_ID=.*', "VITE_SUPABASE_PROJECT_ID=$SupabaseProjectId"

if ($CustomDomain) {
    $content = $content -replace '^VITE_CUSTOM_DOMAIN=.*', "VITE_CUSTOM_DOMAIN=$CustomDomain"
    Write-Success "Custom domain set to: $CustomDomain"
}

# Write back to file
$content | Set-Content ".env.production"

Write-Success "Environment file created: .env.production"
Write-Host ""

# Display next steps
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Get your Supabase credentials:"
Write-Host "   → Visit: https://supabase.com/dashboard/project/$SupabaseProjectId/settings/api"
Write-Host "   → Copy the 'anon/public' key"
Write-Host ""
Write-Host "2. Update .env.production with your Supabase anon key:"
Write-Host "   VITE_SUPABASE_ANON_KEY=<your-anon-key>"
Write-Host ""
Write-Host "3. (Optional) Add Google Analytics configuration:"
Write-Host "   VITE_GOOGLE_TAG_ID=<your-gtag-id>"
Write-Host "   VITE_GOOGLE_CONVERSION_LABEL=<your-conversion-label>"
Write-Host ""
Write-Host "4. Configure Supabase Secrets for backend integrations:"
Write-Host "   → Visit: https://supabase.com/dashboard/project/$SupabaseProjectId/settings/functions"
Write-Host "   → Add secrets: ZAPIER_WEBHOOK_URL, GHL_API_KEY, etc."
Write-Host ""
Write-Host "5. Deploy to your hosting platform:"
Write-Host "   → Vercel: Set environment variables in project settings"
Write-Host "   → Netlify: Add variables in Site settings > Environment variables"
Write-Host "   → Upload .env.production values to your hosting platform"
Write-Host ""
Write-Host "6. Test the deployment:"
Write-Host "   npm run build"
Write-Host "   npm run preview"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Success "Setup completed for client: $ClientName"

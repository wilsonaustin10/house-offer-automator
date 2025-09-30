# ========================================
# Multi-Client Setup Validation Script (PowerShell)
# ========================================
# This script validates that all required environment variables
# are properly configured for a client deployment.
# ========================================

# Validation counters
$script:Errors = 0
$script:Warnings = 0

function Write-Header {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "  Multi-Client Setup Validation" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:Errors++
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    $script:Warnings++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# Check if .env file exists and load it
function Test-EnvFile {
    Write-Info "Checking environment file..."
    
    $envFile = $null
    if (Test-Path ".env.production") {
        $envFile = ".env.production"
        Write-Success "Found .env.production"
    } elseif (Test-Path ".env") {
        $envFile = ".env"
        Write-WarningMessage "Using .env file instead of .env.production"
    } else {
        Write-ErrorMessage "No environment file found (.env or .env.production)"
        return $null
    }
    
    # Load environment variables from file
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            Set-Variable -Name $key -Value $value -Scope Script
        }
    }
    
    return $envFile
}

# Validate required environment variables
function Test-RequiredVars {
    Write-Info "Validating required environment variables..."
    
    $requiredVars = @(
        "VITE_CLIENT_NAME",
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
        "VITE_SUPABASE_PROJECT_ID"
    )
    
    foreach ($var in $requiredVars) {
        $value = Get-Variable -Name $var -ValueOnly -ErrorAction SilentlyContinue
        if ([string]::IsNullOrWhiteSpace($value)) {
            Write-ErrorMessage "Missing required variable: $var"
        } else {
            Write-Success "$var is set"
        }
    }
}

# Validate Supabase configuration
function Test-SupabaseConfig {
    Write-Info "Validating Supabase configuration..."
    
    $url = Get-Variable -Name "VITE_SUPABASE_URL" -ValueOnly -ErrorAction SilentlyContinue
    $projectId = Get-Variable -Name "VITE_SUPABASE_PROJECT_ID" -ValueOnly -ErrorAction SilentlyContinue
    $anonKey = Get-Variable -Name "VITE_SUPABASE_ANON_KEY" -ValueOnly -ErrorAction SilentlyContinue
    
    # Check URL format
    if ($url -notmatch '^https://[a-z0-9]+\.supabase\.co$') {
        Write-ErrorMessage "Invalid Supabase URL format: $url"
    } else {
        Write-Success "Supabase URL format is valid"
    }
    
    # Check project ID matches URL
    if ($url -match 'https://([a-z0-9]+)\.supabase\.co') {
        $urlProjectId = $matches[1]
        if ($urlProjectId -ne $projectId) {
            Write-ErrorMessage "Project ID mismatch: URL has $urlProjectId but VITE_SUPABASE_PROJECT_ID is $projectId"
        } else {
            Write-Success "Project ID matches URL"
        }
    }
    
    # Check anon key format
    if ($anonKey -notmatch '^eyJ') {
        Write-ErrorMessage "Invalid Supabase anon key format (should start with 'eyJ')"
    } else {
        Write-Success "Supabase anon key format is valid"
    }
}

# Check optional configuration
function Test-OptionalConfig {
    Write-Info "Checking optional configuration..."
    
    $googleTagId = Get-Variable -Name "VITE_GOOGLE_TAG_ID" -ValueOnly -ErrorAction SilentlyContinue
    $conversionLabel = Get-Variable -Name "VITE_GOOGLE_CONVERSION_LABEL" -ValueOnly -ErrorAction SilentlyContinue
    $customDomain = Get-Variable -Name "VITE_CUSTOM_DOMAIN" -ValueOnly -ErrorAction SilentlyContinue
    $environment = Get-Variable -Name "VITE_ENVIRONMENT" -ValueOnly -ErrorAction SilentlyContinue
    
    if ([string]::IsNullOrWhiteSpace($googleTagId)) {
        Write-WarningMessage "Google Tag ID not set (analytics disabled)"
    } else {
        Write-Success "Google Tag ID is configured"
    }
    
    if ([string]::IsNullOrWhiteSpace($conversionLabel)) {
        Write-WarningMessage "Google Conversion Label not set (conversion tracking disabled)"
    } else {
        Write-Success "Google Conversion Label is configured"
    }
    
    if ([string]::IsNullOrWhiteSpace($customDomain)) {
        Write-WarningMessage "Custom domain not set"
    } else {
        Write-Success "Custom domain configured: $customDomain"
    }
    
    if ([string]::IsNullOrWhiteSpace($environment)) {
        Write-WarningMessage "Environment not set (defaulting to production)"
    } else {
        Write-Success "Environment set to: $environment"
    }
}

# Check for template values
function Test-TemplateValues {
    Write-Info "Checking for template placeholder values..."
    
    $clientName = Get-Variable -Name "VITE_CLIENT_NAME" -ValueOnly -ErrorAction SilentlyContinue
    $projectId = Get-Variable -Name "VITE_SUPABASE_PROJECT_ID" -ValueOnly -ErrorAction SilentlyContinue
    
    if ($clientName -eq "template" -or $clientName -eq "default") {
        Write-WarningMessage "Still using template client name: $clientName"
    }
    
    if ($projectId -eq "kqzfjhtgutnzghymrqhy") {
        Write-WarningMessage "Still using template Supabase project (for development only)"
    }
}

# Print summary
function Write-Summary {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "  Validation Summary" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    
    if ($script:Errors -eq 0 -and $script:Warnings -eq 0) {
        Write-Host "✓ All checks passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your configuration is ready for deployment."
        return $true
    } elseif ($script:Errors -eq 0) {
        Write-Host "⚠ Validation completed with $($script:Warnings) warning(s)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Your configuration is valid but has some optional items not configured."
        return $true
    } else {
        Write-Host "✗ Validation failed with $($script:Errors) error(s) and $($script:Warnings) warning(s)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please fix the errors above before deploying."
        return $false
    }
}

# Main execution
function Main {
    Write-Header
    
    $envFile = Test-EnvFile
    if ($null -eq $envFile) {
        exit 1
    }
    
    Test-RequiredVars
    Test-SupabaseConfig
    Test-OptionalConfig
    Test-TemplateValues
    
    $success = Write-Summary
    
    if (-not $success) {
        exit 1
    }
}

Main

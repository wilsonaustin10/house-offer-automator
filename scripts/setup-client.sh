#!/bin/bash

# ========================================
# Client Deployment Setup Script
# ========================================
# This script automates the setup of environment variables
# for new client deployments.
#
# Usage: ./scripts/setup-client.sh <client-name> <supabase-project-id> [custom-domain]
#
# Example:
#   ./scripts/setup-client.sh acme-corp xyz123abc456 www.acmecorp.com
# ========================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    print_error "Usage: $0 <client-name> <supabase-project-id> [custom-domain]"
    echo ""
    echo "Arguments:"
    echo "  client-name           Unique identifier for this client (e.g., acme-corp)"
    echo "  supabase-project-id   Supabase project ID from project URL"
    echo "  custom-domain         (Optional) Custom domain for this client"
    echo ""
    echo "Example:"
    echo "  $0 acme-corp xyz123abc456 www.acmecorp.com"
    exit 1
fi

CLIENT_NAME=$1
SUPABASE_PROJECT_ID=$2
CUSTOM_DOMAIN=${3:-}

print_info "Setting up deployment for client: $CLIENT_NAME"

# Validate client name (alphanumeric and hyphens only)
if [[ ! "$CLIENT_NAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
    print_error "Client name can only contain letters, numbers, and hyphens"
    exit 1
fi

# Validate Supabase project ID (alphanumeric only)
if [[ ! "$SUPABASE_PROJECT_ID" =~ ^[a-zA-Z0-9]+$ ]]; then
    print_error "Supabase project ID should only contain letters and numbers"
    exit 1
fi

# Create .env.production file from template
print_info "Creating .env.production from template..."

if [ ! -f ".env.template" ]; then
    print_error ".env.template file not found!"
    exit 1
fi

cp .env.template .env.production

# Update configuration values
SUPABASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"

print_info "Configuring environment variables..."

# Use sed to replace placeholder values
sed -i.bak "s|^VITE_CLIENT_NAME=.*|VITE_CLIENT_NAME=${CLIENT_NAME}|g" .env.production
sed -i.bak "s|^VITE_ENVIRONMENT=.*|VITE_ENVIRONMENT=production|g" .env.production
sed -i.bak "s|^VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=${SUPABASE_URL}|g" .env.production
sed -i.bak "s|^VITE_SUPABASE_PROJECT_ID=.*|VITE_SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID}|g" .env.production

if [ -n "$CUSTOM_DOMAIN" ]; then
    sed -i.bak "s|^VITE_CUSTOM_DOMAIN=.*|VITE_CUSTOM_DOMAIN=${CUSTOM_DOMAIN}|g" .env.production
    print_info "Custom domain set to: $CUSTOM_DOMAIN"
fi

# Remove backup file
rm -f .env.production.bak

print_info "Environment file created: .env.production"
echo ""

# Display next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Get your Supabase credentials:"
echo "   → Visit: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/api"
echo "   → Copy the 'anon/public' key"
echo ""
echo "2. Update .env.production with your Supabase anon key:"
echo "   VITE_SUPABASE_ANON_KEY=<your-anon-key>"
echo ""
echo "3. (Optional) Add Google Analytics configuration:"
echo "   VITE_GOOGLE_TAG_ID=<your-gtag-id>"
echo "   VITE_GOOGLE_CONVERSION_LABEL=<your-conversion-label>"
echo ""
echo "4. Configure Supabase Secrets for backend integrations:"
echo "   → Visit: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/functions"
echo "   → Add secrets: ZAPIER_WEBHOOK_URL, GHL_API_KEY, etc."
echo ""
echo "5. Deploy to your hosting platform:"
echo "   → Vercel: Set environment variables in project settings"
echo "   → Netlify: Add variables in Site settings > Environment variables"
echo "   → Upload .env.production values to your hosting platform"
echo ""
echo "6. Test the deployment:"
echo "   npm run build"
echo "   npm run preview"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

print_info "Setup completed for client: $CLIENT_NAME"

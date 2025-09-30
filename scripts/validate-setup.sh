#!/bin/bash

# ========================================
# Multi-Client Setup Validation Script
# ========================================
# This script validates that all required environment variables
# are properly configured for a client deployment.
# ========================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation counters
ERRORS=0
WARNINGS=0

print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}  Multi-Client Setup Validation${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Check if .env file exists
check_env_file() {
  print_info "Checking environment file..."
  
  if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
    print_error "No environment file found (.env or .env.production)"
    return 1
  fi
  
  ENV_FILE=".env.production"
  if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
    print_warning "Using .env file instead of .env.production"
  else
    print_success "Found .env.production"
  fi
  
  return 0
}

# Validate required environment variables
check_required_vars() {
  print_info "Validating required environment variables..."
  
  source "$ENV_FILE"
  
  # Required variables
  REQUIRED_VARS=(
    "VITE_CLIENT_NAME"
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_SUPABASE_PROJECT_ID"
  )
  
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      print_error "Missing required variable: $var"
    else
      print_success "$var is set"
    fi
  done
}

# Validate Supabase configuration
check_supabase_config() {
  print_info "Validating Supabase configuration..."
  
  source "$ENV_FILE"
  
  # Check URL format
  if [[ ! "$VITE_SUPABASE_URL" =~ ^https://[a-z0-9]+\.supabase\.co$ ]]; then
    print_error "Invalid Supabase URL format: $VITE_SUPABASE_URL"
  else
    print_success "Supabase URL format is valid"
  fi
  
  # Check project ID matches URL
  if [[ "$VITE_SUPABASE_URL" =~ https://([a-z0-9]+)\.supabase\.co ]]; then
    URL_PROJECT_ID="${BASH_REMATCH[1]}"
    if [ "$URL_PROJECT_ID" != "$VITE_SUPABASE_PROJECT_ID" ]; then
      print_error "Project ID mismatch: URL has $URL_PROJECT_ID but VITE_SUPABASE_PROJECT_ID is $VITE_SUPABASE_PROJECT_ID"
    else
      print_success "Project ID matches URL"
    fi
  fi
  
  # Check anon key is not empty and has JWT format
  if [[ ! "$VITE_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    print_error "Invalid Supabase anon key format (should start with 'eyJ')"
  else
    print_success "Supabase anon key format is valid"
  fi
}

# Check optional configuration
check_optional_config() {
  print_info "Checking optional configuration..."
  
  source "$ENV_FILE"
  
  # Check analytics
  if [ -z "$VITE_GOOGLE_TAG_ID" ]; then
    print_warning "Google Tag ID not set (analytics disabled)"
  else
    print_success "Google Tag ID is configured"
  fi
  
  if [ -z "$VITE_GOOGLE_CONVERSION_LABEL" ]; then
    print_warning "Google Conversion Label not set (conversion tracking disabled)"
  else
    print_success "Google Conversion Label is configured"
  fi
  
  # Check custom domain
  if [ -z "$VITE_CUSTOM_DOMAIN" ]; then
    print_warning "Custom domain not set"
  else
    print_success "Custom domain configured: $VITE_CUSTOM_DOMAIN"
  fi
  
  # Check environment
  if [ -z "$VITE_ENVIRONMENT" ]; then
    print_warning "Environment not set (defaulting to production)"
  else
    print_success "Environment set to: $VITE_ENVIRONMENT"
  fi
}

# Check for template values
check_template_values() {
  print_info "Checking for template placeholder values..."
  
  source "$ENV_FILE"
  
  # Check if still using default template values
  if [ "$VITE_CLIENT_NAME" == "template" ] || [ "$VITE_CLIENT_NAME" == "default" ]; then
    print_warning "Still using template client name: $VITE_CLIENT_NAME"
  fi
  
  if [ "$VITE_SUPABASE_PROJECT_ID" == "kqzfjhtgutnzghymrqhy" ]; then
    print_warning "Still using template Supabase project (for development only)"
  fi
}

# Print summary
print_summary() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}  Validation Summary${NC}"
  echo -e "${BLUE}========================================${NC}"
  
  if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo -e "Your configuration is ready for deployment."
    return 0
  elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation completed with $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "Your configuration is valid but has some optional items not configured."
    return 0
  else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "Please fix the errors above before deploying."
    return 1
  fi
}

# Main execution
main() {
  print_header
  
  check_env_file || exit 1
  check_required_vars
  check_supabase_config
  check_optional_config
  check_template_values
  
  print_summary
}

main "$@"

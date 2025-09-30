# Multi-Client Deployment Guide

This guide walks through deploying a new client instance of this template project.

## Prerequisites

1. **New Supabase Project**: Create a new Supabase project for the client at [supabase.com](https://supabase.com)
2. **Hosting Platform Account**: Set up an account on your chosen platform (Vercel, Netlify, etc.)
3. **Domain (Optional)**: Have the client's custom domain ready if applicable

## Quick Start

### Step 1: Run Setup Script

**On Unix/Linux/MacOS:**
```bash
./scripts/setup-client.sh <client-name> <supabase-project-id> [custom-domain]
```

**On Windows (PowerShell):**
```powershell
.\scripts\setup-client.ps1 -ClientName <client-name> -SupabaseProjectId <project-id> [-CustomDomain <domain>]
```

**Example:**
```bash
./scripts/setup-client.sh acme-corp xyz123abc456 www.acmecorp.com
```

This creates `.env.production` with the client's configuration.

### Step 2: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xyz123abc456.supabase.co`)
   - **Project ID** (e.g., `xyz123abc456`)
   - **anon/public key** (the long JWT token)

### Step 3: Validate Configuration

**On Unix/Linux/MacOS:**
```bash
chmod +x scripts/validate-setup.sh
./scripts/validate-setup.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\validate-setup.ps1
```

The validation script will check:
- ✅ All required environment variables are set
- ✅ Supabase configuration is valid
- ✅ Project ID matches the URL
- ⚠️ Optional configurations (analytics, custom domain)

### Step 4: Configure Backend Secrets

Configure these secrets in the Supabase Dashboard at:
**Settings > Edge Functions > Secrets**

Required secrets:
```bash
# These are auto-configured by Supabase:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY

# Configure these for integrations:
ZAPIER_WEBHOOK_URL=<your-zapier-webhook-url>
GHL_API_KEY=<your-go-high-level-api-key>
GHL_LOCATION_ID=<your-ghl-location-id>

# Optional - for server-side analytics:
GTAG_ID=<your-google-tag-id>
CONVERSION_LABEL=<your-conversion-label>
```

### Step 5: Deploy Edge Functions

Deploy the edge functions to your new Supabase project:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-id>

# Deploy all functions
supabase functions deploy
```

### Step 6: Deploy to Hosting Platform

#### Option A: Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy:
   ```bash
   vercel --prod
   ```
3. In Vercel dashboard, add environment variables from `.env.production`:
   - Go to **Settings > Environment Variables**
   - Add each `VITE_*` variable

#### Option B: Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Deploy:
   ```bash
   netlify deploy --prod
   ```
3. In Netlify dashboard, add environment variables from `.env.production`:
   - Go to **Site Settings > Environment Variables**
   - Add each `VITE_*` variable

#### Option C: Manual Build

1. Build the project:
   ```bash
   npm run build
   ```
2. Upload the `dist` folder to your hosting provider
3. Configure environment variables in your hosting platform

## Configuration Reference

### Frontend Environment Variables (VITE_*)

These are embedded at build time and must be set in your hosting platform:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_CLIENT_NAME` | Yes | Unique client identifier | `acme-corp` |
| `VITE_ENVIRONMENT` | No | Deployment environment | `production` |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public key | `eyJ...` |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID | `xyz123abc456` |
| `VITE_CUSTOM_DOMAIN` | No | Custom domain | `www.example.com` |
| `VITE_GOOGLE_TAG_ID` | No | Google Analytics/Tag Manager | `G-XXXXXXXXXX` |
| `VITE_GOOGLE_CONVERSION_LABEL` | No | Google Ads conversion label | `AW-XXXXXXXXXX/...` |

### Backend Secrets (Supabase Dashboard)

These are configured in the Supabase Dashboard and never exposed to the frontend:

| Secret | Required | Description |
|--------|----------|-------------|
| `SUPABASE_URL` | Auto | Supabase project URL (auto-configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Service role key (auto-configured) |
| `SUPABASE_ANON_KEY` | Auto | Public anon key (auto-configured) |
| `ZAPIER_WEBHOOK_URL` | Optional | Zapier webhook for lead submission |
| `GHL_API_KEY` | Optional | Go High Level API key |
| `GHL_LOCATION_ID` | Optional | Go High Level location ID |
| `GTAG_ID` | Optional | Server-side analytics tracking |
| `CONVERSION_LABEL` | Optional | Server-side conversion tracking |

## Testing Your Deployment

1. **Frontend Test**:
   - Visit your deployed URL
   - Check browser console for any errors
   - Verify client name in dev tools: `clientConfig.client.name`

2. **Backend Test**:
   - Submit a test lead through the form
   - Check Edge Function logs in Supabase Dashboard
   - Verify data appears in your database/integrations

3. **Analytics Test** (if configured):
   - Perform test conversion
   - Check Google Analytics/Ads dashboard
   - Verify events are being tracked

## Troubleshooting

### Build Fails

- **Error**: "Invalid configuration"
  - **Solution**: Run validation script to identify missing variables

- **Error**: "Module not found"
  - **Solution**: Run `npm install` to ensure all dependencies are installed

### Runtime Errors

- **Error**: "Missing Supabase configuration"
  - **Solution**: Verify environment variables are set in hosting platform and rebuild

- **Error**: "Invalid Supabase URL"
  - **Solution**: Check that URL format matches `https://[project-id].supabase.co`

### Edge Function Errors

- **Error**: "Missing secret: ZAPIER_WEBHOOK_URL"
  - **Solution**: Configure the secret in Supabase Dashboard > Settings > Functions

- **Error**: "Function timeout"
  - **Solution**: Check edge function logs for performance issues

## Rollback Procedure

If a deployment has issues:

1. **Immediate Rollback** (Hosting):
   - Vercel: `vercel rollback` or use dashboard
   - Netlify: Use dashboard to revert to previous deployment

2. **Revert Edge Functions**:
   ```bash
   supabase functions deploy <function-name> --version <previous-version>
   ```

3. **Database Rollback** (if needed):
   - Review recent migrations in Supabase dashboard
   - Use SQL Editor to revert specific changes

## Multi-Environment Setup

For staging environments:

1. Create a separate Supabase project for staging
2. Run setup script with staging project details:
   ```bash
   ./scripts/setup-client.sh acme-corp-staging xyz789staging
   ```
3. Deploy to a staging environment in your hosting platform
4. Set `VITE_ENVIRONMENT=staging` in hosting platform

## Support & Resources

- **Architecture Documentation**: See `docs/lovable-multi-client-architecture.md`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Edge Function Logs**: https://supabase.com/dashboard/project/{project-id}/functions/{function-name}/logs
- **Validation Script**: Run `./scripts/validate-setup.sh` anytime to check configuration

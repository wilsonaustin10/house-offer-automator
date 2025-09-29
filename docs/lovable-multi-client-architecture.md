# Lovable Multi-Client Deployment Architecture

## Executive Summary

This document outlines a production-ready architecture for deploying multiple client instances using Lovable's platform with Supabase backend integration. It addresses the unique constraints of the Lovable ecosystem while maintaining scalability, security, and operational excellence.

## Critical Constraints & Adaptations

### Lovable Platform Limitations

1. **Environment Variable Restrictions**
   - `VITE_*` variables work in frontend code but **NOT** in Supabase Edge Functions
   - Edge Functions can only access Supabase Secrets
   - No `.env` file support in traditional sense

2. **Dual Configuration Strategy Required**
   - **Frontend**: Uses `VITE_*` environment variables (for build-time configuration)
   - **Backend**: Uses Supabase Secrets (for runtime configuration in edge functions)

3. **Deployment Model**
   - Lovable handles deployments through its platform
   - Cannot use traditional CI/CD pipelines directly
   - Must work within Lovable's publish workflow

---

## Architecture Overview

### Three-Tier Configuration Model

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │   Frontend      │         │   Backend       │           │
│  │   (Lovable)     │         │   (Supabase)    │           │
│  ├─────────────────┤         ├─────────────────┤           │
│  │ VITE_* vars     │────────▶│ Secrets Manager │           │
│  │ - SUPABASE_URL  │         │ - GHL_API_KEY   │           │
│  │ - ANON_KEY      │         │ - GTAG_ID       │           │
│  │ - PROJECT_ID    │         │ - WEBHOOK_URL   │           │
│  │ - CLIENT_NAME   │         │ - etc.          │           │
│  └─────────────────┘         └─────────────────┘           │
│         │                            │                       │
│         └────────────────────────────┘                       │
│              Coordinated Deployment                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Strategy

### Phase 1: Template Setup for Multi-Client Deployment

#### 1.1 Frontend Configuration System

**Create Environment Configuration Manager:**

```typescript
// src/config/client.config.ts
/**
 * Client-specific configuration
 * Set these via Lovable's environment variable settings
 */
export const clientConfig = {
  // Supabase Configuration (Frontend)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || ''
  },
  
  // Client Identification
  client: {
    name: import.meta.env.VITE_CLIENT_NAME || 'default',
    environment: import.meta.env.VITE_ENVIRONMENT || 'production',
    domain: import.meta.env.VITE_CUSTOM_DOMAIN || ''
  },
  
  // Feature Flags (per-client customization)
  features: {
    googleTag: import.meta.env.VITE_GOOGLE_TAG_ID || '',
    conversionLabel: import.meta.env.VITE_GOOGLE_CONVERSION_LABEL || '',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableChat: import.meta.env.VITE_ENABLE_CHAT === 'true'
  }
};

// Validation function
export function validateClientConfig() {
  const required = [
    { key: 'VITE_SUPABASE_URL', value: clientConfig.supabase.url },
    { key: 'VITE_SUPABASE_ANON_KEY', value: clientConfig.supabase.anonKey },
    { key: 'VITE_SUPABASE_PROJECT_ID', value: clientConfig.supabase.projectId },
    { key: 'VITE_CLIENT_NAME', value: clientConfig.client.name }
  ];

  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.map(m => m.key));
    throw new Error(`Configuration Error: Missing ${missing.map(m => m.key).join(', ')}`);
  }

  return true;
}
```

**Update Supabase Client to Use Configuration:**

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { clientConfig, validateClientConfig } from '@/config/client.config';
import type { Database } from './types';

// Validate configuration on initialization
validateClientConfig();

export const supabase = createClient<Database>(
  clientConfig.supabase.url,
  clientConfig.supabase.anonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export client info for debugging
export const clientInfo = {
  name: clientConfig.client.name,
  environment: clientConfig.client.environment,
  projectId: clientConfig.supabase.projectId
};
```

#### 1.2 Backend Configuration System (Supabase Secrets)

**Required Secrets per Client:**

```bash
# Client-Specific Secrets (Set in Supabase Dashboard)
GHL_API_KEY                    # GoHighLevel API Key
GHL_LOCATION_ID                # GoHighLevel Location ID
ZAPIER_WEBHOOK_URL             # Zapier webhook endpoint
GTAG_ID                        # Google Tag Manager ID
CONVERSION_LABEL               # Google conversion label

# System Secrets (Pre-configured)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
```

**Edge Function Configuration Handler:**

```typescript
// supabase/functions/_shared/config.ts
/**
 * Shared configuration loader for edge functions
 * Reads from Supabase Secrets
 */
export interface EdgeFunctionConfig {
  ghl: {
    apiKey: string;
    locationId: string;
  };
  zapier: {
    webhookUrl: string;
  };
  analytics: {
    gtagId: string;
    conversionLabel: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
}

export function loadEdgeConfig(): EdgeFunctionConfig {
  // All secrets are accessed via Deno.env in edge functions
  const config: EdgeFunctionConfig = {
    ghl: {
      apiKey: Deno.env.get('GHL_API_KEY') || '',
      locationId: Deno.env.get('GHL_LOCATION_ID') || ''
    },
    zapier: {
      webhookUrl: Deno.env.get('ZAPIER_WEBHOOK_URL') || ''
    },
    analytics: {
      gtagId: Deno.env.get('GTAG_ID') || '',
      conversionLabel: Deno.env.get('CONVERSION_LABEL') || ''
    },
    supabase: {
      url: Deno.env.get('SUPABASE_URL') || '',
      anonKey: Deno.env.get('SUPABASE_ANON_KEY') || '',
      serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    }
  };

  return config;
}

export function validateEdgeConfig(config: EdgeFunctionConfig, required: string[] = []): void {
  const allChecks = [
    { name: 'SUPABASE_URL', value: config.supabase.url },
    { name: 'SUPABASE_ANON_KEY', value: config.supabase.anonKey },
    ...required.map(key => {
      const parts = key.split('.');
      let value: any = config;
      for (const part of parts) {
        value = value?.[part];
      }
      return { name: key, value };
    })
  ];

  const missing = allChecks.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.map(m => m.name).join(', ')}`);
  }
}
```

**Updated Edge Function Template:**

```typescript
// supabase/functions/submit-lead/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadEdgeConfig, validateEdgeConfig } from '../_shared/config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load and validate configuration
    const config = loadEdgeConfig();
    validateEdgeConfig(config, ['ghl.apiKey', 'ghl.locationId', 'zapier.webhookUrl']);

    const { address, propertyCondition, timeline } = await req.json();

    // Use config values
    const ghlResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ghl.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locationId: config.ghl.locationId,
        // ... rest of data
      })
    });

    // ... rest of logic

  } catch (error) {
    console.error('Error in submit-lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

### Phase 2: Multi-Client Deployment Workflow

#### 2.1 Client Setup Process

**Per-Client Setup Checklist:**

1. **Create New Supabase Project**
   ```bash
   # Via Supabase Dashboard
   - Create new project
   - Note: Project ID, URL, Anon Key, Service Role Key
   ```

2. **Configure Supabase Secrets**
   ```bash
   # Via Supabase Dashboard > Project Settings > Edge Functions > Secrets
   - Add GHL_API_KEY
   - Add GHL_LOCATION_ID
   - Add ZAPIER_WEBHOOK_URL
   - Add GTAG_ID
   - Add CONVERSION_LABEL
   ```

3. **Run Database Migrations**
   ```sql
   -- Apply from supabase/migrations/ folder
   -- Migrations are tracked in Supabase Dashboard
   ```

4. **Create Lovable Environment Variables**
   ```bash
   # Via Lovable Project Settings > Environment Variables
   VITE_SUPABASE_URL=https://[project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[anon-key]
   VITE_SUPABASE_PROJECT_ID=[project-id]
   VITE_CLIENT_NAME=client-a
   VITE_ENVIRONMENT=production
   VITE_CUSTOM_DOMAIN=client-a.com
   VITE_GOOGLE_TAG_ID=[gtag-id]
   VITE_GOOGLE_CONVERSION_LABEL=[conversion-label]
   ```

5. **Deploy via Lovable**
   ```bash
   # Via Lovable Dashboard
   - Click "Publish" button
   - Configure custom domain
   - Verify deployment
   ```

#### 2.2 Client Configuration Template

**Create per-client documentation:**

```markdown
# Client: [CLIENT_NAME]
**Environment:** Production
**Domain:** [custom-domain.com]
**Deployed:** [date]

## Supabase Configuration
- **Project ID:** [project-id]
- **Project URL:** https://[project-id].supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/[project-id]

## Lovable Configuration
- **Project URL:** https://[project-name].lovable.app
- **Custom Domain:** [custom-domain.com]
- **Environment Variables:** ✓ Configured

## External Integrations
- **GoHighLevel Location:** [location-id]
- **Zapier Webhook:** [webhook-url]
- **Google Tag Manager:** [gtag-id]

## Deployment History
- v1.0.0 - [date] - Initial deployment
```

---

### Phase 3: Database Schema Management

#### 3.1 Migration Strategy

**Version-Controlled Schema:**

```sql
-- supabase/migrations/20250101000000_init_leads_table.sql
-- Version: 1.0.0
-- Description: Initial leads table with client tracking

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    property_condition TEXT NOT NULL,
    timeline TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Client tracking (optional for multi-tenant)
    client_name TEXT,
    
    -- External IDs
    ghl_contact_id TEXT,
    zapier_submission_id TEXT,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    referrer TEXT
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public insert policy (for lead submissions)
CREATE POLICY "Allow public lead submissions"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Admin read policy (service role only)
CREATE POLICY "Allow service role full access"
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_client_name ON public.leads(client_name);

-- Add updated_at trigger
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

#### 3.2 Multi-Tenant Considerations

**Option A: Separate Databases (Recommended)**
- Each client gets their own Supabase project
- Complete data isolation
- Independent scaling
- Simpler RLS policies

**Option B: Shared Database with Tenant ID**
- Single Supabase project
- Client identification via `client_name` field
- More complex RLS policies
- Cost-effective for small clients

---

### Phase 4: Monitoring & Operations

#### 4.1 Logging Strategy

**Frontend Logging:**

```typescript
// src/utils/logger.ts
import { clientConfig } from '@/config/client.config';

export const logger = {
  info: (message: string, data?: any) => {
    if (clientConfig.client.environment === 'development') {
      console.log(`[${clientConfig.client.name}] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`[${clientConfig.client.name}] ${message}`, error);
    
    // Optional: Send to error tracking service
    if (clientConfig.client.environment === 'production') {
      // Send to Sentry, LogRocket, etc.
    }
  },
  
  track: (event: string, properties?: any) => {
    console.log(`[${clientConfig.client.name}] Event: ${event}`, properties);
    
    // Track in analytics
    if (window.gtag && clientConfig.features.googleTag) {
      window.gtag('event', event, properties);
    }
  }
};
```

**Backend Logging (Edge Functions):**

```typescript
// Always log to console in edge functions
// Logs are available in Supabase Dashboard > Functions > [function-name] > Logs

console.log(`[submit-lead] Processing submission for client: ${config.client.name}`);
console.error(`[submit-lead] Error:`, error);
```

#### 4.2 Health Checks

**Frontend Health Check:**

```typescript
// src/utils/health.ts
import { supabase, clientInfo } from '@/integrations/supabase/client';

export async function performHealthCheck() {
  try {
    // Check Supabase connection
    const { error } = await supabase.from('leads').select('count').limit(1);
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      client: clientInfo,
      timestamp: new Date().toISOString(),
      error: error?.message
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      client: clientInfo,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}
```

#### 4.3 Monitoring Dashboard Links

**Per-Client Monitoring:**

```markdown
## Client: [CLIENT_NAME] - Quick Links

### Supabase
- [Database](https://supabase.com/dashboard/project/[project-id]/editor)
- [Edge Function Logs](https://supabase.com/dashboard/project/[project-id]/functions)
- [Auth Users](https://supabase.com/dashboard/project/[project-id]/auth/users)
- [Secrets](https://supabase.com/dashboard/project/[project-id]/settings/functions)

### Lovable
- [Project Dashboard](https://lovable.dev/projects/[project-id])
- [Deployments](https://lovable.dev/projects/[project-id]/deployments)
- [Environment Variables](https://lovable.dev/projects/[project-id]/settings)

### External Services
- [GoHighLevel Dashboard](https://app.gohighlevel.com)
- [Google Analytics](https://analytics.google.com)
- [Domain DNS Settings](https://[registrar].com)
```

---

## Deployment Runbook

### New Client Onboarding (30-60 minutes)

1. **Pre-requisites Collection (15 min)**
   - [ ] Client name identifier
   - [ ] Custom domain
   - [ ] GHL API key & location ID
   - [ ] Zapier webhook URL
   - [ ] Google Tag Manager ID & conversion label

2. **Supabase Setup (10 min)**
   - [ ] Create new Supabase project
   - [ ] Copy project credentials
   - [ ] Run database migrations
   - [ ] Configure RLS policies
   - [ ] Add secrets to Supabase

3. **Lovable Configuration (10 min)**
   - [ ] Fork/Remix project (or use same codebase)
   - [ ] Add environment variables
   - [ ] Configure custom domain
   - [ ] Test build

4. **Deployment & Verification (15 min)**
   - [ ] Publish via Lovable
   - [ ] Verify DNS propagation
   - [ ] Test lead submission flow
   - [ ] Verify GHL integration
   - [ ] Verify Zapier webhook
   - [ ] Test Google Tag tracking

5. **Documentation (10 min)**
   - [ ] Create client documentation file
   - [ ] Record all credentials (in secure vault)
   - [ ] Update monitoring dashboard
   - [ ] Send handoff email to client

---

## Security Best Practices

### 1. Credential Management

- **Never commit secrets to Git**
- **Use Supabase Secrets for backend**
- **Use Lovable Environment Variables for frontend**
- **Rotate API keys quarterly**
- **Use service role key only in edge functions**

### 2. RLS Policies

```sql
-- Always enable RLS on user-accessible tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Restrict service role access to edge functions only
-- Never expose service role key to frontend
```

### 3. CORS Configuration

```typescript
// Always restrict CORS in production edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## Cost Optimization

### Supabase Pricing per Client

- **Free Tier:** 500MB database, 2GB bandwidth, 2GB file storage
- **Pro Tier ($25/mo):** 8GB database, 50GB bandwidth, 100GB storage
- **Recommendation:** Start with Pro tier for production clients

### Lovable Pricing

- **Per-project pricing**
- **Consider consolidating similar clients if possible**

### Total Cost per Client

- Supabase Pro: $25/mo
- Lovable: [current pricing]
- Domain: $12-15/year
- **Estimated: $30-40/mo per client**

---

## Rollback Procedures

### Frontend Rollback (via Lovable)

1. Go to Lovable Project Dashboard
2. Navigate to Deployments history
3. Click "Rollback" on previous deployment
4. Verify functionality

### Backend Rollback (Supabase Migrations)

```sql
-- Create rollback migrations
-- supabase/migrations/20250101000001_rollback_init_leads_table.sql
DROP TABLE IF EXISTS public.leads CASCADE;
```

### Emergency Procedures

1. **Complete outage:**
   - Switch DNS to maintenance page
   - Investigate via Supabase logs
   - Contact Lovable support if needed

2. **Data corruption:**
   - Use Supabase point-in-time recovery
   - Restore from daily backups

---

## Testing Strategy

### Pre-Deployment Checklist

```typescript
// Test script to run before each deployment
export async function preDeploymentTest() {
  const tests = [
    { name: 'Config validation', fn: validateClientConfig },
    { name: 'Supabase connection', fn: testSupabaseConnection },
    { name: 'Edge function health', fn: testEdgeFunctionHealth },
    { name: 'GHL API connectivity', fn: testGHLIntegration },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✓ ${test.name}`);
    } catch (error) {
      console.error(`✗ ${test.name}:`, error);
      throw new Error(`Pre-deployment test failed: ${test.name}`);
    }
  }
}
```

---

## Conclusion

This architecture provides a production-ready framework for deploying multiple client instances while working within Lovable's platform constraints. Key principles:

1. **Dual configuration:** Frontend uses `VITE_*` vars, backend uses Supabase Secrets
2. **Complete isolation:** Each client gets their own Supabase project
3. **Operational excellence:** Comprehensive logging, monitoring, and rollback procedures
4. **Security first:** RLS policies, secret management, credential rotation

By following this architecture, you can confidently deploy and manage dozens of client instances with predictable outcomes and minimal operational overhead.

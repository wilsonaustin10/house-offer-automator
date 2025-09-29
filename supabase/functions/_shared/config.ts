/**
 * Shared Configuration for Supabase Edge Functions
 * 
 * This module provides centralized configuration management for edge functions.
 * Uses Supabase Secrets (managed via Supabase dashboard) for sensitive data.
 * 
 * Important: Edge functions CANNOT access VITE_* environment variables.
 * All configuration must be stored as Supabase Secrets.
 */

export interface EdgeFunctionConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
    anonKey: string;
  };
  integrations: {
    zapier?: {
      webhookUrl: string;
    };
    ghl?: {
      apiKey: string;
      locationId?: string;
    };
  };
  analytics?: {
    gtagId?: string;
    conversionLabel?: string;
  };
}

/**
 * Get configuration from Supabase Secrets
 * Throws an error if required secrets are missing
 */
export function getEdgeFunctionConfig(): EdgeFunctionConfig {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const config: EdgeFunctionConfig = {
    supabase: {
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceKey,
      anonKey: supabaseAnonKey || ''
    },
    integrations: {}
  };

  // Optional Zapier integration
  const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
  if (zapierWebhookUrl && zapierWebhookUrl.trim()) {
    config.integrations.zapier = {
      webhookUrl: zapierWebhookUrl.trim()
    };
  }

  // Optional Go High Level integration
  const ghlApiKey = Deno.env.get('GHL_API_KEY');
  const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
  if (ghlApiKey && ghlApiKey.trim()) {
    config.integrations.ghl = {
      apiKey: ghlApiKey.trim(),
      locationId: ghlLocationId?.trim()
    };
  }

  // Optional Analytics
  const gtagId = Deno.env.get('GTAG_ID');
  const conversionLabel = Deno.env.get('CONVERSION_LABEL');
  if (gtagId || conversionLabel) {
    config.analytics = {
      gtagId: gtagId?.trim(),
      conversionLabel: conversionLabel?.trim()
    };
  }

  return config;
}

/**
 * Validate that all required secrets for a specific integration are present
 */
export function validateIntegrationConfig(integration: 'zapier' | 'ghl'): boolean {
  const config = getEdgeFunctionConfig();
  
  switch (integration) {
    case 'zapier':
      return !!config.integrations.zapier?.webhookUrl;
    case 'ghl':
      return !!config.integrations.ghl?.apiKey;
    default:
      return false;
  }
}

/**
 * Log configuration status (without sensitive data)
 */
export function logConfigStatus() {
  const config = getEdgeFunctionConfig();
  
  console.log('Edge Function Configuration Status:', {
    supabase: {
      hasUrl: !!config.supabase.url,
      hasServiceKey: !!config.supabase.serviceRoleKey,
      hasAnonKey: !!config.supabase.anonKey
    },
    integrations: {
      zapier: !!config.integrations.zapier,
      ghl: !!config.integrations.ghl
    },
    analytics: {
      hasGtag: !!config.analytics?.gtagId,
      hasConversionLabel: !!config.analytics?.conversionLabel
    }
  });
}

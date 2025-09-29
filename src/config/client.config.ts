/**
 * Client Configuration System
 * 
 * This file manages environment-specific configuration for multi-client deployments.
 * It uses VITE_* environment variables which are embedded at build time.
 * 
 * For production deployments, set these in your hosting platform (Vercel, Netlify, etc.)
 */

import { z } from 'zod';

// Configuration schema with validation
const configSchema = z.object({
  supabase: z.object({
    url: z.string().url('Invalid Supabase URL'),
    anonKey: z.string().min(1, 'Supabase anon key is required'),
    projectId: z.string().min(1, 'Supabase project ID is required')
  }),
  client: z.object({
    name: z.string().min(1, 'Client name is required'),
    environment: z.enum(['development', 'staging', 'production']).default('production'),
    domain: z.string().optional()
  }),
  analytics: z.object({
    googleTagId: z.string().optional(),
    conversionLabel: z.string().optional()
  })
});

export type ClientConfig = z.infer<typeof configSchema>;

/**
 * Get configuration from environment variables
 * Validates the configuration and throws an error if invalid
 */
function getConfig(): ClientConfig {
  const rawConfig = {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || ''
    },
    client: {
      name: import.meta.env.VITE_CLIENT_NAME || 'default',
      environment: (import.meta.env.VITE_ENVIRONMENT || 'production') as 'development' | 'staging' | 'production',
      domain: import.meta.env.VITE_CUSTOM_DOMAIN
    },
    analytics: {
      googleTagId: import.meta.env.VITE_GOOGLE_TAG_ID,
      conversionLabel: import.meta.env.VITE_GOOGLE_CONVERSION_LABEL
    }
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:', error.errors);
      throw new Error(
        `Invalid configuration: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
}

// Export validated configuration
export const clientConfig = getConfig();

// Helper functions for common config access
export const getSupabaseConfig = () => clientConfig.supabase;
export const getClientInfo = () => clientConfig.client;
export const getAnalyticsConfig = () => clientConfig.analytics;

// Log configuration in development (without sensitive data)
if (import.meta.env.DEV) {
  console.log('Client Configuration:', {
    client: clientConfig.client,
    supabase: {
      url: clientConfig.supabase.url,
      projectId: clientConfig.supabase.projectId,
      anonKey: `${clientConfig.supabase.anonKey.substring(0, 10)}...`
    },
    analytics: {
      hasGoogleTag: !!clientConfig.analytics.googleTagId,
      hasConversionLabel: !!clientConfig.analytics.conversionLabel
    }
  });
}

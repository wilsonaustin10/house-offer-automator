/**
 * Supabase Client Configuration
 * 
 * Uses environment-specific configuration for multi-client deployments.
 * Falls back to default values if environment variables are not set.
 * 
 * For new deployments:
 * 1. Set VITE_SUPABASE_URL in your hosting environment
 * 2. Set VITE_SUPABASE_ANON_KEY in your hosting environment
 * 3. Set VITE_SUPABASE_PROJECT_ID in your hosting environment
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default configuration (current project)
const DEFAULT_SUPABASE_URL = "https://kqzfjhtgutnzghymrqhy.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxemZqaHRndXRuemdoeW1ycWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDY2MzEsImV4cCI6MjA3Mzc4MjYzMX0.8Gnaetyqc7SfY-LMGXS0ILZZMgUfFdbsbzx5h7lmbMM";

// Use environment variables if available, otherwise fall back to defaults
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
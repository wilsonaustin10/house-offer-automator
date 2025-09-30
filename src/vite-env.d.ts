/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client Configuration
  readonly VITE_CLIENT_NAME?: string
  readonly VITE_ENVIRONMENT?: 'development' | 'staging' | 'production'
  readonly VITE_CUSTOM_DOMAIN?: string
  
  // Supabase Configuration
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PROJECT_ID?: string
  
  // Analytics Configuration
  readonly VITE_GOOGLE_TAG_ID?: string
  readonly VITE_GOOGLE_CONVERSION_LABEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

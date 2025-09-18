/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_TAG_ID?: string
  readonly VITE_GOOGLE_CONVERSION_LABEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

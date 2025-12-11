// Manually declare Vite client types since 'vite/client' is missing
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend the existing NodeJS.ProcessEnv interface to include API_KEY.
// This avoids "Cannot redeclare block-scoped variable 'process'" errors.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

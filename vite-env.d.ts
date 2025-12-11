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
    // ⚠️ DO NOT PASTE YOUR API KEY HERE ⚠️
    // This is just a type definition telling TypeScript that "API_KEY" exists.
    // To set the actual value, create a .env file and add: VITE_GEMINI_API_KEY=your_key
    API_KEY: string;
  }
}

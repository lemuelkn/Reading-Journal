import { createClient } from '@supabase/supabase-js';

// Helper to access environment variables in Vite or standard environments
const getEnvVar = (key: string) => {
  // Check Vite (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  // Check Process (Node/CRA/Next)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// If keys are missing or look like placeholders, we are in Demo Mode
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_url');

export const isSupabaseConfigured = () => {
  return !isDemoMode;
};

// Use dummy values for the client if in demo mode so the app doesn't crash on load.
const clientUrl = isDemoMode ? 'https://demo.supabase.co' : supabaseUrl;
const clientKey = isDemoMode ? 'demo-key' : supabaseAnonKey;

// --- Safety Check for Service Role Key ---
if (!isDemoMode && clientKey) {
  try {
    // Check if the key looks like a JWT
    const parts = clientKey.split('.');
    if (parts.length === 3) {
      // Decode JWT payload (Base64Url -> Base64)
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      if (payload.role === 'service_role') {
        console.error(`
          \n
          🔴 CRITICAL CONFIGURATION ERROR 🔴
          You are using the Supabase "service_role" (secret) key in the browser.
          This is a security risk and causes the "Forbidden use of secret API key" error.
          
          Please update your .env file:
          VITE_SUPABASE_ANON_KEY should contain the "anon" (public) key found in:
          Supabase Dashboard -> Settings -> API -> Project API keys
          \n
        `);
      }
    }
  } catch (e) {
    // Silently ignore parsing errors and let Supabase client handle validation
  }
}

if (isDemoMode) {
  console.log("⚠️ Lumina is running in DEMO MODE (Local Storage)."); 
  console.log("👉 To go live, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart.");
} else {
  console.log("✅ Lumina is connected to Supabase Backend.");
}

export const supabase = createClient(clientUrl, clientKey);
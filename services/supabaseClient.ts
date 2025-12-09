import { createClient } from '@supabase/supabase-js';

// Access environment variables safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// If keys are missing or look like placeholders, we are in Demo Mode
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_url';

export const isSupabaseConfigured = () => {
  return !isDemoMode;
};

// Use dummy values for the client if in demo mode so the app doesn't crash on load.
// The App.tsx logic will prevent using this client if isDemoMode is true.
const clientUrl = isDemoMode ? 'https://demo.supabase.co' : supabaseUrl;
const clientKey = isDemoMode ? 'demo-key' : supabaseAnonKey;

if (isDemoMode) {
  console.log("⚠️ Lumina is running in DEMO MODE (Local Storage). Add Supabase keys to .env to go live.");
} else {
  console.log("✅ Lumina is connected to Supabase Backend.");
}

export const supabase = createClient(clientUrl, clientKey);
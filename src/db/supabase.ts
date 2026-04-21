import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Netlify environment settings."
  );
}

// Extract project ref for consistent storage key
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so it survives tab/browser close
    persistSession: true,
    // Use Supabase's default storage (localStorage wrapper with edge-case handling)
    // Do NOT set storage: window.localStorage — it bypasses internal session management
    // Use a consistent storage key
    storageKey: `sb-${projectRef}-auth-token`,
    // Automatically refresh the JWT before it expires
    autoRefreshToken: true,
    // Detect OAuth callback tokens in the URL
    detectSessionInUrl: true,
    // Use implicit flow (default) — PKCE uses sessionStorage for code verifiers
    // which gets cleared when browser closes, causing session loss
    flowType: 'implicit',
  },
});

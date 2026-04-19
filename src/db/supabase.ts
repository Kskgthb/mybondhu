import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Netlify environment settings."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so it survives tab/browser close
    persistSession: true,
    // Automatically refresh the JWT before it expires
    autoRefreshToken: true,
    // Detect OAuth callback tokens in the URL
    detectSessionInUrl: true,
    // Use PKCE flow for OAuth (more secure)
    flowType: 'pkce',
  },
});

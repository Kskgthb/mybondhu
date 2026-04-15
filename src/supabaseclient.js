import { createClient } from "@supabase/supabase-js";

const supabaseUrl ='https://jfqudweigoqazpkhfgrj.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaHBwbHNyeHd0bG5xZ2J2cmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTk2MzgsImV4cCI6MjA4NjI3NTYzOH0.EWVvaMIWwSYMvTyFgwMmp0j210biMSjJWO6aY-d6H0U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

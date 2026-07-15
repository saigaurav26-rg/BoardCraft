import { createClient } from '@supabase/supabase-js';

// Retrieve your configured environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the named client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
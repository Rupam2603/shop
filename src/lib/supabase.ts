import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env.local file."
  );
}

/**
 * Singleton Supabase browser client.
 *
 * Uses the ANON key — safe to expose in the browser because
 * all access is restricted by Row Level Security (RLS) policies.
 *
 * NEVER import or use the service-role key in this file or any frontend file.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Database types ────────────────────────────────────────────────────────────

export type UserRole = "customer" | "retailer" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  shop_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

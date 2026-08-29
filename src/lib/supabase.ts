import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://httevxkzcudyugqbpptd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dGV2eGt6Y3VkeXVncWJwcHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDgwNDAsImV4cCI6MjEwMzQ4NDA0MH0.K8Zcrf_zk2ibFjNekPinv-UpfOVfofjO4n7qxXJi0KY";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

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
  approval_status?: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

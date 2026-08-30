import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";

export type UserRole = "customer" | "retailer" | "admin";

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  shop_name: string | null;
  avatar_url: string | null;
  approval_status?: "pending" | "approved" | "blocked" | "rejected";
  created_at: string;
  updated_at: string;
}

const NEON_AUTH_API = import.meta.env.VITE_NEON_AUTH_API;
const NEON_DATA_API = import.meta.env.VITE_NEON_DATA_API;

if (!NEON_AUTH_API || !NEON_DATA_API) {
  throw new Error(
    "Missing VITE_NEON_AUTH_API / VITE_NEON_DATA_API environment variables. Set them in .env.local (see .env.example)."
  );
}

/**
 * Real Neon Auth (Managed Better Auth) + Neon Data API client.
 *
 * The SupabaseAuthAdapter gives `supabase.auth.*` the same shape as
 * `@supabase/supabase-js` (signInWithPassword, signUp, onAuthStateChange,
 * admin.*, ...), and `supabase.from(...)` talks to the Neon Data API
 * (PostgREST-compatible), authorized via Postgres Row-Level Security using
 * the signed-in user's JWT. No database credentials are ever present in
 * this client or the browser bundle.
 */
export const supabase = createClient({
  auth: {
    url: NEON_AUTH_API,
    adapter: SupabaseAuthAdapter(),
    // Store settings and the retailer-approval status check are readable
    // before login; everything else is still gated by RLS per-role.
    allowAnonymous: true,
  },
  dataApi: {
    url: NEON_DATA_API,
  },
});

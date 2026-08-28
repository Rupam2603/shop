import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, UserRole } from "../lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  /** Supabase Auth user (contains id, email, etc.) */
  authUser: User;
  /** Our profiles row (contains role, full_name, phone, etc.) */
  profile: Profile;
}

interface AuthContextValue {
  /** null = not logged in, undefined = still loading */
  appUser: AppUser | null | undefined;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (opts: SignUpOptions) => Promise<{ error: string | null; emailConfirmationRequired: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, "full_name" | "phone" | "shop_name" | "avatar_url">>) => Promise<{ error: string | null }>;
}

interface SignUpOptions {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  shopName?: string;
  role: "customer" | "retailer"; // Only these two allowed for public signup
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the profile row from the database for a given Supabase Auth user.
   * Returns null if profile doesn't exist yet (e.g., trigger hasn't run).
   */
  const fetchProfile = useCallback(async (user: User): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error.message);
      return null;
    }
    return data as Profile;
  }, []);

  /**
   * Sets up the combined AppUser from an auth user + their profile.
   */
  const hydrateUser = useCallback(
    async (user: User | null) => {
      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      const profile = await fetchProfile(user);
      if (profile) {
        setAppUser({ authUser: user, profile });
        setLoading(false);
      } else {
        // If profile query fails or trigger hasn't completed yet,
        // construct profile from user_metadata so the user is never locked out.
        const meta = user.user_metadata || {};
        const safeRole: UserRole = meta.role === "admin" ? "admin" : meta.role === "retailer" ? "retailer" : "customer";
        const fallbackProfile: Profile = {
          id: user.id,
          full_name: meta.full_name || user.email?.split("@")[0] || "User",
          role: safeRole,
          phone: meta.phone ?? null,
          shop_name: meta.shop_name ?? null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setAppUser({ authUser: user, profile: fallbackProfile });
        setLoading(false);

        // Attempt background insert if missing
        supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: fallbackProfile.full_name,
            role: safeRole,
            phone: fallbackProfile.phone,
            shop_name: fallbackProfile.shop_name,
          })
          .then(({ data: upserted }) => {
            if (upserted) {
              setAppUser({ authUser: user, profile: upserted as Profile });
            }
          });
      }
    },
    [fetchProfile]
  );

  // ── Listen to auth state changes (login, logout, session restore) ────────────
  useEffect(() => {
    // Get initial session (restores session after browser refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrateUser(session?.user ?? null);
    });

    // Subscribe to future auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  // ── Sign In ──────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error) };
      }
      if (data.user) {
        await hydrateUser(data.user);
      }
      return { error: null };
    },
    [hydrateUser]
  );

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (opts: SignUpOptions): Promise<{ error: string | null; emailConfirmationRequired: boolean }> => {
      setLoading(true);

      // Security: block admin role — this would be ignored anyway by the
      // trigger (which always sets 'customer'), but we enforce it here too.
      const safeRole: "customer" | "retailer" = opts.role === "retailer" ? "retailer" : "customer";

      const { data, error } = await supabase.auth.signUp({
        email: opts.email,
        password: opts.password,
        options: {
          data: {
            full_name: opts.fullName,
            role: safeRole,      // stored in raw_user_meta_data
            phone: opts.phone ?? null,
            shop_name: opts.shopName ?? null,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error), emailConfirmationRequired: false };
      }

      // If email confirmation is required, the session will be null
      const emailConfirmationRequired = !data.session;

      if (data.session && data.user) {
        await hydrateUser(data.user);
      } else {
        setLoading(false);
      }

      return { error: null, emailConfirmationRequired };
    },
    [hydrateUser]
  );

  // ── Reset Password ──────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { error: friendlyAuthError(error) };
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message || "Failed to send reset link." };
    }
  }, []);

  // ── Sign Out ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setAppUser(null);
    setLoading(false);
  }, []);

  // ── Update Profile ───────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<Profile, "full_name" | "phone" | "shop_name" | "avatar_url">>
    ): Promise<{ error: string | null }> => {
      if (!appUser) return { error: "Not authenticated." };

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", appUser.authUser.id)
        .select()
        .single();

      if (error) return { error: error.message };

      // Update local state
      setAppUser((prev) =>
        prev ? { ...prev, profile: data as Profile } : prev
      );
      return { error: null };
    },
    [appUser]
  );

  return (
    <AuthContext.Provider value={{ appUser, loading, signIn, signUp, resetPassword, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ─── Helper — turn Supabase AuthError into friendly message ───────────────────

function friendlyAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials"))
    return "Incorrect email or password. Please verify your credentials and try again.";
  if (msg.includes("email not confirmed"))
    return "Please confirm your email address first. Check your inbox.";
  if (msg.includes("user already registered") || msg.includes("already been registered"))
    return "An account with this email already exists. Try logging in instead.";
  if (msg.includes("password should be at least"))
    return "Password must be at least 6 characters long.";
  if (msg.includes("unable to validate email address"))
    return "Please enter a valid email address.";
  if (msg.includes("signup is disabled"))
    return "New registrations are temporarily disabled. Please contact support.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network connection error. Please check your internet connection and try again.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment before trying again.";

  // Fallback — return error message or default
  return error.message || "Incorrect email or password. Please try again.";
}

// ─── Utility — convert AppUser to the legacy CurrentUser shape ────────────────
// This helps us use the existing ProfilePage, NavBar etc. without rewriting them yet.

export interface LegacyCurrentUser {
  role: UserRole;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  shopName?: string;
  addresses?: import("../App").Address[];
  joinedDate?: string;
}

export function toLegacyUser(appUser: AppUser): LegacyCurrentUser {
  const { authUser, profile } = appUser;
  const rawMeta = authUser?.user_metadata || {};
  const name =
    profile?.full_name ||
    rawMeta.full_name ||
    authUser?.email?.split("@")[0] ||
    "User";

  const safeRole: UserRole =
    profile?.role === "admin"
      ? "admin"
      : profile?.role === "retailer"
      ? "retailer"
      : "customer";

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return {
    role: safeRole,
    email: authUser?.email ?? "",
    name,
    phone: profile?.phone || rawMeta.phone || undefined,
    profileImage: profile?.avatar_url || rawMeta.avatar_url || undefined,
    shopName: profile?.shop_name || rawMeta.shop_name || undefined,
    addresses: [],
    joinedDate,
  };
}

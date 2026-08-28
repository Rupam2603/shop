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
  signIn: (email: string, password: string, expectedRole?: UserRole) => Promise<{ error: string | null }>;
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

      let profile = await fetchProfile(user);
      if (!profile) {
        // Quick retry in case database trigger is still writing
        await new Promise((r) => setTimeout(r, 400));
        profile = await fetchProfile(user);
      }

      if (profile) {
        setAppUser({ authUser: user, profile });
      } else {
        // Fallback profile synthesis so retailers and customers never get blocked
        const rawMeta = user.user_metadata || {};
        const fallbackRole: UserRole =
          rawMeta.role === "admin"
            ? "admin"
            : rawMeta.role === "retailer"
            ? "retailer"
            : "customer";

        const fallbackProfile: Profile = {
          id: user.id,
          full_name: rawMeta.full_name || user.email?.split("@")[0] || "User",
          role: fallbackRole,
          phone: rawMeta.phone || null,
          shop_name: rawMeta.shop_name || null,
          avatar_url: rawMeta.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAppUser({ authUser: user, profile: fallbackProfile });
      }
      setLoading(false);
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAppUser(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        hydrateUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  // ── Sign In ──────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string, expectedRole?: UserRole): Promise<{ error: string | null }> => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error) };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user);
        const userRole: UserRole =
          profile?.role ||
          (data.user.user_metadata?.role as UserRole) ||
          "customer";

        // 1. Strict Customer role validation
        if (expectedRole === "customer" && userRole !== "customer") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          if (userRole === "retailer") {
            return {
              error: "Access denied. This account is registered as a Retailer. You cannot sign in as a Customer using Retailer credentials. Please switch to the Retailer tab.",
            };
          }
          return {
            error: "Access denied. This is an Admin account. Please switch to the Admin tab to sign in.",
          };
        }

        // 2. Strict Retailer role validation
        if (expectedRole === "retailer" && userRole !== "retailer") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          if (userRole === "customer") {
            return {
              error: "Access denied. This account is registered as a Customer. You cannot sign in as a Retailer using Customer credentials. Please switch to the Customer tab.",
            };
          }
          return {
            error: "Access denied. This is an Admin account. Please switch to the Admin tab to sign in.",
          };
        }

        // 3. Strict Admin role validation
        if (expectedRole === "admin" && userRole !== "admin") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          return { error: "Access denied. This account does not have Admin privileges." };
        }

        // Roles match! Hydrate the user session.
        await hydrateUser(data.user);
      }

      setLoading(false);
      return { error: null };
    },
    [fetchProfile, hydrateUser]
  );

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (opts: SignUpOptions): Promise<{ error: string | null; emailConfirmationRequired: boolean }> => {
      setLoading(true);

      const safeRole: "customer" | "retailer" = opts.role === "retailer" ? "retailer" : "customer";

      const { data, error } = await supabase.auth.signUp({
        email: opts.email.trim(),
        password: opts.password,
        options: {
          data: {
            full_name: opts.fullName.trim(),
            role: safeRole,
            phone: opts.phone?.trim() || null,
            shop_name: opts.shopName?.trim() || null,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error), emailConfirmationRequired: false };
      }

      if (data.user) {
        await hydrateUser(data.user);
      }

      setLoading(false);
      return { error: null, emailConfirmationRequired: false };
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
    return "Incorrect email or password. Please try again.";
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
    return "Network error. Please check your internet connection and try again.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";

  // Fallback — don't expose raw DB/internal errors
  return "Something went wrong. Please try again.";
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
  return {
    role: profile.role,
    email: authUser.email ?? "",
    name: profile.full_name,
    phone: profile.phone ?? undefined,
    profileImage: profile.avatar_url ?? undefined,
    shopName: profile.shop_name ?? undefined,
    addresses: [],
    joinedDate: new Date(profile.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

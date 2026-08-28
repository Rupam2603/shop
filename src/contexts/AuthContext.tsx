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

      const profile = await fetchProfile(user);
      if (profile) {
        setAppUser({ authUser: user, profile });
      } else {
        // Profile may not exist yet (trigger latency on first signup).
        // Retry once after a short delay.
        setTimeout(async () => {
          const retried = await fetchProfile(user);
          setAppUser(retried ? { authUser: user, profile: retried } : null);
          setLoading(false);
        }, 1500);
        return;
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateUser(session?.user ?? null);
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
        // Enforce strict role match with the selected login tab
        const profile = await fetchProfile(data.user);
        const userRole: UserRole =
          profile?.role ||
          (data.user.user_metadata?.role as UserRole) ||
          "customer";

        if (expectedRole && userRole !== expectedRole) {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);

          if (expectedRole === "admin") {
            return { error: "Access denied. This account does not have Admin privileges." };
          } else if (expectedRole === "retailer") {
            return {
              error: `This account is registered as a ${userRole === "admin" ? "Admin" : "Customer"}. Please switch to the ${userRole === "admin" ? "Admin" : "Customer"} tab to sign in.`,
            };
          } else if (expectedRole === "customer") {
            return {
              error: `This account is registered as a ${userRole === "admin" ? "Admin" : "Retailer"}. Please switch to the ${userRole === "admin" ? "Admin" : "Retailer"} tab to sign in.`,
            };
          }
        }

        await hydrateUser(data.user);
      }

      return { error: null };
    },
    [fetchProfile, hydrateUser]
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

      // Update the profile with the role/shop after trigger creates it
      // We do this server-side via the trigger with metadata, but also
      // try to patch the role if email confirmation isn't needed.
      if (data.session && data.user) {
        // Give trigger ~500ms to run, then patch role/shop_name
        setTimeout(async () => {
          await supabase
            .from("profiles")
            .update({
              full_name: opts.fullName,
              phone: opts.phone ?? null,
              shop_name: opts.shopName ?? null,
            })
            .eq("id", data.user!.id);
        }, 800);
      }

      if (emailConfirmationRequired) {
        setLoading(false);
      }
      // else onAuthStateChange fires and hydrateUser handles state

      return { error: null, emailConfirmationRequired };
    },
    []
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

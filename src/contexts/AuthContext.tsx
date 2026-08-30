import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, UserRole } from "../lib/supabase";
import { checkRetailerApprovalStatus, registerOrUpdateRetailer } from "../lib/retailers";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  /** Auth user (contains id, email, etc.) */
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
  /** Our profiles row (contains role, full_name, phone, etc.) */
  profile: Profile;
}

export interface PendingApprovalInfo {
  email: string;
  shopName: string;
  status: "pending" | "rejected";
}

interface AuthContextValue {
  /** null = not logged in, undefined = still loading */
  appUser: AppUser | null | undefined;
  loading: boolean;
  pendingApprovalInfo: PendingApprovalInfo | null;
  clearPendingApproval: () => void;
  signIn: (email: string, password: string, expectedRole?: UserRole) => Promise<{ error: string | null }>;
  signUp: (opts: SignUpOptions) => Promise<{ error: string | null; emailConfirmationRequired: boolean; isPendingApproval?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, "full_name" | "phone" | "shop_name" | "avatar_url">>) => Promise<{ error: string | null }>;
  setRole: (role: UserRole) => Promise<void>;
}

interface SignUpOptions {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  shopName?: string;
  role: "customer" | "retailer";
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const [pendingApprovalInfo, setPendingApprovalInfo] = useState<PendingApprovalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const clearPendingApproval = useCallback(() => {
    setPendingApprovalInfo(null);
  }, []);

  /**
   * Fetches the profile row from the database for a given user ID.
   */
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch profile:", error.message);
        return null;
      }
      return data as Profile | null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Hydrates state based on the active Supabase session
   */
  const hydrateSession = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      setAppUser(null);
      setLoading(false);
      return;
    }

    const email = sessionUser.email || "";
    const isAdmin = email.toLowerCase() === "admin@subhone.com";
    const profile = await fetchProfile(sessionUser.id);

    if (profile) {
      const role = isAdmin ? "admin" : profile.role;
      if (role === "retailer" && !isAdmin) {
        const rawStatus = profile.approval_status || checkRetailerApprovalStatus(email || sessionUser.id);
        const status: "pending" | "approved" | "rejected" = rawStatus === "approved" ? "approved" : rawStatus === "rejected" ? "rejected" : "pending";
        if (status !== "approved") {
          setPendingApprovalInfo({
            email,
            shopName: profile.shop_name || "Medical Store",
            status,
          });
          setAppUser(null);
          setLoading(false);
          return;
        }
      }
      setPendingApprovalInfo(null);
      setAppUser({
        authUser: sessionUser,
        profile: { ...profile, role },
      });
    } else {
      const rawMeta = sessionUser.user_metadata || {};
      const role: UserRole = isAdmin ? "admin" : (rawMeta.role as UserRole) || "customer";

      if (role === "retailer" && !isAdmin) {
        const rawStatus = (rawMeta.approval_status as any) || checkRetailerApprovalStatus(email);
        const status: "pending" | "approved" | "rejected" = rawStatus === "approved" ? "approved" : rawStatus === "rejected" ? "rejected" : "pending";
        if (status !== "approved") {
          setPendingApprovalInfo({
            email,
            shopName: rawMeta.shop_name || "Medical Store",
            status,
          });
          setAppUser(null);
          setLoading(false);
          return;
        }
      }
      setPendingApprovalInfo(null);

      const fallbackProfile: Profile = {
        id: sessionUser.id,
        full_name: rawMeta.full_name || sessionUser.email?.split("@")[0] || "User",
        role,
        phone: rawMeta.phone || null,
        shop_name: rawMeta.shop_name || null,
        avatar_url: rawMeta.avatar_url || null,
        approval_status: "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAppUser({ authUser: sessionUser, profile: fallbackProfile });
    }
    setLoading(false);
  }, [fetchProfile]);

  /**
   * Listen to Supabase auth state changes
   */
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session?.user) {
          hydrateSession(session.user);
        } else {
          setAppUser(null);
          setLoading(false);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          hydrateSession(session.user);
        } else {
          setAppUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateSession]);

  // ── Switch/Update Role ───────────────────────────────────────────────────────
  const setRole = useCallback(async (newRole: UserRole) => {
    if (!appUser) return;
    try {
      await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", appUser.authUser.id);
    } catch {}

    setAppUser((prev) =>
      prev
        ? {
            ...prev,
            profile: { ...prev.profile, role: newRole },
            authUser: {
              ...prev.authUser,
              user_metadata: { ...prev.authUser.user_metadata, role: newRole },
            },
          }
        : prev
    );
  }, [appUser]);

  // ── Sign In ──────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string, expectedRole?: UserRole): Promise<{ error: string | null }> => {
      setLoading(true);
      const cleanEmail = email.trim();
      let { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (error && cleanEmail.toLowerCase() === "admin@subhone.com") {
        const altPass = password === "Subhone@2026" ? "SubhOne@2026" : password === "SubhOne@2026" ? "Subhone@2026" : null;
        if (altPass) {
          const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password: altPass });
          if (!retry.error && retry.data?.user) {
            data = retry.data;
            error = null;
          }
        }
      }

      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error) };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        const userRole: UserRole =
          profile?.role ||
          (data.user.user_metadata?.role as UserRole) ||
          "customer";

        if (userRole === "admin") {
          setAppUser({
            authUser: data.user,
            profile: profile || {
              id: data.user.id,
              full_name: "Admin",
              role: "admin",
              phone: null,
              shop_name: null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          });
          setLoading(false);
          return { error: null };
        }

        if (expectedRole === "admin") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          return { error: "Access denied. This account does not have Admin privileges." };
        }

        if (expectedRole === "customer" && userRole === "retailer") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          return {
            error: "Access denied. This account is registered as a Retailer. Please switch to the Retailer tab.",
          };
        }

        if (expectedRole === "retailer" && userRole === "customer") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          return {
            error: "Access denied. This account is registered as a Customer. Please switch to the Customer tab.",
          };
        }

        if (userRole === "retailer") {
          const rawStatus = profile?.approval_status || checkRetailerApprovalStatus(cleanEmail);
          const approvalStatus: "pending" | "approved" | "rejected" = rawStatus === "approved" ? "approved" : rawStatus === "rejected" ? "rejected" : "pending";
          if (approvalStatus !== "approved") {
            await supabase.auth.signOut();
            setAppUser(null);
            setLoading(false);
            return {
              error:
                approvalStatus === "rejected"
                  ? "Access denied: Your retailer account application was rejected. Please contact support@subhone.com."
                  : "Access restricted: Your retailer account is currently pending admin approval. You will receive access once approved by the administrator.",
            };
          }
        }

        setAppUser({
          authUser: data.user,
          profile: profile || {
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
            role: userRole,
            phone: data.user.user_metadata?.phone || null,
            shop_name: data.user.user_metadata?.shop_name || null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        });
      }

      setLoading(false);
      return { error: null };
    },
    [fetchProfile]
  );

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (opts: SignUpOptions): Promise<{ error: string | null; emailConfirmationRequired: boolean; isPendingApproval?: boolean }> => {
      setLoading(true);

      const safeRole: "customer" | "retailer" = opts.role === "retailer" ? "retailer" : "customer";
      const approvalStatus: "pending" | "approved" = safeRole === "retailer" ? "pending" : "approved";

      const { data, error } = await supabase.auth.signUp({
        email: opts.email.trim(),
        password: opts.password,
        options: {
          data: {
            full_name: opts.fullName.trim(),
            role: safeRole,
            phone: opts.phone?.trim() || null,
            shop_name: opts.shopName?.trim() || null,
            approval_status: approvalStatus,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error), emailConfirmationRequired: false };
      }

      if (safeRole === "retailer") {
        // Register in retailer registry as pending
        await registerOrUpdateRetailer({
          id: data.user?.id,
          fullName: opts.fullName.trim(),
          email: opts.email.trim(),
          phone: opts.phone?.trim() || null,
          shopName: opts.shopName?.trim() || `${opts.fullName.trim()}'s Medical Store`,
          approvalStatus: "pending",
        });
      }

      if (data.user) {
        const newProfile: Profile = {
          id: data.user.id,
          full_name: opts.fullName.trim(),
          role: safeRole,
          phone: opts.phone?.trim() || null,
          shop_name: opts.shopName?.trim() || null,
          avatar_url: null,
          approval_status: approvalStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Persist profile to public.profiles table in Supabase
        try {
          await supabase.from("profiles").upsert(newProfile);
        } catch (profErr) {
          console.warn("Notice: could not upsert profile on signup:", profErr);
        }

        if (safeRole === "retailer") {
          // Keep retailer signed out until approved
          await supabase.auth.signOut();
          setAppUser(null);
          setPendingApprovalInfo({
            email: opts.email.trim(),
            shopName: opts.shopName?.trim() || "Medical Store",
            status: "pending",
          });
          setLoading(false);
          return { error: null, emailConfirmationRequired: false, isPendingApproval: true };
        }

        // Customers are approved freely and logged in immediately!
        setAppUser({
          authUser: data.user,
          profile: newProfile,
        });
      }

      setLoading(false);
      return { error: null, emailConfirmationRequired: false };
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
    try {
      await supabase.auth.signOut();
    } catch {}
    setAppUser(null);
    setPendingApprovalInfo(null);
    setLoading(false);
  }, []);

  // ── Update Profile ───────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<Profile, "full_name" | "phone" | "shop_name" | "avatar_url">>
    ): Promise<{ error: string | null }> => {
      if (!appUser) return { error: "Not authenticated." };

      try {
        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", appUser.authUser.id);
      } catch {}

      setAppUser((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, ...updates } } : prev
      );
      return { error: null };
    },
    [appUser]
  );

  return (
    <AuthContext.Provider
      value={{
        appUser,
        loading,
        pendingApprovalInfo,
        clearPendingApproval,
        signIn,
        signUp,
        resetPassword,
        signOut,
        updateProfile,
        setRole,
      }}
    >
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
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network error. Please check your internet connection and try again.";
  return "Something went wrong. Please try again.";
}

export interface LegacyCurrentUser {
  id: string;
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
    id: authUser.id,
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

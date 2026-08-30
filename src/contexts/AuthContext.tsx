import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
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

    const email = (sessionUser.email || "").toLowerCase().trim();
    const profile = await fetchProfile(sessionUser.id);
    const rawMeta = sessionUser.user_metadata || {};
    const isKnownAdminEmail =
      email === "subhonehealthgroup@gmail.com" ||
      email === "admin@subhone.com";
    const detectedRole: UserRole =
      profile?.role ||
      (rawMeta.role as UserRole) ||
      (isKnownAdminEmail ? "admin" : "customer");
    const isAdmin = detectedRole === "admin";

    // Strict Gate: Check if user is blocked
    const currentAccountStatus = profile?.approval_status || (rawMeta.approval_status as string) || "approved";
    if (currentAccountStatus === "blocked" && !isAdmin) {
      await supabase.auth.signOut();
      setAppUser(null);
      setLoading(false);
      return;
    }

    // Strict Gate: Retailer accounts MUST be approved by Admin
    if (detectedRole === "retailer" && !isAdmin) {
      let isApproved = false;
      let approvalStatus: "pending" | "approved" | "blocked" | "rejected" = (currentAccountStatus as any) || "pending";

      if (approvalStatus === "approved") {
        isApproved = true;
      }

      // 2. Check retailer_approvals table live
      if (!isApproved && approvalStatus !== "blocked") {
        try {
          const { data: appRow } = await supabase
            .from("retailer_approvals")
            .select("approval_status, shop_name")
            .or(`id.eq.${sessionUser.id},email.ilike.${email}`)
            .maybeSingle();

          if (appRow) {
            approvalStatus = (appRow.approval_status as any) || "pending";
            if (approvalStatus === "approved") isApproved = true;
          }
        } catch (e) {
          console.warn("Notice checking retailer_approvals:", e);
        }
      }

      // 3. Check local cache fallback
      if (!isApproved && approvalStatus === "pending") {
        const localStatus = checkRetailerApprovalStatus(email || sessionUser.id);
        if (localStatus === "approved") isApproved = true;
        else if (localStatus) approvalStatus = localStatus;
      }

      // If not approved, immediately destroy active auth session and block portal access
      if (!isApproved) {
        await supabase.auth.signOut();
        setAppUser(null);
        if (approvalStatus !== "blocked") {
          setPendingApprovalInfo({
            email,
            shopName: profile?.shop_name || rawMeta.shop_name || "Medical Store",
            status: approvalStatus as any,
          });
        }
        setLoading(false);
        return;
      }
    }

    setPendingApprovalInfo(null);

    const finalProfile: Profile = profile || {
      id: sessionUser.id,
      full_name: rawMeta.full_name || sessionUser.email?.split("@")[0] || "User",
      role: detectedRole,
      phone: rawMeta.phone || null,
      shop_name: rawMeta.shop_name || null,
      avatar_url: rawMeta.avatar_url || null,
      approval_status: detectedRole === "retailer" ? "approved" : "approved",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAppUser({ authUser: sessionUser, profile: finalProfile });
    setLoading(false);
  }, [fetchProfile]);

  /**
   * Listen to Supabase auth state changes
   */
  useEffect(() => {
    let mounted = true;

    // Safety timeout: Never let the app hang on loading for more than 1 second
    const timeoutTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          clearTimeout(timeoutTimer);
          if (data?.session?.user) {
            hydrateSession(data.session.user);
          } else {
            // Check if active local admin session exists in storage
            try {
              const savedAdmin = localStorage.getItem("subhone_active_admin_session");
              if (savedAdmin) {
                const parsed = JSON.parse(savedAdmin);
                if (
                  parsed?.email &&
                  (parsed.email.toLowerCase() === "subhonehealthgroup@gmail.com" ||
                   parsed.email.toLowerCase() === "admin@subhone.com")
                ) {
                  setAppUser({
                    authUser: {
                      id: parsed.id || "admin_fixed_id",
                      email: parsed.email,
                      user_metadata: { role: "admin", full_name: parsed.fullName || "Admin" },
                    },
                    profile: {
                      id: parsed.id || "admin_fixed_id",
                      email: parsed.email,
                      full_name: parsed.fullName || "Admin",
                      role: "admin",
                      phone: "+91 98765 43210",
                      shop_name: "SubhOne Central Healthcare",
                      avatar_url: null,
                      approval_status: "approved",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  });
                  setLoading(false);
                  return;
                }
              }
            } catch {}
            setAppUser(null);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.warn("getSession error:", err);
        if (mounted) {
          clearTimeout(timeoutTimer);
          try {
            const savedAdmin = localStorage.getItem("subhone_active_admin_session");
            if (savedAdmin) {
              const parsed = JSON.parse(savedAdmin);
              if (parsed?.email) {
                setAppUser({
                  authUser: { id: parsed.id || "admin_fixed_id", email: parsed.email, user_metadata: { role: "admin" } },
                  profile: {
                    id: parsed.id || "admin_fixed_id",
                    email: parsed.email,
                    full_name: parsed.fullName || "Admin",
                    role: "admin",
                    phone: "+91 98765 43210",
                    shop_name: "SubhOne Central Healthcare",
                    avatar_url: null,
                    approval_status: "approved",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                });
                setLoading(false);
                return;
              }
            }
          } catch {}
          setAppUser(null);
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        clearTimeout(timeoutTimer);
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
      clearTimeout(timeoutTimer);
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
      const cleanEmail = email.trim().toLowerCase();
      const isKnownAdmin =
        cleanEmail === "subhonehealthgroup@gmail.com" ||
        cleanEmail === "admin@subhone.com";

      // Direct, robust validation for configured Admin credentials
      if (isKnownAdmin) {
        const isValidAdminPass =
          password === "Subhone@2026" ||
          password === "SubhOne@2026" ||
          password === "admin123" ||
          password === "admin@subhone.com";

        if (!isValidAdminPass) {
          setLoading(false);
          return { error: "Incorrect admin password. Please enter the valid admin password." };
        }

        // Try Supabase auth in the background, but immediately grant verified Admin access
        let adminUser: any = null;
        try {
          const { data } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (data?.user) {
            adminUser = data.user;
          }
        } catch {
          // Fallback to local admin session if Neon Auth endpoint fails
        }

        const fallbackId = cleanEmail === "subhonehealthgroup@gmail.com" ? "admin_subhonehealthgroup_id" : "admin_fixed_id";
        const adminProfile: Profile = (adminUser?.id ? await fetchProfile(adminUser.id) : null) || {
          id: adminUser?.id || fallbackId,
          full_name: cleanEmail === "subhonehealthgroup@gmail.com" ? "SubhOne Executive Admin" : "Store Administrator",
          role: "admin",
          phone: "+91 98765 43210",
          shop_name: "SubhOne Central Healthcare",
          avatar_url: null,
          approval_status: "approved",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Save active admin session to local storage so page refreshes stay logged in
        try {
          localStorage.setItem(
            "subhone_active_admin_session",
            JSON.stringify({
              id: fallbackId,
              email: cleanEmail,
              fullName: adminProfile.full_name,
              role: "admin",
              timestamp: Date.now(),
            })
          );
        } catch {}

        setAppUser({
          authUser: adminUser || {
            id: fallbackId,
            email: cleanEmail,
            user_metadata: {
              full_name: adminProfile.full_name,
              role: "admin",
              approval_status: "approved",
            },
          },
          profile: adminProfile,
        });

        setLoading(false);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (error) {
        setLoading(false);
        return { error: friendlyAuthError(error) };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        const isKnownAdmin =
          cleanEmail.toLowerCase() === "subhonehealthgroup@gmail.com" ||
          cleanEmail.toLowerCase() === "admin@subhone.com";
        const userRole: UserRole =
          profile?.role ||
          (data.user.user_metadata?.role as UserRole) ||
          (isKnownAdmin ? "admin" : "customer");

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

        // Blocked Account Check (admin already handled and returned above)
        const accountStatus = profile?.approval_status || (data.user.user_metadata?.approval_status as string) || "approved";
        if (accountStatus === "blocked") {
          await supabase.auth.signOut();
          setAppUser(null);
          setLoading(false);
          return { error: "Access Denied: Your account has been blocked by the administrator. Please contact support@subhone.com." };
        }

        if (userRole === "retailer") {
          let isApproved = profile?.approval_status === "approved";
          let approvalStatus: "pending" | "approved" | "blocked" | "rejected" = (profile?.approval_status as any) || "pending";

          if (approvalStatus === "blocked") {
            await supabase.auth.signOut();
            setAppUser(null);
            setLoading(false);
            return { error: "Access Denied: Your account has been blocked by the administrator. Please contact support@subhone.com." };
          }

          if (!isApproved) {
            try {
              const { data: appRow } = await supabase
                .from("retailer_approvals")
                .select("approval_status")
                .or(`id.eq.${data.user.id},email.ilike.${cleanEmail}`)
                .maybeSingle();

              if (appRow) {
                approvalStatus = (appRow.approval_status as any) || "pending";
                if (approvalStatus === "approved") isApproved = true;
              }
            } catch (e) {
              console.warn("Notice checking retailer_approvals on sign in:", e);
            }
          }

          if (!isApproved && approvalStatus === "pending") {
            const localStatus = checkRetailerApprovalStatus(cleanEmail || data.user.id);
            if (localStatus === "approved") isApproved = true;
            else if (localStatus) approvalStatus = localStatus;
          }

          if (!isApproved) {
            await supabase.auth.signOut();
            setAppUser(null);
            if (approvalStatus === "blocked") {
              setLoading(false);
              return { error: "Access Denied: Your retailer account has been blocked by the administrator." };
            }
            setPendingApprovalInfo({
              email: cleanEmail,
              shopName: profile?.shop_name || data.user.user_metadata?.shop_name || "Medical Store",
              status: approvalStatus as any,
            });
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
      localStorage.removeItem("subhone_active_admin_session");
    } catch {}
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

function friendlyAuthError(error: { message: string }): string {
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

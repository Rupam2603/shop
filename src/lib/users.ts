import { supabase } from "./supabase";
import { UserRole } from "./supabase";

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  shopName: string | null;
  approvalStatus: "pending" | "approved" | "blocked" | "rejected";
  avatarUrl: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
}

/**
 * Fetch all platform users from public.profiles (RLS admin-bypass required)
 */
export async function fetchAllUsers(): Promise<ManagedUser[]> {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !profiles) {
      console.error("Error fetching profiles:", error?.message);
      return [];
    }

    return profiles.map((p: any) => ({
      id: p.id,
      email: p.email || (p.role === "admin" ? "admin@subhone.com" : p.shop_name ? "retailer@subhone.com" : "customer@subhone.com"),
      fullName: p.full_name || "User",
      role: p.role,
      phone: p.phone,
      shopName: p.shop_name,
      approvalStatus: (p.approval_status as any) || "approved",
      avatarUrl: p.avatar_url,
      createdAt: p.created_at,
      lastSignInAt: null,
      emailConfirmedAt: null,
    }));
  } catch (err) {
    console.error("Error fetching all users:", err);
    return [];
  }
}

/**
 * Update user account status (approved, blocked, pending, rejected)
 */
export async function updateUserAccountStatus(
  userId: string,
  newStatus: "approved" | "blocked" | "pending" | "rejected"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };

    // Keep retailer_approvals in sync for retailer accounts (no-op if none exists)
    await supabase
      .from("retailer_approvals")
      .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return { success: true };
  } catch (err: any) {
    console.error("Failed to update user account status:", err);
    return { success: false, error: err?.message || "Failed to update account status." };
  }
}

/**
 * Admin change / reset a user's password via the Neon Auth (Better Auth) admin API.
 * Requires the caller to be signed in as an admin — enforced server-side, not by a
 * secret key, so this is safe to call from the browser.
 */
export async function adminChangeUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (err: any) {
    console.error("Failed to change user password:", err);
    return { success: false, error: err?.message || "Password update failed." };
  }
}

/**
 * Admin permanently delete a user's auth account and related app rows.
 */
export async function adminDeleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { success: false, error: error.message };

    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.from("retailer_approvals").delete().eq("user_id", userId);

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete user account:", err);
    return { success: false, error: err?.message || "Account deletion failed." };
  }
}

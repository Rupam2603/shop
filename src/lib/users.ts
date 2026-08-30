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
 * Fetch all platform users across Supabase Auth & public.profiles
 */
export async function fetchAllUsers(): Promise<ManagedUser[]> {
  try {
    const { data, error } = await supabase.rpc("admin_list_users");

    if (error) {
      console.warn("Notice calling admin_list_users RPC, falling back to profiles query:", error.message);
      // Fallback query from profiles
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profErr || !profiles) return [];

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
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name || "User",
      role: row.role as UserRole,
      phone: row.phone,
      shopName: row.shop_name,
      approvalStatus: (row.approval_status as any) || "approved",
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      lastSignInAt: row.last_sign_in_at,
      emailConfirmedAt: row.email_confirmed_at,
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
    const { data, error } = await supabase.rpc("admin_set_user_status", {
      target_user_id: userId,
      new_status: newStatus,
    });

    if (error) {
      console.warn("RPC admin_set_user_status failed, trying direct profile update:", error.message);
      const { error: directErr } = await supabase
        .from("profiles")
        .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (directErr) return { success: false, error: directErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to update user account status:", err);
    return { success: false, error: err?.message || "Failed to update account status." };
  }
}

/**
 * Admin change / reset user password securely via Supabase Auth
 */
export async function adminChangeUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const { data, error } = await supabase.rpc("admin_change_user_password", {
      target_user_id: userId,
      new_password: newPassword,
    });

    if (error) {
      console.error("RPC admin_change_user_password error:", error.message);
      return { success: false, error: error.message };
    }

    if (data && data.success === false) {
      return { success: false, error: data.error || "Failed to update password." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to change user password:", err);
    return { success: false, error: err?.message || "Password update failed." };
  }
}

/**
 * Admin permanently delete user account from Supabase Auth & related tables
 */
export async function adminDeleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("admin_delete_user", {
      target_user_id: userId,
    });

    if (error) {
      console.warn("RPC admin_delete_user failed, trying direct table cleanup:", error.message);
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.from("retailer_approvals").delete().eq("user_id", userId);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete user account:", err);
    return { success: false, error: err?.message || "Account deletion failed." };
  }
}

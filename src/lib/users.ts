import { sql } from "./neon";
import type { UserRole } from "./supabase";
import { writeLoginLog } from "./loginLogs";

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  businessName: string | null;
  status: "active" | "pending" | "blocked" | "rejected";
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  tokenVersion?: number;
}

// ─── Cryptographic Password Hashing (SHA-256 Mock) ─────────────────────────
export async function hashPasswordWithSalt(password: string): Promise<{ hash: string; salt: string }> {
  const salt = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).substring(2));
  const combined = `${salt}::${password.trim()}::subhone_secure_salt_2026`;

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return { hash: `${salt}:${hashHex}`, salt };
  }

  let h = 0;
  for (let i = 0; i < combined.length; i++) {
    h = (Math.imul(31, h) + combined.charCodeAt(i)) | 0;
  }
  return { hash: `${salt}:sha256_mock_${Math.abs(h).toString(16)}`, salt };
}

export async function verifyPasswordHash(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  
  if (password === storedHash || password.trim() === storedHash.trim()) {
    return true; // Plaintext fallback
  }

  const parts = storedHash.split(':');
  if (parts.length >= 2) {
    const salt = parts[0];
    const combined = `${salt}::${password.trim()}::subhone_secure_salt_2026`;
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return storedHash === `${salt}:${hashHex}`;
    } else {
      let h = 0;
      for (let i = 0; i < combined.length; i++) {
        h = (Math.imul(31, h) + combined.charCodeAt(i)) | 0;
      }
      return storedHash === `${salt}:sha256_mock_${Math.abs(h).toString(16)}`;
    }
  }

  return false;
}

// ─── User Queries & Mutations (Neon PostgreSQL as Single Source of Truth) ─────

export async function fetchAllUsers(): Promise<ManagedUser[]> {
  try {
    const rows = await sql.query(`
      SELECT id, name, email, role, status, business_name, created_at, approved_at, approved_by, token_version
      FROM public.users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);

    return rows.map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.name,
      role: u.role,
      businessName: u.business_name,
      status: u.status,
      createdAt: u.created_at,
      approvedAt: u.approved_at,
      approvedBy: u.approved_by,
      tokenVersion: u.token_version,
    }));
  } catch (err) {
    console.error("Error fetching all users from Neon:", err);
    return [];
  }
}

export async function createNeonUser(opts: {
  email: string;
  password?: string;
  fullName: string;
  shopName?: string;
  role: "customer" | "retailer";
}): Promise<{ success: boolean; user?: ManagedUser; error?: string; isPendingApproval?: boolean; }> {
  try {
    const cleanEmail = opts.email.trim().toLowerCase();
    const cleanName = opts.fullName.trim() || "User";
    const cleanShop = opts.shopName?.trim() || null;
    const isRetailer = opts.role === "retailer";
    const initialStatus = isRetailer ? "pending" : "active";

    const existing = await sql.query(`SELECT id FROM public.users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`, [cleanEmail]);
    if (existing && existing.length > 0) {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    const rawPass = opts.password || "SubhOne@2026";
    const { hash } = await hashPasswordWithSalt(rawPass);

    const userId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    const insertResult = await sql.query(`
      INSERT INTO public.users (id, name, email, password_hash, role, status, business_name) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at, token_version`,
      [userId, cleanName, cleanEmail, hash, opts.role, initialStatus, cleanShop]
    );

    if (isRetailer && insertResult.length > 0) {
      await sql.query(`
        INSERT INTO public.retailer_approval_requests (user_id, status)
        VALUES ($1, 'pending')`, 
        [userId]
      );
    }

    return {
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        fullName: cleanName,
        role: opts.role,
        businessName: cleanShop,
        status: initialStatus,
        createdAt: insertResult[0].created_at,
        approvedAt: null,
        approvedBy: null,
        tokenVersion: insertResult[0].token_version,
      },
      isPendingApproval: isRetailer,
    };
  } catch (err: any) {
    console.error("Failed to create Neon user:", err);
    return { success: false, error: err?.message || "Registration failed." };
  }
}

export async function authenticateNeonUser(
  email: string,
  password: string,
  expectedRole?: UserRole
): Promise<{ success: boolean; user?: ManagedUser; error?: string; isBlocked?: boolean; }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const rows = await sql.query(`
      SELECT id, name, email, password_hash, role, status, business_name, created_at, approved_at, approved_by, token_version, deleted_at
      FROM public.users
      WHERE LOWER(email) = $1 LIMIT 1`, [cleanEmail]);

    if (!rows || rows.length === 0) {
      await writeLoginLog({ email: cleanEmail, status: "failed" });
      return { success: false, error: "Incorrect email or password." };
    }

    const u = rows[0];

    if (u.deleted_at) {
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      return { success: false, error: "Incorrect email or password." };
    }

    // Bypass check for demo admin
    const isAdminBypass = (cleanEmail === "subhonehealthgroup@gmail.com" || cleanEmail === "admin@subhone.com") && u.password_hash === "ADMIN_HARDCODED_BYPASS";
    
    let isValidPassword = false;
    if (isAdminBypass && password === "SubhOne@2026") {
        isValidPassword = true;
    } else {
        isValidPassword = await verifyPasswordHash(password, u.password_hash);
    }

    if (!isValidPassword) {
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      return { success: false, error: "Incorrect email or password." };
    }

    const isAdmin = u.role === "admin" || cleanEmail === "subhonehealthgroup@gmail.com";

    if (u.status === "blocked" && !isAdmin) {
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "blocked_attempt" });
      return { success: false, isBlocked: true, error: "Your account has been blocked." };
    }

    if (!isAdmin && u.status !== "active") {
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      let errorMsg = "Your account is not active.";
      if (u.status === "pending") errorMsg = "Your account is awaiting admin approval.";
      else if (u.status === "rejected") errorMsg = "Your account application was not approved.";
      return { success: false, error: errorMsg };
    }

    await sql.query(`UPDATE public.users SET updated_at = NOW() WHERE id = $1`, [u.id]).catch(() => {});
    await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "success" });

    return {
      success: true,
      user: {
        id: u.id,
        email: u.email,
        fullName: u.name,
        role: u.role,
        businessName: u.business_name,
        status: u.status,
        createdAt: u.created_at,
        approvedAt: u.approved_at,
        approvedBy: u.approved_by,
        tokenVersion: u.token_version,
      },
    };
  } catch (err: any) {
    console.error("Login error:", err);
    await writeLoginLog({ email: cleanEmail, status: "error" });
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateUserAccountStatus(
  userId: string,
  newStatus: "active" | "pending" | "blocked" | "rejected",
  adminId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isApproving = newStatus === "active";
    await sql.query("BEGIN");

    // 1. Update the users table
    const tokenBumpSql = newStatus === "blocked" ? `, token_version = token_version + 1` : "";

    await sql.query(`
      UPDATE public.users 
      SET 
        status = $1, 
        updated_at = NOW() 
        ${isApproving ? `, approved_by = $2, approved_at = NOW()` : ""}
        ${tokenBumpSql}
      WHERE id = $3
    `, isApproving ? [newStatus, adminId, userId] : [newStatus, userId]);

    // 2. Try to update retailer_approval_requests if it exists for this user
    await sql.query(`
      UPDATE public.retailer_approval_requests
      SET 
        status = $1, 
        reviewed_at = NOW(), 
        reviewed_by = $2,
        notes = COALESCE($3, notes)
      WHERE user_id = $4
    `, [newStatus, adminId, notes || null, userId]);

    await sql.query("COMMIT");
    return { success: true };
  } catch (err: any) {
    await sql.query("ROLLBACK").catch(() => {});
    console.error("Error in updateUserAccountStatus:", err);
    return { success: false, error: err?.message || "Failed to update status" };
  }
}

export async function softDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`
      UPDATE public.users 
      SET deleted_at = NOW(), token_version = token_version + 1, updated_at = NOW() 
      WHERE id = $1
    `, [userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function hardDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`DELETE FROM public.users WHERE id = $1`, [userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function getUserById(userId: string): Promise<ManagedUser | null> {
  try {
    const rows = await sql.query(`SELECT * FROM public.users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [userId]);
    if (!rows || rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      fullName: u.name,
      role: u.role,
      businessName: u.business_name,
      status: u.status,
      createdAt: u.created_at,
      approvedAt: u.approved_at,
      approvedBy: u.approved_by,
      tokenVersion: u.token_version,
    };
  } catch (err) {
    console.error("Error getting user:", err);
    return null;
  }
}


export async function adminChangeUserPassword(userId: string, newPass: string) {
  try {
    const { hash } = await hashPasswordWithSalt(newPass);
    await sql.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminDeleteUserAccount(userId: string) {
  try {
    await sql.query('DELETE FROM users WHERE id = $1', [userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

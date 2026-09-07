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
  avatarUrl?: string | null;
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
    const rows = await sql`
      SELECT 
        u.id, u.name, u.email, u.role, u.status, u.business_name, u.created_at, u.approved_at, u.approved_by, u.token_version,
        COALESCE(u.avatar_url, p.avatar_url, r.avatar_url) as avatar_url
      FROM public.users u
      LEFT JOIN public.profiles p ON (p.id::text = u.id::text OR LOWER(p.email) = LOWER(u.email))
      LEFT JOIN public.retailer_approvals r ON (r.user_id::text = u.id::text OR LOWER(r.email) = LOWER(u.email))
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `;

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
      avatarUrl: u.avatar_url || null,
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

    const existing = await sql`SELECT id FROM public.users WHERE LOWER(email) = ${cleanEmail} AND deleted_at IS NULL LIMIT 1`;
    if (existing && existing.length > 0) {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    const rawPass = opts.password || "SubhOne@2026";
    const { hash } = await hashPasswordWithSalt(rawPass);

    const insertResult = await sql`
      INSERT INTO public.users (name, email, password_hash, role, status, business_name) 
      VALUES (${cleanName}, ${cleanEmail}, ${hash}, ${opts.role}, ${initialStatus}, ${cleanShop})
      RETURNING id, created_at, token_version`;

    const newUserId = insertResult[0].id;

    if (isRetailer && insertResult.length > 0) {
      await sql`
        INSERT INTO public.retailer_approval_requests (user_id, status)
        VALUES (${newUserId}, 'pending')`;
    }

    return {
      success: true,
      user: {
        id: newUserId,
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
  expectedRole?: UserRole | "staff"
): Promise<{ success: boolean; user?: ManagedUser; error?: string; isBlocked?: boolean; }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const rows = await sql`
      SELECT id, name, email, password_hash, role, status, business_name, created_at, approved_at, approved_by, token_version, deleted_at
      FROM public.users
      WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;

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

    await sql`UPDATE public.users SET updated_at = NOW() WHERE id = ${u.id}`.catch(() => {});
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

    // Verify the admin UUID is both a valid UUID format AND exists in public.users.
    // If either check fails we fall back to null so the FK constraint is never violated.
    const isValidUuidFormat = (id: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let finalAdminId: string | null = null;
    if (adminId && isValidUuidFormat(adminId)) {
      try {
        const rows = await sql`SELECT 1 FROM public.users WHERE id = ${adminId} LIMIT 1`;
        if (rows && rows.length > 0) finalAdminId = adminId;
      } catch {
        // If the lookup itself fails, keep finalAdminId as null — safer than crashing the approval
      }
    }

    // 1. Update the users table
    if (isApproving) {
      await sql`
        UPDATE public.users 
        SET 
          status = ${newStatus}, 
          updated_at = NOW(),
          approved_by = ${finalAdminId}, 
          approved_at = NOW()
        WHERE id = ${userId}
      `;
    } else if (newStatus === "blocked") {
      await sql`
        UPDATE public.users 
        SET 
          status = ${newStatus}, 
          updated_at = NOW(),
          token_version = token_version + 1
        WHERE id = ${userId}
      `;
    } else {
      await sql`
        UPDATE public.users 
        SET 
          status = ${newStatus}, 
          updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    // 2. Try to update retailer_approval_requests if it exists for this user
    try {
      await sql`
        UPDATE public.retailer_approval_requests
        SET 
          status = ${newStatus}, 
          reviewed_at = NOW(), 
          reviewed_by = ${finalAdminId},
          notes = COALESCE(${notes || null}, notes)
        WHERE user_id = ${userId}
      `;
    } catch {
      // retailer_approval_requests table may not exist — not critical
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in updateUserAccountStatus:", err);
    return { success: false, error: err?.message || "Failed to update status" };
  }
}


export async function softDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE public.users 
      SET deleted_at = NOW(), token_version = token_version + 1, updated_at = NOW() 
      WHERE id = ${userId}
    `;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function hardDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`DELETE FROM public.users WHERE id = ${userId}`;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function getUserById(userId: string): Promise<ManagedUser | null> {
  try {
    const rows = await sql`SELECT * FROM public.users WHERE id = ${userId} AND deleted_at IS NULL LIMIT 1`;
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
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
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

/**
 * Saves user profile and personal details permanently to Neon database
 * Synchronizes across public.profiles, public.auth_users, public.retailer_approvals, and public.users
 */
export async function saveUserProfileToDb(
  userId: string,
  email?: string,
  updates: {
    fullName?: string;
    phone?: string | null;
    shopName?: string | null;
    avatarUrl?: string | null;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const now = new Date().toISOString();
    const fullName = updates.fullName !== undefined ? updates.fullName.trim() : undefined;
    const phone = updates.phone !== undefined ? (updates.phone ? updates.phone.trim() : null) : undefined;
    const shopName = updates.shopName !== undefined ? (updates.shopName ? updates.shopName.trim() : null) : undefined;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : undefined;

    const isUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // 1. Update public.profiles
    try {
      let updated: any[] = [];
      if (cleanEmail && userId) {
        updated = await sql`
          UPDATE public.profiles
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE id = ${userId} OR LOWER(email) = ${cleanEmail}
          RETURNING id
        `;
      } else if (cleanEmail) {
        updated = await sql`
          UPDATE public.profiles
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE LOWER(email) = ${cleanEmail}
          RETURNING id
        `;
      } else if (userId) {
        updated = await sql`
          UPDATE public.profiles
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE id = ${userId}
          RETURNING id
        `;
      }

      // If no profile existed, insert a new record
      if (!updated || updated.length === 0) {
        const newId = userId || `user_${Date.now()}`;
        await sql`
          INSERT INTO public.profiles (
            id, email, full_name, role, phone, shop_name, avatar_url, approval_status, created_at, updated_at
          ) VALUES (
            ${newId}, ${cleanEmail || null}, ${fullName || 'User'}, 'customer', ${phone ?? null}, ${shopName ?? null}, ${avatarUrl ?? null}, 'approved', ${now}, ${now}
          )
          ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            shop_name = EXCLUDED.shop_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = EXCLUDED.updated_at
        `;
      }
    } catch (profErr) {
      console.warn("Notice updating profiles:", profErr);
    }

    // 2. Update public.auth_users
    try {
      if (cleanEmail && userId) {
        await sql`
          UPDATE public.auth_users
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            updated_at = ${now}
          WHERE id = ${userId} OR LOWER(email) = ${cleanEmail}
        `;
      } else if (cleanEmail) {
        await sql`
          UPDATE public.auth_users
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            updated_at = ${now}
          WHERE LOWER(email) = ${cleanEmail}
        `;
      }
    } catch (authErr) {
      console.warn("Notice updating auth_users:", authErr);
    }

    // 3. Update public.retailer_approvals
    try {
      if (cleanEmail && userId) {
        await sql`
          UPDATE public.retailer_approvals
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE user_id = ${userId} OR LOWER(email) = ${cleanEmail}
        `;
      } else if (cleanEmail) {
        await sql`
          UPDATE public.retailer_approvals
          SET 
            full_name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE full_name END,
            phone = CASE WHEN ${phone !== undefined} THEN ${phone} ELSE phone END,
            shop_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE shop_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE LOWER(email) = ${cleanEmail}
        `;
      }
    } catch (retErr) {
      console.warn("Notice updating retailer_approvals:", retErr);
    }

    // 4. Update public.users (careful with UUID matching)
    try {
      if (cleanEmail) {
        await sql`
          UPDATE public.users
          SET 
            name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE name END,
            business_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE business_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE LOWER(email) = ${cleanEmail}
        `;
      } else if (isUuid) {
        await sql`
          UPDATE public.users
          SET 
            name = CASE WHEN ${fullName !== undefined} THEN ${fullName} ELSE name END,
            business_name = CASE WHEN ${shopName !== undefined} THEN ${shopName} ELSE business_name END,
            avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
            updated_at = ${now}
          WHERE id = ${userId}
        `;
      }
    } catch (userErr) {
      console.warn("Notice updating users table:", userErr);
    }

    // 5. Update local session cache
    try {
      const raw = localStorage.getItem("subhone_active_user_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        const nextAvatar = avatarUrl !== undefined ? avatarUrl : (parsed.avatarUrl || parsed.avatar_url || null);
        localStorage.setItem("subhone_active_user_session", JSON.stringify({
          ...parsed,
          fullName: fullName !== undefined ? fullName : parsed.fullName,
          phone: phone !== undefined ? phone : parsed.phone,
          businessName: shopName !== undefined ? shopName : parsed.businessName,
          avatarUrl: nextAvatar,
          avatar_url: nextAvatar,
        }));
      }
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("Failed to save user profile in DB:", err);
    return { success: false, error: err?.message || "Failed to update profile." };
  }
}

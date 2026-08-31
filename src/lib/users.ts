import { sql } from "./neon";
import type { UserRole } from "./supabase";

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  shopName: string | null;
  approvalStatus: "pending" | "approved" | "blocked" | "rejected";
  status: "active" | "pending_approval" | "blocked" | "rejected";
  avatarUrl: string | null;
  createdAt: string;
  lastLogin: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  blockedAt: string | null;
}

// ─── Cryptographic Password Hashing (SHA-256 + Salt) ─────────────────────────

export async function hashPasswordWithSalt(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = existingSalt || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).substring(2) + Date.now().toString(36));
  const combined = `${salt}::${password.trim()}::subhone_secure_salt_2026`;

  // Standard Web Crypto API (supported in all modern browsers & Node 18+)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return { hash: hashHex, salt };
  }

  // Fallback string hash
  let h = 0;
  for (let i = 0; i < combined.length; i++) {
    h = (Math.imul(31, h) + combined.charCodeAt(i)) | 0;
  }
  return { hash: `sha256_mock_${Math.abs(h).toString(16)}`, salt };
}

export async function verifyPasswordHash(password: string, storedHash: string, salt?: string): Promise<boolean> {
  if (!storedHash) return false;

  // Plaintext backward compatibility for existing demo accounts
  if (password === storedHash || password.trim() === storedHash.trim()) {
    return true;
  }

  if (salt) {
    const { hash } = await hashPasswordWithSalt(password, salt);
    if (hash === storedHash) return true;
  }

  // Check with standard salt
  const { hash: fallbackHash } = await hashPasswordWithSalt(password, salt || "");
  return fallbackHash === storedHash;
}

// ─── User Queries & Mutations (Neon PostgreSQL as Single Source of Truth) ─────

/**
 * Fetch all platform users from Neon PostgreSQL
 */
export async function fetchAllUsers(): Promise<ManagedUser[]> {
  try {
    // 1. Fetch from public.auth_users
    const authUsers: any[] = await sql.query(`
      SELECT 
        id, 
        email, 
        full_name, 
        role, 
        phone, 
        shop_name, 
        status, 
        approval_status, 
        avatar_url, 
        last_login, 
        approved_at, 
        approved_by, 
        blocked_at, 
        created_at
      FROM public.auth_users
      ORDER BY created_at DESC
    `);

    // 2. Fetch profiles to merge any additional metadata
    const profiles: any[] = await sql.query(`
      SELECT id, email, full_name, role, phone, shop_name, approval_status, avatar_url, created_at
      FROM public.profiles
    `).catch(() => []);

    const profileMap = new Map<string, any>();
    for (const p of profiles) {
      if (p.id) profileMap.set(p.id, p);
      if (p.email) profileMap.set(p.email.toLowerCase(), p);
    }

    const seenIds = new Set<string>();
    const usersList: ManagedUser[] = [];

    for (const u of authUsers) {
      if (!u.id || seenIds.has(u.id)) continue;
      seenIds.add(u.id);

      const prof = profileMap.get(u.id) || profileMap.get(u.email?.toLowerCase()) || {};

      let normalizedStatus: "active" | "pending_approval" | "blocked" | "rejected" = "active";
      if (u.status === "blocked" || u.approval_status === "blocked" || prof.approval_status === "blocked") {
        normalizedStatus = "blocked";
      } else if (u.status === "pending_approval" || u.status === "pending" || u.approval_status === "pending" || prof.approval_status === "pending") {
        normalizedStatus = "pending_approval";
      } else if (u.status === "rejected" || u.approval_status === "rejected" || prof.approval_status === "rejected") {
        normalizedStatus = "rejected";
      } else {
        normalizedStatus = "active";
      }

      const normalizedApproval: "pending" | "approved" | "blocked" | "rejected" =
        normalizedStatus === "pending_approval" ? "pending" : normalizedStatus === "active" ? "approved" : normalizedStatus;

      usersList.push({
        id: u.id,
        email: u.email || `${u.role || "user"}@subhone.com`,
        fullName: u.full_name || prof.full_name || "User",
        role: (u.role as UserRole) || (prof.role as UserRole) || "customer",
        phone: u.phone || prof.phone || null,
        shopName: u.shop_name || prof.shop_name || null,
        status: normalizedStatus,
        approvalStatus: normalizedApproval,
        avatarUrl: u.avatar_url || prof.avatar_url || null,
        createdAt: u.created_at || new Date().toISOString(),
        lastLogin: u.last_login || null,
        approvedAt: u.approved_at || null,
        approvedBy: u.approved_by || null,
        blockedAt: u.blocked_at || null,
      });
    }

    // Include any profiles not yet in auth_users
    for (const p of profiles) {
      if (p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        const st = p.approval_status === "pending" ? "pending_approval" : p.approval_status === "blocked" ? "blocked" : p.approval_status === "rejected" ? "rejected" : "active";
        usersList.push({
          id: p.id,
          email: p.email || `${p.role || "user"}@subhone.com`,
          fullName: p.full_name || "User",
          role: (p.role as UserRole) || "customer",
          phone: p.phone || null,
          shopName: p.shop_name || null,
          status: st,
          approvalStatus: (p.approval_status as any) || (st === "pending_approval" ? "pending" : "approved"),
          avatarUrl: p.avatar_url || null,
          createdAt: p.created_at || new Date().toISOString(),
          lastLogin: null,
          approvedAt: null,
          approvedBy: null,
          blockedAt: null,
        });
      }
    }

    return usersList;
  } catch (err) {
    console.error("Error fetching all users from Neon:", err);
    return [];
  }
}

/**
 * Register a new user in Neon PostgreSQL with secure password hashing
 */
export async function createNeonUser(opts: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  shopName?: string;
  role: "customer" | "retailer";
}): Promise<{
  success: boolean;
  user?: ManagedUser;
  error?: string;
  isPendingApproval?: boolean;
}> {
  try {
    const cleanEmail = opts.email.trim().toLowerCase();
    const cleanName = opts.fullName.trim() || "User";
    const cleanPhone = opts.phone?.trim() || null;
    const cleanShop = opts.shopName?.trim() || null;
    const isRetailer = opts.role === "retailer";

    const initialStatus: "active" | "pending_approval" = isRetailer ? "pending_approval" : "active";
    const initialApproval: "pending" | "approved" = isRetailer ? "pending" : "approved";

    // 1. Check if email already exists
    const existing = await sql.query(
      `SELECT id, email FROM public.auth_users WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    if (existing && existing.length > 0) {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    // 2. Hash password securely
    const rawPass = opts.password || "SubhOne@2026";
    const { hash, salt } = await hashPasswordWithSalt(rawPass);
    const userId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    // 3. Insert into public.auth_users
    await sql.query(
      `INSERT INTO public.auth_users (
        id, email, phone, password_hash, salt, full_name, role, status, approval_status, shop_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        userId,
        cleanEmail,
        cleanPhone,
        hash,
        salt,
        cleanName,
        opts.role,
        initialStatus,
        initialApproval,
        cleanShop,
      ]
    );

    // 4. Upsert into public.profiles
    await sql.query(
      `INSERT INTO public.profiles (
        id, email, full_name, role, phone, shop_name, approval_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET email = $2, full_name = $3, role = $4, phone = $5, shop_name = $6, approval_status = $7, updated_at = NOW()`,
      [userId, cleanEmail, cleanName, opts.role, cleanPhone, cleanShop, initialApproval]
    ).catch(() => {});

    // 5. If retailer, register in public.retailer_approvals
    if (isRetailer) {
      await sql.query(
        `INSERT INTO public.retailer_approvals (
          user_id, email, full_name, phone, shop_name, approval_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())`,
        [userId, cleanEmail, cleanName, cleanPhone, cleanShop || `${cleanName}'s Store`]
      ).catch(() => {});
    }

    const newUser: ManagedUser = {
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
      role: opts.role,
      phone: cleanPhone,
      shopName: cleanShop,
      status: initialStatus,
      approvalStatus: initialApproval,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      approvedAt: null,
      approvedBy: null,
      blockedAt: null,
    };

    return {
      success: true,
      user: newUser,
      isPendingApproval: isRetailer,
    };
  } catch (err: any) {
    console.error("Failed to create Neon user:", err);
    return { success: false, error: err?.message || "Registration failed. Please try again." };
  }
}

/**
 * Authenticate a user against Neon PostgreSQL
 */
export async function authenticateNeonUser(
  email: string,
  password: string,
  expectedRole?: UserRole
): Promise<{
  success: boolean;
  user?: ManagedUser;
  error?: string;
  isPendingApproval?: boolean;
  isBlocked?: boolean;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user from public.auth_users
    const rows: any[] = await sql.query(
      `SELECT 
        id, email, phone, password_hash, salt, full_name, role, status, approval_status, 
        shop_name, avatar_url, last_login, approved_at, approved_by, blocked_at, created_at
       FROM public.auth_users 
       WHERE LOWER(email) = $1 
       LIMIT 1`,
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return { success: false, error: "Incorrect email or password. Please try again." };
    }

    const u = rows[0];

    // 2. Verify password hash
    const isValidPassword = await verifyPasswordHash(password, u.password_hash, u.salt);
    if (!isValidPassword) {
      return { success: false, error: "Incorrect email or password. Please try again." };
    }

    const role = (u.role as UserRole) || "customer";
    const isAdmin = role === "admin" || cleanEmail === "subhonehealthgroup@gmail.com" || cleanEmail === "admin@subhone.com";

    // 3. Gate 1: Check if account is blocked
    if ((u.status === "blocked" || u.approval_status === "blocked") && !isAdmin) {
      return {
        success: false,
        isBlocked: true,
        error: "Your account has been blocked by an administrator. Please contact support.",
      };
    }

    // 4. Gate 2: Check if Retailer is awaiting admin approval
    if (role === "retailer" && !isAdmin) {
      const isApproved = u.status === "active" && u.approval_status === "approved";
      if (!isApproved) {
        if (u.status === "rejected" || u.approval_status === "rejected") {
          return {
            success: false,
            error: "Your retailer account application was not approved. Please contact support.",
          };
        }
        return {
          success: false,
          isPendingApproval: true,
          error: "Your retailer account is awaiting admin approval. You will be able to sign in once an administrator approves your account.",
        };
      }
    }

    // 5. Update last_login timestamp in Neon
    await sql.query(
      `UPDATE public.auth_users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
      [u.id]
    ).catch(() => {});

    const managedUser: ManagedUser = {
      id: u.id,
      email: u.email,
      fullName: u.full_name || "User",
      role: role,
      phone: u.phone || null,
      shopName: u.shop_name || null,
      status: u.status === "blocked" ? "blocked" : u.status === "pending_approval" ? "pending_approval" : "active",
      approvalStatus: u.approval_status || (u.status === "pending_approval" ? "pending" : "approved"),
      avatarUrl: u.avatar_url || null,
      createdAt: u.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      approvedAt: u.approved_at || null,
      approvedBy: u.approved_by || null,
      blockedAt: u.blocked_at || null,
    };

    return {
      success: true,
      user: managedUser,
    };
  } catch (err: any) {
    console.error("Neon authentication error:", err);
    return { success: false, error: err?.message || "Authentication failed. Please try again." };
  }
}

/**
 * Update user account status in Neon PostgreSQL (Approve, Block, Unblock, Reject)
 */
export async function updateUserAccountStatus(
  userId: string,
  newStatus: "approved" | "blocked" | "pending" | "rejected" | "active"
): Promise<{ success: boolean; error?: string }> {
  try {
    let authStatus: string = "active";
    let approvalStatus: string = "approved";
    let approvedAt: string | null = null;
    let blockedAt: string | null = null;

    if (newStatus === "approved" || newStatus === "active") {
      authStatus = "active";
      approvalStatus = "approved";
      approvedAt = new Date().toISOString();
      blockedAt = null;
    } else if (newStatus === "blocked") {
      authStatus = "blocked";
      approvalStatus = "blocked";
      blockedAt = new Date().toISOString();
    } else if (newStatus === "pending") {
      authStatus = "pending_approval";
      approvalStatus = "pending";
    } else if (newStatus === "rejected") {
      authStatus = "rejected";
      approvalStatus = "rejected";
    }

    // 1. Update public.auth_users
    await sql.query(
      `UPDATE public.auth_users 
       SET status = $1, 
           approval_status = $2, 
           approved_at = CASE WHEN $3::TIMESTAMPTZ IS NOT NULL THEN $3::TIMESTAMPTZ ELSE approved_at END,
           blocked_at = $4::TIMESTAMPTZ,
           updated_at = NOW()
       WHERE id = $5 OR LOWER(email) = LOWER($5)`,
      [authStatus, approvalStatus, approvedAt, blockedAt, userId]
    );

    // 2. Update public.profiles
    await sql.query(
      `UPDATE public.profiles 
       SET approval_status = $1, updated_at = NOW() 
       WHERE id = $2 OR LOWER(email) = LOWER($2)`,
      [approvalStatus, userId]
    ).catch(() => {});

    // 3. Update public.retailer_approvals
    await sql.query(
      `UPDATE public.retailer_approvals 
       SET approval_status = $1, 
           approved_at = CASE WHEN $2::TIMESTAMPTZ IS NOT NULL THEN $2::TIMESTAMPTZ ELSE approved_at END,
           updated_at = NOW() 
       WHERE user_id = $3 OR LOWER(email) = LOWER($3) OR id = $3`,
      [approvalStatus, approvedAt, userId]
    ).catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error("Failed to update user account status in Neon:", err);
    return { success: false, error: err?.message || "Failed to update account status." };
  }
}

/**
 * Admin change / reset a user's password in Neon PostgreSQL
 */
export async function adminChangeUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    // 1. Hash with fresh salt
    const { hash, salt } = await hashPasswordWithSalt(newPassword);

    // 2. Update in public.auth_users
    await sql.query(
      `UPDATE public.auth_users 
       SET password_hash = $1, salt = $2, updated_at = NOW() 
       WHERE id = $3 OR LOWER(email) = LOWER($3)`,
      [hash, salt, userId]
    );

    return { success: true };
  } catch (err: any) {
    console.error("Failed to reset password in Neon:", err);
    return { success: false, error: err?.message || "Password update failed." };
  }
}

/**
 * Admin permanently delete a user account from Neon PostgreSQL
 */
export async function adminDeleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`DELETE FROM public.auth_users WHERE id = $1 OR LOWER(email) = LOWER($1)`, [userId]);
    await sql.query(`DELETE FROM public.profiles WHERE id = $1 OR LOWER(email) = LOWER($1)`, [userId]).catch(() => {});
    await sql.query(`DELETE FROM public.retailer_approvals WHERE user_id = $1 OR LOWER(email) = LOWER($1) OR id = $1`, [userId]).catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete user account in Neon:", err);
    return { success: false, error: err?.message || "Account deletion failed." };
  }
}

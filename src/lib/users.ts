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
  tokenVersion?: number;
}

export interface LoginLog {
  id: string;
  userId: string | null;
  email: string;
  role: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  loggedInAt: string;
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

  // Only attempt hash verification if we have a salt
  if (salt) {
    const { hash } = await hashPasswordWithSalt(password, salt);
    if (hash === storedHash) return true;
  }

  // If no salt provided, this password cannot be verified securely
  // Return false instead of creating a fallback hash
  return false;
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
        created_at,
        token_version
      FROM public.auth_users
      WHERE deleted_at IS NULL
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
        tokenVersion: u.token_version ?? 0,
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
          tokenVersion: 0,
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

    // 1. Check if email already exists (exclude soft-deleted)
    const existing = await sql.query(
      `SELECT id, email FROM public.auth_users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
      [cleanEmail]
    );

    if (existing && existing.length > 0) {
      console.warn(`Signup attempt: email ${cleanEmail} already exists`);
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    // 2. Hash password securely
    const rawPass = opts.password || "SubhOne@2026";
    const { hash, salt } = await hashPasswordWithSalt(rawPass);

    // Validate hash and salt were created
    if (!hash || !salt) {
      console.error("Password hashing failed - hash or salt is empty");
      return { success: false, error: "Registration failed during password setup. Please try again." };
    }

    const userId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    // 3. Insert into public.auth_users
    const insertResult = await sql.query(
      `INSERT INTO public.auth_users (
        id, email, phone, password_hash, salt, full_name, role, status, approval_status, shop_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, email, password_hash, salt`,
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

    if (!insertResult || insertResult.length === 0) {
      console.error("Failed to insert user into auth_users table");
      return { success: false, error: "Failed to create user account. Please try again." };
    }

    const created = insertResult[0];
    console.log(`User created successfully: ${cleanEmail} with hash length: ${created.password_hash?.length || 0}, salt length: ${created.salt?.length || 0}`);

    // 4. Upsert into public.profiles
    await sql.query(
      `INSERT INTO public.profiles (
        id, email, full_name, role, phone, shop_name, approval_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET email = $2, full_name = $3, role = $4, phone = $5, shop_name = $6, approval_status = $7, updated_at = NOW()`,
      [userId, cleanEmail, cleanName, opts.role, cleanPhone, cleanShop, initialApproval]
    ).catch((err) => {
      console.warn("Notice upserting profile:", err?.message);
    });

    // 5. If retailer, register in approval tables
    if (isRetailer) {
      await sql.query(
        `INSERT INTO public.retailer_approvals (
          user_id, email, full_name, phone, shop_name, approval_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())`,
        [userId, cleanEmail, cleanName, cleanPhone, cleanShop || `${cleanName}'s Store`]
      ).catch((err) => {
        console.warn("Notice creating retailer approval:", err?.message);
      });
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
      tokenVersion: 0,
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
  const cleanEmail = email.trim().toLowerCase();
  try {

    // 1. Fetch user from public.auth_users (exclude soft-deleted)
    const rows: any[] = await sql.query(
      `SELECT
        id, email, phone, password_hash, salt, full_name, role, status, approval_status,
        shop_name, avatar_url, last_login, approved_at, approved_by, blocked_at, created_at,
        token_version, deleted_at
       FROM public.auth_users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      console.warn(`Login attempt: user not found for email ${cleanEmail}`);
      await writeLoginLog({ email: cleanEmail, status: "failed" });
      return { success: false, error: "Incorrect email or password. Please try again." };
    }

    const u = rows[0];

    // Block soft-deleted accounts
    if (u.deleted_at) {
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      return { success: false, error: "Incorrect email or password. Please try again." };
    }

    if (!u.password_hash) {
      console.error(`User ${cleanEmail} has no password_hash stored. Account may be corrupted.`);
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      return { success: false, error: "Account authentication data is missing. Please contact support." };
    }

    // 2. Verify password hash
    const isValidPassword = await verifyPasswordHash(password, u.password_hash, u.salt);
    if (!isValidPassword) {
      console.warn(`Login attempt failed: invalid password for ${cleanEmail}. Salt present: ${!!u.salt}`);
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      return { success: false, error: "Incorrect email or password. Please try again." };
    }

    const role = (u.role as UserRole) || "customer";
    const isAdmin = role === "admin" || cleanEmail === "subhonehealthgroup@gmail.com" || cleanEmail === "admin@subhone.com";

    // 3. Gate 1: Check if account is blocked
    if ((u.status === "blocked" || u.approval_status === "blocked") && !isAdmin) {
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "blocked_attempt" });
      return {
        success: false,
        isBlocked: true,
        error: "Your account has been blocked by an administrator. Please contact support.",
      };
    }

    // 4. Gate 2: Check if account is active
    if (!isAdmin && u.status !== "active") {
      console.log(`[AUTH-DEBUG] Login blocked for ${cleanEmail}: DB users.status is '${u.status}'`);
      await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "failed" });
      
      let errorMsg = "Your account is not active. Please contact support.";
      if (u.status === "pending" || u.status === "pending_approval") {
        errorMsg = "Your account is awaiting admin approval. You will be able to sign in once an administrator approves your account.";
      } else if (u.status === "rejected") {
        errorMsg = "Your account application was not approved. Please contact support.";
      }
      
      return {
        success: false,
        error: errorMsg,
      };
    }

    // 5. Update last_login timestamp in Neon
    await sql.query(
      `UPDATE public.auth_users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
      [u.id]
    ).catch(() => {});

    // 6. Write success audit log
    await writeLoginLog({ userId: u.id, email: cleanEmail, role: u.role, status: "success" });

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
      tokenVersion: u.token_version ?? 0,
    };

    return {
      success: true,
      user: managedUser,
    };
  } catch (err: any) {
    console.error("Neon authentication error:", err);
    await writeLoginLog({ email: cleanEmail, status: "failed" }).catch(() => {});
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

    // 1. Database Updates inside an atomic transaction to avoid desync
    const results = await sql.transaction([
      sql`UPDATE public.auth_users 
          SET status = ${authStatus}, 
              approval_status = ${approvalStatus}, 
              approved_at = CASE WHEN ${approvedAt}::TIMESTAMPTZ IS NOT NULL THEN ${approvedAt}::TIMESTAMPTZ ELSE approved_at END,
              blocked_at = ${blockedAt}::TIMESTAMPTZ,
              updated_at = NOW()
          WHERE id = ${userId} OR LOWER(email) = LOWER(${userId})
          RETURNING id`,

      sql`UPDATE public.profiles 
          SET approval_status = ${approvalStatus}, updated_at = NOW() 
          WHERE id = ${userId} OR LOWER(email) = LOWER(${userId})`,

      sql`UPDATE public.retailer_approvals 
          SET approval_status = ${approvalStatus}, 
              approved_at = CASE WHEN ${approvedAt}::TIMESTAMPTZ IS NOT NULL THEN ${approvedAt}::TIMESTAMPTZ ELSE approved_at END,
              updated_at = NOW() 
          WHERE user_id = ${userId} OR LOWER(email) = LOWER(${userId}) OR id = ${userId}`
    ]);

    if (!results || !results[0] || results[0].length === 0) {
      throw new Error(`Account not found or ID mismatch for ${userId}. No rows were updated.`);
    }

    // 2. Session invalidation: bump token_version on block or reject
    if (newStatus === "blocked" || newStatus === "rejected") {
      await bumpTokenVersion(userId);
    }

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
 * Soft-delete a user account (sets deleted_at, bumps token_version).
 * Login history and references remain intact for audit/integrity.
 * This replaces the previous hard DELETE approach.
 */
export async function adminDeleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete: stamp deleted_at so the row persists for audit trail
    await sql.query(
      `UPDATE public.auth_users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [userId]
    );

    // Bump token version to immediately invalidate any active sessions
    await bumpTokenVersion(userId);

    // Update profile record timestamp
    await sql.query(
      `UPDATE public.profiles SET updated_at = NOW() WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [userId]
    ).catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error("Failed to soft-delete user account in Neon:", err);
    return { success: false, error: err?.message || "Account deletion failed." };
  }
}

// ─── Login Audit Log ──────────────────────────────────────────────────────────

/**
 * Write a login event to public.auth_login_logs.
 * status: 'success' | 'failed' | 'blocked_attempt'
 * This must never throw — wrapped in try/catch to protect the auth flow.
 */
export async function writeLoginLog(opts: {
  userId?: string | null;
  email: string;
  role?: string | null;
  status: "success" | "failed" | "blocked_attempt";
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await sql.query(
      `INSERT INTO public.auth_login_logs (user_id, email, role, status, ip_address, user_agent, logged_in_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        opts.userId || null,
        opts.email.trim().toLowerCase(),
        opts.role || null,
        opts.status,
        opts.ipAddress || null,
        opts.userAgent || null,
      ]
    );
  } catch (err) {
    // Log writes must never break the main auth flow
    console.warn("Failed to write login log:", err);
  }
}

// ─── Token Version (Session Invalidation) ────────────────────────────────────

/**
 * Increment token_version — call this whenever a user is blocked or deleted.
 * Any outstanding JWTs/sessions with an older version are considered invalid.
 */
export async function bumpTokenVersion(userId: string): Promise<void> {
  try {
    await sql.query(
      `UPDATE public.auth_users
       SET token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
       WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [userId]
    );
  } catch (err) {
    console.warn("Failed to bump token_version:", err);
  }
}

// ─── Login Logs Viewer (Admin) ────────────────────────────────────────────────

/**
 * Fetch paginated login logs from public.auth_login_logs
 * Supports filtering by userId, role, status, and date range.
 */
export async function fetchLoginLogs(opts?: {
  userId?: string;
  role?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: LoginLog[]; total: number }> {
  try {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (opts?.userId) {
      conditions.push(`user_id = $${pIdx++}`);
      params.push(opts.userId);
    }
    if (opts?.role && opts.role !== "all") {
      conditions.push(`role = $${pIdx++}`);
      params.push(opts.role);
    }
    if (opts?.status && opts.status !== "all") {
      conditions.push(`status = $${pIdx++}`);
      params.push(opts.status);
    }
    if (opts?.from) {
      conditions.push(`logged_in_at >= $${pIdx++}`);
      params.push(opts.from);
    }
    if (opts?.to) {
      conditions.push(`logged_in_at <= $${pIdx++}`);
      params.push(opts.to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await sql.query(
      `SELECT COUNT(*) as total FROM public.auth_login_logs ${whereClause}`,
      params
    );
    const total = parseInt(String(countResult[0]?.total || "0"), 10);

    const rows: any[] = await sql.query(
      `SELECT id, user_id, email, role, status, ip_address, user_agent, logged_in_at
       FROM public.auth_login_logs
       ${whereClause}
       ORDER BY logged_in_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++}`,
      [...params, limit, offset]
    );

    const logs: LoginLog[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      email: r.email,
      role: r.role,
      status: r.status,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      loggedInAt: r.logged_in_at,
    }));

    return { logs, total };
  } catch (err) {
    console.error("Error fetching login logs:", err);
    return { logs: [], total: 0 };
  }
}

import { neon } from "@neondatabase/serverless";
import { NEON_CONNECTION_STRING } from "./neon";

const dbUrl =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  NEON_CONNECTION_STRING;

const sql = neon(dbUrl as string);

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

export async function writeLoginLog(opts: {
  userId?: string;
  email: string;
  role?: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await sql.query(
      `INSERT INTO public.login_logs (user_id, email, role, status, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        opts.userId || null,
        opts.email,
        opts.role || null,
        opts.status,
        opts.ipAddress || null,
        opts.userAgent || null,
      ]
    );
  } catch (err) {
    console.error("Failed to write login log:", err);
  }
}

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
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (opts?.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(opts.userId);
    }
    if (opts?.role) {
      conditions.push(`role = $${paramIndex++}`);
      params.push(opts.role);
    }
    if (opts?.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(opts.status);
    }
    if (opts?.from) {
      conditions.push(`logged_in_at >= $${paramIndex++}::TIMESTAMPTZ`);
      params.push(opts.from);
    }
    if (opts?.to) {
      conditions.push(`logged_in_at <= $${paramIndex++}::TIMESTAMPTZ`);
      params.push(opts.to);
    }

    const whereClause = conditions.join(" AND ");

    const totalRes = await sql.query(
      `SELECT COUNT(*) as count FROM public.login_logs WHERE ${whereClause}`,
      params
    );
    const total = parseInt(totalRes[0].count, 10);

    const limit = opts?.limit || 50;
    const offset = opts?.offset || 0;
    params.push(limit, offset);

    const logsRes = await sql.query(
      `SELECT id, user_id, email, role, status, ip_address, user_agent, logged_in_at 
       FROM public.login_logs 
       WHERE ${whereClause}
       ORDER BY logged_in_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    const logs: LoginLog[] = logsRes.map((r: any) => ({
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

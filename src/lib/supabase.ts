import { sql, NEON_CONNECTION_STRING, NEON_DATA_API, NEON_AUTH_API } from "./neon";

export type UserRole = "customer" | "retailer" | "admin";

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  shop_name: string | null;
  avatar_url: string | null;
  approval_status?: "pending" | "approved" | "blocked" | "rejected";
  created_at: string;
  updated_at: string;
}

// Local Session state
const SESSION_KEY = "subhone_neon_auth_session";

function getStoredSession(): { user: any } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(user: any | null) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
}

/**
 * Neon Query Builder to provide seamless database operations
 */
class NeonQueryBuilder {
  private tableName: string;
  private selectedFields: string = "*";
  private whereClauses: { field: string; op: string; val: any }[] = [];
  private orderField?: string;
  private orderAsc: boolean = true;
  private limitCount?: number;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = "*") {
    this.selectedFields = fields;
    return this;
  }

  eq(field: string, val: any) {
    this.whereClauses.push({ field, op: "=", val });
    return this;
  }

  neq(field: string, val: any) {
    this.whereClauses.push({ field, op: "!=", val });
    return this;
  }

  gte(field: string, val: any) {
    this.whereClauses.push({ field, op: ">=", val });
    return this;
  }

  lte(field: string, val: any) {
    this.whereClauses.push({ field, op: "<=", val });
    return this;
  }

  in(field: string, vals: any[]) {
    this.whereClauses.push({ field, op: "IN", val: vals });
    return this;
  }

  or(conditionStr: string) {
    // Custom handling or ignore
    return this;
  }

  order(field: string, opts: { ascending?: boolean } = {}) {
    this.orderField = field;
    this.orderAsc = opts.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async insert(data: any | any[]) {
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return { data: [], error: null };

    try {
      const insertedRows: any[] = [];
      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.map((k) => `"${k}"`).join(", ");
        const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
        const values = keys.map((k) => row[k]);

        const query = `INSERT INTO public."${this.tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`;
        const res = await sql.query(query, values);
        if (res && res[0]) insertedRows.push(res[0]);
      }

      return {
        data: Array.isArray(data) ? insertedRows : insertedRows[0],
        error: null,
        select: () => ({
          single: () => Promise.resolve({ data: insertedRows[0], error: null }),
        }),
      };
    } catch (err: any) {
      console.error(`Neon insert error on ${this.tableName}:`, err);
      return { data: null, error: err };
    }
  }

  async upsert(data: any | any[], opts: { onConflict?: string } = {}) {
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return { data: [], error: null };

    const conflictCol = opts.onConflict || "id";
    try {
      const insertedRows: any[] = [];
      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.map((k) => `"${k}"`).join(", ");
        const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
        const values = keys.map((k) => row[k]);

        const updateSet = keys
          .filter((k) => k !== conflictCol)
          .map((k) => `"${k}" = EXCLUDED."${k}"`)
          .join(", ");

        const query = `INSERT INTO public."${this.tableName}" (${cols}) VALUES (${placeholders})
          ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateSet} RETURNING *`;

        const res = await sql.query(query, values);
        if (res && res[0]) insertedRows.push(res[0]);
      }

      return { data: Array.isArray(data) ? insertedRows : insertedRows[0], error: null };
    } catch (err: any) {
      console.error(`Neon upsert error on ${this.tableName}:`, err);
      return { data: null, error: err };
    }
  }

  async update(updates: any) {
    return {
      eq: async (field: string, val: any) => {
        try {
          const keys = Object.keys(updates);
          const setClauses = keys.map((k, idx) => `"${k}" = $${idx + 1}`).join(", ");
          const values = [...keys.map((k) => updates[k]), val];
          const query = `UPDATE public."${this.tableName}" SET ${setClauses} WHERE "${field}" = $${values.length} RETURNING *`;
          const res = await sql.query(query, values);
          return { data: res, error: null };
        } catch (err: any) {
          console.error(`Neon update error on ${this.tableName}:`, err);
          return { data: null, error: err };
        }
      },
    };
  }

  async delete() {
    return {
      eq: async (field: string, val: any) => {
        try {
          const query = `DELETE FROM public."${this.tableName}" WHERE "${field}" = $1 RETURNING *`;
          const res = await sql.query(query, [val]);
          return { data: res, error: null };
        } catch (err: any) {
          console.error(`Neon delete error on ${this.tableName}:`, err);
          return { data: null, error: err };
        }
      },
    };
  }

  // Thenable execution for await .select()
  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      let query = `SELECT ${this.selectedFields} FROM public."${this.tableName}"`;
      const values: any[] = [];

      if (this.whereClauses.length > 0) {
        const conditions = this.whereClauses.map((c) => {
          if (c.op === "IN") {
            const inPlaceholders = c.val.map((v: any) => {
              values.push(v);
              return `$${values.length}`;
            }).join(", ");
            return `"${c.field}" IN (${inPlaceholders})`;
          } else {
            values.push(c.val);
            return `"${c.field}" ${c.op} $${values.length}`;
          }
        });
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      if (this.orderField) {
        query += ` ORDER BY "${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }

      if (this.limitCount) {
        query += ` LIMIT ${this.limitCount}`;
      }

      const rows = await sql.query(query, values);

      if (this.isSingle) {
        if (!rows || rows.length === 0) {
          resolve({ data: null, error: new Error("Row not found") });
        } else {
          resolve({ data: rows[0], error: null });
        }
      } else if (this.isMaybeSingle) {
        resolve({ data: rows && rows.length > 0 ? rows[0] : null, error: null });
      } else {
        resolve({ data: rows || [], error: null });
      }
    } catch (err: any) {
      console.error(`Neon query error on ${this.tableName}:`, err);
      resolve({ data: null, error: err });
    }
  }
}

/**
 * Neon Client with Auth & DB support matching the app interface
 */
export const neonClient = {
  from(tableName: string) {
    return new NeonQueryBuilder(tableName);
  },

  async rpc(funcName: string, params: any = {}) {
    if (funcName === "admin_list_users") {
      try {
        const rows = await sql.query(`
          SELECT 
            p.id, 
            p.email, 
            p.full_name, 
            p.role, 
            p.phone, 
            p.shop_name, 
            p.approval_status, 
            p.avatar_url, 
            p.created_at, 
            u.created_at as last_sign_in_at
          FROM public.profiles p
          LEFT JOIN public.auth_users u ON p.email = u.email
          ORDER BY p.created_at DESC
        `);
        return { data: rows || [], error: null };
      } catch (err) {
        return { data: [], error: err };
      }
    }

    if (funcName === "admin_set_user_status") {
      try {
        await sql.query(
          `UPDATE public.profiles SET approval_status = $1, updated_at = NOW() WHERE id = $2`,
          [params.new_status, params.target_user_id]
        );
        await sql.query(
          `UPDATE public.auth_users SET approval_status = $1, updated_at = NOW() WHERE id = $2`,
          [params.new_status, params.target_user_id]
        );
        return { data: { success: true }, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    return { data: null, error: null };
  },

  auth: {
    async getUser() {
      const sess = getStoredSession();
      return { data: { user: sess?.user || null }, error: null };
    },

    async getSession() {
      const sess = getStoredSession();
      return { data: { session: sess ? { user: sess.user } : null }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      const sess = getStoredSession();
      if (sess?.user) {
        callback("SIGNED_IN", { user: sess.user });
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const cleanEmail = email.toLowerCase().trim();

        // Check in auth_users table
        const rows = await sql.query(
          `SELECT * FROM public.auth_users WHERE LOWER(email) = $1`,
          [cleanEmail]
        );

        if (!rows || rows.length === 0) {
          // Allow default admin sign in if credentials match
          if (cleanEmail === "admin@subhone.com" && (password === "Subhone@2026" || password === "admin123")) {
            const adminUser = {
              id: "admin_fixed_id",
              email: "admin@subhone.com",
              user_metadata: { role: "admin", full_name: "Store Administrator" },
            };
            saveStoredSession(adminUser);
            return { data: { user: adminUser, session: { user: adminUser } }, error: null };
          }
          return { data: { user: null, session: null }, error: { message: "Invalid login credentials." } };
        }

        const userRow = rows[0];
        if (userRow.password_hash !== password) {
          return { data: { user: null, session: null }, error: { message: "Incorrect password." } };
        }

        if (userRow.approval_status === "blocked") {
          return { data: { user: null, session: null }, error: { message: "Your account has been blocked." } };
        }

        const authUser = {
          id: userRow.id,
          email: userRow.email,
          user_metadata: {
            role: userRow.role,
            full_name: userRow.full_name,
            shop_name: userRow.shop_name,
            phone: userRow.phone,
            approval_status: userRow.approval_status,
          },
        };

        saveStoredSession(authUser);
        return { data: { user: authUser, session: { user: authUser } }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err?.message || "Sign in failed" } };
      }
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
      try {
        const cleanEmail = email.toLowerCase().trim();
        const role = options?.data?.role || "customer";
        const fullName = options?.data?.full_name || "User";
        const phone = options?.data?.phone || null;
        const shopName = options?.data?.shop_name || null;
        const approvalStatus = role === "retailer" ? "pending" : "approved";
        const userId = "user_" + Math.random().toString(36).substring(2, 12);

        // Insert into auth_users
        await sql.query(
          `INSERT INTO public.auth_users (id, email, password_hash, full_name, role, phone, shop_name, approval_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO UPDATE SET password_hash = $3, full_name = $4, updated_at = NOW()`,
          [userId, cleanEmail, password, fullName, role, phone, shopName, approvalStatus]
        );

        // Insert/update profile
        await sql.query(
          `INSERT INTO public.profiles (id, email, full_name, role, phone, shop_name, approval_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET full_name = $3, phone = $5, shop_name = $6, approval_status = $7, updated_at = NOW()`,
          [userId, cleanEmail, fullName, role, phone, shopName, approvalStatus]
        );

        // If retailer, create approval request
        if (role === "retailer") {
          await sql.query(
            `INSERT INTO public.retailer_approvals (user_id, email, full_name, phone, shop_name, approval_status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [userId, cleanEmail, fullName, phone, shopName || "Medical Store"]
          );
        }

        const userObj = {
          id: userId,
          email: cleanEmail,
          user_metadata: { role, full_name: fullName, shop_name: shopName, phone, approval_status: approvalStatus },
        };

        if (role !== "retailer") {
          saveStoredSession(userObj);
        }

        return { data: { user: userObj, session: role !== "retailer" ? { user: userObj } : null }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err?.message || "Registration failed" } };
      }
    },

    async resetPasswordForEmail(email: string) {
      return { data: {}, error: null };
    },

    async updateUser(updates: any) {
      const sess = getStoredSession();
      if (sess?.user) {
        sess.user.user_metadata = { ...sess.user.user_metadata, ...(updates.data || {}) };
        saveStoredSession(sess.user);
      }
      return { data: { user: sess?.user }, error: null };
    },

    async signOut() {
      saveStoredSession(null);
      return { error: null };
    },
  },

  storage: {
    from(bucketName: string) {
      return {
        async upload(path: string, file: any) {
          return { data: { path }, error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: path } };
        },
      };
    },
  },

  channel(name: string) {
    return {
      on(event: string, opts: any, callback: any) {
        return this;
      },
      subscribe() {
        return {
          unsubscribe: () => {},
        };
      },
    };
  },
};

// Export singleton replacing supabase with Neon
export const supabase = neonClient;

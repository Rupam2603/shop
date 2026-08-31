import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function setupUserManagementTables() {
  console.log("Setting up User Management tables in Neon PostgreSQL...");

  // 1. Create / update public.auth_users
  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.auth_users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      salt TEXT,
      full_name TEXT NOT NULL DEFAULT 'User',
      role TEXT NOT NULL DEFAULT 'customer',
      status TEXT NOT NULL DEFAULT 'active',
      approval_status TEXT NOT NULL DEFAULT 'active',
      shop_name TEXT,
      avatar_url TEXT,
      last_login TIMESTAMPTZ,
      approved_at TIMESTAMPTZ,
      approved_by TEXT,
      blocked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Ensure columns exist if table was already created
  const columnsToAdd = [
    { name: "salt", type: "TEXT" },
    { name: "status", type: "TEXT NOT NULL DEFAULT 'active'" },
    { name: "approval_status", type: "TEXT NOT NULL DEFAULT 'active'" },
    { name: "phone", type: "TEXT" },
    { name: "shop_name", type: "TEXT" },
    { name: "avatar_url", type: "TEXT" },
    { name: "last_login", type: "TIMESTAMPTZ" },
    { name: "approved_at", type: "TIMESTAMPTZ" },
    { name: "approved_by", type: "TEXT" },
    { name: "blocked_at", type: "TIMESTAMPTZ" },
    { name: "created_at", type: "TIMESTAMPTZ NOT NULL DEFAULT NOW()" },
    { name: "updated_at", type: "TIMESTAMPTZ NOT NULL DEFAULT NOW()" },
  ];

  for (const col of columnsToAdd) {
    try {
      await sql.query(`ALTER TABLE public.auth_users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
    } catch (e) {
      // Ignore if already exists
    }
  }

  // 2. Ensure public.profiles exists and is aligned
  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      full_name TEXT NOT NULL DEFAULT 'User',
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      shop_name TEXT,
      avatar_url TEXT,
      approval_status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 3. Ensure public.retailer_approvals exists
  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.retailer_approvals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id TEXT,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      shop_name TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 4. Create Indexes
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_auth_users_phone ON public.auth_users(phone);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_auth_users_role ON public.auth_users(role);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_auth_users_status ON public.auth_users(status);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_retailer_approvals_email ON public.retailer_approvals(email);`);

  console.log("User Management tables and indexes successfully setup in Neon PostgreSQL!");
}

setupUserManagementTables().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

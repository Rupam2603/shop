const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const sql = neon('postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
  const queries = [
    `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
    
    `DO $$ BEGIN
      CREATE TYPE user_role   AS ENUM ('customer','retailer','admin');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('pending','active','blocked','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    
    `CREATE TABLE IF NOT EXISTS public.users (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name              TEXT NOT NULL,
      email             TEXT UNIQUE NOT NULL,
      password_hash     TEXT NOT NULL,
      role              user_role   NOT NULL DEFAULT 'customer',
      status            user_status NOT NULL DEFAULT 'active',
      business_name     TEXT,
      business_doc_url  TEXT,
      token_version     INT NOT NULL DEFAULT 0,
      deleted_at        TIMESTAMPTZ,
      created_at        TIMESTAMPTZ DEFAULT now(),
      updated_at        TIMESTAMPTZ DEFAULT now(),
      approved_by       UUID REFERENCES public.users(id),
      approved_at       TIMESTAMPTZ
    );`,
    
    `CREATE TABLE IF NOT EXISTS public.retailer_approval_requests (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
      status       user_status NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ DEFAULT now(),
      reviewed_at  TIMESTAMPTZ,
      reviewed_by  UUID REFERENCES public.users(id),
      notes        TEXT
    );`,
    
    `CREATE TABLE IF NOT EXISTS public.login_logs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
      email        TEXT NOT NULL,
      role         user_role,
      status       TEXT NOT NULL,
      ip_address   TEXT,
      user_agent   TEXT,
      logged_in_at TIMESTAMPTZ DEFAULT now()
    );`,
    
    `CREATE INDEX IF NOT EXISTS idx_users_email          ON public.users(LOWER(email));`,
    `CREATE INDEX IF NOT EXISTS idx_users_status         ON public.users(status);`,
    `CREATE INDEX IF NOT EXISTS idx_users_role           ON public.users(role);`,
    `CREATE INDEX IF NOT EXISTS idx_rar_user_id          ON public.retailer_approval_requests(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_rar_status           ON public.retailer_approval_requests(status);`,
    `CREATE INDEX IF NOT EXISTS idx_login_logs_user_id   ON public.login_logs(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_login_logs_email     ON public.login_logs(email);`,
    `CREATE INDEX IF NOT EXISTS idx_login_logs_logged_at ON public.login_logs(logged_in_at DESC);`,
    
    `INSERT INTO public.users (id, name, email, password_hash, role, status)
    VALUES (
      gen_random_uuid(),
      'Store Administrator',
      'subhonehealthgroup@gmail.com',
      'ADMIN_HARDCODED_BYPASS',
      'admin',
      'active'
    ) ON CONFLICT (email) DO NOTHING;`
  ];

  try {
    for (const q of queries) {
      await sql.query(q);
    }
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();

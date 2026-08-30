import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function setAdminCredentials() {
  const adminEmail = "admin@subhone.com";
  const adminPassword = "Subhone@2026";
  const adminId = "admin_fixed_id";

  console.log(`Setting admin credentials for ${adminEmail} on Neon Postgres...`);

  // 1. Update/insert in public.auth_users
  await sql.query(
    `INSERT INTO public.auth_users (id, email, password_hash, full_name, role, approval_status, updated_at)
     VALUES ($1, $2, $3, 'Store Administrator', 'admin', 'approved', NOW())
     ON CONFLICT (email) DO UPDATE 
     SET password_hash = $3, full_name = 'Store Administrator', role = 'admin', approval_status = 'approved', updated_at = NOW()`,
    [adminId, adminEmail, adminPassword]
  );

  // 2. Update/insert in public.profiles
  await sql.query(
    `INSERT INTO public.profiles (id, email, full_name, role, approval_status, updated_at)
     VALUES ($1, $2, 'Store Administrator', 'admin', 'approved', NOW())
     ON CONFLICT (id) DO UPDATE 
     SET email = $2, full_name = 'Store Administrator', role = 'admin', approval_status = 'approved', updated_at = NOW()`,
    [adminId, adminEmail]
  );

  // Verify in Neon DB
  const check = await sql.query(`SELECT id, email, role, approval_status FROM public.auth_users WHERE email = $1`, [adminEmail]);
  console.log("Admin credentials saved in Neon database:", check);
}

setAdminCredentials().catch((err) => {
  console.error("Error setting admin credentials:", err);
  process.exit(1);
});

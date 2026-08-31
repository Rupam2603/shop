import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function setAdminCredentials() {
  const adminEmails = ["subhonehealthgroup@gmail.com", "admin@subhone.com"];
  const adminPassword = "Subhone@2026";
  const adminFullName = "SubhOne Executive Admin";

  console.log(`Configuring Admin credentials for ${adminEmails.join(", ")} on Neon Postgres...`);

  for (const adminEmail of adminEmails) {
    const adminId = adminEmail === "subhonehealthgroup@gmail.com" ? "admin_subhonehealthgroup_id" : "admin_fixed_id";

    // 1. Delete any conflicting records with different id if exists, or update
    await sql.query(
      `DELETE FROM public.auth_users WHERE email = $1 AND id != $2`,
      [adminEmail, adminId]
    );
    await sql.query(
      `DELETE FROM public.profiles WHERE email = $1 AND id != $2`,
      [adminEmail, adminId]
    );

    // 2. Update/insert in public.auth_users
    await sql.query(
      `INSERT INTO public.auth_users (id, email, password_hash, full_name, role, approval_status, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', 'approved', NOW())
       ON CONFLICT (id) DO UPDATE 
       SET email = $2, password_hash = $3, full_name = $4, role = 'admin', approval_status = 'approved', updated_at = NOW()`,
      [adminId, adminEmail, adminPassword, adminFullName]
    );

    // 3. Update/insert in public.profiles
    await sql.query(
      `INSERT INTO public.profiles (id, email, full_name, role, approval_status, phone, shop_name, updated_at)
       VALUES ($1, $2, $3, 'admin', 'approved', '+91 98765 43210', 'SubhOne Central Healthcare', NOW())
       ON CONFLICT (id) DO UPDATE 
       SET email = $2, full_name = $3, role = 'admin', approval_status = 'approved', phone = '+91 98765 43210', shop_name = 'SubhOne Central Healthcare', updated_at = NOW()`,
      [adminId, adminEmail, adminFullName]
    );
  }

  // Verify in Neon DB
  const check = await sql.query(`SELECT id, email, role, approval_status FROM public.profiles WHERE role = 'admin'`);
  console.log("Admin accounts verified in Neon database:", check);
}

setAdminCredentials().catch((err) => {
  console.error("Error setting admin credentials:", err);
  process.exit(1);
});

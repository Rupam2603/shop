import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function resetOrdersAndSetup() {
  console.log("1. Clearing orders and order_items from Neon database...");
  await sql.query(`DELETE FROM public.order_items;`);
  await sql.query(`DELETE FROM public.orders;`);
  await sql.query(`DELETE FROM public.lab_test_bookings;`);

  console.log("2. Cleaning dummy retailer approvals / users, preserving Admin...");
  // Keep admin
  await sql.query(`DELETE FROM public.retailer_approvals;`);
  await sql.query(`DELETE FROM public.profiles WHERE email != 'admin@subhone.com';`);
  await sql.query(`DELETE FROM public.auth_users WHERE email != 'admin@subhone.com';`);

  // Verify Admin exists
  await sql.query(`
    INSERT INTO public.auth_users (id, email, password_hash, full_name, role, approval_status, updated_at)
    VALUES ('admin_fixed_id', 'admin@subhone.com', 'Subhone@2026', 'Store Administrator', 'admin', 'approved', NOW())
    ON CONFLICT (email) DO UPDATE 
    SET password_hash = 'Subhone@2026', full_name = 'Store Administrator', role = 'admin', approval_status = 'approved', updated_at = NOW();
  `);

  await sql.query(`
    INSERT INTO public.profiles (id, email, full_name, role, approval_status, updated_at)
    VALUES ('admin_fixed_id', 'admin@subhone.com', 'Store Administrator', 'admin', 'approved', NOW())
    ON CONFLICT (id) DO UPDATE 
    SET email = 'admin@subhone.com', full_name = 'Store Administrator', role = 'admin', approval_status = 'approved', updated_at = NOW();
  `);

  console.log("Order history reset and fresh DB state confirmed in Neon!");
}

resetOrdersAndSetup().catch((e) => {
  console.error("Error resetting orders in Neon:", e);
  process.exit(1);
});

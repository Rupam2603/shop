import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");

async function migrate() {
  try {
    console.log("Adding partner_code sequence...");
    await sql`CREATE SEQUENCE IF NOT EXISTS dly_partner_seq START WITH 1;`;

    console.log("Adding partner_code column...");
    await sql`ALTER TABLE public.delivery_partner_profiles ADD COLUMN IF NOT EXISTS partner_code VARCHAR(50);`;

    console.log("Creating trigger function...");
    await sql`
      CREATE OR REPLACE FUNCTION generate_dly_partner_code()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.partner_code IS NULL THEN
          NEW.partner_code := 'DLY-' || LPAD(nextval('dly_partner_seq')::text, 2, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log("Creating trigger...");
    await sql`DROP TRIGGER IF EXISTS trg_generate_dly_partner_code ON public.delivery_partner_profiles;`;
    await sql`
      CREATE TRIGGER trg_generate_dly_partner_code
      BEFORE INSERT ON public.delivery_partner_profiles
      FOR EACH ROW
      EXECUTE FUNCTION generate_dly_partner_code();
    `;

    console.log("Backfilling existing partners...");
    await sql`
      UPDATE public.delivery_partner_profiles
      SET partner_code = 'DLY-' || LPAD(nextval('dly_partner_seq')::text, 2, '0')
      WHERE partner_code IS NULL;
    `;

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();

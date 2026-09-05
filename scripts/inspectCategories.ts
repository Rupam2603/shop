import { neon } from "@neondatabase/serverless";

const PROD_DB_URL = "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(PROD_DB_URL);

async function check() {
  try {
    const cats = await sql`SELECT id, name, slug FROM categories ORDER BY name`;
    console.log("CATEGORIES IN DB:", JSON.stringify(cats, null, 2));
    
    const prodCats = await sql`SELECT DISTINCT category_name, COUNT(*) as count FROM products GROUP BY category_name`;
    console.log("PRODUCTS BY CATEGORY_NAME:", JSON.stringify(prodCats, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();

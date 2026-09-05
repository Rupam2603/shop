import { neon } from "@neondatabase/serverless";

const PROD_DB_URL = "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(PROD_DB_URL);

async function inspect() {
  const products = await sql`SELECT id, numeric_id, name, category_name, category_id, sub_category_name, sub_category_id FROM products ORDER BY id`;
  console.log("PRODUCTS:", JSON.stringify(products, null, 2));

  const categories = await sql`SELECT * FROM categories`;
  console.log("CATEGORIES:", JSON.stringify(categories, null, 2));

  const subCategories = await sql`SELECT * FROM sub_categories`;
  console.log("SUB_CATEGORIES:", JSON.stringify(subCategories, null, 2));
}

inspect();

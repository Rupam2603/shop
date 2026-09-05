import { neon } from "@neondatabase/serverless";
import { KEY_PRODUCT_CATEGORIES, KEY_CATEGORIES_CONFIG } from "../src/lib/keyCategories";

const PROD_DB_URL =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(PROD_DB_URL);

const HSN_BY_KEY_CAT: Record<string, string> = {
  "Skin Care & Ointments": "3304",
  "Pain Relief & Muscle Care": "3004",
  "Weight Loss & Metabolism": "2106",
  "Daily Wellness & Immunity": "2106",
  "Monsoon Health & Antiseptics": "3808",
  "Baby Care & Infant Nutrition": "3924",
  "Women's Health & Hygiene": "3305",
  "Men's Health & Vitality": "3004",
  "Diet & Digestive Health": "3004",
  "Hair Care & Scalp Therapy": "3305",
  "Vaccines & Medical Disposables": "3002",
  "Medical Supplies & Devices": "9018",
};

async function syncKeyCategories() {
  console.log("=== Starting Key Categories Sync ===");

  // Ensure inventory_products has sub_category columns
  await sql`
    ALTER TABLE inventory_products
    ADD COLUMN IF NOT EXISTS sub_category_id TEXT,
    ADD COLUMN IF NOT EXISTS sub_category_name TEXT;
  `;

  // 1. Ensure all 12 Key Categories exist in `categories` table
  const categoryMap = new Map<string, string>(); // name -> id

  for (const catName of KEY_PRODUCT_CATEGORIES) {
    const config = KEY_CATEGORIES_CONFIG.find((c) => c.name === catName);
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const hsn = HSN_BY_KEY_CAT[catName] || "3004";
    const accent = config?.accent || "#006a39";
    const desc = config?.description || "";

    const existing = await sql`
      SELECT id FROM categories WHERE name = ${catName} LIMIT 1
    `;

    let catId: string;
    if (existing.length > 0) {
      catId = existing[0].id;
      console.log(`Category exists: ${catName} (${catId})`);
    } else {
      catId = crypto.randomUUID();
      await sql`
        INSERT INTO categories (id, name, slug, hsn_code, accent_color, description)
        VALUES (${catId}, ${catName}, ${slug}, ${hsn}, ${accent}, ${desc})
      `;
      console.log(`Created category: ${catName} (${catId})`);
    }
    categoryMap.set(catName, catId);
  }

  // 2. Set up Sub-Categories under "Men's Health & Vitality"
  const mensCatId = categoryMap.get("Men's Health & Vitality")!;
  const subCategoryMap = new Map<string, string>(); // name -> id

  const mensSubCategories = ["Deodorant", "Face Wash", "Shaving Foam", "Shaving Gel"];
  for (const subName of mensSubCategories) {
    const slug = subName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existing = await sql`
      SELECT id FROM sub_categories WHERE name = ${subName} LIMIT 1
    `;

    let subId: string;
    if (existing.length > 0) {
      subId = existing[0].id;
      // Re-point to "Men's Health & Vitality" category_id if needed
      await sql`
        UPDATE sub_categories
        SET category_id = ${mensCatId}, updated_at = now()
        WHERE id = ${subId}
      `;
      console.log(`Updated sub_category: ${subName} -> Men's Health & Vitality (${subId})`);
    } else {
      subId = crypto.randomUUID();
      await sql`
        INSERT INTO sub_categories (id, name, slug, category_id, status)
        VALUES (${subId}, ${subName}, ${slug}, ${mensCatId}, 'active')
      `;
      console.log(`Created sub_category: ${subName} (${subId})`);
    }
    subCategoryMap.set(subName, subId);
  }

  // 3. Migrate and normalize all product category names in `products` and `inventory_products`
  const categoryReplacements: { from: string; toCategory: string; toSubCategory?: string }[] = [
    { from: "Skin Care, Powders & Ointments", toCategory: "Skin Care & Ointments" },
    { from: "Pain Relief & Balms", toCategory: "Pain Relief & Muscle Care" },
    { from: "Energy, Hydration & Supplements", toCategory: "Daily Wellness & Immunity" },
    { from: "First Aid & Antiseptics", toCategory: "Monsoon Health & Antiseptics" },
    { from: "Antacids, Digestion & Laxatives", toCategory: "Diet & Digestive Health" },
    { from: "Baby Care", toCategory: "Baby Care & Infant Nutrition" },
    { from: "Medical Supplies & General", toCategory: "Medical Supplies & Devices" },
    { from: "Personal Care > Men's Care > Deodorant", toCategory: "Men's Health & Vitality", toSubCategory: "Deodorant" },
    { from: "Personal Care > Men's Care > Face Wash", toCategory: "Men's Health & Vitality", toSubCategory: "Face Wash" },
    { from: "Personal Care > Men's Care > Shaving Foam", toCategory: "Men's Health & Vitality", toSubCategory: "Shaving Foam" },
    { from: "Personal Care > Men's Care > Shaving Gel", toCategory: "Men's Health & Vitality", toSubCategory: "Shaving Gel" },
  ];

  for (const rep of categoryReplacements) {
    const targetCatId = categoryMap.get(rep.toCategory) || null;
    const targetSubCatId = rep.toSubCategory ? (subCategoryMap.get(rep.toSubCategory) || null) : null;
    const targetSubCatName = rep.toSubCategory || null;

    console.log(`Migrating products from "${rep.from}" to "${rep.toCategory}" (sub: ${targetSubCatName})...`);

    await sql`
      UPDATE products
      SET
        category_name = ${rep.toCategory},
        category_id = ${targetCatId},
        sub_category_name = ${targetSubCatName},
        sub_category_id = ${targetSubCatId},
        updated_at = now()
      WHERE category_name = ${rep.from}
    `;

    await sql`
      UPDATE inventory_products
      SET
        category_name = ${rep.toCategory},
        category_id = ${targetCatId},
        sub_category_name = ${targetSubCatName},
        sub_category_id = ${targetSubCatId},
        updated_at = now()
      WHERE category_name = ${rep.from}
    `;
  }

  // Also assign category_id for products already having Key Category names (e.g. "Daily Wellness & Immunity")
  for (const [catName, catId] of categoryMap.entries()) {
    await sql`
      UPDATE products
      SET category_id = ${catId}
      WHERE category_name = ${catName} AND (category_id IS NULL OR category_id != ${catId})
    `;
    await sql`
      UPDATE inventory_products
      SET category_id = ${catId}
      WHERE category_name = ${catName} AND (category_id IS NULL OR category_id != ${catId})
    `;
  }

  // 4. Remove any obsolete/similar categories from `categories` table (such as "Men's")
  const keyNames = [...KEY_PRODUCT_CATEGORIES];
  const allExistingCats = await sql`SELECT id, name FROM categories`;
  const obsoleteCats = allExistingCats.filter((c: any) => !keyNames.includes(c.name));

  for (const oldCat of obsoleteCats) {
    console.log(`Removing obsolete category from DB: ${oldCat.name} (${oldCat.id})`);
    // Ensure no subcategories or products are pointing to it before deleting
    await sql`UPDATE sub_categories SET category_id = ${mensCatId} WHERE category_id = ${oldCat.id}`;
    await sql`UPDATE products SET category_id = ${mensCatId} WHERE category_id = ${oldCat.id}`;
    await sql`UPDATE inventory_products SET category_id = ${mensCatId} WHERE category_id = ${oldCat.id}`;
    await sql`DELETE FROM categories WHERE id = ${oldCat.id}`;
  }

  // Verification summary
  console.log("=== Verification ===");
  const finalCats = await sql`SELECT id, name, slug FROM categories ORDER BY name`;
  console.log("Final Categories in DB:", finalCats);

  const finalSubCats = await sql`SELECT id, name, category_id FROM sub_categories ORDER BY name`;
  console.log("Final Sub-Categories in DB:", finalSubCats);

  const finalProdCats = await sql`
    SELECT DISTINCT category_name, sub_category_name, COUNT(*) as count
    FROM products
    GROUP BY category_name, sub_category_name
    ORDER BY category_name, sub_category_name
  `;
  console.log("Final Products Grouped:", finalProdCats);

  console.log("=== Sync Complete! ===");
}

syncKeyCategories()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });

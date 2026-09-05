import { sql } from "./neon";

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  hsn_code: string | null;
  accent_color: string | null;
  description: string | null;
  created_at: string;
}

export interface DbSubCategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<DbCategory[]> {
  try {
    const rows = await sql`SELECT * FROM categories ORDER BY name ASC`;
    return rows as DbCategory[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Fetch sub-categories, optionally filtered by category_id
 */
export async function fetchSubCategories(categoryId?: string): Promise<DbSubCategory[]> {
  try {
    if (categoryId) {
      const rows = await sql`SELECT * FROM sub_categories WHERE category_id = ${categoryId} ORDER BY name ASC`;
      return rows as DbSubCategory[];
    } else {
      const rows = await sql`SELECT * FROM sub_categories ORDER BY name ASC`;
      return rows as DbSubCategory[];
    }
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return [];
  }
}

/**
 * Create a new category
 */
export async function createCategory(name: string): Promise<{ data: DbCategory | null; error: string | null }> {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = crypto.randomUUID();
    const rows = await sql`
      INSERT INTO categories (id, name, slug, hsn_code, accent_color, description)
      VALUES (${id}, ${name}, ${slug}, '3004', '#006a39', '')
      RETURNING *
    `;
    return { data: rows[0] as DbCategory, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to create category" };
  }
}

/**
 * Create a new sub-category
 */
export async function createSubCategory(name: string, categoryId: string): Promise<{ data: DbSubCategory | null; error: string | null }> {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = crypto.randomUUID();

    try {
      // Try with slug column (new schema)
      const rows = await sql`
        INSERT INTO sub_categories (id, name, slug, category_id)
        VALUES (${id}, ${name}, ${slug}, ${categoryId})
        RETURNING *
      `;
      return { data: rows[0] as DbSubCategory, error: null };
    } catch (slugErr: any) {
      // If slug column doesn't exist, try without it (fallback for old schema)
      if (slugErr.message?.includes('slug')) {
        console.warn("⚠️ 'slug' column not found. Inserting without slug column...");
        const rows = await sql`
          INSERT INTO sub_categories (id, name, category_id)
          VALUES (${id}, ${name}, ${categoryId})
          RETURNING *
        `;
        return { data: rows[0] as DbSubCategory, error: null };
      }
      throw slugErr;
    }
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to create sub-category" };
  }
}

/**
 * Delete a category (safely unlinks products and deletes sub-categories)
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Unlink products that were assigned to this category
    await sql`UPDATE products SET category_id = NULL, sub_category_id = NULL WHERE category_id = ${id}`;
    
    // Delete any sub-categories belonging to this category
    await sql`DELETE FROM sub_categories WHERE category_id = ${id}`;
    
    // Delete the category itself
    await sql`DELETE FROM categories WHERE id = ${id}`;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category" };
  }
}

/**
 * Delete a sub-category (safely unlinks products)
 */
export async function deleteSubCategory(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await sql`UPDATE products SET sub_category_id = NULL WHERE sub_category_id = ${id}`;
    await sql`DELETE FROM sub_categories WHERE id = ${id}`;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete sub-category" };
  }
}

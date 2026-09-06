/**
 * Database Migration Script
 * Adds missing `slug` column to sub_categories table
 * Run this once to fix the schema
 */

import { sql } from "./neon";

export async function migrateSubCategoriesAddSlug(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log("🔄 Starting migration: Adding slug column to sub_categories...");

    // Check if slug column already exists
    const checkColumn = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sub_categories' AND column_name = 'slug'
    `;

    if (checkColumn.length > 0) {
      console.log("✅ Column 'slug' already exists in sub_categories table");
      return {
        success: true,
        message: "Column 'slug' already exists. No migration needed.",
      };
    }

    // Add slug column
    await sql`
      ALTER TABLE sub_categories
      ADD COLUMN slug TEXT DEFAULT '';
    `;

    console.log("✅ Added slug column to sub_categories");

    // Generate slugs for existing sub-categories
    const existingSubCats = await sql`SELECT id, name FROM sub_categories`;

    for (const subCat of existingSubCats) {
      const slug = subCat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

      await sql`
        UPDATE sub_categories
        SET slug = ${slug}
        WHERE id = ${subCat.id}
      `;
    }

    console.log(
      `✅ Generated slugs for ${existingSubCats.length} existing sub-categories`
    );

    // Make slug column NOT NULL and add unique constraint
    await sql`
      ALTER TABLE sub_categories
      ALTER COLUMN slug SET NOT NULL;
    `;

    await sql`
      ALTER TABLE sub_categories
      ADD CONSTRAINT unique_slug_per_category
      UNIQUE (category_id, slug);
    `;

    console.log("✅ Added NOT NULL constraint and unique index on slug");

    return {
      success: true,
      message: "Migration completed successfully. Column 'slug' added to sub_categories.",
    };
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    return {
      success: false,
      message: "Migration failed",
      error: error.message,
    };
  }
}

/**
 * Migration: Ensures public.addresses table exists with indexes
 */
export async function migrateCreateAddressesTable(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        label TEXT NOT NULL DEFAULT 'Home',
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        line1 TEXT NOT NULL,
        line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);
    `;

    return {
      success: true,
      message: "Addresses table and indexes verified successfully.",
    };
  } catch (error: any) {
    console.error("Addresses migration error:", error);
    return {
      success: false,
      message: "Addresses migration failed",
      error: error.message,
    };
  }
}

// Run migration on startup
export async function runMigrationsOnStartup(): Promise<void> {
  try {
    const result = await migrateSubCategoriesAddSlug();
    if (!result.success) {
      console.error("Migration warning:", result.error);
    }
  } catch (error) {
    console.error("Failed to run sub-categories migration:", error);
  }

  try {
    const addrResult = await migrateCreateAddressesTable();
    if (!addrResult.success) {
      console.error("Addresses migration warning:", addrResult.error);
    }
  } catch (error) {
    console.error("Failed to run addresses migration:", error);
  }
}

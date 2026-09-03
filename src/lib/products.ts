import { supabase } from "./supabase";
import { sql } from "./neon";

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  hsn_code: string;
  accent_color: string;
  description: string | null;
  created_at: string;
}

export interface DbProduct {
  id: string;
  numeric_id: number;
  name: string;
  subtitle: string | null;
  category_id: string | null;
  category_name: string;
  brand: string;
  sku: string | null;
  hsn: string;
  mrp: number;
  customer_price: number;
  retailer_price: number;
  discount_percent: number;
  stock: number;
  image_url: string;
  web_image_url?: string;
  details: string | null;
  is_flash_sale: boolean;
  is_featured: boolean;
  badges?: any[];
  created_at: string;
  updated_at: string;
}

export interface DbInventoryProduct {
  id: string;
  numeric_id: number;
  product_id?: string | null;
  name: string;
  subtitle?: string | null;
  category_id?: string | null;
  category_name: string;
  brand: string;
  sku?: string | null;
  batch_no?: string | null;
  hsn: string;
  mrp: number;
  customer_price: number;
  retailer_price: number;
  purchase_price?: number;
  discount_percent: number;
  stock: number;
  min_stock_level?: number;
  unit?: string;
  dosage_form?: string;
  strength?: string | null;
  expiry_date?: string | null;
  image_url: string;
  web_image_url?: string;
  gallery_images?: any[];
  details?: string | null;
  description?: string | null;
  is_active?: boolean;
  is_flash_sale?: boolean;
  is_featured?: boolean;
  badges?: any[];
  meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "featured" | "price-asc" | "price-desc" | "discount";
}

/**
 * Fetch all categories from Neon Postgres
 */
export async function fetchCategories(): Promise<DbCategory[]> {
  try {
    const rows = await sql`SELECT * FROM categories ORDER BY name ASC`;
    return rows as DbCategory[];
  } catch (error) {
    console.error("Error fetching categories via sql, attempting fallback:", error);
    try {
      const { data } = await supabase.from("categories").select("*").order("name", { ascending: true });
      return (data || []) as DbCategory[];
    } catch {
      return [];
    }
  }
}

/**
 * Fetch products directly from Neon Postgres authoritative products table
 */
export async function fetchProducts(filters: ProductFilters = {}): Promise<DbProduct[]> {
  try {
    const rows = await sql`SELECT * FROM products ORDER BY numeric_id ASC`;
    let prods: DbProduct[] = (rows as any[]).map((r) => ({
      ...r,
      numeric_id: Number(r.numeric_id) || 0,
      mrp: Number(r.mrp) || 0,
      customer_price: Number(r.customer_price) || 0,
      retailer_price: Number(r.retailer_price) || 0,
      discount_percent: Number(r.discount_percent) || 0,
      stock: Number(r.stock) || 0,
      is_flash_sale: Boolean(r.is_flash_sale),
      is_featured: Boolean(r.is_featured),
    }));

    if (filters.category && filters.category !== "All") {
      const targetCat = filters.category.toLowerCase().trim();
      prods = prods.filter((p) => p.category_name && p.category_name.toLowerCase().trim() === targetCat);
    }

    if (filters.brand && filters.brand.length > 0) {
      prods = prods.filter((p) => filters.brand?.includes(p.brand));
    }

    if (filters.minPrice !== undefined) {
      prods = prods.filter((p) => p.customer_price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== Infinity) {
      prods = prods.filter((p) => p.customer_price <= filters.maxPrice!);
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      prods = prods.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(term)) ||
          (p.details && p.details.toLowerCase().includes(term))
      );
    }

    switch (filters.sortBy) {
      case "price-asc":
        prods.sort((a, b) => a.customer_price - b.customer_price);
        break;
      case "price-desc":
        prods.sort((a, b) => b.customer_price - a.customer_price);
        break;
      case "discount":
        prods.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
        break;
      default:
        prods.sort((a, b) => (a.numeric_id || 0) - (b.numeric_id || 0));
        break;
    }

    return prods;
  } catch (error) {
    console.error("Error fetching products via sql, attempting fallback:", error);
    try {
      const { data, error: supErr } = await supabase.from("products").select("*");
      if (!supErr && data) {
        return (data as any[]).map((r) => ({
          ...r,
          numeric_id: Number(r.numeric_id) || 0,
          mrp: Number(r.mrp) || 0,
          customer_price: Number(r.customer_price) || 0,
          retailer_price: Number(r.retailer_price) || 0,
          discount_percent: Number(r.discount_percent) || 0,
          stock: Number(r.stock) || 0,
        })) as DbProduct[];
      }
    } catch {}
    return [];
  }
}

/**
 * Admin: Add a new product to Supabase in real-time
 */
export async function createProduct(
  product: Omit<DbProduct, "id" | "numeric_id" | "created_at" | "updated_at"> & {
    numeric_id?: number;
    badges?: any[];
  }
): Promise<{ data: DbProduct | null; error: string | null }> {
  try {
    // 0. If image is a base64 data URL, upload to Supabase storage-assets bucket
    let finalImageUrl = product.image_url;
    if (finalImageUrl && finalImageUrl.startsWith("data:")) {
      const { uploadImageToSupabase } = await import("./storage");
      const { url: uploadedUrl, error: uploadErr } = await uploadImageToSupabase(finalImageUrl, "products");
      if (uploadErr) {
        return { data: null, error: uploadErr };
      }
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    // 1. Resolve category_id safely if needed
    let catId = product.category_id;
    if (!catId || catId === "00000000-0000-0000-0000-000000000000") {
      const catRows = await sql`SELECT id FROM categories WHERE name ILIKE ${product.category_name} LIMIT 1`;
      catId = catRows.length > 0 ? catRows[0].id : null;
    }

    // 2. Resolve next numeric_id
    let numId = product.numeric_id;
    if (!numId) {
      const maxProd = await sql`SELECT numeric_id FROM products ORDER BY numeric_id DESC LIMIT 1`;
      numId = maxProd.length > 0 && maxProd[0].numeric_id ? maxProd[0].numeric_id + 1 : Math.floor(1000 + Math.random() * 9000);
    }

    const pName = product.name;
    const pSubtitle = product.subtitle || product.details || null;
    const pCatId = catId;
    const pCatName = product.category_name;
    const pBrand = product.brand;
    const pSku = product.sku || `SKU-${numId}`;
    const pHsn = product.hsn || "3004";
    const pMrp = Number(product.mrp) || 0;
    const pCustPrice = Number(product.customer_price) || 0;
    const pRetPrice = Number(product.retailer_price) || 0;
    const pDisc = Number(product.discount_percent) || 0;
    const pStock = Number(product.stock) || 0;
    const pImage = finalImageUrl || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";
    const pDetails = product.details || null;
    const pFlash = Boolean(product.is_flash_sale);
    const pFeat = Boolean(product.is_featured);
    const pBadges = JSON.stringify(product.badges || []);

    const insertedProd = await sql`
      INSERT INTO products (
        numeric_id, name, subtitle, category_id, category_name, brand, sku, hsn, mrp,
        customer_price, retailer_price, discount_percent, stock, image_url, details,
        is_flash_sale, is_featured, badges, updated_at
      ) VALUES (
        ${numId}, ${pName}, ${pSubtitle}, ${pCatId}, ${pCatName}, ${pBrand}, ${pSku}, ${pHsn}, ${pMrp},
        ${pCustPrice}, ${pRetPrice}, ${pDisc}, ${pStock}, ${pImage}, ${pDetails},
        ${pFlash}, ${pFeat}, ${pBadges}::jsonb, now()
      ) RETURNING *
    `;

    const data = insertedProd[0];

    // Keep public.inventory_products in sync
    try {
      await sql`
        INSERT INTO inventory_products (
          id, numeric_id, product_id, name, subtitle, category_id, category_name, brand, sku, hsn, mrp,
          customer_price, retailer_price, discount_percent, stock, image_url, web_image_url, details,
          is_flash_sale, is_featured, badges, updated_at
        ) VALUES (
          ${data.id}, ${data.numeric_id}, ${data.id}, ${data.name}, ${data.subtitle}, ${data.category_id}, ${data.category_name}, ${data.brand}, ${data.sku}, ${data.hsn}, ${data.mrp},
          ${data.customer_price}, ${data.retailer_price}, ${data.discount_percent}, ${data.stock}, ${data.image_url}, ${data.image_url}, ${data.details},
          ${data.is_flash_sale}, ${data.is_featured}, ${JSON.stringify(data.badges)}::jsonb, now()
        ) ON CONFLICT (id) DO UPDATE SET
          numeric_id = EXCLUDED.numeric_id,
          product_id = EXCLUDED.product_id,
          name = EXCLUDED.name,
          subtitle = EXCLUDED.subtitle,
          category_id = EXCLUDED.category_id,
          category_name = EXCLUDED.category_name,
          brand = EXCLUDED.brand,
          sku = EXCLUDED.sku,
          hsn = EXCLUDED.hsn,
          mrp = EXCLUDED.mrp,
          customer_price = EXCLUDED.customer_price,
          retailer_price = EXCLUDED.retailer_price,
          discount_percent = EXCLUDED.discount_percent,
          stock = EXCLUDED.stock,
          image_url = EXCLUDED.image_url,
          web_image_url = EXCLUDED.web_image_url,
          details = EXCLUDED.details,
          is_flash_sale = EXCLUDED.is_flash_sale,
          is_featured = EXCLUDED.is_featured,
          badges = EXCLUDED.badges,
          updated_at = EXCLUDED.updated_at
      `;
    } catch (invErr) {
      console.warn("Notice: synced inventory_products:", invErr);
    }

    return { data: data as DbProduct, error: null };
  } catch (err: any) {
    console.error("Exception in createProduct:", err);
    return { data: null, error: err?.message || "Failed to create product" };
  }
}

/**
 * Admin: Update existing product details in Supabase in real-time
 */
export async function updateProduct(
  id: string,
  updates: Partial<DbProduct> & { badges?: any[] }
): Promise<{ data: DbProduct | null; error: string | null }> {
  try {
    let finalImageUrl = updates.image_url;
    if (finalImageUrl && finalImageUrl.startsWith("data:")) {
      const { uploadImageToSupabase } = await import("./storage");
      const { url: uploadedUrl, error: uploadErr } = await uploadImageToSupabase(finalImageUrl, "products");
      if (uploadErr) {
        return { data: null, error: uploadErr };
      }
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    const existingRows = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (existingRows.length === 0) return { data: null, error: "Product not found" };
    const existing = existingRows[0];

    let catId = updates.category_id;
    if (catId === "00000000-0000-0000-0000-000000000000") {
      catId = existing.category_id;
    }

    const pName = updates.name !== undefined ? updates.name : existing.name;
    const pSubtitle = updates.subtitle !== undefined ? updates.subtitle : existing.subtitle;
    const pCatId = catId !== undefined ? catId : existing.category_id;
    const pCatName = updates.category_name !== undefined ? updates.category_name : existing.category_name;
    const pBrand = updates.brand !== undefined ? updates.brand : existing.brand;
    const pSku = updates.sku !== undefined ? updates.sku : existing.sku;
    const pHsn = updates.hsn !== undefined ? updates.hsn : existing.hsn;
    const pMrp = updates.mrp !== undefined ? Number(updates.mrp) : existing.mrp;
    const pCustPrice = updates.customer_price !== undefined ? Number(updates.customer_price) : existing.customer_price;
    const pRetPrice = updates.retailer_price !== undefined ? Number(updates.retailer_price) : existing.retailer_price;
    const pDisc = updates.discount_percent !== undefined ? Number(updates.discount_percent) : existing.discount_percent;
    const pStock = updates.stock !== undefined ? Number(updates.stock) : existing.stock;
    const pImage = finalImageUrl !== undefined ? finalImageUrl : existing.image_url;
    const pDetails = updates.details !== undefined ? updates.details : existing.details;
    const pFlash = updates.is_flash_sale !== undefined ? Boolean(updates.is_flash_sale) : existing.is_flash_sale;
    const pFeat = updates.is_featured !== undefined ? Boolean(updates.is_featured) : existing.is_featured;
    const pBadges = JSON.stringify(updates.badges !== undefined ? updates.badges : existing.badges);

    const updatedRows = await sql`
      UPDATE products SET
        name = ${pName},
        subtitle = ${pSubtitle},
        category_id = ${pCatId},
        category_name = ${pCatName},
        brand = ${pBrand},
        sku = ${pSku},
        hsn = ${pHsn},
        mrp = ${pMrp},
        customer_price = ${pCustPrice},
        retailer_price = ${pRetPrice},
        discount_percent = ${pDisc},
        stock = ${pStock},
        image_url = ${pImage},
        details = ${pDetails},
        is_flash_sale = ${pFlash},
        is_featured = ${pFeat},
        badges = ${pBadges}::jsonb,
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedRows.length === 0) return { data: null, error: "Failed to update product" };
    const data = updatedRows[0];

    // Keep public.inventory_products in sync
    try {
      await sql`
        UPDATE inventory_products SET
          name = ${data.name},
          subtitle = ${data.subtitle},
          category_id = ${data.category_id},
          category_name = ${data.category_name},
          brand = ${data.brand},
          sku = ${data.sku},
          hsn = ${data.hsn},
          mrp = ${data.mrp},
          customer_price = ${data.customer_price},
          retailer_price = ${data.retailer_price},
          discount_percent = ${data.discount_percent},
          stock = ${data.stock},
          image_url = ${data.image_url},
          web_image_url = ${data.image_url},
          details = ${data.details},
          is_flash_sale = ${data.is_flash_sale},
          is_featured = ${data.is_featured},
          badges = ${JSON.stringify(data.badges)}::jsonb,
          updated_at = now()
        WHERE id = ${id}
      `;
    } catch {}

    return { data: data as DbProduct, error: null };
  } catch (err: any) {
    console.error("Exception in updateProduct:", err);
    return { data: null, error: err?.message || "Failed to update product" };
  }
}

/**
 * Admin: Delete product
 */
export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  try {
    await sql`DELETE FROM products WHERE id = ${id}`;
  } catch (err: any) {
    return { error: err.message };
  }
  try {
    await sql`DELETE FROM inventory_products WHERE id = ${id}`;
  } catch {}
  return { error: null };
}

/**
 * Admin / Real-time: Update stock for a product
 */
export async function updateProductStock(
  id: string,
  newStock: number
): Promise<{ error: string | null }> {
  const finalStock = Math.max(0, newStock);
  try {
    await sql`UPDATE products SET stock = ${finalStock}, updated_at = now() WHERE id = ${id}`;
  } catch (err: any) {
    return { error: err.message };
  }

  try {
    await sql`UPDATE inventory_products SET stock = ${finalStock}, updated_at = now() WHERE id = ${id}`;
  } catch {}

  return { error: null };
}

/**
 * Fetch dedicated inventory products from public.inventory_products table
 */
export async function fetchInventoryProducts(): Promise<DbInventoryProduct[]> {
  try {
    const { data, error } = await supabase
      .from("inventory_products")
      .select("*")
      .order("numeric_id", { ascending: true });

    if (error || !data) {
      // Fallback to products table
      const fallback = await fetchProducts();
      return fallback as DbInventoryProduct[];
    }
    return data as DbInventoryProduct[];
  } catch {
    const fallback = await fetchProducts();
    return fallback as DbInventoryProduct[];
  }
}

/**
 * Keep products fresh via polling. The Neon Data API doesn't offer realtime
 * subscriptions, so this relies entirely on the visibility/online/interval
 * fallback below (which already did the real work even before this change —
 * the old Supabase-shim "realtime" channel never actually fired).
 */
export function subscribeToProductsRealtime(
  callback: (payload: { eventType: string; new: DbProduct; old: Partial<DbProduct> }) => void
) {
  // When app tab regains focus or comes back online, fetch latest products
  const handleVisibilityOrOnline = () => {
    if (document.visibilityState === "visible" || navigator.onLine) {
      fetchProducts().then((latest) => {
        if (latest && latest.length > 0) {
          latest.forEach((p) => {
            callback({ eventType: "UPDATE", new: p, old: { id: p.id } });
          });
        }
      }).catch((e) => console.warn("Fallback inventory sync warning:", e));
    }
  };

  window.addEventListener("online", handleVisibilityOrOnline);
  document.addEventListener("visibilitychange", handleVisibilityOrOnline);

  // Background fallback poll every 25 seconds to guarantee fresh inventory
  const pollInterval = setInterval(() => {
    if (document.visibilityState === "visible") {
      fetchProducts().then((latest) => {
        if (latest && latest.length > 0) {
          latest.forEach((p) => {
            callback({ eventType: "UPDATE", new: p, old: { id: p.id } });
          });
        }
      }).catch(() => {});
    }
  }, 25000);

  return () => {
    window.removeEventListener("online", handleVisibilityOrOnline);
    document.removeEventListener("visibilitychange", handleVisibilityOrOnline);
    clearInterval(pollInterval);
  };
}

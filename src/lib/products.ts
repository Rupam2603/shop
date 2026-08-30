import { supabase } from "./supabase";

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
  details: string | null;
  is_flash_sale: boolean;
  is_featured: boolean;
  badges?: any[];
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
 * Fetch all categories from Supabase
 */
export async function fetchCategories(): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data as DbCategory[];
}

/**
 * Fetch products from Supabase with optional filters
 */
export async function fetchProducts(filters: ProductFilters = {}): Promise<DbProduct[]> {
  let query = supabase.from("products").select("*");

  if (filters.category && filters.category !== "All") {
    query = query.eq("category_name", filters.category);
  }

  if (filters.brand && filters.brand.length > 0) {
    query = query.in("brand", filters.brand);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte("customer_price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== Infinity) {
    query = query.lte("customer_price", filters.maxPrice);
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},brand.ilike.${term},subtitle.ilike.${term}`);
  }

  switch (filters.sortBy) {
    case "price-asc":
      query = query.order("customer_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("customer_price", { ascending: false });
      break;
    case "discount":
      query = query.order("discount_percent", { ascending: false });
      break;
    default:
      query = query.order("numeric_id", { ascending: true });
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data as DbProduct[];
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
      const { url: uploadedUrl } = await uploadImageToSupabase(finalImageUrl, "products");
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    // 1. Resolve category_id safely if needed
    let catId = product.category_id;
    if (!catId || catId === "00000000-0000-0000-0000-000000000000") {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", product.category_name)
        .maybeSingle();
      catId = cat?.id || null;
    }

    // 2. Resolve next numeric_id
    let numId = product.numeric_id;
    if (!numId) {
      const { data: maxProd } = await supabase
        .from("products")
        .select("numeric_id")
        .order("numeric_id", { ascending: false })
        .limit(1)
        .maybeSingle();
      numId = maxProd && maxProd.numeric_id ? maxProd.numeric_id + 1 : Math.floor(1000 + Math.random() * 9000);
    }

    const payload: any = {
      name: product.name,
      subtitle: product.subtitle || product.details || null,
      category_id: catId,
      category_name: product.category_name,
      brand: product.brand,
      sku: product.sku || `SKU-${numId}`,
      hsn: product.hsn || "3004",
      mrp: Number(product.mrp) || 0,
      customer_price: Number(product.customer_price) || 0,
      retailer_price: Number(product.retailer_price) || 0,
      discount_percent: Number(product.discount_percent) || 0,
      stock: Number(product.stock) || 0,
      image_url: finalImageUrl || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
      details: product.details,
      is_flash_sale: Boolean(product.is_flash_sale),
      is_featured: Boolean(product.is_featured),
      badges: product.badges || [],
      numeric_id: numId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating product in Supabase:", error);
      return { data: null, error: error.message };
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
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    if (payload.category_id === "00000000-0000-0000-0000-000000000000") {
      delete payload.category_id;
    }
    if (payload.image_url && payload.image_url.startsWith("data:")) {
      const { uploadImageToSupabase } = await import("./storage");
      const { url: uploadedUrl } = await uploadImageToSupabase(payload.image_url, "products");
      if (uploadedUrl) {
        payload.image_url = uploadedUrl;
      }
    }
    if (payload.mrp !== undefined) payload.mrp = Number(payload.mrp);
    if (payload.customer_price !== undefined) payload.customer_price = Number(payload.customer_price);
    if (payload.retailer_price !== undefined) payload.retailer_price = Number(payload.retailer_price);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (payload.discount_percent !== undefined) payload.discount_percent = Number(payload.discount_percent);

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product in Supabase:", error);
      return { data: null, error: error.message };
    }
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
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Admin / Real-time: Update stock for a product
 */
export async function updateProductStock(
  id: string,
  newStock: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, newStock) })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Subscribe to real-time changes on the products table with auto-reconnection & fallback
 */
export function subscribeToProductsRealtime(
  callback: (payload: { eventType: string; new: DbProduct; old: Partial<DbProduct> }) => void
) {
  let isSubscribed = false;

  const channel = supabase
    .channel(`realtime-products-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      (payload) => {
        callback(payload as unknown as { eventType: string; new: DbProduct; old: Partial<DbProduct> });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isSubscribed = true;
      }
    });

  // Fallback: When app tab regains focus or comes back online, fetch latest products
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
    supabase.removeChannel(channel);
  };
}

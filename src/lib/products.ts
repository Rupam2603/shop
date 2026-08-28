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
  category_id: string;
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
 * Admin: Add a new product
 */
export async function createProduct(
  product: Omit<DbProduct, "id" | "numeric_id" | "created_at" | "updated_at">
): Promise<{ data: DbProduct | null; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as DbProduct, error: null };
}

/**
 * Admin: Update existing product details
 */
export async function updateProduct(
  id: string,
  updates: Partial<DbProduct>
): Promise<{ data: DbProduct | null; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as DbProduct, error: null };
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

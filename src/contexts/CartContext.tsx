import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { DbProduct, fetchProducts } from "../lib/products";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string; // unique item id
  productId: string; // Supabase product UUID (if known)
  productNumericId: number; // Numeric ID (if known)
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  imageUrl: string;
  quantity: number;
  sku?: string | null;
  retailerPrice?: number;
}

export interface AddToCartPayload {
  id?: string | number;
  dbId?: string;
  numeric_id?: number;
  name: string;
  brand?: string;
  category_name?: string;
  category?: string;
  cat?: string;
  sub?: string;
  customer_price?: number;
  retailer_price?: number;
  price?: string | number;
  mrp?: number;
  orig?: string | number;
  image_url?: string;
  img?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  savings: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: AddToCartPayload, qty?: number) => Promise<void>;
  updateQuantity: (identifier: string | number, qty: number) => Promise<void>;
  removeFromCart: (identifier: string | number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "subhone_cart_v3";

function parseNumericPrice(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Could not load cart from localStorage:", e);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "retailer" | "admin">("customer");

  // Sync to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart to localStorage:", e);
    }
  }, [items]);

  // Load from Supabase on auth change
  const loadCartFromSupabase = useCallback(async (uid: string, role: "customer" | "retailer" | "admin" = "customer") => {
    if (!isUuid(uid)) return;
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity, products(*)")
        .eq("user_id", uid);

      if (error) {
        console.warn("Notice loading cart from Supabase:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const loaded: CartItem[] = data
          .filter((row) => row.products)
          .map((row) => {
            const p = row.products as unknown as DbProduct;
            return {
              id: row.id,
              productId: p.id,
              productNumericId: p.numeric_id,
              name: p.name,
              brand: p.brand || "Generic",
              category: p.category_name || "Medicines",
              price: Number(role === "retailer" ? p.retailer_price : p.customer_price) || 0,
              mrp: Number(p.mrp) || Number(p.customer_price) || 0,
              imageUrl: p.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
              quantity: Math.max(1, row.quantity || 1),
              sku: p.sku || null,
              retailerPrice: Number(p.retailer_price) || 0,
            };
          });

        setItems(loaded);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn("Supabase cart sync error:", err);
    }
  }, []);

  const { appUser } = useAuth();

  useEffect(() => {
    if (appUser?.authUser?.id) {
      const role = appUser.profile?.role || appUser.authUser.user_metadata?.role || "customer";
      setUserId(appUser.authUser.id);
      setUserRole(role as "customer" | "retailer" | "admin");
      loadCartFromSupabase(appUser.authUser.id, role as "customer" | "retailer" | "admin");
    } else {
      setUserId(null);
      setUserRole("customer");
      setItems([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  }, [appUser?.authUser?.id, appUser?.profile?.role, loadCartFromSupabase]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addToCart = useCallback(
    async (product: AddToCartPayload, qty = 1) => {
      const quantityToAdd = Math.max(1, qty);
      const name = (product.name || "Product").trim();
      const numId =
        typeof product.numeric_id === "number"
          ? product.numeric_id
          : typeof product.id === "number"
          ? product.id
          : typeof product.id === "string" && !isNaN(parseInt(product.id))
          ? parseInt(product.id)
          : 0;

      const price = parseNumericPrice(
        userRole === "retailer"
          ? (product.retailer_price ?? product.customer_price ?? product.price)
          : (product.customer_price ?? product.price),
        100
      );
      const mrp = parseNumericPrice(
        product.mrp ?? product.orig,
        price
      );
      const brand = product.brand || "SubhOne Health";
      const category = product.category || product.category_name || product.cat || "Medicines";
      const imageUrl =
        product.image_url ||
        product.img ||
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";

      const rawUuid =
        product.dbId ||
        (typeof product.id === "string" && isUuid(product.id) ? product.id : "");

      let isNew = false;

      setItems((prev) => {
        const idx = prev.findIndex(
          (item) =>
            (rawUuid && item.productId === rawUuid) ||
            (numId > 0 && item.productNumericId === numId) ||
            item.name.toLowerCase() === name.toLowerCase()
        );

        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + quantityToAdd,
          };
          return updated;
        }

        isNew = true;
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          productId: rawUuid,
          productNumericId: numId,
          name,
          brand,
          category,
          price,
          mrp,
          imageUrl,
          quantity: quantityToAdd,
          sku: (product as any).sku || null,
          retailerPrice: parseNumericPrice((product as any).retailer_price, price),
        };
        return [...prev, newItem];
      });

      if (isNew) {
        setIsCartOpen(true);
      }

      // Background sync to Supabase if UUID user
      if (userId && isUuid(userId)) {
        try {
          let targetUuid = rawUuid;
          if (!targetUuid) {
            const all = await fetchProducts();
            const found = all.find((p) => (numId > 0 && p.numeric_id === numId) || p.name.toLowerCase() === name.toLowerCase());
            if (found) targetUuid = found.id;
          }

          if (targetUuid) {
            const { data: existing } = await supabase
              .from("cart_items")
              .select("id, quantity")
              .eq("user_id", userId)
              .eq("product_id", targetUuid)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + quantityToAdd })
                .eq("id", existing.id);
            } else {
              await supabase
                .from("cart_items")
                .insert([{ user_id: userId, product_id: targetUuid, quantity: quantityToAdd }]);
            }
          }
        } catch (e) {
          console.warn("Notice syncing cart item to Supabase:", e);
        }
      }
    },
    [userId]
  );

  const updateQuantity = useCallback(
    async (identifier: string | number, qty: number) => {
      if (qty <= 0) {
        removeFromCart(identifier);
        return;
      }

      let matchedProductId: string | null = null;

      setItems((prev) =>
        prev.map((item) => {
          const isMatch =
            item.id === identifier ||
            item.productId === identifier ||
            item.productNumericId === identifier ||
            item.name.toLowerCase() === String(identifier).toLowerCase();

          if (isMatch) {
            if (item.productId) matchedProductId = item.productId;
            return { ...item, quantity: qty };
          }
          return item;
        })
      );

      if (userId && isUuid(userId) && matchedProductId) {
        try {
          await supabase
            .from("cart_items")
            .update({ quantity: qty })
            .eq("user_id", userId)
            .eq("product_id", matchedProductId);
        } catch {}
      }
    },
    [userId]
  );

  const removeFromCart = useCallback(
    async (identifier: string | number) => {
      let matchedProductId: string | null = null;

      setItems((prev) => {
        const found = prev.find(
          (item) =>
            item.id === identifier ||
            item.productId === identifier ||
            item.productNumericId === identifier ||
            item.name.toLowerCase() === String(identifier).toLowerCase()
        );
        if (found?.productId) matchedProductId = found.productId;

        return prev.filter(
          (item) =>
            item.id !== identifier &&
            item.productId !== identifier &&
            item.productNumericId !== identifier &&
            item.name.toLowerCase() !== String(identifier).toLowerCase()
        );
      });

      if (userId && isUuid(userId) && matchedProductId) {
        try {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId)
            .eq("product_id", matchedProductId);
        } catch {}
      }
    },
    [userId]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (userId && isUuid(userId)) {
      try {
        await supabase.from("cart_items").delete().eq("user_id", userId);
      } catch {}
    }
  }, [userId]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0),
    [items]
  );

  const savings = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Math.max(0, (item.mrp || item.price) - item.price) * (item.quantity || 0),
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        savings,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return context;
}

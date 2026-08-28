import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { DbProduct, fetchProducts } from "../lib/products";

export interface CartItem {
  id: string; // cart_item db id or temp local id
  productId: string;
  productNumericId: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  imageUrl: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  savings: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (
    product: {
      id?: string | number;
      numeric_id?: number;
      name: string;
      brand: string;
      category_name?: string;
      cat?: string;
      sub?: string;
      customer_price?: number;
      price?: string | number;
      mrp?: number;
      orig?: string | number;
      image_url?: string;
      img?: string;
    },
    qty?: number
  ) => Promise<void>;
  updateQuantity: (productId: string | number, qty: number) => Promise<void>;
  removeFromCart: (productId: string | number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Sync with Supabase on auth state change
  const loadCartFromDb = useCallback(async (uid: string) => {
    const { data: cartData, error: cartError } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(*)")
      .eq("user_id", uid);

    if (cartError) {
      console.error("Error loading cart:", cartError.message);
      return;
    }

    if (cartData) {
      const loaded: CartItem[] = cartData
        .filter((row) => row.products)
        .map((row) => {
          const p = row.products as unknown as DbProduct;
          return {
            id: row.id,
            productId: p.id,
            productNumericId: p.numeric_id,
            name: p.name,
            brand: p.brand,
            category: p.category_name,
            price: Number(p.customer_price),
            mrp: Number(p.mrp),
            imageUrl: p.image_url,
            quantity: row.quantity,
          };
        });
      setItems(loaded);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadCartFromDb(user.id);
      } else {
        setUserId(null);
        setItems([]);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadCartFromDb(session.user.id);
      } else {
        setUserId(null);
        setItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCartFromDb]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = useCallback(
    async (
      product: {
        id?: string | number;
        numeric_id?: number;
        name: string;
        brand: string;
        category_name?: string;
        cat?: string;
        customer_price?: number;
        price?: string | number;
        mrp?: number;
        orig?: string | number;
        image_url?: string;
        img?: string;
      },
      qty = 1
    ) => {
      const numId =
        typeof product.id === "number"
          ? product.id
          : product.numeric_id ?? (typeof product.id === "string" ? parseInt(product.id) || 1 : 1);

      const priceVal =
        product.customer_price ??
        (typeof product.price === "string"
          ? parseFloat(product.price.replace(/[₹,]/g, "")) || 0
          : product.price || 0);

      const mrpVal =
        product.mrp ??
        (typeof product.orig === "string"
          ? parseFloat(product.orig.replace(/[₹,]/g, "")) || priceVal
          : product.orig || priceVal);

      const prodName = product.name;
      const prodBrand = product.brand || "Generic";
      const prodCat = product.category_name || product.cat || "OTC & Wellness";
      const prodImg =
        product.image_url ||
        product.img ||
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";

      // Optimistic update
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.productNumericId === numId || item.name === prodName
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].quantity += qty;
          return updated;
        }
        return [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            productId: typeof product.id === "string" && product.id.includes("-") ? product.id : "",
            productNumericId: numId,
            name: prodName,
            brand: prodBrand,
            category: prodCat,
            price: priceVal,
            mrp: mrpVal,
            imageUrl: prodImg,
            quantity: qty,
          },
        ];
      });

      setIsCartOpen(true);

      // Persist to Supabase if logged in
      if (userId) {
        // Resolve db product UUID if not already known
        let targetUuid = typeof product.id === "string" && product.id.includes("-") ? product.id : "";
        if (!targetUuid) {
          const allProds = await fetchProducts();
          const match = allProds.find((p) => p.numeric_id === numId || p.name === prodName);
          if (match) targetUuid = match.id;
        }

        if (targetUuid) {
          const { data: existingItem } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", userId)
            .eq("product_id", targetUuid)
            .maybeSingle();

          if (existingItem) {
            await supabase
              .from("cart_items")
              .update({ quantity: existingItem.quantity + qty })
              .eq("id", existingItem.id);
          } else {
            await supabase
              .from("cart_items")
              .insert([{ user_id: userId, product_id: targetUuid, quantity: qty }]);
          }
        }
      }
    },
    [userId]
  );

  const updateQuantity = useCallback(
    async (productId: string | number, qty: number) => {
      if (qty <= 0) {
        removeFromCart(productId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.productId === productId || item.productNumericId === productId) {
            return { ...item, quantity: qty };
          }
          return item;
        })
      );

      if (userId) {
        const item = items.find(
          (i) => i.productId === productId || i.productNumericId === productId
        );
        if (item?.productId) {
          await supabase
            .from("cart_items")
            .update({ quantity: qty })
            .eq("user_id", userId)
            .eq("product_id", item.productId);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, items]
  );

  const removeFromCart = useCallback(
    async (productId: string | number) => {
      const itemToRemove = items.find(
        (i) => i.productId === productId || i.productNumericId === productId
      );

      setItems((prev) =>
        prev.filter((i) => i.productId !== productId && i.productNumericId !== productId)
      );

      if (userId && itemToRemove?.productId) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", itemToRemove.productId);
      }
    },
    [userId, items]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    }
  }, [userId]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const savings = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Math.max(0, item.mrp - item.price) * item.quantity,
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

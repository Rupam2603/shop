import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";

interface CartDrawerProps {
  onCheckout: () => void;
  onBrowse: () => void;
}

export default function CartDrawer({ onCheckout, onBrowse }: CartDrawerProps) {
  const {
    items,
    itemCount,
    subtotal,
    savings,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const { appUser } = useAuth();
  const isRetailer = appUser?.profile?.role === "retailer";
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);

  // Listen for Escape key to close cart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Fetch real-time products to check live stock
  useEffect(() => {
    let mounted = true;
    fetchProducts().then((prods) => {
      if (mounted && prods) {
        setDbProducts(prods);
      }
    });

    const unsubscribe = subscribeToProductsRealtime((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        setDbProducts((prev) =>
          prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
        );
      } else if (payload.eventType === "INSERT" && payload.new) {
        setDbProducts((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === "DELETE" && payload.old) {
        setDbProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (!isCartOpen) return null;

  // Helper to match live stock
  const getLiveStock = (item: typeof items[0]): number => {
    const matched = dbProducts.find(
      (p) =>
        (item.productId && p.id === item.productId) ||
        (item.productNumericId && p.numeric_id === item.productNumericId) ||
        p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    return matched ? matched.stock : 50;
  };

  const hasOutOfStockItems = items.some((item) => getLiveStock(item) <= 0);
  const hasExceededStockItems = items.some((item) => item.quantity > getLiveStock(item));

  const FREE_DELIVERY_THRESHOLD = 150;
  const isFreeDelivery = isRetailer || subtotal >= FREE_DELIVERY_THRESHOLD;
  const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : 40;
  const totalAmount = subtotal + deliveryFee;

  const handleProceedToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeCart();
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-10">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl border-l border-white/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-[#e4ede2]/80 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg sm:text-xl">
                Your Shopping Cart
              </h2>
              <span className="bg-emerald-100/90 text-[#006a39] text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="w-9 h-9 rounded-2xl bg-white/80 border border-[#dce7db] flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] transition-colors cursor-pointer shadow-xs"
              aria-label="Close cart"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1L11 11M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Free Delivery Bar */}
          {items.length > 0 && (
            <div className="bg-[#f0fdf4] border-b border-[#bbf7d0] px-5 py-2.5">
              {isRetailer ? (
                <p className="text-xs text-[#047857] font-semibold flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 0C3.13 0 0 3.13 0 7C0 10.87 3.13 14 7 14C10.87 14 14 10.87 14 7C14 3.13 10.87 0 7 0ZM5.6 10.5L2.1 7L3.08 6.02L5.6 8.54L10.92 3.22L11.9 4.2L5.6 10.5Z"
                      fill="#047857"
                    />
                  </svg>
                  <span>
                    ✨ <strong>Retailer Benefit:</strong> FREE Delivery on every order!
                  </span>
                </p>
              ) : isFreeDelivery ? (
                <p className="text-xs text-[#047857] font-semibold flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 0C3.13 0 0 3.13 0 7C0 10.87 3.13 14 7 14C10.87 14 14 10.87 14 7C14 3.13 10.87 0 7 0ZM5.6 10.5L2.1 7L3.08 6.02L5.6 8.54L10.92 3.22L11.9 4.2L5.6 10.5Z"
                      fill="#047857"
                    />
                  </svg>
                  <span>
                    You unlocked <strong>FREE Delivery</strong> on this order!
                  </span>
                </p>
              ) : (
                <div>
                  <p className="text-xs text-[#073b4c] mb-1.5">
                    Add <strong className="text-[#006a39]">₹{amountNeeded}</strong> more for{" "}
                    <strong>FREE Delivery</strong> (orders above ₹150)
                  </p>
                  <div className="w-full h-1.5 bg-[#e4ede2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#006a39] rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#f0f4f0]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#006a39] mb-4">
                  <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M1 1H3L3.4 3M5 11H17L19 3H3.4M5 11L3.4 3M5 11L2.7 14.3C2.31 14.87 2.72 15.67 3.4 15.67H17M17 15.67C16.07 15.67 15.33 16.41 15.33 17.33C15.33 18.26 16.07 19 17 19C17.93 19 18.67 18.26 18.67 17.33C18.67 16.41 17.93 15.67 17 15.67ZM7.67 17.33C7.67 18.26 6.93 19 6 19C5.07 19 4.33 18.26 4.33 17.33C4.33 16.41 5.07 15.67 6 15.67C6.93 15.67 7.67 16.41 7.67 17.33Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg mb-1">
                  Your cart is empty
                </h3>
                <p className="text-[#9aa89b] text-xs max-w-xs mb-6">
                  Explore thousands of genuine medicines, healthcare supplements, and wellness items.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    onBrowse();
                  }}
                  className="bg-[#006a39] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#005a30] transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const liveStock = getLiveStock(item);
                const isOutOfStock = liveStock <= 0;
                const isExceeded = item.quantity > liveStock;

                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5 items-center">
                    <div className="w-16 h-16 rounded-xl bg-[#f8fafb] border border-[#e4ede2] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xs leading-snug line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-[#9aa89b]">{item.brand}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#c0392b] hover:text-[#ba1a1a] p-1 -mr-1 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Stock Warnings */}
                      {isOutOfStock ? (
                        <p className="text-[10px] text-red-600 font-bold mt-0.5">
                          ⚠️ Out of stock — Please remove
                        </p>
                      ) : isExceeded ? (
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                          ⚠️ Only {liveStock} units available
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-[10px] text-[#9aa89b] line-through">
                              ₹{item.mrp * item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-[#e4ede2] rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] font-bold text-xs transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-[#073b4c]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= liveStock}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={`w-7 h-7 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                              item.quantity >= liveStock
                                ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                                : "text-[#073b4c] hover:bg-[#f0f4f0]"
                            }`}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="border-t border-[#e4ede2] p-5 bg-[#f8fafb] flex flex-col gap-3">
              {hasOutOfStockItems && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Your cart contains out-of-stock items. Please remove them to proceed.</span>
                </div>
              )}

              {hasExceededStockItems && !hasOutOfStockItems && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Quantity exceeds available stock for some items. Please reduce before checking out.</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-xs text-[#6d7a6f]">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-extrabold text-[#073b4c]">₹{subtotal}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-[#006a39] font-bold">
                    <span>Total Savings</span>
                    <span>- ₹{savings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {isFreeDelivery ? (
                      <strong className="text-[#006a39] uppercase font-black">Free</strong>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="border-t border-[#e4ede2] pt-2.5 mt-1 flex justify-between text-sm font-['Manrope',sans-serif] font-black text-[#073b4c]">
                  <span>To Pay</span>
                  <span className="text-lg text-[#006a39]">₹{totalAmount}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={hasOutOfStockItems || hasExceededStockItems}
                onClick={handleProceedToCheckout}
                className={`w-full py-4 font-['Manrope',sans-serif] font-black text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border ${
                  hasOutOfStockItems || hasExceededStockItems
                    ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#006a39] to-[#008749] text-white border-white/30 hover:opacity-95 shadow-emerald-950/20 active:scale-[0.98]"
                }`}
              >
                <span>{hasOutOfStockItems ? "Remove Out of Stock Items" : "Proceed to Checkout"}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useModalBackHandler } from "../lib/navigation";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";

interface CartDrawerProps {
  onCheckout: () => void;
  onBrowse: () => void;
}

export default function CartDrawer({ onCheckout, onBrowse }: CartDrawerProps) {
  const { items, itemCount, subtotal, savings, isCartOpen, closeCart, updateQuantity, removeFromCart } =
    useCart();
  const { appUser } = useAuth();
  const isRetailer = appUser?.role === "retailer";
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);

  useModalBackHandler(isCartOpen, closeCart, "cart");

  useEffect(() => {
    let mounted = true;
    fetchProducts().then((prods) => {
      if (mounted && prods) {
        setDbProducts(prods);
      }
    });

    const unsubscribe = subscribeToProductsRealtime((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        setDbProducts((prev) => prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)));
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
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // Helper to find live stock of a cart item
  const getLiveStock = (item: typeof items[0]): number => {
    const matched = dbProducts.find(
      (p) =>
        p.id === item.productId ||
        p.numeric_id === item.productNumericId ||
        p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );
    return matched ? matched.stock : 50; // fallback to 50 if db product not loaded yet
  };

  const hasOutOfStockItems = items.some((item) => getLiveStock(item) <= 0);
  const hasExceededStockItems = items.some((item) => item.quantity > getLiveStock(item));

  const FREE_DELIVERY_THRESHOLD = 150;
  const isFreeDelivery = isRetailer || subtotal >= FREE_DELIVERY_THRESHOLD;
  const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : 40;
  const totalAmount = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#e4ede2] flex items-center justify-between bg-[#f8fafb]">
            <div className="flex items-center gap-2">
              <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">
                Your Shopping Cart
              </h2>
              <span className="bg-[#e8f5ee] text-[#006a39] text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-full bg-white border border-[#e4ede2] flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] transition-colors"
              aria-label="Close cart"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Free Delivery Bar */}
          {items.length > 0 && (
            <div className="bg-[#f0fdf4] border-b border-[#bbf7d0] px-5 py-2.5">
              {isRetailer ? (
                <p className="text-xs text-[#047857] font-semibold flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 0C3.13 0 0 3.13 0 7C0 10.87 3.13 14 7 14C10.87 14 14 10.87 14 7C14 3.13 10.87 0 7 0ZM5.6 10.5L2.1 7L3.08 6.02L5.6 8.54L10.92 3.22L11.9 4.2L5.6 10.5Z" fill="#047857" />
                  </svg>
                  <span>✨ <strong>Retailer Benefit:</strong> FREE Delivery on every order!</span>
                </p>
              ) : isFreeDelivery ? (
                <p className="text-xs text-[#047857] font-semibold flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 0C3.13 0 0 3.13 0 7C0 10.87 3.13 14 7 14C10.87 14 14 10.87 14 7C14 3.13 10.87 0 7 0ZM5.6 10.5L2.1 7L3.08 6.02L5.6 8.54L10.92 3.22L11.9 4.2L5.6 10.5Z" fill="#047857" />
                  </svg>
                  You unlocked <strong>FREE Delivery</strong> on this order!
                </p>
              ) : (
                <div>
                  <p className="text-xs text-[#073b4c] mb-1.5">
                    Add <strong className="text-[#006a39]">₹{amountNeeded}</strong> more for <strong>FREE Delivery</strong> (orders above ₹150)
                  </p>
                  <div className="w-full h-1.5 bg-[#e4ede2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#006a39] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
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
                  onClick={() => {
                    closeCart();
                    onBrowse();
                  }}
                  className="bg-[#006a39] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#005a30] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const stock = getLiveStock(item);
                const isOutOfStock = stock <= 0;
                const isOverStock = item.quantity > stock && stock > 0;
                const isLow = stock > 0 && stock <= 5;

                return (
                  <div key={item.productId || item.name} className={`py-4 first:pt-0 last:pb-0 flex gap-3 ${isOutOfStock ? "opacity-75" : ""}`}>
                    <div className="w-16 h-16 bg-[#f8fafb] border border-[#e4ede2] rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 relative">
                      <img src={item.imageUrl} alt={item.name} className="h-full max-w-full object-contain" />
                      {isOutOfStock && (
                        <span className="absolute inset-0 bg-red-900/60 flex items-center justify-center text-white text-[9px] font-extrabold uppercase text-center p-1 leading-tight">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#006a39] block">
                            {item.brand}
                          </span>
                          <h4 className="font-bold text-[#073b4c] text-xs leading-snug line-clamp-1">
                            {item.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId || item.productNumericId)}
                          className="text-[#9aa89b] hover:text-[#c0392b] transition-colors p-1"
                          title="Remove"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 3.5H12M4.5 3.5V2C4.5 1.7 4.7 1.5 5 1.5H9C9.3 1.5 9.5 1.7 9.5 2V3.5M5.5 6V10.5M8.5 6V10.5M3 3.5L3.7 12C3.7 12.3 4 12.5 4.3 12.5H9.7C10 12.5 10.3 12.3 10.3 12L11 3.5H3Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Stock Warning Messages in Cart */}
                      <div className="my-1">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded inline-block">
                            🔴 Out of Stock - Please remove to checkout
                          </span>
                        ) : isOverStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block">
                            ⚠️ Only {stock} units available in stock
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-medium text-amber-600 inline-block">
                            ⚠️ Only {stock} units left in stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600 inline-block">
                            🟢 {stock} in stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center border border-[#e4ede2] rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(item.productId || item.productNumericId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] transition-colors font-bold text-xs"
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-[#073b4c]">
                            {item.quantity}
                          </span>
                          <button
                            disabled={isOutOfStock || item.quantity >= stock}
                            onClick={() => updateQuantity(item.productId || item.productNumericId, item.quantity + 1)}
                            className={`w-6 h-6 flex items-center justify-center text-[#073b4c] transition-colors font-bold text-xs ${
                              isOutOfStock || item.quantity >= stock
                                ? "opacity-30 cursor-not-allowed bg-gray-100"
                                : "hover:bg-[#f0f4f0]"
                            }`}
                            title={item.quantity >= stock ? `Max available stock reached (${stock})` : "Add one"}
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-[10px] text-[#9aa89b] line-through block">
                              ₹{item.mrp * item.quantity}
                            </span>
                          )}
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
                  <span className="font-semibold text-[#073b4c]">₹{subtotal}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-[#047857]">
                    <span>Total Savings</span>
                    <span className="font-semibold">- ₹{savings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{isFreeDelivery ? <strong className="text-[#047857] uppercase">Free</strong> : `₹${deliveryFee}`}</span>
                </div>
                <div className="border-t border-[#e4ede2] pt-2 mt-1 flex justify-between text-sm font-['Manrope',sans-serif] font-bold text-[#073b4c]">
                  <span>To Pay</span>
                  <span className="text-base text-[#006a39]">₹{totalAmount}</span>
                </div>
              </div>

              <button
                disabled={hasOutOfStockItems || hasExceededStockItems}
                onClick={() => {
                  closeCart();
                  onCheckout();
                }}
                className={`w-full py-3 font-['Manrope',sans-serif] font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  hasOutOfStockItems || hasExceededStockItems
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                    : "bg-[#006a39] text-white hover:bg-[#005a30] active:scale-[0.98]"
                }`}
              >
                <span>{hasOutOfStockItems ? "Remove Out of Stock Items" : "Proceed to Checkout"}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


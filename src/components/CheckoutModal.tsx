import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { fetchUserAddresses, DbAddress, createAddress } from "../lib/addresses";
import { placeOrder } from "../lib/orders";
import { useModalBackHandler } from "../lib/navigation";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
  user: { name: string; email: string; phone?: string };
}

export default function CheckoutModal({
  open,
  onClose,
  onOrderSuccess,
  user,
}: CheckoutModalProps) {
  useModalBackHandler(open, onClose, "checkout");

  const { items, subtotal, savings, clearCart } = useCart();
  const { appUser } = useAuth();
  const isRetailer = appUser?.profile?.role === "retailer";
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Card" | "COD">("UPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState<{ id: string; orderNumber: string } | null>(null);

  // New address form state
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    name: user.name || "",
    phone: user.phone || "",
    line1: "",
    line2: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  });

  useEffect(() => {
    if (open) {
      setError("");
      setOrderPlaced(null);
      fetchUserAddresses().then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.is_default) || data[0];
        if (def) {
          setSelectedAddrId(def.id);
          setShowNewAddr(false);
        } else {
          setShowNewAddr(true);
        }
      });
    }
  }, [open, user]);

  if (!open) return null;

  const FREE_DELIVERY_THRESHOLD = 150;
  const deliveryFee = isRetailer || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 40;
  const finalTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    setError("");
    let shippingAddress: Partial<DbAddress> | undefined;

    if (showNewAddr) {
      if (!newAddr.name.trim() || !newAddr.phone.trim() || !newAddr.line1.trim() || !newAddr.city.trim() || !newAddr.pincode.trim()) {
        setError("Please complete all required fields for your delivery address.");
        return;
      }
      setLoading(true);
      const { data: savedAddr, error: addrErr } = await createAddress({
        label: newAddr.label,
        name: newAddr.name,
        phone: newAddr.phone,
        line1: newAddr.line1,
        line2: newAddr.line2 || null,
        city: newAddr.city,
        state: newAddr.state,
        pincode: newAddr.pincode,
        is_default: addresses.length === 0,
      });
      if (addrErr || !savedAddr) {
        setError(addrErr || "Failed to save address");
        setLoading(false);
        return;
      }
      shippingAddress = savedAddr;
    } else {
      shippingAddress = addresses.find((a) => a.id === selectedAddrId);
      if (!shippingAddress) {
        setError("Please select a delivery address.");
        return;
      }
    }

    setLoading(true);
    const { data: order, error: orderErr } = await placeOrder({
      customerName: shippingAddress.name || user.name,
      customerPhone: shippingAddress.phone || user.phone || "",
      shippingAddress,
      items,
      totalAmount: finalTotal,
      paymentMethod,
    });
    setLoading(false);

    if (orderErr || !order) {
      setError(orderErr || "Failed to place order. Please try again.");
      return;
    }

    clearCart();
    setOrderPlaced({ id: order.id, orderNumber: order.order_number });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e4ede2] flex items-center justify-between bg-[#f8fafb]">
          <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">
            {orderPlaced ? "Order Confirmed!" : "Checkout"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#e4ede2] flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {orderPlaced ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#d1fae5] flex items-center justify-center text-[#047857] mb-4">
              <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor" />
              </svg>
            </div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl mb-1">
              Thank you for your order!
            </h3>
            <p className="text-sm font-semibold text-[#006a39] mb-4">
              Order ID: #{orderPlaced.orderNumber}
            </p>
            <p className="text-xs text-[#6d7a6f] max-w-sm mb-6 leading-relaxed">
              We&apos;ve received your order and our pharmacy partner is preparing your items. You will receive real-time delivery notifications.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  onClose();
                  onOrderSuccess(orderPlaced.id);
                }}
                className="flex-1 py-3 bg-[#006a39] text-white font-bold text-sm rounded-xl hover:bg-[#005a30] transition-colors"
              >
                View Order History
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-[#d5dcd3] text-[#073b4c] font-bold text-sm rounded-xl hover:bg-[#f0f4f0] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
            {/* Delivery Address Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#006a39] text-white text-xs flex items-center justify-center font-bold">1</span>
                  Delivery Address
                </h3>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowNewAddr(!showNewAddr)}
                    className="text-xs font-bold text-[#006a39] hover:underline"
                  >
                    {showNewAddr ? "Choose Saved" : "+ Add New"}
                  </button>
                )}
              </div>

              {!showNewAddr && addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddrId(addr.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddrId === addr.id
                          ? "border-[#006a39] bg-[#f0fdf4]"
                          : "border-[#e4ede2] bg-white hover:border-[#bbf7d0]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#e8f5ee] text-[#006a39]">
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="text-[9px] text-[#047857] font-semibold">Default</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#073b4c]">{addr.name}</p>
                      <p className="text-[11px] text-[#6d7a6f] line-clamp-2 mt-0.5">
                        {addr.line1}, {addr.city} - {addr.pincode}
                      </p>
                      <p className="text-[10px] text-[#9aa89b] mt-1">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#f8fafb] border border-[#e4ede2] rounded-xl p-4 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase block mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        value={newAddr.name}
                        onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                        className="w-full bg-white border border-[#d5dcd3] rounded-lg px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/[^0-9+]/g, "") })}
                        className="w-full bg-white border border-[#d5dcd3] rounded-lg px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                        placeholder="9876543210 (10-digit number)"
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#073b4c] uppercase block mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className="w-full bg-white border border-[#d5dcd3] rounded-lg px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      placeholder="Flat, Building, Street"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase block mb-1">City *</label>
                      <input
                        type="text"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full bg-white border border-[#d5dcd3] rounded-lg px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase block mb-1">State *</label>
                      <input
                        type="text"
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full bg-white border border-[#d5dcd3] rounded-lg px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase block mb-1">Pincode *</label>
                      <input
                        type="text"
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        className="w-full bg-white border border-[#d5dcd3] rounded-lg px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-[#006a39] text-white text-xs flex items-center justify-center font-bold">2</span>
                Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "UPI" as const, label: "UPI / QR", sub: "GPay, PhonePe, Paytm" },
                  { id: "Card" as const, label: "Debit/Credit", sub: "Visa, MC, RuPay" },
                  { id: "COD" as const, label: "Cash on Delivery", sub: "Pay at Doorstep" },
                ].map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      paymentMethod === pm.id
                        ? "border-[#006a39] bg-[#f0fdf4]"
                        : "border-[#e4ede2] bg-white hover:border-[#bbf7d0]"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#073b4c]">{pm.label}</p>
                    <p className="text-[9px] text-[#9aa89b] mt-0.5">{pm.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items & Price Summary */}
            <div className="bg-[#f8fafb] border border-[#e4ede2] rounded-xl p-4">
              <h4 className="text-xs font-bold text-[#073b4c] mb-2">Order Summary ({items.length} items)</h4>
              <div className="flex flex-col gap-1 text-xs text-[#6d7a6f]">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-[#073b4c]">₹{subtotal}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-[#047857]">
                    <span>Discount Savings</span>
                    <span>- ₹{savings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>{deliveryFee === 0 ? <strong className="text-[#047857]">FREE</strong> : `₹${deliveryFee}`}</span>
                </div>
                <div className="border-t border-[#e4ede2] pt-2 mt-1 flex justify-between text-sm font-['Manrope',sans-serif] font-extrabold text-[#073b4c]">
                  <span>Total Amount</span>
                  <span className="text-base text-[#006a39]">₹{finalTotal}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#fff0ee] border border-[#ffd5cf] text-xs text-[#c0392b]">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3.5 bg-[#006a39] text-white font-['Manrope',sans-serif] font-bold text-sm rounded-xl hover:bg-[#005a30] transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? "Placing Order…" : `Place Order (₹${finalTotal})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

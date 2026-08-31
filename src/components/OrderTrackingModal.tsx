import React, { useState, useEffect, useMemo } from "react";
import { DbOrder, fetchUserOrders, fetchOrderByNumber, subscribeToUserOrdersRealtime, subscribeToOrdersRealtime } from "../lib/orders";
import { printOrDownloadInvoice, downloadInvoiceFile, InvoiceOrderData } from "../lib/invoiceGenerator";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string | null;
  userRole?: "retailer" | "customer" | "admin";
  userPhone?: string;
  userName?: string;
}

export default function OrderTrackingModal({
  isOpen,
  onClose,
  initialOrderNumber,
  userRole = "customer",
  userPhone,
  userName,
}: Props) {
  const [searchInput, setSearchInput] = useState(initialOrderNumber || "");
  const [userOrders, setUserOrders] = useState<DbOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DbOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [livePulse, setLivePulse] = useState(true);

  // Load user orders and initial order on open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setNotFound(false);

    fetchUserOrders().then((orders) => {
      if (!mounted) return;
      setUserOrders(orders);

      if (initialOrderNumber) {
        const found = orders.find(
          (o) => o.order_number.toLowerCase() === initialOrderNumber.toLowerCase() || o.id === initialOrderNumber
        );
        if (found) {
          setActiveOrder(found);
          setSearchInput(found.order_number);
          setLoading(false);
        } else {
          // Fetch from Supabase directly
          fetchOrderByNumber(initialOrderNumber).then((single) => {
            if (!mounted) return;
            if (single) {
              setActiveOrder(single);
              setSearchInput(single.order_number);
            } else {
              setNotFound(true);
            }
            setLoading(false);
          });
        }
      } else if (orders.length > 0) {
        setActiveOrder(orders[0]);
        setSearchInput(orders[0].order_number);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to realtime changes
    const unsub = subscribeToOrdersRealtime(() => {
      // Re-fetch active order and orders list
      fetchUserOrders().then((updatedList) => {
        if (!mounted) return;
        setUserOrders(updatedList);
        if (activeOrder) {
          const fresh = updatedList.find((o) => o.id === activeOrder.id);
          if (fresh) {
            setActiveOrder(fresh);
          } else {
            fetchOrderByNumber(activeOrder.order_number).then((o) => {
              if (mounted && o) setActiveOrder(o);
            });
          }
        }
      });
      // Flash live pulse
      setLivePulse(true);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [isOpen, initialOrderNumber]);

  // Handle Search submit
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setLoading(true);
    setNotFound(false);

    // 1. Check local list first
    const match = userOrders.find(
      (o) => o.order_number.toLowerCase() === query.toLowerCase() || o.id.toLowerCase() === query.toLowerCase()
    );

    if (match) {
      setActiveOrder(match);
      setLoading(false);
      return;
    }

    // 2. Fetch from DB
    const fetched = await fetchOrderByNumber(query);
    if (fetched) {
      setActiveOrder(fetched);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const currentStatus = activeOrder?.status || "Processing";
  const isCancelled = currentStatus === "Cancelled";
  const isRetailer = userRole === "retailer" || activeOrder?.user_role === "retailer";

  // Step stages definition
  const steps = [
    {
      id: "placed",
      title: "Order Placed & Confirmed",
      desc: isRetailer ? "Wholesale PO verified with verified GSTIN" : "Payment confirmed & prescription verified",
      time: activeOrder ? new Date(activeOrder.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Done",
      isDone: true,
      isActive: currentStatus === "Processing",
      icon: "✓",
    },
    {
      id: "packed",
      title: "Pharmacy Packaging & QC Checked",
      desc: isRetailer ? "Bulk cartons packed with Batch & Expiry audit" : "Dispensed by licensed pharmacist & sealed",
      time: currentStatus !== "Processing" ? "Completed" : "In Progress",
      isDone: currentStatus === "Shipped" || currentStatus === "Delivered",
      isActive: currentStatus === "Processing",
      icon: "📦",
    },
    {
      id: "shipped",
      title: isRetailer ? "In Transit (Express Logistics Van)" : "Out for Delivery (SubhOne Express)",
      desc: isRetailer ? "Dispatched from Central Warehouse with e-Way Bill" : "Delivery agent on route with temperature-controlled pack",
      time: currentStatus === "Shipped" ? "Arriving Today" : currentStatus === "Delivered" ? "Completed" : "Pending",
      isDone: currentStatus === "Shipped" || currentStatus === "Delivered",
      isActive: currentStatus === "Shipped",
      icon: "🚚",
    },
    {
      id: "delivered",
      title: "Delivered & Verified",
      desc: isRetailer ? "Consignment handed over with delivery challan" : "Handed over safely with OTP verification",
      time: currentStatus === "Delivered" ? "Delivered" : "Expected in 35-45 mins",
      isDone: currentStatus === "Delivered",
      isActive: currentStatus === "Delivered",
      icon: "🎉",
    },
  ];

  // Convert DbOrder to Invoice format for printing
  const invoiceData: InvoiceOrderData | null = activeOrder
    ? {
        id: activeOrder.order_number,
        dbId: activeOrder.id,
        customer: activeOrder.customer_name || userName || "Valued Customer",
        phone: activeOrder.customer_phone || userPhone || "+91 98765 00000",
        role: isRetailer ? "retailer" : "customer",
        shopName: activeOrder.shop_name || (isRetailer ? "Retailer Pharmacy Store" : undefined),
        address: typeof activeOrder.shipping_address === "object"
          ? `${activeOrder.shipping_address?.line1 || ""}, ${activeOrder.shipping_address?.city || ""}, ${activeOrder.shipping_address?.state || ""} - ${activeOrder.shipping_address?.pincode || ""}`
          : "Delivery Address Provided",
        items: activeOrder.order_items?.length || 1,
        amount: activeOrder.total_amount,
        status: activeOrder.status,
        date: activeOrder.created_at,
        payment: activeOrder.payment_method || "UPI",
        orderItems: activeOrder.order_items?.map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
          price: it.unit_price,
          mrp: Math.round(it.unit_price * 1.15),
          batch: "SBH-8840",
          expiry: "12/28",
        })),
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4ede2]">
        {/* ── Modal Header ── */}
        <div className="bg-gradient-to-r from-[#073b4c] via-[#005f32] to-[#006a39] text-white p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-xl shadow-inner border border-white/20">
              🚚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Manrope',sans-serif] font-extrabold text-lg sm:text-xl text-white">
                  Real-Time Order Tracking
                </h2>
                <span className="flex items-center gap-1 bg-[#00a86b]/30 border border-[#00a86b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-white/80 text-xs mt-0.5">
                {isRetailer ? "Wholesale B2B Cargo Logistics Tracker" : "Hyperlocal Healthcare Delivery Tracking"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── Order Search & Quick Selector Bar ── */}
        <div className="bg-[#f8fafb] border-b border-[#e4ede2] p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order ID (e.g. ORD-1234)..."
                className="w-full bg-white border border-[#c3dec0] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#073b4c] focus:outline-none focus:border-[#006a39] shadow-2xs uppercase"
              />
            </div>
            <button
              type="submit"
              className="bg-[#073b4c] hover:bg-[#052c3a] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Track
            </button>
          </form>

          {/* User's recent orders quick pills */}
          {userOrders.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] font-bold text-[#6d7a6f] shrink-0">Recent Orders:</span>
              {userOrders.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setActiveOrder(o);
                    setSearchInput(o.order_number);
                    setNotFound(false);
                  }}
                  className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    activeOrder?.id === o.id
                      ? "bg-[#006a39] text-white shadow-xs"
                      : "bg-white border border-[#e4ede2] text-[#073b4c] hover:border-[#006a39]"
                  }`}
                >
                  {o.order_number}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Modal Main Body ── */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col gap-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-3 border-[#006a39] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-[#073b4c]">Connecting to live tracking satellites...</p>
            </div>
          ) : notFound ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 text-3xl flex items-center justify-center">
                🔍
              </div>
              <h3 className="text-base font-bold text-[#073b4c]">Order Not Found</h3>
              <p className="text-xs sm:text-sm text-[#6d7a6f] max-w-sm">
                No active order found with ID <span className="font-mono font-bold text-black">{searchInput}</span>. Please verify your order number and try again.
              </p>
            </div>
          ) : activeOrder ? (
            <>
              {/* Order Quick Details Card */}
              <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base sm:text-lg font-extrabold text-[#006a39]">
                      {activeOrder.order_number}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isCancelled
                          ? "bg-rose-100 text-rose-700"
                          : currentStatus === "Delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {activeOrder.status}
                    </span>
                    {isRetailer ? (
                      <span className="text-[10px] font-extrabold bg-[#e0f2fe] text-[#0369a1] px-2 py-0.5 rounded-md border border-[#bae6fd]">
                        🏪 Wholesale Consignment
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold bg-[#d1fae5] text-[#047857] px-2 py-0.5 rounded-md border border-[#a7f3d0]">
                        👤 Retail Customer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6d7a6f] mt-1">
                    Placed on {new Date(activeOrder.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#9aa89b] uppercase">Order Amount</p>
                    <p className="font-['Manrope',sans-serif] font-extrabold text-xl text-[#073b4c]">
                      ₹{activeOrder.total_amount.toLocaleString()}
                    </p>
                  </div>
                  {invoiceData && (
                    <button
                      onClick={() => printOrDownloadInvoice(invoiceData)}
                      className="flex items-center gap-1.5 bg-[#f0f7ee] hover:bg-[#006a39] text-[#006a39] hover:text-white border border-[#c3dec0] text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
                      title="Download or Print Invoice Bill PDF"
                    >
                      <span>🧾</span>
                      <span>Invoice Bill</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Interactive Route Visualizer Simulation ── */}
              {!isCancelled && (
                <div className="relative bg-gradient-to-br from-[#f8fafb] to-[#edf7ed] rounded-2xl border border-[#c3dec0] p-5 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🗺️</span>
                      <h4 className="font-bold text-[#073b4c] text-xs sm:text-sm">
                        Live Delivery Route Simulation
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-[#006a39] bg-white/80 px-2.5 py-1 rounded-full border border-[#c3dec0]">
                      {currentStatus === "Delivered" ? "Arrived at Destination" : "Estimated Arrival: 30-40 Mins"}
                    </span>
                  </div>

                  {/* Visual Route Line */}
                  <div className="relative py-4 px-2">
                    <div className="h-2 bg-[#d1e7d1] rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-[#006a39] transition-all duration-1000 relative"
                        style={{
                          width:
                            currentStatus === "Delivered"
                              ? "100%"
                              : currentStatus === "Shipped"
                              ? "70%"
                              : "25%",
                        }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse" />
                      </div>
                    </div>

                    {/* Nodes on Map */}
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <div className="text-left">
                        <div className="flex items-center gap-1 font-bold text-[#073b4c]">
                          <span>🏢</span>
                          <span>Central Hub</span>
                        </div>
                        <p className="text-[10px] text-[#6d7a6f]">Kolkata Dispatch</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-[#006a39]">
                          <span className="animate-bounce">🚚</span>
                          <span>{isRetailer ? "Freight Transit" : "Express Agent"}</span>
                        </div>
                        <p className="text-[10px] text-[#6d7a6f]">In Transit</p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 font-bold text-[#073b4c]">
                          <span>📍</span>
                          <span>{isRetailer ? "Pharmacy Store" : "Your Doorstep"}</span>
                        </div>
                        <p className="text-[10px] text-[#6d7a6f]">Final Destination</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Real-Time Order Timeline ── */}
              <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-6 shadow-xs">
                <h4 className="font-['Manrope',sans-serif] font-bold text-base text-[#073b4c] mb-6 flex items-center gap-2">
                  <span>⏱️</span>
                  <span>Live Fulfillment Timeline</span>
                </h4>

                {isCancelled ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️</span> Order Cancelled
                    </p>
                    <p className="mt-1 text-rose-700">
                      This order has been cancelled and any reserved product stocks have been restored. If amount was debited, a full refund has been initiated to your source payment account.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#d1fae5]">
                    {steps.map((st, idx) => {
                      const isComplete = st.isDone;
                      const isCurrent = st.isActive;

                      return (
                        <div key={st.id} className="relative flex items-start justify-between gap-4">
                          {/* Circle Icon Badge */}
                          <div
                            className={`absolute -left-6 sm:-left-8 w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all ${
                              isComplete
                                ? "bg-[#006a39] text-white ring-4 ring-[#d1fae5]"
                                : isCurrent
                                ? "bg-[#073b4c] text-white ring-4 ring-[#e0f2fe] animate-pulse"
                                : "bg-white border-2 border-gray-300 text-gray-400"
                            }`}
                          >
                            {st.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5
                                className={`text-xs sm:text-sm font-bold ${
                                  isComplete || isCurrent ? "text-[#073b4c]" : "text-gray-400"
                                }`}
                              >
                                {st.title}
                              </h5>
                              {isCurrent && (
                                <span className="bg-[#00a86b] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Current Status
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6d7a6f] mt-0.5">{st.desc}</p>
                          </div>

                          <span className="text-[11px] font-semibold text-[#9aa89b] whitespace-nowrap">
                            {st.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Order Items & Delivery Information ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Items Box */}
                <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 shadow-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#9aa89b] mb-3">
                    Prescribed Items ({activeOrder.order_items?.length || 0})
                  </h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {activeOrder.order_items && activeOrder.order_items.length > 0 ? (
                      activeOrder.order_items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-[#f0f4f0] last:border-0">
                          <div>
                            <p className="font-semibold text-[#073b4c]">{it.product_name}</p>
                            <p className="text-[10px] text-[#6d7a6f]">Qty: {it.quantity} unit{it.quantity > 1 ? "s" : ""}</p>
                          </div>
                          <span className="font-bold text-[#073b4c]">₹{it.total_price.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#6d7a6f]">Standard order bundle</p>
                    )}
                  </div>
                </div>

                {/* Shipping & Payment Box */}
                <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#9aa89b] mb-2">
                      Delivery Destination
                    </h4>
                    <p className="text-xs font-semibold text-[#073b4c]">{activeOrder.customer_name}</p>
                    <p className="text-xs text-[#6d7a6f] mt-0.5">
                      {typeof activeOrder.shipping_address === "object"
                        ? `${activeOrder.shipping_address?.line1 || ""}, ${activeOrder.shipping_address?.city || ""}`
                        : "Verified Store Address"}
                    </p>
                    <p className="text-xs text-[#6d7a6f] mt-0.5">Ph: {activeOrder.customer_phone}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f0f4f0] flex items-center justify-between text-xs">
                    <span className="text-[#6d7a6f]">Payment Mode:</span>
                    <span className="font-bold text-[#006a39] bg-[#d1fae5] px-2 py-0.5 rounded">
                      {activeOrder.payment_method || "UPI"} ({activeOrder.payment_status || "Paid"})
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-[#6d7a6f]">
              <p>Please enter an order number above to begin real-time tracking.</p>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="bg-[#f8fafb] border-t border-[#e4ede2] p-4 sm:p-5 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#6d7a6f] hidden sm:inline">
            🔒 256-Bit Encrypted Real-Time Logistics Feed
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {invoiceData && (
              <button
                onClick={() => downloadInvoiceFile(invoiceData)}
                className="bg-white hover:bg-gray-50 text-[#073b4c] border border-[#e4ede2] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>📥</span>
                <span>Download Invoice</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-[#073b4c] hover:bg-[#052c3a] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

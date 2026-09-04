import React, { useEffect, useState, useRef } from "react";
import type { CurrentUser } from "../App";
import { getDeliveryPartnerById, completeDeliveryPartnerProfile, toggleDeliveryPartnerDuty, DeliveryPartnerItem } from "../lib/deliveryPartners";
import { fetchAvailableOrdersForPartners, acceptOrderForDelivery, fetchOrdersForPartner, markOrderPickedUp, markOrderDelivered } from "../lib/deliveryOrders";
import { pushDeliveryLocation } from "../lib/deliveryLocation";
import { DbOrder } from "../lib/orders";
import { uploadImageToSupabase } from "../lib/storage";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import RetailerApprovalsManager from "../components/RetailerApprovalsManager";

interface Props {
  user: CurrentUser;
  onLogout: () => void;
}

type TabKey = "incoming" | "active" | "history" | "approvals" | "profile";

export default function DeliveryPartnerDashboard({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("incoming");
  const [partnerProfile, setPartnerProfile] = useState<DeliveryPartnerItem | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Orders State
  const [availableOrders, setAvailableOrders] = useState<DbOrder[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<DbOrder[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<DbOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [orderActionId, setOrderActionId] = useState<string | null>(null);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState<DbOrder | null>(null);

  // Profile Completion Form State
  const [profileForm, setProfileForm] = useState({
    phone: user.phone || "",
    address: "",
    vehicleType: "Motorcycle / Scooter",
    vehicleNumber: "",
    avatarUrl: user.profileImage || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // GPS Tracking Loop
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Load Partner Profile
  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await getDeliveryPartnerById(user.id || "");
      if (data) {
        setPartnerProfile(data);
        setIsOnDuty(data.isOnDuty);
        setProfileForm({
          phone: data.phone || user.phone || "",
          address: data.address || "",
          vehicleType: data.vehicleType || "Motorcycle / Scooter",
          vehicleNumber: data.vehicleNumber || "",
          avatarUrl: data.avatarUrl || user.profileImage || "",
        });
      }
    } catch (err) {
      console.error("Error loading partner profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const [avail, active, done] = await Promise.all([
        fetchAvailableOrdersForPartners(),
        fetchOrdersForPartner(user.id || "", { activeOnly: true }),
        fetchOrdersForPartner(user.id || "", { completedOnly: true }),
      ]);
      setAvailableOrders(avail);
      setActiveDeliveries(active);
      setCompletedDeliveries(done);
    } catch (err) {
      console.error("Error loading delivery orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  // GPS Geolocation loop management
  useEffect(() => {
    if (!isOnDuty) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsActive(false);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    let lastPushTime = 0;
    const PUSH_INTERVAL_MS = 10000; // Throttle to 10s

    setGpsError(null);
    setGpsActive(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLastCoords({ lat: latitude, lng: longitude });

        const now = Date.now();
        if (now - lastPushTime >= PUSH_INTERVAL_MS) {
          lastPushTime = now;
          const activeOrderId = activeDeliveries[0]?.id || null;
          await pushDeliveryLocation(user.id || "", {
            lat: latitude,
            lng: longitude,
            accuracy,
            orderId: activeOrderId,
          });
        }
      },
      (err) => {
        console.warn("GPS watch position error:", err);
        setGpsError(err.message || "Location access permission denied.");
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnDuty, user.id, activeDeliveries]);

  // Duty Toggle
  const handleToggleDuty = async () => {
    if (!partnerProfile?.profileCompleted) {
      alert("Please complete your profile details first before going on duty.");
      return;
    }

    const nextDuty = !isOnDuty;
    setIsOnDuty(nextDuty);
    const res = await toggleDeliveryPartnerDuty(user.id || "", nextDuty);
    if (!res.success) {
      setIsOnDuty(!nextDuty);
      alert("Failed to change duty status: " + (res.error || "Please check connection"));
    }
  };

  // Accept Order Handler
  const handleAcceptOrder = async (orderId: string) => {
    if (!isOnDuty) {
      alert("Please toggle On-Duty first to accept delivery orders.");
      return;
    }

    setAcceptingOrderId(orderId);
    try {
      const res = await acceptOrderForDelivery(orderId, user.id || "", partnerProfile?.name || user.name);
      if (res.success) {
        await loadOrders();
        setActiveTab("active");
      } else {
        alert(res.error || "Could not accept order. It may have been claimed.");
        await loadOrders();
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setAcceptingOrderId(null);
    }
  };

  // Mark Picked Up
  const handleMarkPickedUp = async (orderId: string) => {
    setOrderActionId(orderId);
    try {
      const res = await markOrderPickedUp(orderId, user.id || "");
      if (res.success) {
        await loadOrders();
      } else {
        alert(res.error || "Failed to update order status.");
      }
    } finally {
      setOrderActionId(null);
    }
  };

  // Mark Delivered
  const handleMarkDelivered = async (orderId: string) => {
    setOrderActionId(orderId);
    try {
      const res = await markOrderDelivered(orderId, user.id || "");
      if (res.success) {
        await loadOrders();
        if (selectedOrderForMap?.id === orderId) setSelectedOrderForMap(null);
      } else {
        alert(res.error || "Failed to mark order as delivered.");
      }
    } finally {
      setOrderActionId(null);
    }
  };

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const uploadRes = await uploadImageToSupabase(base64, "avatars");
      if (uploadRes.url) {
        setProfileForm((prev) => ({ ...prev, avatarUrl: uploadRes.url || "" }));
      } else {
        // Fallback to local base64 preview
        setProfileForm((prev) => ({ ...prev, avatarUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.phone.trim() || !profileForm.address.trim()) {
      setProfileError("Phone number and address are required.");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    try {
      const res = await completeDeliveryPartnerProfile(user.id || "", {
        phone: profileForm.phone,
        address: profileForm.address,
        avatarUrl: profileForm.avatarUrl,
        vehicleType: profileForm.vehicleType,
        vehicleNumber: profileForm.vehicleNumber,
      });

      if (res.success) {
        await loadProfile();
      } else {
        setProfileError(res.error || "Failed to save profile.");
      }
    } catch (err: any) {
      setProfileError(err?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const isProfileIncomplete = !loadingProfile && (!partnerProfile || !partnerProfile.profileCompleted);

  return (
    <div className="min-h-screen bg-[#f5fbf2] text-[#171d18] flex flex-col" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* ── TOP NAV BAR ── */}
      <header className="safe-top bg-white/95 backdrop-blur-xl border-b border-[#dce7db] sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006a39] to-[#008749] text-white flex items-center justify-center text-xl shadow-md">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Manrope',sans-serif] font-black text-[#073b4c] text-lg sm:text-xl tracking-tight">SubhOne</span>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Delivery Partner
              </span>
            </div>
            <p className="text-[#657969] text-xs font-semibold">{partnerProfile?.name || user.name}</p>
          </div>
        </div>

        {/* Right Section: Duty Switch & Profile & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Duty Switch */}
          <button
            onClick={handleToggleDuty}
            className={`px-3.5 sm:px-4 py-2 rounded-2xl font-['Manrope',sans-serif] font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
              isOnDuty
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? "bg-emerald-300 animate-ping" : "bg-slate-400"}`} />
            <span>{isOnDuty ? "On Duty" : "Off Duty"}</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
            title="Sign Out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── LIVE GPS BANNER IF ON DUTY ── */}
      {isOnDuty && (
        <div className="bg-emerald-900 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live GPS Sharing Active</span>
            {lastCoords && (
              <span className="font-mono text-emerald-300 hidden sm:inline">
                ({lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)})
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-200">
            {gpsActive ? "Transmitting location to customers & admin" : "Waiting for GPS satellite fix..."}
          </span>
        </div>
      )}

      {gpsError && isOnDuty && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs px-4 py-2 flex items-center justify-between">
          <span>⚠️ {gpsError} Please allow location permissions in your browser settings.</span>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* FIRST LOGIN: Force Complete Profile Modal/Section */}
        {isProfileIncomplete ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce7db] shadow-xl max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shadow-xs">
                📝
              </div>
              <div>
                <h2 className="font-['Manrope',sans-serif] font-black text-xl text-[#073b4c]">
                  Complete Your Delivery Partner Profile
                </h2>
                <p className="text-xs text-[#657969]">
                  Please furnish your contact details and vehicle information before accepting delivery orders.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 mt-6">
              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
                  {profileError}
                </div>
              )}

              {/* Avatar Upload */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafb] border border-[#e4ede2]">
                {profileForm.avatarUrl ? (
                  <img
                    src={profileForm.avatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-xl font-black">
                    {(user.name?.[0] || "D").toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-extrabold text-[#073b4c]">Profile Photo</p>
                  <label className="mt-1.5 inline-block px-3 py-1.5 rounded-xl bg-white border border-[#dce7db] text-xs font-bold text-[#006a39] hover:bg-emerald-50 cursor-pointer shadow-2xs">
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                  Full Base Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street, City, Pincode..."
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={profileForm.vehicleType}
                    onChange={(e) => setProfileForm((p) => ({ ...p, vehicleType: e.target.value }))}
                    className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  >
                    <option>Motorcycle / Scooter</option>
                    <option>Electric Two-Wheeler</option>
                    <option>Delivery Van / Cargo Auto</option>
                    <option>Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                    Vehicle Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WB-01-AB-1234"
                    value={profileForm.vehicleNumber}
                    onChange={(e) => setProfileForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                    className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39] uppercase font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-black text-sm shadow-lg shadow-emerald-950/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? "Saving Profile…" : "Save & Unlock Dashboard"}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* ── METRIC STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce7db] shadow-xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">Available Orders</p>
                <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c] mt-1">
                  {availableOrders.length}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce7db] shadow-xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">In Progress</p>
                <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#006a39] mt-1">
                  {activeDeliveries.length}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce7db] shadow-xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">Delivered Today</p>
                <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c] mt-1">
                  {completedDeliveries.length}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce7db] shadow-xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">Duty Status</p>
                <p className="font-['Manrope',sans-serif] font-black text-base sm:text-lg text-emerald-700 mt-2 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span>{isOnDuty ? "Present" : "Off Duty"}</span>
                </p>
              </div>
            </div>

            {/* ── TABS SELECTOR ── */}
            <div className="flex items-center gap-2 border-b border-[#dce7db] pb-3 overflow-x-auto">
              {[
                { id: "incoming", label: `Incoming Orders (${availableOrders.length})` },
                { id: "active", label: `My Deliveries (${activeDeliveries.length})` },
                { id: "history", label: "Delivery History" },
                { id: "approvals", label: "Retailer Approvals" },
                { id: "profile", label: "My Profile" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id as TabKey);
                    if (t.id !== "active") setSelectedOrderForMap(null);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold font-['Manrope',sans-serif] whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === t.id
                      ? "bg-[#006a39] text-white shadow-md shadow-emerald-950/20"
                      : "bg-white text-[#073b4c] border border-[#dce7db] hover:bg-emerald-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB 1: INCOMING ORDERS FEED ── */}
            {activeTab === "incoming" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-['Manrope',sans-serif] font-black text-lg text-[#073b4c]">
                    Available Retailer Deliveries
                  </h3>
                  <button
                    onClick={loadOrders}
                    className="text-xs font-bold text-[#006a39] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Refresh</span> 🔄
                  </button>
                </div>

                {!isOnDuty && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span>You are currently Off Duty. Toggle On Duty to claim and accept incoming delivery orders.</span>
                    <button
                      onClick={handleToggleDuty}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-extrabold hover:bg-emerald-800 cursor-pointer"
                    >
                      Go On Duty
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableOrders.map((order) => {
                    const isAccepting = acceptingOrderId === order.id;
                    const shipAddr = (order.shipping_address || {}) as any;
                    const dest = shipAddr.formattedAddress || `${shipAddr.city || "Kolkata"}, ${shipAddr.pincode || ""}`;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl p-5 border border-[#dce7db] shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                              {order.order_number}
                            </span>
                            <span className="text-xs font-black text-[#006a39] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              ₹{order.total_amount} ({order.payment_method})
                            </span>
                          </div>

                          <h4 className="font-['Manrope',sans-serif] font-extrabold text-base text-[#073b4c]">
                            {order.customer_name} {order.shop_name && <span className="text-emerald-700">({order.shop_name})</span>}
                          </h4>
                          <p className="text-xs text-[#657969] mt-1 flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate">{dest}</span>
                          </p>

                          <div className="mt-3 text-xs text-[#728575] bg-[#f8fafb] rounded-2xl p-3">
                            <p className="font-bold text-[#073b4c] mb-1">
                              Items ({order.order_items?.length || 1}):
                            </p>
                            <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                              {order.order_items?.map((it, idx) => (
                                <li key={idx} className="flex justify-between text-[11px]">
                                  <span className="truncate max-w-[200px]">{it.product_name}</span>
                                  <span className="font-mono font-bold">x{it.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={isAccepting || !isOnDuty}
                          className="w-full py-3 rounded-2xl bg-[#006a39] hover:bg-[#008749] active:scale-98 text-white font-black text-sm shadow-md shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isAccepting ? (
                            <span>Claiming order…</span>
                          ) : (
                            <>
                              <span>Accept Delivery</span>
                              <span>🚀</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {availableOrders.length === 0 && (
                    <div className="col-span-full py-16 text-center text-[#728575] bg-white rounded-3xl border border-[#dce7db] flex flex-col items-center gap-2">
                      <span className="text-3xl">📦</span>
                      <p className="font-bold text-[#073b4c]">No unassigned orders available right now</p>
                      <p className="text-xs">New wholesale orders placed by retailers will show up here automatically.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: ACTIVE DELIVERIES ── */}
            {activeTab === "active" && (
              <div className="flex flex-col gap-5">
                <h3 className="font-['Manrope',sans-serif] font-black text-lg text-[#073b4c]">
                  Your Active Shipments ({activeDeliveries.length})
                </h3>

                {/* Selected Order Map Viewer */}
                {selectedOrderForMap && (
                  <div className="animate-in fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#073b4c]">
                        Live Tracking View for {selectedOrderForMap.order_number}
                      </span>
                      <button
                        onClick={() => setSelectedOrderForMap(null)}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Hide Map ✕
                      </button>
                    </div>
                    <LiveDeliveryMap
                      orderId={selectedOrderForMap.id}
                      partnerName={partnerProfile?.name || user.name}
                      partnerPhone={partnerProfile?.phone || user.phone}
                      partnerAvatar={partnerProfile?.avatarUrl || user.profileImage}
                      vehicleType={partnerProfile?.vehicleType || "Bike"}
                      vehicleNumber={partnerProfile?.vehicleNumber || ""}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeDeliveries.map((order) => {
                    const isPickedUp = order.delivery_status === "picked_up";
                    const isBusy = orderActionId === order.id;
                    const shipAddr = (order.shipping_address || {}) as any;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl p-5 border-2 border-emerald-600/40 shadow-md flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl">
                              {order.order_number}
                            </span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full uppercase bg-sky-100 text-sky-800">
                              {isPickedUp ? "En Route (Picked Up)" : "Accepted"}
                            </span>
                          </div>

                          <h4 className="font-['Manrope',sans-serif] font-extrabold text-base text-[#073b4c]">
                            {order.customer_name}
                          </h4>
                          <p className="text-xs text-[#006a39] font-bold">
                            📞 {order.customer_phone}
                          </p>
                          <p className="text-xs text-[#657969] mt-1">
                            📍 {shipAddr.formattedAddress || `${shipAddr.city || "Kolkata"}, ${shipAddr.pincode || ""}`}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-[#f0f4f0]">
                          <div className="flex items-center gap-2">
                            {!isPickedUp ? (
                              <button
                                onClick={() => handleMarkPickedUp(order.id)}
                                disabled={isBusy}
                                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                              >
                                Mark Picked Up 📦
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkDelivered(order.id)}
                                disabled={isBusy}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                              >
                                Mark Delivered ✅
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedOrderForMap(selectedOrderForMap?.id === order.id ? null : order)}
                              className="px-4 py-2.5 rounded-xl border border-[#dce7db] text-[#073b4c] hover:bg-[#f8fafb] text-xs font-bold transition-all cursor-pointer"
                            >
                              {selectedOrderForMap?.id === order.id ? "Hide Map" : "View Map 🗺️"}
                            </button>
                          </div>

                          {order.customer_phone && (
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="py-2 text-center rounded-xl bg-[#f0f5f2] text-[#006a39] hover:bg-[#e4ede6] text-xs font-bold transition-colors"
                            >
                              Call Retailer Customer ({order.customer_phone})
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {activeDeliveries.length === 0 && (
                    <div className="col-span-full py-16 text-center text-[#728575] bg-white rounded-3xl border border-[#dce7db] flex flex-col items-center gap-2">
                      <span className="text-3xl">🚴</span>
                      <p className="font-bold text-[#073b4c]">No active deliveries at the moment</p>
                      <p className="text-xs">Claim an order from the "Incoming Orders" tab to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: DELIVERED HISTORY ── */}
            {activeTab === "history" && (
              <div className="flex flex-col gap-4">
                <h3 className="font-['Manrope',sans-serif] font-black text-lg text-[#073b4c]">
                  Completed Deliveries History
                </h3>

                <div className="bg-white rounded-3xl border border-[#dce7db] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafb] border-b border-[#e4ede2] text-[#073b4c] font-black uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f4f0]">
                        {completedDeliveries.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#f8fafb] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#006a39]">{ord.order_number}</td>
                            <td className="p-4 font-semibold text-[#073b4c]">{ord.customer_name}</td>
                            <td className="p-4 font-black">₹{ord.total_amount}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                Delivered
                              </span>
                            </td>
                            <td className="p-4 text-[#728575]">
                              {new Date(ord.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {completedDeliveries.length === 0 && (
                    <div className="p-12 text-center text-[#728575] text-xs font-semibold">
                      No delivered orders yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: RETAILER APPROVALS ── */}
            {activeTab === "approvals" && (
              <div className="flex flex-col gap-4">
                <RetailerApprovalsManager currentUserId={user.id || ""} isDeliveryPartner={true} />
              </div>
            )}

            {/* ── TAB 5: MY PROFILE ── */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce7db] shadow-xs max-w-2xl">
                <h3 className="font-['Manrope',sans-serif] font-black text-lg text-[#073b4c] mb-4">
                  Delivery Partner Profile
                </h3>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  {profileError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
                      {profileError}
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafb] border border-[#e4ede2]">
                    {profileForm.avatarUrl ? (
                      <img
                        src={profileForm.avatarUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-xl font-black">
                        {(user.name?.[0] || "D").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-extrabold text-[#073b4c]">Profile Photo</p>
                      <label className="mt-1.5 inline-block px-3 py-1.5 rounded-xl bg-white border border-[#dce7db] text-xs font-bold text-[#006a39] hover:bg-emerald-50 cursor-pointer shadow-2xs">
                        <span>Change Photo</span>
                        <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={partnerProfile?.name || user.name}
                      className="w-full bg-slate-100 border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                      Email (Login ID)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-slate-100 border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                      Base Address
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                      className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={profileForm.vehicleType}
                        onChange={(e) => setProfileForm((p) => ({ ...p, vehicleType: e.target.value }))}
                        className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      >
                        <option>Motorcycle / Scooter</option>
                        <option>Electric Two-Wheeler</option>
                        <option>Delivery Van / Cargo Auto</option>
                        <option>Bicycle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.vehicleNumber}
                        onChange={(e) => setProfileForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                        className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39] uppercase font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="mt-2 py-3 rounded-2xl bg-[#006a39] hover:bg-[#008749] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? "Saving…" : "Update Profile"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

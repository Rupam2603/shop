import React, { useState, useRef, useEffect } from "react";
import type { CurrentUser, Address, Page } from "../App";
import {
  fetchUserAddresses,
  createAddress as dbCreateAddress,
  updateAddress as dbUpdateAddress,
  deleteAddress as dbDeleteAddress,
  setDefaultAddress as dbSetDefaultAddress,
  DbAddress,
} from "../lib/addresses";
import { fetchUserOrders, DbOrder } from "../lib/orders";
import { fetchUserLabBookings, DbLabBooking } from "../lib/labTests";

type ProfileSection = "profile" | "addresses" | "orders" | "lab-tests" | "security";

const CUSTOMER_ORDERS = [
  { id: "ORD-3041", date: "Aug 28, 2026", status: "Processing", total: 212,  items: ["Volini Spray 249ml", "Dettol Antiseptic 60ml", "Eno Lemon Sachet 5g"] },
  { id: "ORD-2991", date: "Aug 22, 2026", status: "Delivered",  total: 671,  items: ["Dabur Chyawanprash 860g"] },
  { id: "ORD-2843", date: "Aug 19, 2026", status: "Delivered",  total: 296,  items: ["Hansaplast Regular Band-Aid", "Dettol Antiseptic 250ml"] },
  { id: "ORD-2756", date: "Aug 14, 2026", status: "Delivered",  total: 412,  items: ["Glucon D Orange Jar 415g", "Electrol Sachet ×3", "Sugar Free Gold 40 Tabs"] },
  { id: "ORD-2601", date: "Aug 6, 2026",  status: "Cancelled",  total: 215,  items: ["Zandu Nityam Tablets ×2", "Kayam Churna 115g"] },
];

const RETAILER_ORDERS = [
  { id: "BLK-1041", date: "Aug 28, 2026", status: "Processing", total: 4770,  items: ["Volini Gel 15g ×50", "Dettol Antiseptic 250ml ×20"] },
  { id: "BLK-0992", date: "Aug 23, 2026", status: "Delivered",  total: 11560, items: ["Glucon D Orange Jar 415g ×30", "Sugar Free Gold 40 Tabs ×50"] },
  { id: "BLK-0876", date: "Aug 17, 2026", status: "Delivered",  total: 7770,  items: ["Hansaplast Regular Band-Aid ×40", "Boroline Antiseptic Cream 45g ×30"] },
  { id: "BLK-0741", date: "Aug 10, 2026", status: "Shipped",    total: 4160,  items: ["Nycil Cool Powder 130g ×25", "Ring Guard Cream 96g ×20"] },
  { id: "BLK-0654", date: "Aug 3, 2026",  status: "Delivered",  total: 4100,  items: ["Dettol Hand Sanitizer 30ml ×100", "Surgical Face Mask 75pc ×20"] },
];

function orderStatusStyle(s: string): { color: string; bg: string } {
  switch (s) {
    case "Delivered":  return { color: "#047857", bg: "#d1fae5" };
    case "Shipped":    return { color: "#1d4ed8", bg: "#dbeafe" };
    case "Processing": return { color: "#d97706", bg: "#fef3c7" };
    case "Cancelled":  return { color: "#b91c1c", bg: "#fee2e2" };
    default:           return { color: "#374151", bg: "#f3f4f6" };
  }
}

const ADDR_LABEL_COLORS: Record<string, { color: string; bg: string }> = {
  "Home":  { color: "#006a39", bg: "#e8f5ee" },
  "Work":  { color: "#0369a1", bg: "#e0f2fe" },
  "Shop":  { color: "#d97706", bg: "#fef3c7" },
  "Other": { color: "#6d7a6f", bg: "#f0f4f0" },
};

const emptyAddr = (): Partial<Address> => ({
  id: "", label: "Home", name: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", isDefault: false,
});

const INPUT_CLS = "w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-sm text-[#073b4c] focus:outline-none transition-colors placeholder:text-[#c0ccc0]";

export default function ProfilePage({
  user,
  onUpdateUser,
  onNavigate,
}: {
  user: CurrentUser;
  onUpdateUser: (updates: Partial<CurrentUser>) => void;
  onNavigate: (page: Page) => void;
}) {
  const [section, setSection] = useState<ProfileSection>("profile");
  const [dbAddresses, setDbAddresses] = useState<DbAddress[]>([]);
  const [dbOrders, setDbOrders] = useState<DbOrder[]>([]);
  const [dbLabBookings, setDbLabBookings] = useState<DbLabBooking[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchUserAddresses().then((data) => {
      if (mounted) setDbAddresses(data);
    });
    fetchUserOrders().then((data) => {
      if (mounted) setDbOrders(data);
    });
    fetchUserLabBookings().then((data) => {
      if (mounted) setDbLabBookings(data);
    });
    return () => { mounted = false; };
  }, []);

  const accent = user.role === "retailer" ? "#006a39" : "#0369a1";

  // Combine live db addresses with fallback to legacy user.addresses
  const addresses: Address[] = dbAddresses.length > 0
    ? dbAddresses.map((a) => ({
        id: a.id,
        label: a.label,
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 || undefined,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.is_default,
      }))
    : user.addresses ?? [];

  // Combine live orders with fallback
  const displayOrders = dbOrders.length > 0
    ? dbOrders.map((o) => ({
        id: o.order_number,
        date: new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: o.status,
        total: Number(o.total_amount),
        items: o.order_items?.map((item) => `${item.product_name} ×${item.quantity}`) || ["Order items"],
      }))
    : user.role === "retailer" ? RETAILER_ORDERS : CUSTOMER_ORDERS;

  const totalSpent = displayOrders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);

  // ── Profile tab state ──
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone ?? "");
  const [editShop, setEditShop] = useState(user.shopName ?? "");
  const [saved, setSaved] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const handleProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdateUser({ profileImage: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = () => {
    onUpdateUser({
      name: editName.trim() || user.name,
      phone: editPhone,
      shopName: user.role === "retailer" ? editShop : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Addresses tab state ──
  const [addrModal, setAddrModal] = useState<{
    open: boolean; mode: "add" | "edit"; idx: number | null; form: Partial<Address>;
  }>({ open: false, mode: "add", idx: null, form: emptyAddr() });

  const openAddAddr  = () => setAddrModal({ open: true, mode: "add",  idx: null, form: emptyAddr() });
  const openEditAddr = (idx: number) => setAddrModal({ open: true, mode: "edit", idx, form: { ...addresses[idx] } });
  const closeAddrModal = () => setAddrModal((p) => ({ ...p, open: false }));

  const saveAddress = async () => {
    const f = addrModal.form as Address;
    if (!f.name?.trim() || !f.line1?.trim() || !f.city?.trim() || !f.pincode?.trim()) return;

    if (addrModal.mode === "add") {
      const { data } = await dbCreateAddress({
        label: f.label || "Home",
        name: f.name,
        phone: f.phone || "",
        line1: f.line1,
        line2: f.line2 || null,
        city: f.city,
        state: f.state,
        pincode: f.pincode,
        is_default: addresses.length === 0 || !!f.isDefault,
      });
      if (data) {
        setDbAddresses((prev) => [...prev, data]);
      }
    } else if (addrModal.idx !== null) {
      const target = addresses[addrModal.idx];
      if (target?.id) {
        const { data } = await dbUpdateAddress(target.id, {
          label: f.label,
          name: f.name,
          phone: f.phone,
          line1: f.line1,
          line2: f.line2 || null,
          city: f.city,
          state: f.state,
          pincode: f.pincode,
          is_default: f.isDefault,
        });
        if (data) {
          setDbAddresses((prev) => prev.map((a) => a.id === target.id ? data : a));
        }
      }
    }
    closeAddrModal();
  };

  const deleteAddress = async (idx: number) => {
    const target = addresses[idx];
    if (target?.id) {
      setDbAddresses((prev) => prev.filter((a) => a.id !== target.id));
      await dbDeleteAddress(target.id);
    }
  };

  const setDefaultAddr = async (idx: number) => {
    const target = addresses[idx];
    if (target?.id) {
      setDbAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === target.id })));
      await dbSetDefaultAddress(target.id);
    }
  };

  const setAddrField = (key: string, val: string | boolean) =>
    setAddrModal((p) => ({ ...p, form: { ...p.form, [key]: val } }));

  // ── Orders tab state ──
  const [orderFilter, setOrderFilter] = useState("All");
  const filteredOrders = orderFilter === "All" ? displayOrders : displayOrders.filter((o) => o.status === orderFilter);

  // ── Security tab state ──
  const [curPass, setCurPass]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confPass, setConfPass] = useState("");
  const [passMsg, setPassMsg]   = useState("");
  const [notifs, setNotifs]     = useState({ orders: true, promos: false, reminders: true });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6)        { setPassMsg("New password must be at least 6 characters."); return; }
    if (newPass !== confPass)       { setPassMsg("Passwords don't match."); return; }
    setPassMsg("✓ Password updated successfully!");
    setCurPass(""); setNewPass(""); setConfPass("");
    setTimeout(() => setPassMsg(""), 3000);
  };

  const NAV_ITEMS: { id: ProfileSection; label: string; badge?: number; icon: React.ReactElement }[] = [
    { id: "profile",   label: "My Profile",       icon: <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M8 9C10.21 9 12 7.21 12 5C12 2.79 10.21 1 8 1C5.79 1 4 2.79 4 5C4 7.21 5.79 9 8 9ZM8 11C5.33 11 0 12.34 0 15V17H16V15C16 12.34 10.67 11 8 11Z" fill="currentColor"/></svg> },
    { id: "addresses", label: "Saved Addresses",  badge: addresses.length || undefined, icon: <svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M8 0C4.13 0 1 3.13 1 7C1 12.25 8 20 8 20C8 20 15 12.25 15 7C15 3.13 11.87 0 8 0ZM8 9.5C6.62 9.5 5.5 8.38 5.5 7C5.5 5.62 6.62 4.5 8 4.5C9.38 4.5 10.5 5.62 10.5 7C10.5 8.38 9.38 9.5 8 9.5Z" fill="currentColor"/></svg> },
    { id: "orders",    label: "Order History",    badge: displayOrders.length || undefined, icon: <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M3 0H13C14.1 0 15 0.9 15 2V16L12 14.5L8 16L4 14.5L1 16V2C1 0.9 1.9 0 3 0ZM4 5H12M4 8H12M4 11H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
    { id: "lab-tests", label: "Lab Bookings",     badge: dbLabBookings.length || undefined, icon: <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 3H6v6L2 15c-.83 1.39-.83 3.08 0 4.47C2.83 20.86 4.33 22 6 22h12c1.67 0 3.17-1.14 4-2.53.83-1.39.83-3.08 0-4.47L18 9V3h-3M9 3v6l-4 6h14L15 9V3M9 3h6"/></svg> },
    { id: "security",  label: "Security",         icon: <svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M8 0L0 4V9C0 13.55 3.4 17.74 8 19C12.6 17.74 16 13.55 16 9V4L8 0ZM7 13L4 10L5.41 8.59L7 10.17L10.59 6.58L12 8L7 13Z" fill="currentColor"/></svg> },
  ];

  return (
    <div className="min-h-screen bg-[#f5fbf2]">
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(140deg, #073b4c 0%, #0a5568 55%, " + accent + " 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.06]" style={{ backgroundColor: "white" }} />
        <div className="absolute top-6 -left-28 w-56 h-56 rounded-full opacity-[0.04]" style={{ backgroundColor: "white" }} />
        <div className="absolute -bottom-10 right-40 w-40 h-40 rounded-full opacity-[0.05]" style={{ backgroundColor: "white" }} />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 relative z-10">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-white/65 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Home
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                onClick={() => imageRef.current?.click()}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white/20 overflow-hidden cursor-pointer group relative shadow-md"
                style={{ backgroundColor: accent }}
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-['Manrope',sans-serif] font-extrabold text-white text-2xl sm:text-3xl">
                    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg width="20" height="18" viewBox="0 0 20 18" fill="white"><path d="M7 1H13L14.5 3H19C19.55 3 20 3.45 20 4V16C20 16.55 19.55 17 19 17H1C0.45 17 0 16.55 0 16V4C0 3.45 0.45 3 1 3H5.5L7 1Z"/><circle cx="10" cy="10" r="3" fill="rgba(0,0,0,0.35)" stroke="white" strokeWidth="1.5"/></svg>
                </div>
              </div>
              <input ref={imageRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleProfileImage} />
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-1 flex-wrap">
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-white text-xl sm:text-2xl leading-none">{user.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.95)" }}>
                  {user.role}
                </span>
              </div>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">{user.email}</p>
              {user.phone && <p className="text-white/50 text-xs mt-0.5">{user.phone}</p>}
              {user.shopName && (
                <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium flex items-center gap-1.5">
                  <svg width="13" height="12" viewBox="0 0 13 12" fill="white" opacity="0.8"><path d="M1 6H2.5V11H10.5V6H12L11 2H2L1 6ZM4 6V10H2.5V6H4ZM9 6V10H7.5V7H5.5V10H4V6H9Z"/></svg>
                  {user.shopName}
                </p>
              )}
              {user.joinedDate && <p className="text-white/40 text-[11px] mt-1">Member since {user.joinedDate}</p>}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 pb-1 w-full sm:w-auto">
              {[
                { label: "Total Orders",   value: displayOrders.length },
                { label: "Delivered",      value: displayOrders.filter((o) => o.status === "Delivered").length },
                { label: "Addresses",      value: addresses.length },
                { label: "Total Spent",    value: "₹" + totalSpent.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="text-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl min-w-[70px]" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <p className="font-['Manrope',sans-serif] font-extrabold text-white text-base sm:text-xl leading-none">{s.value}</p>
                  <p className="text-white/50 text-[10px] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col md:flex-row gap-5 sm:gap-7">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden flex md:flex-col overflow-x-auto md:overflow-visible sticky top-20">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all border-b md:border-b border-r md:border-r-0 border-[#f0f4f0] last:border-0 shrink-0 md:w-full"
                style={section === item.id
                  ? { color: accent, backgroundColor: accent + "0f" }
                  : { color: "#6d7a6f" }
                }
              >
                <span style={{ color: section === item.id ? accent : "#c0ccc0" }}>{item.icon}</span>
                <span className="text-left whitespace-nowrap">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ backgroundColor: section === item.id ? accent + "20" : "#f0f4f0", color: section === item.id ? accent : "#9aa89b" }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ════ MY PROFILE ════ */}
          {section === "profile" && (
            <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg sm:text-xl">My Profile</h2>
                {saved && (
                  <span className="flex items-center gap-1.5 text-[#047857] text-xs sm:text-sm font-semibold bg-[#d1fae5] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full animate-pulse">
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Saved!
                  </span>
                )}
              </div>

              {/* Avatar row */}
              <div className="flex items-center gap-4 sm:gap-5 pb-5 sm:pb-7 mb-5 sm:mb-7 border-b border-[#f0f4f0]">
                <div
                  onClick={() => imageRef.current?.click()}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden cursor-pointer group relative shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-['Manrope',sans-serif] font-extrabold text-white text-xl sm:text-2xl">
                      {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg width="18" height="16" viewBox="0 0 20 18" fill="white"><path d="M7 1H13L14.5 3H19C19.55 3 20 3.45 20 4V16C20 16.55 19.55 17 19 17H1C0.45 17 0 16.55 0 16V4C0 3.45 0.45 3 1 3H5.5L7 1Z"/><circle cx="10" cy="10" r="2.8" fill="rgba(0,0,0,0.4)" stroke="white" strokeWidth="1.5"/></svg>
                  </div>
                </div>
                <div>
                  <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg leading-none">{user.name}</p>
                  <p className="text-[#9aa89b] text-xs sm:text-sm mt-1">{user.email}</p>
                  <button onClick={() => imageRef.current?.click()} className="mt-1.5 text-xs font-semibold hover:underline transition-colors" style={{ color: accent }}>
                    Change profile photo
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={INPUT_CLS}
                    onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Email Address</label>
                  <input type="email" value={user.email} disabled className={`${INPUT_CLS} opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Phone Number</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9+]/g, ""))} placeholder="9876543210 (10-digit number)" className={INPUT_CLS}
                    onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
                {user.role === "retailer" && (
                  <div>
                    <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Shop / Business Name</label>
                    <input type="text" value={editShop} onChange={(e) => setEditShop(e.target.value)} className={INPUT_CLS}
                      onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                  </div>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-[#f0f4f0] flex justify-end">
                <button onClick={handleSaveProfile} className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ════ ADDRESSES ════ */}
          {section === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div>
                  <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg sm:text-xl">Saved Addresses</h2>
                  <p className="text-[#9aa89b] text-xs sm:text-sm mt-0.5">Manage your delivery and billing addresses</p>
                </div>
                <button
                  onClick={openAddAddr}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accent }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1V11M1 6H11" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                  Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e4ede2] py-16 sm:py-20 flex flex-col items-center gap-4 px-4 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: accent + "15" }}>
                    <svg width="28" height="34" viewBox="0 0 28 34" fill="none"><path d="M14 1C7.37 1 2 6.37 2 13C2 22.25 14 33 14 33C14 33 26 22.25 26 13C26 6.37 20.63 1 14 1ZM14 17.5C11.51 17.5 9.5 15.49 9.5 13C9.5 10.51 11.51 8.5 14 8.5C16.49 8.5 18.5 10.51 18.5 13C18.5 15.49 16.49 17.5 14 17.5Z" fill={accent} fillOpacity="0.35"/></svg>
                  </div>
                  <div>
                    <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg">No saved addresses yet</p>
                    <p className="text-[#9aa89b] text-xs sm:text-sm mt-1">Add a delivery address for faster checkout</p>
                  </div>
                  <button onClick={openAddAddr} className="px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr, idx) => {
                    const lc = ADDR_LABEL_COLORS[addr.label] ?? ADDR_LABEL_COLORS["Other"];
                    return (
                      <div key={addr.id} className="bg-white rounded-2xl border-2 p-4 sm:p-5 transition-all" style={{ borderColor: addr.isDefault ? accent : "#e4ede2" }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ color: lc.color, backgroundColor: lc.bg }}>{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#047857] uppercase tracking-wide">Default</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => openEditAddr(idx)} className="w-7 h-7 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center hover:opacity-80 transition-opacity" title="Edit">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 1.5L10.5 4.5M1 11L2 9L9 1.5L12 4.5L5 12H1V12Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                            </button>
                            <button onClick={() => deleteAddress(idx)} className="w-7 h-7 rounded-lg bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center hover:opacity-80 transition-opacity" title="Delete">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4 3V2H8V3M5 5.5V9M7 5.5V9M3 3L3.5 10H8.5L9 3H3Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                        </div>
                        <p className="font-semibold text-[#073b4c] text-sm">{addr.name}</p>
                        <p className="text-[#6d7a6f] text-xs sm:text-sm mt-0.5 leading-snug">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="text-[#6d7a6f] text-xs sm:text-sm leading-snug">{addr.city}, {addr.state} – {addr.pincode}</p>
                        {addr.phone && <p className="text-[#9aa89b] text-xs mt-1">{addr.phone}</p>}
                        {addr.isDefault ? (
                          <p className="mt-3 text-xs text-[#047857] font-medium flex items-center gap-1.5">
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Auto-fills at checkout
                          </p>
                        ) : (
                          <button onClick={() => setDefaultAddr(idx)} className="mt-3 text-xs font-semibold hover:underline transition-colors" style={{ color: accent }}>
                            Set as default
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ ORDER HISTORY ════ */}
          {section === "orders" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl">Order History</h2>
                  <p className="text-[#9aa89b] text-sm mt-0.5">
                    {displayOrders.length} orders · ₹{totalSpent.toLocaleString()} total spent
                  </p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map((f) => (
                    <button key={f} onClick={() => setOrderFilter(f)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0"
                      style={orderFilter === f
                        ? { backgroundColor: accent, color: "white" }
                        : { backgroundColor: "white", color: "#6d7a6f", border: "1px solid #e4ede2" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e4ede2] py-12 text-center">
                  <p className="text-[#9aa89b] text-sm">No orders with this status.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredOrders.map((o) => {
                    const st = orderStatusStyle(o.status);
                    return (
                      <div key={o.id} className="bg-white rounded-2xl border border-[#e4ede2] p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                              <span className="font-mono text-sm font-bold" style={{ color: accent }}>{o.id}</span>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: st.color, backgroundColor: st.bg }}>{o.status}</span>
                              <span className="text-[#9aa89b] text-xs">{o.date}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {o.items.slice(0, 2).map((item) => (
                                <span key={item} className="text-xs bg-[#f8fafb] text-[#073b4c] border border-[#e4ede2] px-2 py-0.5 rounded-lg">{item}</span>
                              ))}
                              {o.items.length > 2 && (
                                <span className="text-xs text-[#9aa89b] px-1 py-0.5">+{o.items.length - 2} more</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl">₹{o.total.toLocaleString()}</p>
                            <button className="text-xs font-semibold mt-1.5 hover:underline transition-colors" style={{ color: accent }}>
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ LAB BOOKINGS ════ */}
          {section === "lab-tests" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl">Lab Test Bookings</h2>
                  <p className="text-[#9aa89b] text-sm mt-0.5">
                    {dbLabBookings.length} scheduled / past home collection{dbLabBookings.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("lab-tests")}
                  className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accent }}
                >
                  + Book New Test
                </button>
              </div>

              {dbLabBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e4ede2] py-16 flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] text-[#006a39] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3H6v6L2 15c-.83 1.39-.83 3.08 0 4.47C2.83 20.86 4.33 22 6 22h12c1.67 0 3.17-1.14 4-2.53.83-1.39.83-3.08 0-4.47L18 9V3h-3M9 3v6l-4 6h14L15 9V3M9 3h6"/></svg>
                  </div>
                  <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg">No Lab Test Bookings Yet</p>
                  <p className="text-[#9aa89b] text-xs sm:text-sm max-w-sm">
                    Book certified pathology tests from home with free sample pickup and 24-hour smart digital reports.
                  </p>
                  <button
                    onClick={() => onNavigate("lab-tests")}
                    className="mt-2 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accent }}
                  >
                    Browse Health Packages
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dbLabBookings.map((b) => {
                    const isCompleted = b.status === "Completed" || b.status === "Report Generated";
                    return (
                      <div key={b.id} className="bg-white rounded-2xl border border-[#e4ede2] p-5 hover:shadow-xs transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-[#006a39]">{b.booking_number}</span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                b.status === "Scheduled" ? "bg-[#fef3c7] text-[#b45309]" :
                                b.status === "Sample Collected" ? "bg-[#e0f2fe] text-[#0369a1]" :
                                b.status === "Report Generated" || b.status === "Completed" ? "bg-[#d1fae5] text-[#047857]" :
                                "bg-[#fee2e2] text-[#b91c1c]"
                              }`}>
                                {b.status}
                              </span>
                              <span className="text-[#9aa89b] text-xs">
                                Booked on {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>

                            <h3 className="font-bold text-[#073b4c] text-base">{b.package_name}</h3>
                            <p className="text-[#6d7a6f] text-xs mt-1">
                              <strong>Patient:</strong> {b.patient_name} ({b.patient_age} yrs, {b.patient_gender}) · 📞 {b.patient_phone}
                            </p>
                            <p className="text-[#6d7a6f] text-xs mt-0.5">
                              <strong>Sample Collection:</strong> 🗓️ {b.collection_date} ({b.collection_time_slot})
                            </p>
                            <p className="text-[#9aa89b] text-[11px] mt-0.5">
                              📍 {b.collection_address?.line1 || "Address"}, {b.collection_address?.city || ""} {b.collection_address?.pincode ? `- ${b.collection_address.pincode}` : ""}
                            </p>
                          </div>

                          <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#f0f4f0]">
                            <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl">₹{Number(b.total_amount).toLocaleString()}</p>
                            <span className="inline-block text-[10px] text-[#6d7a6f] font-semibold bg-[#f0f4f0] px-2 py-0.5 rounded-md mt-1">
                              {b.payment_method}
                            </span>
                            {isCompleted && (
                              <button className="block w-full sm:w-auto text-xs font-bold text-[#006a39] mt-2 underline">
                                📥 Download Report
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ SECURITY ════ */}
          {section === "security" && (
            <div className="flex flex-col gap-5 max-w-lg">
              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
                <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl mb-5">Change Password</h2>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  {[
                    { label: "Current Password",    val: curPass,  set: setCurPass },
                    { label: "New Password",         val: newPass,  set: setNewPass },
                    { label: "Confirm New Password", val: confPass, set: setConfPass },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">{label}</label>
                      <input type="password" value={val} onChange={(e) => set(e.target.value)} placeholder="••••••••" className={INPUT_CLS}
                        onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                    </div>
                  ))}
                  {passMsg && (
                    <p className={`text-sm font-medium ${passMsg.startsWith("✓") ? "text-[#047857]" : "text-[#c0392b]"}`}>{passMsg}</p>
                  )}
                  <button type="submit" className="w-full sm:w-auto self-start px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>
                    Update Password
                  </button>
                </form>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
                <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base mb-5">Notification Preferences</h3>
                <div className="flex flex-col gap-5">
                  {[
                    { key: "orders" as const,     label: "Order updates via Email",   sub: "Delivery status, confirmations" },
                    { key: "promos" as const,      label: "Offers & promotions via SMS", sub: "Exclusive deals and discounts" },
                    { key: "reminders" as const,   label: "Reorder reminders",         sub: "When your medicines are about to run out" },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[#073b4c] text-sm font-medium">{label}</p>
                        <p className="text-[#9aa89b] text-xs mt-0.5">{sub}</p>
                      </div>
                      <button
                        onClick={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))}
                        className="w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5"
                        style={{ backgroundColor: notifs[key] ? accent : "#d1d5db" }}
                      >
                        <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200" style={{ left: notifs[key] ? "22px" : "4px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border-2 border-[#fee2e2] p-5 sm:p-7">
                <h3 className="font-['Manrope',sans-serif] font-bold text-[#b91c1c] text-base mb-1">Danger Zone</h3>
                <p className="text-[#6d7a6f] text-sm mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                <button className="px-5 py-2 rounded-xl border-2 border-[#b91c1c] text-[#b91c1c] text-sm font-bold hover:bg-[#fee2e2] transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Address Modal ── */}
      {addrModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeAddrModal}>
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-[#e4ede2]">
              <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg">
                {addrModal.mode === "add" ? "Add New Address" : "Edit Address"}
              </h3>
              <button onClick={closeAddrModal} className="w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center hover:bg-[#e4ede2] transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="#073b4c" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="p-4 sm:p-7 flex flex-col gap-4 overflow-y-auto max-h-[72vh]">
              {/* Label selector */}
              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-2">Address Label</label>
                <div className="flex gap-2 flex-wrap">
                  {["Home", "Work", "Shop", "Other"].map((lbl) => {
                    const lc = ADDR_LABEL_COLORS[lbl] ?? ADDR_LABEL_COLORS["Other"];
                    const active = addrModal.form.label === lbl;
                    return (
                      <button key={lbl} type="button" onClick={() => setAddrField("label", lbl)}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                        style={active ? { borderColor: lc.color, backgroundColor: lc.bg, color: lc.color } : { borderColor: "#e4ede2", backgroundColor: "white", color: "#6d7a6f" }}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Full Name *</label>
                  <input type="text" value={addrModal.form.name ?? ""} onChange={(e) => setAddrField("name", e.target.value)}
                    placeholder="Name on address" className={INPUT_CLS}
                    onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Phone Number</label>
                  <input type="tel" value={addrModal.form.phone ?? ""} onChange={(e) => setAddrField("phone", e.target.value.replace(/[^0-9+]/g, ""))}
                    placeholder="9876543210 (10-digit number)" className={INPUT_CLS}
                    onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Address Line 1 *</label>
                <input type="text" value={addrModal.form.line1 ?? ""} onChange={(e) => setAddrField("line1", e.target.value)}
                  placeholder="Flat/House No., Building, Street" className={INPUT_CLS}
                  onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                  Address Line 2 <span className="font-normal normal-case text-[#c0ccc0]">(optional)</span>
                </label>
                <input type="text" value={addrModal.form.line2 ?? ""} onChange={(e) => setAddrField("line2", e.target.value)}
                  placeholder="Area, Landmark, Colony" className={INPUT_CLS}
                  onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "city",    label: "City *",    ph: "Mumbai" },
                  { key: "state",   label: "State *",   ph: "Maharashtra" },
                  { key: "pincode", label: "Pincode *", ph: "400001" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">{f.label}</label>
                    <input type="text" value={(addrModal.form as Record<string, string>)[f.key] ?? ""} onChange={(e) => setAddrField(f.key, e.target.value)}
                      placeholder={f.ph} className={INPUT_CLS}
                      onFocus={(e) => (e.target.style.borderColor = accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addrModal.form.isDefault ?? false}
                  onChange={(e) => setAddrField("isDefault", e.target.checked)}
                  className="w-4 h-4 rounded" style={{ accentColor: accent }} />
                <span className="text-sm text-[#073b4c] font-medium">Set as default delivery address</span>
              </label>
            </div>

            <div className="flex gap-3 px-4 sm:px-7 pb-4 sm:pb-7 pt-2">
              <button onClick={closeAddrModal} className="flex-1 py-3 rounded-xl border-2 border-[#e4ede2] text-[#073b4c] text-sm font-bold hover:bg-[#f0f4f0] transition-colors">
                Cancel
              </button>
              <button onClick={saveAddress} className="flex-1 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: accent }}>
                {addrModal.mode === "add" ? "Add Address" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

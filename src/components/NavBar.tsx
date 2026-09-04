import { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "../contexts/CartContext";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { searchProducts } from "../lib/productSearch";
import ProductDetailModal, { type PopupProduct } from "./ProductModal";
import LocationModal from "./LocationModal";
import {
  UserLocation,
  getSavedLocation,
  detectBrowserLocation,
} from "../lib/location";

import type { Page } from "../App";

interface NavBarProps {
  activePage: Page;
  onNavigate: (page: Page, category?: string, query?: string) => void;
  user?: { role: string; name: string; email: string; id?: string } | null;
  onLogout?: () => void;
  onProfile?: () => void;
  onTrackOrder?: (orderNumber?: string) => void;
  onSearch?: (query: string) => void;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M16.5 16.5L12.875 12.875M14.8333 8.16667C14.8333 11.8486 11.8486 14.8333 8.16667 14.8333C4.48477 14.8333 1.5 11.8486 1.5 8.16667C1.5 4.48477 4.48477 1.5 8.16667 1.5C11.8486 1.5 14.8333 4.48477 14.8333 8.16667Z"
        stroke="#006A39"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 3h2l2.5 12.5a2 2 0 002 1.5h10a2 2 0 002-1.5L22 6H5.5M9 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        stroke="#006A39"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navCategories: { label: string; page: Page; isTrack?: boolean }[] = [
  { label: "🏠 Home", page: "home" },
  { label: "💊 Medicines & OTC", page: "medicines" },
  { label: "🧪 Lab Tests", page: "lab-tests" },
  { label: "🩺 Doctor Consult", page: "consult" },
  { label: "🏷️ Special Offers", page: "offers" },
  { label: "🚚 Track Order", page: "home", isTrack: true },
];

const ROLE_COLORS: Record<string, string> = {
  retailer: "#006a39",
  customer: "#0369a1",
  admin: "#073b4c",
};

export default function NavBar({
  activePage,
  onNavigate,
  user,
  onLogout,
  onProfile,
  onTrackOrder,
  onSearch,
}: NavBarProps) {
  const { itemCount, openCart } = useCart();
  const { settings } = useStoreSettings();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [location, setLocation] = useState<UserLocation>(() => getSavedLocation());
  const [isLocating, setIsLocating] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isRetailer = user?.role === "retailer";

  // Auto-detect GPS location on login
  useEffect(() => {
    let active = true;

    const handleAutoLocation = async () => {
      if (user && !location.isAutoDetected) {
        setIsLocating(true);
        try {
          const loc = await detectBrowserLocation();
          if (active) setLocation(loc);
        } catch (e) {
          // fallback gracefully
        } finally {
          if (active) setIsLocating(false);
        }
      }
    };

    handleAutoLocation();

    const onLocationUpdate = (e: Event) => {
      const detail = (e as CustomEvent<UserLocation>).detail;
      if (detail && active) setLocation(detail);
    };

    window.addEventListener("subhone:location_changed", onLocationUpdate);

    return () => {
      active = false;
      window.removeEventListener("subhone:location_changed", onLocationUpdate);
    };
  }, [user]);

  // Global hotkey Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch products for live search
  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted && data) setDbProducts(data);
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

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smart Search & Similar Products matching
  const searchPayload = useMemo(() => {
    if (!searchValue.trim() || dbProducts.length === 0) return null;
    return searchProducts(dbProducts, searchValue);
  }, [searchValue, dbProducts]);

  const searchResults = useMemo(() => {
    if (!searchPayload) return [];
    return searchPayload.results.slice(0, 8);
  }, [searchPayload]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    setIsSearchOpen(false);
    if (onSearch) {
      onSearch(q);
    } else {
      onNavigate("search", "All", q);
    }
  };

  const handleNavClick = (page: Page, isTrack?: boolean) => {
    if (isTrack) {
      onTrackOrder?.();
      setMobileMenuOpen(false);
      setIsSearchOpen(false);
      return;
    }
    onNavigate(page);
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
  };

  const handleProductSelect = (p: DbProduct) => {
    setSelectedProduct({
      id: p.numeric_id,
      dbId: p.id,
      name: p.name,
      sub: p.details || p.subtitle || p.brand,
      price: `₹${Math.round(p.retailer_price || p.customer_price)}`,
      orig: p.mrp > (p.retailer_price || p.customer_price) ? `₹${Math.round(p.mrp)}` : "",
      disc: p.retailer_discount_percent > 0 ? `${p.retailer_discount_percent}%` : (p.discount_percent > 0 ? `${p.discount_percent}%` : ""),
      cat: p.category_name,
      brand: p.brand,
      img: p.image_url,
      stock: p.stock ?? 50,
    });
    setIsSearchOpen(false);
    setSearchValue("");
  };

  return (
    <>
      <header className="safe-top sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-white/60 shadow-xs transition-all duration-300">
        {/* Tier 1: Main Header Row (Logo, Location, Wide Search, Cart, Profile, Logout) */}
        <div className="max-w-[1480px] mx-auto px-2 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left section: Hamburger, Brand Logo & Location Pill */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl sm:rounded-2xl text-[#073b4c] bg-white/70 hover:bg-white/95 border border-[#dce7db] shadow-2xs backdrop-blur-md transition-all cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-[22px] sm:h-[22px]">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-[22px] sm:h-[22px]">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            {/* SubhOne Logo */}
            <button
              type="button"
              onClick={() => handleNavClick("home")}
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer focus:outline-none group shrink-0"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#006a39] to-[#047857] flex items-center justify-center shadow-md sm:shadow-lg shadow-emerald-900/15 group-hover:scale-105 transition-transform shrink-0 border border-white/30">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="sm:w-[22px] sm:h-[22px]">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-['Manrope',sans-serif] font-black text-[#006a39] text-[11px] min-[360px]:text-xs min-[410px]:text-sm sm:text-2xl tracking-tight drop-shadow-2xs whitespace-nowrap">
                  {settings.storeName || "SubhOne Health Group"}
                </span>
                <span className="text-[8px] sm:text-[9px] font-extrabold text-[#047857] tracking-widest uppercase hidden min-[480px]:inline">
                  Pharmacy & Diagnostic
                </span>
              </div>
            </button>

            {/* Delivery Location Selector Pill */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 hover:bg-white/95 border border-[#dce7db] shadow-xs backdrop-blur-md transition-all cursor-pointer group text-left"
              title="Change Delivery Location"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#006a39] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {isLocating ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#006a39] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xs">📍</span>
                )}
              </div>
              <div className="flex flex-col leading-tight max-w-[150px] lg:max-w-[180px]">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-extrabold uppercase text-[#728575] tracking-wider">Deliver To</span>
                  <span className="text-[9px] bg-emerald-100/90 text-emerald-900 font-bold px-1.5 py-0.2 rounded-full">
                    {location.pincode}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#073b4c] truncate">
                  {location.city || location.area || "Select Location"}
                </span>
              </div>
              <span className="text-[#8aa08e] text-xs font-bold group-hover:translate-y-0.5 transition-transform">▾</span>
            </button>
          </div>

          {/* Center section: Large Omnisearch Bar (desktop/tablet only — mobile has its own below) */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search medicines, brands, salts, FMCG..."
                className="w-full bg-white/80 backdrop-blur-md border border-[#dce7db] hover:border-[#006a39]/40 focus:border-[#006a39] rounded-2xl py-2 sm:py-2.5 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm text-[#073b4c] placeholder-[#8aa08e] shadow-xs focus:shadow-md focus:bg-white transition-all outline-none"
              />
              <button
                type="submit"
                className="absolute left-3 sm:left-3.5 flex items-center justify-center text-[#006a39] hover:scale-110 transition-transform cursor-pointer"
                title="Search Products"
              >
                <SearchIcon />
              </button>
              {searchValue && (
                <button
                  type="button"
                  onClick={() => { setSearchValue(""); searchInputRef.current?.focus(); }}
                  className="absolute right-3 w-5 h-5 rounded-full bg-[#f0f7f0] text-[#728575] hover:text-[#073b4c] text-xs flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Omnisearch Dropdown Results */}
            {isSearchOpen && (searchValue.trim().length > 0 || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-[#e4ede2]/80 bg-[#f7faf8]/80 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006a39]">
                    {searchValue.trim() ? `Search Results (${searchPayload?.results.length || 0})` : "Popular Search Queries"}
                  </span>
                  <button onClick={() => setIsSearchOpen(false)} className="text-xs text-[#728575] hover:text-[#073b4c] font-bold">
                    Close ✕
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#f0f5f1]">
                  {searchResults.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#728575]">
                      No products matching &quot;{searchValue}&quot;. Press enter to explore similar recommendations.
                    </div>
                  ) : (
                    searchResults.map((item) => {
                      const prod = item.product;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleProductSelect(prod)}
                          className="p-2.5 rounded-2xl hover:bg-[#f0f7f1] flex items-center gap-3 cursor-pointer transition-all group"
                        >
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-11 h-11 rounded-xl object-contain bg-white border border-[#e4ede2] p-1 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80"; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-['Manrope',sans-serif] font-bold text-xs text-[#073b4c] group-hover:text-[#006a39] truncate">
                                {prod.name}
                              </p>
                              {item.isSimilar && (
                                <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                  {item.similarityReason === "brand" ? "Same Brand" : "Similar"}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#728575] truncate">
                              {prod.brand} · {prod.category_name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs text-[#073b4c] block">
                              ₹{Math.round(prod.retailer_price || prod.customer_price)}
                            </span>
                            {prod.mrp > (prod.retailer_price || prod.customer_price) && (
                              <span className="text-[9px] text-[#8aa08e] line-through">
                                ₹{Math.round(prod.mrp)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {searchValue.trim() && (
                  <div className="p-2.5 bg-[#f0f7f1] border-t border-[#e4ede2]">
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full py-2 px-3 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>View all {searchPayload?.results.length || 0} results &amp; similar products for &ldquo;{searchValue}&rdquo;</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Right section: Cart, Highly Visible Profile, Highly Visible Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/80 hover:bg-emerald-50/90 border border-emerald-200/80 backdrop-blur-md transition-all relative text-[#006a39] cursor-pointer flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group shrink-0"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:static bg-gradient-to-br from-[#006a39] to-[#047857] text-white text-[10px] sm:text-[11px] font-black rounded-full px-1.5 py-0.2 sm:px-2 sm:py-0.5 min-w-[18px] text-center shadow-xs border border-white/40">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile Button */}
            {user && (
              <button
                type="button"
                onClick={() => {
                  onProfile?.();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:px-3.5 sm:py-1.5 rounded-2xl bg-white/80 hover:bg-white/95 border border-[#dce7db] backdrop-blur-md transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group shrink-0"
                title="View Profile & Account Details"
                aria-label="Profile"
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-['Manrope',sans-serif] font-black text-xs text-white shrink-0 shadow-xs ring-1 ring-white/60"
                  style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#006a39" }}
                >
                  {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col leading-tight text-left max-w-[100px] md:max-w-[140px] lg:max-w-[160px]">
                  <span className="text-xs font-black text-[#073b4c] truncate group-hover:text-[#006a39]">
                    {user.name || "My Account"}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#006a39]">
                    {user.role}
                  </span>
                </div>
              </button>
            )}

            {/* Glassmorphic Logout Button */}
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-rose-500/90 hover:bg-rose-600 text-white border border-rose-400/60 backdrop-blur-md transition-all text-xs sm:text-sm font-black whitespace-nowrap cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shrink-0"
                title="Sign Out of Your Account"
                aria-label="Logout"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {/* Sign In Button for Guests / Not Logged In */}
            {!user && (
              <button
                type="button"
                onClick={() => {
                  onProfile?.();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/15 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Sign In or Register Account"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>



        {/* Mobile Dedicated Search Bar (Visible on mobile screens < md) */}
        <div className="md:hidden px-3 pt-1 pb-2.5 bg-white border-t border-[#f0f4f0] relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <button
              type="submit"
              className="absolute inset-y-0 left-3 flex items-center text-[#006a39] cursor-pointer"
              title="Search"
            >
              <SearchIcon />
            </button>
            <input
              type="text"
              value={searchValue}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search medicines, brands, stock…"
              className="w-full pl-9 pr-8 py-2 bg-[#f3f7f2] border border-[#d6e5d4] rounded-xl text-xs text-[#073b4c] placeholder:text-[#6d7a6f] focus:outline-none focus:bg-white focus:border-[#006a39] transition-all font-semibold"
            />
            {searchValue.trim() && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute inset-y-0 right-2.5 flex items-center text-[#9aa89b]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </form>

          {/* Mobile Search Results Dropdown */}
          {isSearchOpen && searchValue.trim().length > 0 && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white rounded-xl shadow-2xl border border-[#e4ede2] overflow-hidden z-50 max-h-[280px] overflow-y-auto divide-y divide-[#f0f4f0]">
              <div className="p-2 bg-[#f8fafb] flex items-center justify-between text-[11px] text-[#6d7a6f] px-3 font-bold">
                <span>Results for &quot;{searchValue}&quot;</span>
                <span className="text-[#006a39]">{searchPayload?.results.length || 0} found</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#9aa89b]">No direct matches. Press Search to explore similar items.</div>
              ) : (
                searchResults.map((item) => {
                  const p = item.product;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductSelect(p)}
                      className="p-2.5 flex items-center justify-between text-xs hover:bg-[#f5fbf2] cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 object-contain rounded shrink-0 bg-gray-50 p-0.5" />
                        <div className="truncate">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-[#073b4c] truncate">{p.name}</p>
                            {item.isSimilar && (
                              <span className="bg-blue-100 text-blue-800 text-[7px] font-black px-1 py-0.2 rounded uppercase">
                                {item.similarityReason === "brand" ? "Brand" : "Similar"}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#9aa89b] truncate">{p.brand} · {p.category_name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-[#073b4c]">₹{Math.round(p.retailer_price || p.customer_price)}</p>
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                          (p.stock ?? 0) <= 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {(p.stock ?? 0) <= 0 ? "Out" : `${p.stock} in stock`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {searchValue.trim() && (
                <div className="p-2 bg-[#f0f7f1] border-t border-[#e4ede2]">
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="w-full py-2 px-3 rounded-lg bg-[#006a39] text-white text-xs font-bold text-center block cursor-pointer"
                  >
                    View all results &amp; similar products →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Location & Express Strip */}
        <div className="md:hidden px-3 py-1.5 bg-[#f8fafb] border-t border-[#e4ede2] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 text-[#073b4c] font-bold truncate cursor-pointer text-[11px]"
          >
            <span className="text-[#006a39]">📍</span>
            <span className="truncate">
              Deliver to: <strong>{location.area || location.city} ({location.pincode})</strong>
            </span>
            <span className="text-[#006a39] text-[10px]">▼</span>
          </button>
          <span className="text-[9px] font-extrabold text-[#006a39] bg-[#d1fae5] px-2 py-0.5 rounded-full shrink-0">
            ⚡ 30-min Delivery
          </span>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#e4ede2] bg-white px-4 py-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1.5">
              {navCategories.map(({ label, page, isTrack }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavClick(page, isTrack)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    !isTrack && activePage === page
                      ? "bg-[#006a39] text-white shadow-xs"
                      : "text-[#3e4a3f] hover:bg-[#f8fafb]"
                  }`}
                >
                  <span>{label}</span>
                  {!isTrack && activePage === page && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              ))}

              {/* 24/7 Live Customer Support Mobile Trigger */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("subhone:open_support_chat"));
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-black bg-emerald-50 text-[#006a39] border border-emerald-200/90 hover:bg-emerald-100 transition-colors mt-2 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span>24/7 Customer Care Chat</span>
                </div>
                <span className="text-[10px] bg-[#006a39] text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Online</span>
              </button>
            </nav>

            {user ? (
              <div className="mt-4 pt-4 border-t border-[#f0f4f0] flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onProfile?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] hover:bg-[#dcfce7] transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-['Manrope',sans-serif] font-black text-sm text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#006a39" }}
                  >
                    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#073b4c] truncate">{user.name}</p>
                    <p className="text-xs text-[#006a39] font-extrabold capitalize">
                      {user.role} Account · View Profile
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-3 rounded-xl text-sm font-black text-white bg-[#dc2626] hover:bg-[#b91c1c] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out / Logout</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-[#f0f4f0]">
                <button
                  type="button"
                  onClick={() => {
                    onProfile?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#006a39] to-[#047857] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isRetailer={isRetailer}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onLocationChange={(newLoc) => setLocation(newLoc)}
        userId={user?.id}
      />
    </>
  );
}

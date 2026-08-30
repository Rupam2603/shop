import { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "../contexts/CartContext";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import ProductDetailModal, { type PopupProduct } from "./ProductModal";
import LocationModal from "./LocationModal";
import {
  UserLocation,
  getSavedLocation,
  detectBrowserLocation,
} from "../lib/location";

type Page = "home" | "medicines" | "lab-tests" | "consult" | "offers" | "profile" | "checkout";

interface NavBarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  user?: { role: string; name: string; email: string; id?: string } | null;
  onLogout?: () => void;
  onProfile?: () => void;
  onTrackOrder?: (orderNumber?: string) => void;
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

  // Global hotkey Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
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

  const searchResults = useMemo(() => {
    if (!searchValue.trim() || dbProducts.length === 0) return [];
    const query = searchValue.toLowerCase().trim();
    return dbProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category_name.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchValue, dbProducts]);

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
      price: isRetailer
        ? `₹${Math.round(p.retailer_price)}`
        : `₹${Math.round(p.customer_price)}`,
      orig: p.mrp > p.customer_price ? `₹${Math.round(p.mrp)}` : "",
      disc: p.discount_percent > 0 ? `${p.discount_percent}%` : "",
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
      <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-[#e4ede2]/90">
        {/* Tier 1: Main Header Row (Logo, Location, Wide Search, Cart, Profile, Logout) */}
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left section: Hamburger, Brand Logo & Location Pill */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#073b4c] hover:bg-[#f0f7f0] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-br from-[#006a39] to-[#047857] flex items-center justify-center shadow-md shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-['Manrope',sans-serif] font-black text-[#006a39] text-xl sm:text-2xl tracking-tight">
                  {settings.storeName || "SubhOne"}
                </span>
                <span className="text-[9px] font-extrabold text-[#047857] tracking-wider uppercase hidden sm:inline">
                  Pharmacy & Wellness
                </span>
              </div>
            </button>

            {/* Location Selector Widget (Desktop/Tablet) */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#d2e4d0] bg-[#f0f9f1] hover:bg-[#e2f4e3] hover:border-[#006a39] transition-all text-left cursor-pointer group shadow-2xs shrink-0"
              title="Change Delivery Location"
            >
              <div className="w-7 h-7 rounded-lg bg-[#006a39] text-white flex items-center justify-center shrink-0 shadow-2xs">
                {isLocating ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </div>
              <div className="flex flex-col leading-tight max-w-[110px] md:max-w-[140px] lg:max-w-[160px]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-[#006a39] uppercase tracking-wider">
                    Express to
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                </div>
                <span className="text-xs font-extrabold text-[#073b4c] truncate group-hover:text-[#006a39] flex items-center gap-0.5">
                  <span className="truncate">{location.city} {location.pincode ? `(${location.pincode})` : ""}</span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[#006a39]">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </button>
          </div>

          {/* Center: WIDE Flexible Search Bar (Desktop & Tablet) */}
          <div
            ref={searchRef}
            className="hidden md:flex flex-1 min-w-[220px] max-w-2xl xl:max-w-3xl mx-2 lg:mx-4 relative"
          >
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#006a39] group-focus-within:scale-110 transition-transform">
                <SearchIcon />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setIsSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchValue.trim()) {
                    setIsSearchOpen(false);
                    onNavigate("medicines");
                  }
                }}
                placeholder="Search medicines, supplements, brands, active stock…"
                className="w-full pl-11 pr-20 py-2.5 sm:py-3 bg-[#f3f7f2] hover:bg-[#ebf4ea] border border-[#d6e5d4] rounded-2xl text-xs sm:text-sm text-[#073b4c] placeholder:text-[#6d7a6f] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-[#006a39]/15 transition-all shadow-inner font-semibold"
              />

              {/* Clear button or Keyboard Shortcut Hint */}
              <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
                {searchValue.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-full text-[#9aa89b] hover:text-[#073b4c] hover:bg-gray-200 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-[#006a39] bg-white border border-[#bbf7d0] rounded-md shadow-2xs">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchOpen && searchValue.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#e4ede2] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 border-b border-[#f0f4f0] bg-[#f8fafb] flex items-center justify-between text-xs text-[#6d7a6f] px-4">
                  <span className="font-bold text-[#073b4c]">Live Pharmacy Results</span>
                  <span className="bg-[#e8f5ee] text-[#006a39] font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
                  </span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#9aa89b]">
                    No medicines found for &quot;{searchValue}&quot;. Try searching generic name or category.
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f0f4f0]">
                    {searchResults.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLow = p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleProductSelect(p)}
                          className="p-3 hover:bg-[#f5fbf2] transition-colors flex items-center gap-3.5 cursor-pointer group"
                        >
                          <div className="w-12 h-12 bg-[#f8fafb] border border-[#e4ede2] rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 group-hover:border-[#006a39] transition-colors">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#073b4c] truncate group-hover:text-[#006a39]">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-[#6d7a6f] truncate">
                              {p.brand} · <span className="text-[#006a39] font-semibold">{p.category_name}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="font-['Manrope',sans-serif] font-extrabold text-sm text-[#073b4c]">
                              ₹{Math.round(isRetailer ? p.retailer_price : p.customer_price)}
                            </span>
                            {isOutOfStock ? (
                              <span className="text-[9px] font-extrabold text-[#b91c1c] bg-[#fee2e2] border border-[#fecaca] px-1.5 py-0.5 rounded uppercase">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="text-[9px] font-bold text-[#b45309] bg-[#fef3c7] border border-[#fde68a] px-1.5 py-0.5 rounded animate-pulse">
                                Only {p.stock} Left
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-[#047857] bg-[#d1fae5] px-1.5 py-0.5 rounded">
                                {p.stock} in stock
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-3 bg-[#f8fafb] border-t border-[#f0f4f0] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      onNavigate("medicines");
                    }}
                    className="text-xs font-bold text-[#006a39] hover:underline cursor-pointer"
                  >
                    View entire medicine catalog & active stock →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right section: Cart, Highly Visible Profile, Highly Visible Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="p-2 sm:p-2.5 rounded-2xl bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] transition-all relative text-[#006a39] cursor-pointer flex items-center gap-1.5 shadow-xs group"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className="bg-[#006a39] text-white text-[11px] font-black rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-xs">
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
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-2xl bg-[#e8f5ee] hover:bg-[#d1fae5] border border-[#a7f3d0] transition-all cursor-pointer shadow-2xs group shrink-0"
                title="View Profile & Account Details"
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-['Manrope',sans-serif] font-black text-xs text-white shrink-0 shadow-sm ring-1 ring-white"
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

            {/* Red Logout Button */}
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white border border-[#b91c1c] transition-all text-xs sm:text-sm font-black whitespace-nowrap cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
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
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/15 transition-all cursor-pointer shrink-0 active:scale-95"
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
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#006a39]">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchValue}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  setIsSearchOpen(false);
                  onNavigate("medicines");
                }
              }}
              placeholder="Search medicines, supplements, stock…"
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
          </div>

          {/* Mobile Search Results Dropdown */}
          {isSearchOpen && searchValue.trim().length > 0 && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white rounded-xl shadow-2xl border border-[#e4ede2] overflow-hidden z-50 max-h-[280px] overflow-y-auto divide-y divide-[#f0f4f0]">
              <div className="p-2 bg-[#f8fafb] flex items-center justify-between text-[11px] text-[#6d7a6f] px-3 font-bold">
                <span>Results for &quot;{searchValue}&quot;</span>
                <span className="text-[#006a39]">{searchResults.length} found</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#9aa89b]">No products found</div>
              ) : (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProductSelect(p)}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-[#f5fbf2] cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={p.image_url} alt={p.name} className="w-8 h-8 object-contain rounded shrink-0 bg-gray-50 p-0.5" />
                      <div className="truncate">
                        <p className="font-bold text-[#073b4c] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#9aa89b] truncate">{p.brand} · {p.category_name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-[#073b4c]">₹{Math.round(isRetailer ? p.retailer_price : p.customer_price)}</p>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                        p.stock <= 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {p.stock <= 0 ? "Out" : `${p.stock} in stock`}
                      </span>
                    </div>
                  </div>
                ))
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
            </nav>

            {user && (
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

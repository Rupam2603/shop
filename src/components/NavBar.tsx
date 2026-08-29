import { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "../contexts/CartContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import ProductDetailModal, { type PopupProduct } from "./ProductModal";
import LocationModal from "./LocationModal";
import {
  UserLocation,
  getSavedLocation,
  saveLocation,
  detectBrowserLocation,
} from "../lib/location";
import { UserButton, SignedIn } from "@clerk/clerk-react";

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
        stroke="#073B4C"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M1 1H3L3.4 3M5 11H17L19 3H3.4M5 11L3.4 3M5 11L2.7 14.3C2.31 14.87 2.72 15.67 3.4 15.67H17M17 15.67C16.07 15.67 15.33 16.41 15.33 17.33C15.33 18.26 16.07 19 17 19C17.93 19 18.67 18.26 18.67 17.33C18.67 16.41 17.93 15.67 17 15.67ZM7.67 17.33C7.67 18.26 6.93 19 6 19C5.07 19 4.33 18.26 4.33 17.33C4.33 16.41 5.07 15.67 6 15.67C6.93 15.67 7.67 16.41 7.67 17.33Z"
        stroke="#006A39"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navLinks: { label: string; page: Page; isTrack?: boolean }[] = [
  { label: "Home", page: "home" },
  { label: "OTC & Medicines", page: "medicines" },
  { label: "Lab Tests", page: "lab-tests" },
  { label: "Consult", page: "consult" },
  { label: "Offers", page: "offers" },
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

  // 1. Automatically detect current location when user logs in or on first visit
  useEffect(() => {
    let active = true;

    const handleAutoLocation = async () => {
      // If user is logged in, try to auto-detect live location if not already detected
      if (user && !location.isAutoDetected) {
        setIsLocating(true);
        try {
          const loc = await detectBrowserLocation();
          if (active) {
            setLocation(loc);
          }
        } catch (e) {
          // If denied, fallback to saved or default location
        } finally {
          if (active) setIsLocating(false);
        }
      }
    };

    handleAutoLocation();

    // Listen to location change events across components
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

  // 2. Global keyboard shortcut (Cmd+K / Ctrl+K) to focus search
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

  // 3. Load DB products for live search
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e4ede2]/80 shadow-xs transition-all">
        {/* Main Nav Container */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left section: Hamburger, Logo & Location */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#073b4c] hover:bg-[#f0f7f0] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <button
              type="button"
              onClick={() => handleNavClick("home")}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-[#006a39] to-[#047857] flex items-center justify-center shadow-sm shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-['Manrope',sans-serif] font-black text-[#006a39] text-lg sm:text-2xl tracking-tight">
                  SubhOne
                </span>
                <span className="text-[9px] font-bold text-[#6d7a6f] tracking-wider uppercase hidden sm:inline">
                  Pharmacy & Health
                </span>
              </div>
            </button>

            {/* Location Selector Widget (Desktop & Tablet) */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#e4ede2] bg-[#f8fafb] hover:bg-[#f0f7f0] hover:border-[#bbf7d0] transition-all text-left cursor-pointer group shadow-2xs shrink-0"
              title="Change Delivery Location"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#e8f5ee] text-[#006a39] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {isLocating ? (
                  <span className="w-3 h-3 border-2 border-[#006a39] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                      fill="#006a39"
                    />
                  </svg>
                )}
              </div>
              <div className="flex flex-col leading-tight max-w-[90px] md:max-w-[130px] lg:max-w-[160px]">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-[#6d7a6f] uppercase tracking-wider">
                    Express to
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#073b4c] truncate group-hover:text-[#006a39] flex items-center gap-0.5">
                  <span className="truncate">{location.city} {location.pincode ? `(${location.pincode})` : ""}</span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[#9aa89b]">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </button>
          </div>

          {/* Center: Flexible Responsive Search Bar (Tablet & Desktop) */}
          <div
            ref={searchRef}
            className="hidden md:flex flex-1 min-w-[200px] max-w-full lg:max-w-2xl xl:max-w-3xl mx-2 lg:mx-4 relative"
          >
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-3.5 sm:left-4 flex items-center pointer-events-none text-[#6d7a6f] group-focus-within:text-[#006a39] transition-colors">
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
                className="w-full pl-10 sm:pl-11 pr-16 sm:pr-20 py-2 sm:py-2.5 bg-[#f0f4f0] hover:bg-[#ebf2eb] border border-transparent rounded-2xl text-xs sm:text-sm text-[#073b4c] placeholder:text-[#6d7a6f] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-3 focus:ring-[#006a39]/10 transition-all shadow-2xs font-medium"
              />

              {/* Clear button or Keyboard Shortcut Hint */}
              <div className="absolute inset-y-0 right-2.5 sm:right-3 flex items-center gap-1.5">
                {searchValue.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-full text-[#9aa89b] hover:text-[#073b4c] hover:bg-gray-200 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-[#8b998a] bg-white border border-[#d5ded4] rounded-md shadow-2xs">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Live Search Results Dropdown (Desktop/Tablet) */}
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
                              {p.brand} · <span className="text-[#006a39]">{p.category_name}</span>
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

          {/* Right section: Desktop Nav Links & User Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop Navigation links */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map(({ label, page, isTrack }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavClick(page, isTrack)}
                  className={`px-3 py-2 text-xs font-bold transition-colors rounded-xl cursor-pointer ${
                    !isTrack && activePage === page
                      ? "bg-[#e8f5ee] text-[#006a39]"
                      : "text-[#3e4a3f] hover:text-[#006a39] hover:bg-[#f0f7f0]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-[#f0f7f0] border border-transparent hover:border-[#e4ede2] transition-all relative text-[#006a39] cursor-pointer flex items-center gap-1.5"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className="bg-[#006a39] text-white text-[10px] sm:text-[11px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] sm:min-w-[20px] text-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Profile & Logout Section */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1 sm:pl-2 border-l border-[#e2e8df]">
                {/* Profile Pill Button */}
                <button
                  type="button"
                  onClick={() => {
                    onProfile?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#f8fafb] hover:bg-[#e8f5ee] border border-[#e4ede2] hover:border-[#bbf7d0] transition-all cursor-pointer shadow-2xs group"
                  title="View Profile & Account Details"
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-['Manrope',sans-serif] font-black text-xs text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#073b4c" }}
                  >
                    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight text-left max-w-[80px] sm:max-w-[120px] md:max-w-[140px]">
                    <span className="text-xs font-bold text-[#073b4c] truncate group-hover:text-[#006a39]">
                      {user.name || "My Account"}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#006a39]">
                      {user.role}
                    </span>
                  </div>
                </button>

                {/* Visible Logout Pill Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#fff1f0] hover:bg-[#fee2e2] text-[#c0392b] hover:text-[#9a2e1e] border border-[#ffd5cf] transition-all text-xs font-bold whitespace-nowrap cursor-pointer shadow-2xs active:scale-95"
                  title="Sign Out"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Dedicated Search Bar (Visible on mobile screens < md) */}
        <div className="md:hidden px-3 pt-1 pb-2.5 bg-white border-t border-[#f0f4f0] relative">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#6d7a6f]">
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
              className="w-full pl-9 pr-8 py-2 bg-[#f0f4f0] border border-transparent rounded-xl text-xs text-[#073b4c] placeholder:text-[#6d7a6f] focus:outline-none focus:bg-white focus:border-[#006a39] transition-all font-medium"
            />
            {searchValue.trim() && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute inset-y-0 right-2.5 flex items-center text-[#9aa89b]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile Search Results Dropdown */}
          {isSearchOpen && searchValue.trim().length > 0 && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white rounded-xl shadow-2xl border border-[#e4ede2] overflow-hidden z-50 max-h-[280px] overflow-y-auto divide-y divide-[#f0f4f0]">
              <div className="p-2 bg-[#f8fafb] flex items-center justify-between text-[11px] text-[#6d7a6f] px-3 font-semibold">
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
            <span className="text-[#9aa89b] text-[9px]">▼</span>
          </button>
          <span className="text-[9px] font-extrabold text-[#006a39] bg-[#d1fae5] px-1.5 py-0.5 rounded-full shrink-0">
            ⚡ 30-min
          </span>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#e4ede2] bg-white px-4 py-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1.5">
              {navLinks.map(({ label, page, isTrack }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavClick(page, isTrack)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    !isTrack && activePage === page
                      ? "bg-[#e8f5ee] text-[#006a39]"
                      : "text-[#3e4a3f] hover:bg-[#f8fafb]"
                  }`}
                >
                  <span>{label}</span>
                  {!isTrack && activePage === page && (
                    <span className="w-2 h-2 rounded-full bg-[#006a39]" />
                  )}
                </button>
              ))}
            </nav>

            {user && (
              <div className="mt-4 pt-4 border-t border-[#f0f4f0] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onProfile?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8fafb] transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-['Manrope',sans-serif] font-bold text-sm text-white shrink-0"
                    style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#073b4c" }}
                  >
                    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#073b4c] truncate">{user.name}</p>
                    <p className="text-xs text-[#006a39] font-semibold capitalize">
                      {user.role} · View Profile
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#c0392b] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                >
                  Logout
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

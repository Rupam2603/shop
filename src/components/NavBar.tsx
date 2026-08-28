import { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "../contexts/CartContext";
import { useModalBackHandler } from "../lib/navigation";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import ProductDetailModal, { nameToId, type PopupProduct } from "./ProductModal";
import { UserButton, SignedIn } from "@clerk/clerk-react";

type Page = "home" | "medicines" | "lab-tests" | "consult" | "offers" | "profile";

interface NavBarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  user?: { role: string; name: string; email: string } | null;
  onLogout?: () => void;
  onProfile?: () => void;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M16.5 16.5L12.875 12.875M14.8333 8.16667C14.8333 11.8486 11.8486 14.8333 8.16667 14.8333C4.48477 14.8333 1.5 11.8486 1.5 8.16667C1.5 4.48477 4.48477 1.5 8.16667 1.5C11.8486 1.5 14.8333 4.48477 14.8333 8.16667Z"
        stroke="#073B4C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
      <path
        d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 18 7 18C7 18 14 12.25 14 7C14 3.13 10.87 0 7 0ZM7 9.5C5.62 9.5 4.5 8.38 4.5 7C4.5 5.62 5.62 4.5 7 4.5C8.38 4.5 9.5 5.62 9.5 7C9.5 8.38 8.38 9.5 7 9.5Z"
        fill="#006A39"
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

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z"
        stroke="#006A39"
        strokeWidth="1.5"
      />
      <path
        d="M2 18C2 14.6863 5.58172 12 10 12C14.4183 12 18 14.6863 18 18"
        stroke="#006A39"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navLinks: { label: string; page: Page }[] = [
  { label: "Home", page: "home" },
  { label: "OTC & Wellness", page: "medicines" },
  { label: "Lab Tests", page: "lab-tests" },
  { label: "Consult", page: "consult" },
  { label: "Offers", page: "offers" },
  { label: "My Profile", page: "profile" },
];

const ROLE_COLORS: Record<string, string> = {
  retailer: "#006a39",
  customer: "#0369a1",
  admin: "#073b4c",
};

export default function NavBar({ activePage, onNavigate, user, onLogout, onProfile }: NavBarProps) {
  const { itemCount, openCart } = useCart();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const isRetailer = user?.role === "retailer";

  useModalBackHandler(mobileMenuOpen, () => setMobileMenuOpen(false), "mobile-menu");

  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted && data) setDbProducts(data);
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
      .slice(0, 6);
  }, [searchValue, dbProducts]);

  const handleNavClick = (page: Page) => {
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
      price: isRetailer ? `₹${Math.round(p.retailer_price)}` : `₹${Math.round(p.customer_price)}`,
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
      <header
        className="sticky top-0 z-50 bg-white border-b border-[#bdcabc]"
        style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05)" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#073b4c] hover:bg-[#f0f7f0] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#006a39] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" />
              </svg>
            </div>
            <span className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-xl sm:text-2xl tracking-tight">
              SubhOne
            </span>
          </button>

          {/* Desktop Search bar with Live Stock Results */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-[420px] mx-2 lg:mx-6 relative">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#6d7a6f]">
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
                placeholder="Search medicines, stock, brands…"
                className="w-full pl-10 pr-4 py-2 bg-[#f0f4f0] border border-transparent rounded-full text-xs sm:text-sm text-[#073b4c] placeholder:text-[#6d7a6f] focus:outline-none focus:bg-white focus:border-[#006a39] transition-all"
              />
            </div>

            {/* Live Real-Time Search Results Dropdown */}
            {isSearchOpen && searchValue.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#e4ede2] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-2 border-b border-[#f0f4f0] bg-[#f8fafb] flex items-center justify-between text-[11px] text-[#6d7a6f] px-3">
                  <span>Live Product & Stock Search</span>
                  <span>{searchResults.length} match{searchResults.length === 1 ? "" : "es"}</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#9aa89b]">
                    No products found matching "{searchValue}"
                  </div>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[#f0f4f0]">
                    {searchResults.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLow = p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleProductSelect(p)}
                          className="p-2.5 sm:p-3 hover:bg-[#f5fbf2] transition-colors flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 bg-[#f8fafb] border border-[#e4ede2] rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                            <img src={p.image_url} alt={p.name} className="h-full max-w-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#073b4c] truncate group-hover:text-[#006a39]">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-[#9aa89b] truncate">{p.brand} · {p.category_name}</p>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                            <span className="font-['Manrope',sans-serif] font-bold text-xs text-[#073b4c]">
                              ₹{Math.round(isRetailer ? p.retailer_price : p.customer_price)}
                            </span>
                            {/* Stock Badge in Search Dropdown */}
                            {isOutOfStock ? (
                              <span className="text-[9px] font-extrabold text-[#b91c1c] bg-[#fee2e2] border border-[#fecaca] px-1.5 py-0.2 rounded uppercase">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="text-[9px] font-bold text-[#b45309] bg-[#fef3c7] border border-[#fde68a] px-1.5 py-0.2 rounded animate-pulse">
                                Only {p.stock} Left
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-[#047857] bg-[#d1fae5] px-1.5 py-0.2 rounded">
                                {p.stock} in stock
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="p-2 bg-[#f8fafb] border-t border-[#f0f4f0] text-center">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      onNavigate("medicines");
                    }}
                    className="text-xs font-bold text-[#006a39] hover:underline"
                  >
                    View all medicines & stock →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => handleNavClick(page)}
                className={`relative px-3 py-2 text-xs sm:text-sm font-semibold transition-colors rounded-lg ${
                  activePage === page
                    ? "text-[#006a39]"
                    : "text-[#3e4a3f] hover:text-[#006a39]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Trailing icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button className="hidden sm:flex p-2 rounded-full hover:bg-[#f0f7f0] transition-colors relative text-[#006a39]" title="Location">
              <LocationIcon />
            </button>
            <button
              onClick={openCart}
              className="p-2 rounded-full hover:bg-[#f0f7f0] transition-colors relative text-[#006a39]"
              title="Shopping Cart"
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#0f9d58] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {itemCount}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-3 border-l border-[#e2e8df]">
                <SignedIn>
                  <div className="flex items-center">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <button
                  onClick={() => { onProfile?.(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 group cursor-pointer"
                  title="View profile"
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-['Manrope',sans-serif] font-bold text-xs sm:text-sm text-white shrink-0 group-hover:ring-2 group-hover:ring-offset-1 transition-all"
                    style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#073b4c" }}
                  >
                    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col leading-none text-left">
                    <span className="text-xs font-bold text-[#073b4c] group-hover:underline">{user.name || "My Account"}</span>
                    <span className="text-[10px] text-[#9aa89b] capitalize mt-0.5">{user.role}</span>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="hidden sm:inline-block ml-1 text-xs font-bold text-[#c0392b] hover:text-[#9a2e1e] transition-colors whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button className="p-2 rounded-full hover:bg-[#f0f7f0] transition-colors">
                <AccountIcon />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer Menu with Search & Links */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#e4ede2] bg-white px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <div className="mb-4 relative">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#6d7a6f]">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchValue.trim()) {
                      setMobileMenuOpen(false);
                      onNavigate("medicines");
                    }
                  }}
                  placeholder="Search medicines, stock, brands…"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f0] border border-transparent rounded-xl text-xs text-[#073b4c] placeholder:text-[#6d7a6f] focus:outline-none focus:bg-white focus:border-[#006a39] transition-all"
                />
              </div>

              {searchValue.trim().length > 0 && (
                <div className="mt-2 bg-white rounded-xl shadow-md border border-[#e4ede2] overflow-hidden max-h-[220px] overflow-y-auto divide-y divide-[#f0f4f0]">
                  {searchResults.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleProductSelect(p);
                          setMobileMenuOpen(false);
                        }}
                        className="p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-[#f5fbf2]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={p.image_url} alt={p.name} className="w-7 h-7 object-contain rounded" />
                          <span className="font-semibold text-[#073b4c] truncate">{p.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isOutOfStock ? "bg-red-100 text-red-700" : isLow ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {isOutOfStock ? "Out" : `${p.stock} in stock`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <nav className="flex flex-col gap-1">
              {navLinks.map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => handleNavClick(page)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    activePage === page
                      ? "bg-[#e8f5ee] text-[#006a39]"
                      : "text-[#3e4a3f] hover:bg-[#f8fafb]"
                  }`}
                >
                  <span>{label}</span>
                  {activePage === page && (
                    <span className="w-2 h-2 rounded-full bg-[#006a39]" />
                  )}
                </button>
              ))}
            </nav>

            {user && (
              <div className="mt-4 pt-3 border-t border-[#f0f4f0] flex flex-col gap-2">
                <button
                  onClick={() => { onProfile?.(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f8fafb] transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-['Manrope',sans-serif] font-bold text-sm text-white shrink-0"
                    style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#073b4c" }}
                  >
                    {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#073b4c] truncate">{user.name}</p>
                    <p className="text-xs text-[#9aa89b] capitalize">{user.role} · View Profile</p>
                  </div>
                </button>
                <button
                  onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-[#c0392b] hover:bg-[#fee2e2] transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isRetailer={isRetailer}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}


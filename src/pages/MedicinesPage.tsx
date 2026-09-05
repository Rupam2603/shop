import { useState, useMemo, useEffect } from "react";
import ProductDetailModal, { CAT_COLORS, HSN_BY_CAT, retailerPrice, PopupProduct } from "../components/ProductModal";
import KeyCategoriesBar, { KEY_CATEGORIES, KeyCategoryItem } from "../components/KeyCategoriesBar";
import InsuranceModal from "../components/InsuranceModal";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { useCart } from "../contexts/CartContext";
import { KEY_PRODUCT_CATEGORIES, isProductInCategory } from "../lib/keyCategories";

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&q=80`;

const CATEGORY_LIST = [
  "All",
  ...KEY_PRODUCT_CATEGORIES,
];


const PRICE_RANGES = [
  { label: "Under ₹50",    min: 0,    max: 50 },
  { label: "₹50 – ₹149",  min: 50,   max: 149 },
  { label: "₹150 – ₹499", min: 150,  max: 499 },
  { label: "₹500+",       min: 500,  max: Infinity },
];

function parsePrice(p: string) {
  return parseFloat(p.replace(/[₹,]/g, "")) || 0;
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
      <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Collapsible({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e4ede2] pb-4">
      <button className="w-full flex items-center justify-between py-3 font-bold text-[#073b4c] text-sm" onClick={() => setOpen(!open)}>
        {title} <ChevronDownIcon open={open} />
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export default function MedicinesPage({
  initialCategory = "All",
  userRole,
  onNavigate,
}: {
  initialCategory?: string;
  userRole?: string;
  onNavigate?: (page: any, category?: string) => void;
}) {
  const { addToCart } = useCart();
  const isRetailer = userRole === "retailer";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [activeKeyCat, setActiveKeyCat] = useState(() => {
    const found = KEY_CATEGORIES.find(
      (k) => k.filterCat === initialCategory || k.name.toLowerCase() === initialCategory.toLowerCase()
    );
    return found ? found.id : "all";
  });
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);
  const [dbProducts, setDbProducts] = useState<DbProduct[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const PER_PAGE = 24;

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    setActiveKeyCat(cat.id);
    setPage(1);

    if (cat.id === "insurance") {
      setShowInsuranceModal(true);
      return;
    }
    if (cat.route && onNavigate) {
      onNavigate(cat.route);
      return;
    }
    if (onNavigate) {
      onNavigate("category", cat.id);
      return;
    }

    if (cat.filterCat) {
      setSelectedCategory(cat.filterCat);
    } else {
      setSelectedCategory(cat.name);
    }
  };

  useEffect(() => {
    setSelectedCategory(initialCategory);
    const found = KEY_CATEGORIES.find(
      (k) => k.filterCat === initialCategory || k.name.toLowerCase() === initialCategory.toLowerCase()
    );
    setActiveKeyCat(found ? found.id : (initialCategory === "All" ? "all" : ""));
  }, [initialCategory]);

  useEffect(() => {
    let mounted = true;
    setLoadingProducts(true);
    fetchProducts().then((data) => {
      if (mounted) {
        setDbProducts(data || []);
        setLoadingProducts(false);
      }
    }).catch(() => {
      if (mounted) {
        setDbProducts([]);
        setLoadingProducts(false);
      }
    });

    // Real-time Supabase subscription for live stock and product updates
    const unsubscribe = subscribeToProductsRealtime((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        setDbProducts((prev) => {
          if (!prev) return [payload.new];
          return prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p));
        });
      } else if (payload.eventType === "INSERT" && payload.new) {
        setDbProducts((prev) => (prev ? [payload.new, ...prev] : [payload.new]));
      } else if (payload.eventType === "DELETE" && payload.old) {
        setDbProducts((prev) => (prev ? prev.filter((p) => p.id !== payload.old.id) : []));
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const productList = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];
    return dbProducts.map((p) => ({
      id: p.numeric_id,
      dbId: p.id,
      name: p.name,
      sub: p.details || p.subtitle || "",
      price: `₹${Math.round(p.retailer_price || p.customer_price)}`,
      retailerPrice: `₹${Math.round(p.retailer_price || p.customer_price)}`,
      orig: p.mrp > (p.retailer_price || p.customer_price) ? `₹${Math.round(p.mrp)}` : "",
      disc: p.retailer_discount_percent > 0 ? `${p.retailer_discount_percent}%` : (p.discount_percent > 0 ? `${p.discount_percent}%` : ""),
      cat: p.category_name,
      subCat: p.sub_category_name || "",
      brand: p.brand,
      img: p.image_url,
      stock: p.stock ?? 50,
      customer_price: p.customer_price,
      retailer_price: p.retailer_price,
    }));
  }, [dbProducts]);

  const allBrands = useMemo(() => {
    return [...new Set(productList.map((p) => p.brand).filter(Boolean))].sort();
  }, [productList]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const activeFilterCount = selectedBrands.length + (selectedPriceIdx !== null ? 1 : 0);

  const filtered = useMemo(() => {
    let list = productList;

    // Filter by Key Category ID or selected category
    if (activeKeyCat === "50-off") {
      list = list.filter((p) => parseInt(p.disc || "0") >= 20 || parseInt(p.orig ? "1" : "0") > 0);
    } else if (activeKeyCat && activeKeyCat !== "all") {
      list = list.filter((p) => isProductInCategory(p.cat, activeKeyCat));
    } else if (selectedCategory !== "All") {
      list = list.filter((p) => isProductInCategory(p.cat, selectedCategory));
    }

    if (selectedBrands.length) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }
    if (selectedPriceIdx !== null) {
      const r = PRICE_RANGES[selectedPriceIdx];
      list = list.filter((p) => {
        const v = parsePrice(isRetailer && (p as any).retailerPrice ? (p as any).retailerPrice : p.price);
        return v >= r.min && v <= r.max;
      });
    }
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => parsePrice(isRetailer ? (a as any).retailerPrice || a.price : a.price) - parsePrice(isRetailer ? (b as any).retailerPrice || b.price : b.price));
    }
    if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => parsePrice(isRetailer ? (b as any).retailerPrice || b.price : b.price) - parsePrice(isRetailer ? (a as any).retailerPrice || a.price : a.price));
    }
    if (sortBy === "discount") {
      list = [...list].sort((a, b) => parseInt(b.disc || "0") - parseInt(a.disc || "0"));
    }
    return list;
  }, [productList, activeKeyCat, selectedCategory, selectedBrands, selectedPriceIdx, sortBy, isRetailer]);

  const paginated = filtered.slice(0, page * PER_PAGE);

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      {/* Retailer pricing banner */}
      {isRetailer && (
        <div className="bg-[#073b4c] text-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3">
            <span className="bg-[#0369a1] text-white text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded uppercase tracking-wide shrink-0">Retailer</span>
            <p className="text-xs sm:text-sm font-medium">
              Viewing <span className="font-bold text-[#7dd3fc]">wholesale retailer prices</span> — approx. 15-20% below standard MRP for verified store owners.
            </p>
          </div>
        </div>
      )}

      {/* Key Categories Bar (All 14 categories) */}
      <KeyCategoriesBar
        selectedId={activeKeyCat}
        onSelectCategory={handleSelectKeyCategory}
      />

      {/* Page header */}
      <div className="bg-white border-b border-[#e4ede2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl sm:text-3xl">
                {KEY_CATEGORIES.find((k) => k.id === activeKeyCat)?.name || selectedCategory}
              </h1>
              <span className="bg-[#e8f5ee] text-[#006a39] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                {filtered.length} items
              </span>
            </div>
            <p className="text-[#6d7a6f] text-xs sm:text-sm mt-0.5 sm:mt-1">
              Live Verified Inventory · Genuine Quality Guaranteed
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border border-[#d5dcd3] bg-white text-[#073b4c] text-xs sm:text-sm font-semibold hover:border-[#006a39] transition-colors cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#006a39] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="px-3 sm:px-4 py-2 rounded-xl border border-[#d5dcd3] bg-white text-[#073b4c] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#006a39] cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Best Discount</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 flex flex-col md:flex-row gap-5 sm:gap-6">
        {/* Mobile filter drawer backdrop */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setShowFilters(false)} />
        )}

        {/* Filter sidebar — drawer on mobile, column on md+ */}
        {showFilters && (
          <aside className="fixed bottom-0 left-0 right-0 z-50 md:static md:w-52 md:shrink-0 md:z-auto">
            <div className="bg-white rounded-t-2xl md:rounded-2xl border border-[#e4ede2] p-4 md:sticky md:top-20 max-h-[80vh] md:max-h-none overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#e4ede2] mb-1">
                <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c]">Filters</span>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setSelectedBrands([]); setSelectedPriceIdx(null); }} className="text-[#006a39] text-xs font-semibold hover:underline">
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setShowFilters(false)} className="md:hidden w-7 h-7 rounded-full bg-[#f0f4f0] flex items-center justify-center text-[#073b4c]">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <Collapsible title="Price Range">
                {PRICE_RANGES.map((r, i) => (
                  <label key={r.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" checked={selectedPriceIdx === i} onChange={() => setSelectedPriceIdx(selectedPriceIdx === i ? null : i)} className="accent-[#006a39]" />
                    <span className="text-[#3e4a3f] text-xs">{r.label}</span>
                  </label>
                ))}
              </Collapsible>
              <Collapsible title="Brand" defaultOpen={false}>
                <div className="max-h-52 overflow-y-auto flex flex-col gap-2 pr-1">
                  {allBrands.map((b) => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-[#006a39]" />
                      <span className="text-[#3e4a3f] text-xs truncate">{b}</span>
                    </label>
                  ))}
                </div>
              </Collapsible>
            </div>
          </aside>
        )}

        {/* Products grid */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <p className="text-[#6d7a6f] text-xs sm:text-sm">
            Showing <span className="font-semibold text-[#073b4c]">{paginated.length}</span> of{" "}
            <span className="font-semibold text-[#073b4c]">{filtered.length}</span> products
            {selectedCategory !== "All" && (
              <> in{" "}
                <span className="font-semibold" style={{ color: CAT_COLORS[selectedCategory] }}>
                  {selectedCategory}
                </span>
              </>
            )}
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="font-bold text-[#073b4c] text-lg">No products found</p>
              <button onClick={() => { setSelectedBrands([]); setSelectedPriceIdx(null); }} className="bg-[#006a39] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#005a30] transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-3 sm:gap-4 ${showFilters ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
                {paginated.map((p) => {
                  const accentColor = CAT_COLORS[p.cat] || "#006a39";
                  const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                  const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= 10;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`bg-white/85 backdrop-blur-xl rounded-3xl border ${
                        isOutOfStock ? "border-rose-200/80 opacity-75" : "border-white/90 hover:border-emerald-300/80"
                      } hover:shadow-xl hover:shadow-emerald-950/8 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer`}
                    >
                      <div className="relative bg-gradient-to-b from-white/90 to-slate-50/50 h-32 sm:h-38 overflow-hidden flex items-center justify-center p-3">
                        {p.disc && (
                          <span
                            className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-xs border border-white/30 backdrop-blur-md"
                            style={{ backgroundColor: accentColor }}
                          >
                            {p.disc} OFF
                          </span>
                        )}
                        {isOutOfStock ? (
                          <span className="absolute top-2.5 right-2.5 z-10 bg-rose-50/90 text-rose-700 border border-rose-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs backdrop-blur-md">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="absolute top-2.5 right-2.5 z-10 bg-amber-50/90 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse shadow-2xs backdrop-blur-md">
                            Only {p.stock} Left
                          </span>
                        ) : (
                          <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-50/90 text-emerald-800 border border-emerald-200 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
                            {p.stock} in stock
                          </span>
                        )}
                        <img
                          src={p.img}
                          alt={p.name}
                          className="h-full w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }}
                        />
                      </div>
                      <div className="p-3.5 flex flex-col gap-1 flex-1 bg-white/70 backdrop-blur-md">
                        <p className="text-[9px] font-black uppercase tracking-[0.6px]" style={{ color: accentColor }}>
                          {p.brand}
                        </p>
                        <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[34px] group-hover:text-[#006a39] transition-colors">
                          {p.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {p.subCat && (
                            <span className="inline-block text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full leading-none w-fit">
                              {p.subCat}
                            </span>
                          )}
                          {p.sub && (
                            <span className="inline-block text-[9px] font-bold bg-emerald-50/80 text-[#006a39] border border-emerald-200/80 px-2 py-0.5 rounded-full leading-none w-fit">
                              {p.sub}
                            </span>
                          )}
                        </div>
                        <div className="mt-auto pt-2.5 border-t border-[#f0f5f1]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-['Manrope',sans-serif] font-black text-[#0369a1] text-sm sm:text-base">
                                {p.price}
                              </span>
                              <span className="text-[9px] bg-sky-100/90 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded-full font-black uppercase">
                                Wholesale B2B
                              </span>
                            </div>
                            {p.orig && (
                              <div className="flex items-center gap-1">
                                <span className="text-[#8aa08e] text-[9px] font-semibold">MRP: </span>
                                <span className="text-[#8aa08e] text-[10px] line-through font-semibold">{p.orig}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[9px] mt-1.5">
                            <span className="text-[#8aa08e] font-mono">HSN: {HSN_BY_CAT[p.cat] ?? "—"}</span>
                          </div>
                        </div>
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="w-full mt-2 py-2 rounded-2xl bg-[#f3f4f6] text-[#9ca3af] text-[11px] font-bold tracking-[0.4px] cursor-not-allowed flex items-center justify-center gap-1 border border-slate-200"
                          >
                            Out of Stock
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className="w-full mt-2 py-2 rounded-2xl text-white text-[11px] font-black tracking-[0.4px] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/15 cursor-pointer border border-white/30"
                            style={{ backgroundColor: accentColor }}
                          >
                            <PlusIcon /> Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {paginated.length < filtered.length && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setPage((n) => n + 1)}
                    className="bg-white border-2 border-[#006a39] text-[#006a39] font-bold text-sm px-10 py-3 rounded-xl hover:bg-[#006a39] hover:text-white transition-all"
                  >
                    Load More ({filtered.length - paginated.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isRetailer={isRetailer}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <InsuranceModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        isRetailer={isRetailer}
      />
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import type { Page } from "../App";
import ProductDetailModal, { CAT_COLORS, PopupProduct } from "../components/ProductModal";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { searchProducts, ScoredProduct } from "../lib/productSearch";
import { useCart } from "../contexts/CartContext";

interface SearchPageProps {
  initialQuery?: string;
  userRole?: string;
  onNavigate: (page: Page, category?: string) => void;
}

const POPULAR_SEARCHES = [
  "Volini",
  "Dabur",
  "Eno",
  "Dettol",
  "Hansaplast",
  "Honey",
  "Skin Care",
  "Glucon D",
  "Baby",
  "Pain Relief",
];

export default function SearchPage({
  initialQuery = "",
  userRole,
  onNavigate,
}: SearchPageProps) {
  const { addToCart, items, updateQuantity } = useCart();
  const isRetailer = userRole === "retailer";

  const [query, setQuery] = useState(initialQuery);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);

  // Sync when initialQuery changes from external navigation
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Load products & subscribe to updates
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

  // Compute Search & Similarity Results
  const searchPayload = useMemo(() => {
    return searchProducts(dbProducts, query);
  }, [dbProducts, query]);

  // Filter & Sort Results
  const displayedItems = useMemo(() => {
    let list = searchPayload.results;

    if (selectedBrand !== "All") {
      list = list.filter((item) => item.product.brand === selectedBrand);
    }

    if (selectedCategory !== "All") {
      list = list.filter((item) => item.product.category_name === selectedCategory);
    }

    if (inStockOnly) {
      list = list.filter((item) => (item.product.stock ?? 0) > 0);
    }

    const sorted = [...list];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => {
        const priceA = isRetailer ? a.product.retailer_price : a.product.customer_price;
        const priceB = isRetailer ? b.product.retailer_price : b.product.customer_price;
        return priceA - priceB;
      });
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => {
        const priceA = isRetailer ? a.product.retailer_price : a.product.customer_price;
        const priceB = isRetailer ? b.product.retailer_price : b.product.customer_price;
        return priceB - priceA;
      });
    } else if (sortBy === "discount") {
      sorted.sort((a, b) => b.product.discount_percent - a.product.discount_percent);
    }
    // "relevance" keeps default score-based order from searchProducts

    return sorted;
  }, [searchPayload.results, selectedBrand, selectedCategory, inStockOnly, sortBy, isRetailer]);

  // Helper to check cart quantity
  const getCartQty = (productId: string | number) => {
    const item = items.find(
      (i) => i.productId === String(productId) || i.productNumericId === Number(productId)
    );
    return item ? item.quantity : 0;
  };

  const handleCardClick = (p: DbProduct) => {
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
  };

  return (
    <div className="min-h-screen bg-[#f5fbf2] pb-16">
      {/* Search Header Banner */}
      <section className="bg-gradient-to-b from-white/90 via-white/80 to-[#f5fbf2] border-b border-[#e4ede2]/80 pt-6 pb-8 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1280px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#728575] font-semibold mb-4">
            <button
              onClick={() => onNavigate("home")}
              className="hover:text-[#006a39] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#073b4c] font-bold">Product Search</span>
            {query.trim() && (
              <>
                <span>/</span>
                <span className="text-[#006a39] font-black truncate max-w-[200px]">
                  &ldquo;{query.trim()}&rdquo;
                </span>
              </>
            )}
          </div>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedBrand("All");
                setSelectedCategory("All");
              }}
              placeholder="Search medicines, brand (e.g. Volini, Dabur), illness, salt..."
              className="w-full bg-white/90 backdrop-blur-md border border-[#dce7db] hover:border-[#006a39]/50 focus:border-[#006a39] rounded-2xl py-3 pl-12 pr-10 text-sm text-[#073b4c] placeholder-[#8aa08e] shadow-sm focus:shadow-md focus:bg-white transition-all outline-none"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M16.5 16.5L12.875 12.875M14.8333 8.16667C14.8333 11.8486 11.8486 14.8333 8.16667 14.8333C4.48477 14.8333 1.5 11.8486 1.5 8.16667C1.5 4.48477 4.48477 1.5 8.16667 1.5C11.8486 1.5 14.8333 4.48477 14.8333 8.16667Z"
                  stroke="#006A39"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f0f7f0] text-[#728575] hover:text-[#073b4c] text-xs flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Popular Search Suggestions */}
          <div className="flex items-center gap-2 mt-3.5 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#728575]">
              Popular:
            </span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  query.toLowerCase() === term.toLowerCase()
                    ? "bg-[#006a39] text-white border-[#006a39] shadow-xs"
                    : "bg-white/80 text-[#3e4a3f] border-[#dce7db] hover:border-[#006a39] hover:text-[#006a39]"
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Results Summary and Similar Status Banner */}
          {query.trim() && (
            <div className="mt-6">
              {searchPayload.isSimilarOnly ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔍</span>
                    <div>
                      <h2 className="font-['Manrope',sans-serif] font-bold text-sm sm:text-base text-[#073b4c]">
                        No exact matches found for &ldquo;{query}&rdquo;
                      </h2>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Showing <strong>{displayedItems.length} similar products</strong> with the same brand or related keywords instead.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuery("")}
                    className="self-start sm:self-auto text-xs font-bold text-[#006a39] hover:underline bg-white px-3 py-1.5 rounded-lg border border-amber-200 cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : displayedItems.length > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e4ede2]/60">
                  <div>
                    <h1 className="font-['Manrope',sans-serif] font-black text-xl sm:text-2xl text-[#073b4c]">
                      Results for &ldquo;{query}&rdquo;
                    </h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                        {searchPayload.exactCount} direct {searchPayload.exactCount === 1 ? "match" : "matches"}
                      </span>
                      {searchPayload.similarCount > 0 && (
                        <span className="text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          +{searchPayload.similarCount} similar items (same brand & keywords)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#728575]">
                    Showing <strong className="text-[#073b4c]">{displayedItems.length}</strong> products
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area: Filters + Product Grid */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        {/* Controls Toolbar: Brand Pills, Category Pills, In-Stock, Sort */}
        {displayedItems.length > 0 && (
          <div className="flex flex-col gap-4 mb-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[#dce7db] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Brand Pills */}
              {searchPayload.matchedBrands.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#728575] mr-1">
                    Brand:
                  </span>
                  <button
                    onClick={() => setSelectedBrand("All")}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedBrand === "All"
                        ? "bg-[#006a39] text-white shadow-xs"
                        : "bg-white text-[#3e4a3f] border border-[#dce7db] hover:border-[#006a39]"
                    }`}
                  >
                    All Brands
                  </button>
                  {searchPayload.matchedBrands.slice(0, 6).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(selectedBrand === b ? "All" : b)}
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                        selectedBrand === b
                          ? "bg-[#006a39] text-white shadow-xs"
                          : "bg-white text-[#3e4a3f] border border-[#dce7db] hover:border-[#006a39]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* In Stock & Sort Controls */}
              <div className="flex items-center gap-3 ml-auto flex-wrap">
                <label className="flex items-center gap-1.5 text-xs text-[#073b4c] font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#006a39] w-3.5 h-3.5 rounded"
                  />
                  In-Stock Only
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-[#728575]">
                    Sort By:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-[#dce7db] rounded-xl px-2.5 py-1 text-xs text-[#073b4c] font-bold focus:outline-none focus:border-[#006a39] cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="discount">Highest Discount</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {displayedItems.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-md my-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#006a39] flex items-center justify-center text-3xl">
              🔍
            </div>
            <h3 className="font-['Manrope',sans-serif] font-black text-xl text-[#073b4c]">
              {query.trim()
                ? `No products found for "${query}"`
                : "Type in the search box to find products"}
            </h3>
            <p className="text-xs sm:text-sm text-[#728575] max-w-md leading-relaxed">
              We couldn&apos;t find any exact or similar items. Try searching by generic brand name (e.g. Volini, Dabur), category (e.g. Pain relief, Honey), or health concern.
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
              <button
                onClick={() => onNavigate("medicines")}
                className="bg-[#006a39] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#005a30] transition-colors cursor-pointer shadow-xs"
              >
                Browse All Medicines
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="bg-white text-[#073b4c] border border-[#dce7db] font-bold text-xs px-5 py-2.5 rounded-xl hover:border-[#006a39] transition-colors cursor-pointer"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {displayedItems.map((item) => {
              const p = item.product;
              const accentColor = CAT_COLORS[p.category_name] || "#006a39";
              const inCartQty = getCartQty(p.id);
              const isOutOfStock = (p.stock ?? 0) <= 0;
              const isLowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10;
              const unitPrice = isRetailer ? p.retailer_price : p.customer_price;

              return (
                <div
                  key={p.id}
                  onClick={() => handleCardClick(p)}
                  className={`bg-white/90 backdrop-blur-xl rounded-3xl border ${
                    isOutOfStock
                      ? "border-rose-200/80 opacity-75"
                      : "border-white/90 hover:border-emerald-300/80"
                  } hover:shadow-xl hover:shadow-emerald-950/8 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer relative`}
                >
                  {/* Top Badges */}
                  <div className="relative bg-gradient-to-b from-white/90 to-slate-50/50 h-32 sm:h-38 overflow-hidden flex items-center justify-center p-3">
                    {/* Discount or Similarity Tag */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                      {p.discount_percent > 0 && (
                        <span
                          className="text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs border border-white/30 backdrop-blur-md"
                          style={{ backgroundColor: accentColor }}
                        >
                          {p.discount_percent}% OFF
                        </span>
                      )}
                      {item.isSimilar && !item.isExact && (
                        <span className="bg-blue-600/90 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs backdrop-blur-md">
                          {item.similarityReason === "brand" ? "Same Brand" : "Similar"}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
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
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";
                      }}
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex flex-col gap-1 flex-1 bg-white/70 backdrop-blur-md">
                    <p
                      className="text-[9px] font-black uppercase tracking-[0.6px]"
                      style={{ color: accentColor }}
                    >
                      {p.brand}
                    </p>
                    <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[34px] group-hover:text-[#006a39] transition-colors">
                      {p.name}
                    </p>
                    {(p.details || p.subtitle) && (
                      <span className="inline-block text-[9px] font-bold bg-emerald-50/80 text-[#006a39] border border-emerald-200/80 px-2 py-0.5 rounded-full leading-none mt-0.5 w-fit truncate max-w-full">
                        {p.details || p.subtitle}
                      </span>
                    )}

                    {/* Price & Action Row */}
                    <div className="mt-auto pt-2.5 border-t border-[#f0f5f1]">
                      {isRetailer ? (
                        <div className="flex flex-col gap-0.5 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-['Manrope',sans-serif] font-black text-sm text-[#006a39]">
                              ₹{Math.round(p.retailer_price)}
                            </span>
                            <span className="text-[10px] text-[#728575] line-through">
                              ₹{Math.round(p.mrp)}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-700">
                            Wholesale Margin: ₹{Math.round(p.mrp - p.retailer_price)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="font-['Manrope',sans-serif] font-black text-sm text-[#006a39]">
                            ₹{Math.round(p.customer_price)}
                          </span>
                          {p.mrp > p.customer_price && (
                            <span className="text-[10px] text-[#728575] line-through">
                              ₹{Math.round(p.mrp)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Add to Cart Button / Quantity Stepper */}
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
                        >
                          Out of Stock
                        </button>
                      ) : inCartQty > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between bg-emerald-50 border border-[#006a39] rounded-xl px-2 py-1"
                        >
                          <button
                            onClick={() => updateQuantity(String(p.id), inCartQty - 1)}
                            className="w-5 h-5 rounded-lg bg-white text-[#006a39] font-black text-xs flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-2xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-[#006a39]">
                            {inCartQty}
                          </span>
                          <button
                            onClick={() => updateQuantity(String(p.id), inCartQty + 1)}
                            className="w-5 h-5 rounded-lg bg-[#006a39] text-white font-black text-xs flex items-center justify-center hover:bg-[#005a30] transition-colors shadow-2xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              id: p.id,
                              dbId: p.id,
                              numeric_id: p.numeric_id,
                              name: p.name,
                              brand: p.brand,
                              category_name: p.category_name,
                              customer_price: p.customer_price,
                              retailer_price: p.retailer_price,
                              price: unitPrice,
                              mrp: p.mrp,
                              image_url: p.image_url,
                            });
                          }}
                          className="w-full py-1.5 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>+</span> Add to Cart
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isRetailer={isRetailer}
        />
      )}
    </div>
  );
}

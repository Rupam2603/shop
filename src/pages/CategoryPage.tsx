import { useState, useMemo, useEffect } from "react";
import type { Page } from "../App";
import KeyCategoriesBar, { KEY_CATEGORIES, KeyCategoryItem } from "../components/KeyCategoriesBar";
import InsuranceModal from "../components/InsuranceModal";
import ProductDetailModal, { PopupProduct } from "../components/ProductModal";
import { KEY_CATEGORIES_CONFIG, KeyCategoryMeta, isProductInCategory, KEY_CATEGORY_MAP } from "../lib/keyCategories";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { useCart } from "../contexts/CartContext";

function parsePrice(p: string) {
  return parseFloat(p.replace(/[₹,]/g, "")) || 0;
}

interface CategoryPageProps {
  categoryId: string;
  userRole?: string;
  onNavigate: (page: Page, category?: string) => void;
}

export default function CategoryPage({
  categoryId,
  userRole,
  onNavigate,
}: CategoryPageProps) {
  const { addToCart } = useCart();
  const isRetailer = userRole === "retailer";
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [dbProducts, setDbProducts] = useState<DbProduct[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedSubCat, setSelectedSubCat] = useState<string>("All");

  useEffect(() => {
    setSelectedSubCat("All");
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categoryId]);

  // Lookup current Category Configuration with deep alias matching
  const categoryMeta: KeyCategoryMeta = useMemo(() => {
    const cleanId = (categoryId || "all").trim().toLowerCase();
    const mappedName = KEY_CATEGORY_MAP[cleanId]?.toLowerCase();

    const found = KEY_CATEGORIES_CONFIG.find(
      (c) =>
        c.id.toLowerCase() === cleanId ||
        c.short.toLowerCase() === cleanId ||
        c.name.toLowerCase() === cleanId ||
        (mappedName && c.name.toLowerCase() === mappedName) ||
        (c.id === "wellness" && (cleanId === "immunity" || cleanId.includes("immunity"))) ||
        (c.id === "skin" && (cleanId === "personal-care" || cleanId.includes("personal"))) ||
        (c.id === "medical-supplies" && (cleanId === "devices" || cleanId.includes("device")))
    );
    return (
      found || {
        id: categoryId,
        name: KEY_CATEGORY_MAP[cleanId] || categoryId,
        short: categoryId,
        tagline: "Verified Pharmacy Products",
        description: "Explore genuine medicines and wellness essentials with express delivery.",
        accent: "#ff3366",
        lightBg: "#fff0f3",
        iconBg: "#ffe4e9",
        filterFn: (p: any) => isProductInCategory(p.cat, categoryId),
      }
    );
  }, [categoryId]);

  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted) {
        setDbProducts(data || []);
      }
    }).catch(() => {
      if (mounted) {
        setDbProducts([]);
      }
    });

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
      return_policy: p.return_policy || "Non-Returnable",
    }));
  }, [dbProducts]);

  const availableSubCategories = useMemo(() => {
    if (!productList || productList.length === 0) return [];
    const inCat = productList.filter((p) =>
      categoryMeta.filterFn ? categoryMeta.filterFn(p) : isProductInCategory(p.cat, categoryMeta.id)
    );
    const subs = Array.from(new Set(inCat.map((p) => p.subCat).filter(Boolean))) as string[];
    return subs.sort();
  }, [productList, categoryMeta]);

  const filteredProducts = useMemo(() => {
    let list = productList;

    // Filter by specific Category logic
    if (categoryMeta.filterFn) {
      list = list.filter(categoryMeta.filterFn);
    } else {
      list = list.filter((p) => isProductInCategory(p.cat, categoryMeta.id));
    }

    // Filter by Sub-Category if selected
    if (selectedSubCat !== "All") {
      list = list.filter((p) => p.subCat === selectedSubCat);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sub.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => parsePrice(isRetailer ? (a as any).retailerPrice || a.price : a.price) - parsePrice(isRetailer ? (b as any).retailerPrice || b.price : b.price));
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => parsePrice(isRetailer ? (b as any).retailerPrice || b.price : b.price) - parsePrice(isRetailer ? (a as any).retailerPrice || a.price : a.price));
    } else if (sortBy === "discount") {
      list = [...list].sort((a, b) => parseInt(b.disc || "0") - parseInt(a.disc || "0"));
    }

    return list;
  }, [productList, categoryMeta, selectedSubCat, searchQuery, sortBy, isRetailer]);

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    if (cat.id === "insurance") {
      setShowInsuranceModal(true);
      return;
    }
    if (cat.route) {
      onNavigate(cat.route as Page);
      return;
    }
    onNavigate("category", cat.id);
  };

  return (
    <div className="bg-transparent min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col gap-4 sm:gap-6">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <KeyCategoriesBar
            selectedId={categoryMeta.id}
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-slate-500 px-1 font-medium">
          <button onClick={() => onNavigate("home")} className="hover:text-[#ff3366] transition-colors cursor-pointer">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate("category", "all")} className="hover:text-[#ff3366] transition-colors cursor-pointer">
            Categories
          </button>
          <span>/</span>
          <span className="font-extrabold text-slate-900">{categoryMeta.short}</span>
        </div>

        {/* ── Dedicated Category Hero Banner ── */}
        <div
          className="rounded-3xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden shadow-lg border border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{
            background: `linear-gradient(135deg, ${categoryMeta.accent}ee 0%, #002244 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-radial from-white/10 via-transparent to-black/20 pointer-events-none" />

          <div className="flex flex-col gap-2.5 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-md border border-white/25 shadow-2xs">
                Category Collection
              </span>
              <span className="text-white/85 text-xs font-bold">
                {filteredProducts.length} Products Available
              </span>
            </div>

            <h1 className="font-['Manrope',sans-serif] font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              {categoryMeta.name}
            </h1>

            <p className="text-white/90 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              {categoryMeta.description}
            </p>

            <div className="flex items-center gap-4 pt-1 text-[11px] sm:text-xs text-white/85">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-300 font-bold">⚡</span>
                <span>30-Min Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-300 font-bold">🛡️</span>
                <span>Batch Verified Quality</span>
              </div>
            </div>
          </div>

          {/* Search & Sort Controls inside Banner */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 z-10">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${categoryMeta.short}…`}
                className="w-full md:w-64 bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/70 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all shadow-xs font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:bg-white focus:text-slate-900 transition-all cursor-pointer font-bold"
            >
              <option value="featured" className="text-slate-900">Featured</option>
              <option value="price-asc" className="text-slate-900">Price: Low to High</option>
              <option value="price-desc" className="text-slate-900">Price: High to Low</option>
              <option value="discount" className="text-slate-900">Highest Discount</option>
            </select>
          </div>
        </div>

        {/* Retailer banner notice */}
        {isRetailer && (
          <div className="bg-[#002244] text-white p-3 rounded-2xl flex items-center gap-3 border border-sky-900/40 shadow-xs">
            <span className="bg-[#ff3366] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide shrink-0">Retailer</span>
            <p className="text-xs font-medium">
              Viewing <span className="font-bold text-[#7dd3fc]">wholesale distributor prices</span> for verified pharmacies & retailers.
            </p>
          </div>
        )}

        {/* ── Sub-Category Filters (if available) ── */}
        {availableSubCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-700 shrink-0 pl-1 mr-1">Sub-categories:</span>
            <button
              onClick={() => setSelectedSubCat("All")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubCat === "All"
                  ? "bg-[#ff3366] text-white shadow-xs shadow-rose-500/20"
                  : "bg-white/90 text-slate-700 border border-slate-200/85 hover:bg-rose-50/50 hover:border-rose-200"
              }`}
            >
              All
            </button>
            {availableSubCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubCat(sub)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedSubCat === sub
                    ? "bg-[#ff3366] text-white shadow-xs shadow-rose-500/20"
                    : "bg-white/90 text-slate-700 border border-slate-200/85 hover:bg-rose-50/50 hover:border-rose-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* ── Product Catalog Grid ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-['Manrope',sans-serif] font-black text-slate-900 text-base sm:text-lg">
              {categoryMeta.short} Products ({filteredProducts.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredProducts.length} items
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/85 p-12 text-center flex flex-col items-center gap-3 shadow-2xs">
              <span className="text-4xl">🔍</span>
              <h3 className="font-black text-slate-900 text-base">No products found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No items match your search in this category. Try adjusting your query or explore other categories.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-[#ff3366] hover:bg-[#e02958] text-white font-bold text-xs shadow-md shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct({
                      id: p.id,
                      dbId: (p as any).dbId,
                      name: p.name,
                      sub: p.sub,
                      price: p.price,
                      orig: p.orig,
                      disc: p.disc,
                      cat: p.cat,
                      subCat: p.subCat,
                      brand: p.brand,
                      img: p.img,
                      stock: p.stock ?? 50,
                      customer_price: (p as any).customer_price,
                      retailer_price: (p as any).retailer_price,
                      return_policy: (p as any).return_policy || "Non-Returnable",
                    })}
                    className={`bg-white rounded-2xl border ${
                      isOutOfStock ? "border-rose-200/80 opacity-75" : "border-slate-200/85 hover:border-[#ff3366]/40"
                    } hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer shadow-2xs`}
                  >
                    {/* Image & Badge */}
                    <div className="relative bg-slate-50/60 h-24 sm:h-28 overflow-hidden flex items-center justify-center p-2">
                      {p.disc && (
                        <span
                          className="absolute top-2 left-2 z-10 text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs bg-[#ff3366]"
                        >
                          {p.disc} OFF
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="absolute top-2 right-2 z-10 bg-rose-50 text-rose-700 border border-rose-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                          {isRetailer ? "Stock Out" : "Out of Stock"}
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-2 right-2 z-10 bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase animate-pulse shadow-2xs">
                          {isRetailer ? `Low (${p.stock})` : `Only ${p.stock}`}
                        </span>
                      ) : (
                        <span className="absolute top-2 right-2 z-10 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] font-semibold px-1.5 py-0.5 rounded-full shadow-2xs">
                          {isRetailer ? `📦 ${p.stock}` : `${p.stock} in stock`}
                        </span>
                      )}
                      <img
                        src={p.img}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                      />
                    </div>

                    <div className="p-2 sm:p-2.5 flex flex-col gap-0.5 flex-1 bg-white">
                      <p className="text-[9px] font-black uppercase tracking-[0.5px] text-[#003b6d] truncate">
                        {p.brand}
                      </p>
                      <p className="font-['Manrope',sans-serif] font-bold text-slate-900 text-xs sm:text-[12.5px] leading-tight line-clamp-2 min-h-[28px] group-hover:text-[#ff3366] transition-colors">
                        {p.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {p.subCat && (
                          <span className="inline-block text-[8px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 px-1.5 py-0.2 rounded-full leading-none w-fit">
                            {p.subCat}
                          </span>
                        )}
                        {p.sub && (
                          <span className="inline-block text-[8px] font-medium bg-slate-50 text-slate-600 border border-slate-200/80 px-1.5 py-0.2 rounded-full leading-none w-fit truncate max-w-[120px]">
                            {p.sub}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="font-['Manrope',sans-serif] font-black text-slate-900 text-xs sm:text-sm">
                            {p.price}
                          </span>
                          {p.orig && (
                            <span className="text-slate-400 text-[9px] sm:text-[10px] line-through font-semibold">
                              {p.orig}
                            </span>
                          )}
                        </div>

                        {isOutOfStock ? (
                          <span className="text-[8px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                            Out
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                id: p.id,
                                dbId: p.dbId,
                                numeric_id: p.id,
                                name: p.name,
                                sub: p.sub,
                                cat: p.cat,
                                brand: p.brand,
                                price: p.retailer_price ?? p.customer_price ?? p.price,
                                customer_price: p.customer_price,
                                retailer_price: p.retailer_price,
                                orig: p.orig,
                                img: p.img,
                              });
                            }}
                            className="w-8 h-8 rounded-2xl flex items-center justify-center bg-rose-50 hover:bg-[#ff3366] text-[#ff3366] hover:text-white border border-rose-200/80 font-bold shrink-0 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="Add to cart"
                          >
                            +
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

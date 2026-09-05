import { useState, useMemo, useEffect } from "react";
import type { Page } from "../App";
import KeyCategoriesBar, { KEY_CATEGORIES, KeyCategoryItem } from "../components/KeyCategoriesBar";
import InsuranceModal from "../components/InsuranceModal";
import ProductDetailModal, { retailerPrice, PopupProduct } from "../components/ProductModal";
import { KEY_CATEGORIES_CONFIG, KeyCategoryMeta, isProductInCategory } from "../lib/keyCategories";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { useCart } from "../contexts/CartContext";

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&q=80`;

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
  }, [categoryId]);

  // Lookup current Category Configuration
  const categoryMeta: KeyCategoryMeta = useMemo(() => {
    const found = KEY_CATEGORIES_CONFIG.find(
      (c) =>
        c.id.toLowerCase() === categoryId.toLowerCase() ||
        c.short.toLowerCase() === categoryId.toLowerCase() ||
        c.name.toLowerCase() === categoryId.toLowerCase()
    );
    return (
      found || {
        id: categoryId,
        name: categoryId,
        short: categoryId,
        tagline: "Verified Pharmacy Products",
        description: "Explore genuine medicines and wellness essentials.",
        accent: "#006a39",
        lightBg: "#eef7f0",
        iconBg: "#bbf7d0",
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

    // Filter by specific Category's logic
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
    onNavigate("category" as any, cat.id);
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col gap-4 sm:gap-6">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e4ede2] shadow-xs overflow-hidden">
          <KeyCategoriesBar
            selectedId={categoryMeta.id}
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-[#6d7a6f] px-1 font-medium">
          <button onClick={() => onNavigate("home")} className="hover:text-[#006a39] hover:underline cursor-pointer">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate("medicines")} className="hover:text-[#006a39] hover:underline cursor-pointer">
            Categories
          </button>
          <span>/</span>
          <span className="font-bold text-[#073b4c]">{categoryMeta.short}</span>
        </div>

        {/* ── Dedicated Category Hero Banner ── */}
        <div
          className="rounded-3xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{
            background: `linear-gradient(135deg, ${categoryMeta.accent} 0%, #073b4c 100%)`,
          }}
        >
          <div className="flex flex-col gap-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                Category Collection
              </span>
              <span className="text-white/80 text-xs font-semibold">
                {filteredProducts.length} Products Available
              </span>
            </div>

            <h1 className="font-['Manrope',sans-serif] font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              {categoryMeta.name}
            </h1>

            <p className="text-white/85 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              {categoryMeta.description}
            </p>

            <div className="flex items-center gap-4 pt-1 text-[11px] sm:text-xs text-white/80">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">⚡</span>
                <span>30-Min Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">🛡️</span>
                <span>Batch Verified Quality</span>
              </div>
            </div>
          </div>

          {/* Search & Sort Controls inside Banner on Desktop */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 z-10">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${categoryMeta.short}…`}
                className="w-full md:w-64 bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-white/60 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:bg-white focus:text-[#073b4c] focus:placeholder-gray-400 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm px-3 py-2 rounded-xl focus:outline-none focus:bg-white focus:text-[#073b4c] transition-all cursor-pointer font-medium"
            >
              <option value="featured" className="text-[#073b4c]">Featured</option>
              <option value="price-asc" className="text-[#073b4c]">Price: Low to High</option>
              <option value="price-desc" className="text-[#073b4c]">Price: High to Low</option>
              <option value="discount" className="text-[#073b4c]">Highest Discount</option>
            </select>
          </div>
        </div>

        {/* Retailer banner notice */}
        {isRetailer && (
          <div className="bg-[#073b4c] text-white p-3 rounded-2xl flex items-center gap-3">
            <span className="bg-[#0369a1] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shrink-0">Retailer</span>
            <p className="text-xs font-medium">
              Viewing <span className="font-bold text-[#7dd3fc]">wholesale distributor prices</span> for verified pharmacies & retailers.
            </p>
          </div>
        )}

        {/* ── Sub-Category Filters (if available) ── */}
        {availableSubCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="text-xs font-bold text-[#073b4c] shrink-0 pl-1 mr-1">Sub-categories:</span>
            <button
              onClick={() => setSelectedSubCat("All")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubCat === "All"
                  ? "bg-[#006a39] text-white shadow-xs"
                  : "bg-white text-[#4a5568] border border-[#e2e8f0] hover:bg-emerald-50"
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
                    ? "bg-[#006a39] text-white shadow-xs"
                    : "bg-white text-[#4a5568] border border-[#e2e8f0] hover:bg-emerald-50"
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
            <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg">
              {categoryMeta.short} Products ({filteredProducts.length})
            </h2>
            <span className="text-xs text-[#6d7a6f]">
              Showing {filteredProducts.length} items
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 p-12 text-center flex flex-col items-center gap-3 shadow-sm">
              <span className="text-4xl">🔍</span>
              <h3 className="font-bold text-[#073b4c] text-base">No products found</h3>
              <p className="text-xs text-[#6d7a6f] max-w-sm">
                No items match your search in this category. Try adjusting your query or explore other categories.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-bold text-xs shadow-md shadow-emerald-950/15 cursor-pointer active:scale-95"
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
                    })}
                    className={`bg-white/85 backdrop-blur-xl rounded-3xl border ${
                      isOutOfStock ? "border-rose-200/80 opacity-75" : "border-white/90 hover:border-emerald-300/80"
                    } hover:shadow-xl hover:shadow-emerald-950/8 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer`}
                  >
                    {/* Image & Badge */}
                    <div className="relative bg-gradient-to-b from-white/90 to-slate-50/50 h-32 sm:h-38 overflow-hidden flex items-center justify-center p-3">
                      {p.disc && (
                        <span
                          className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-xs border border-white/30 backdrop-blur-md"
                          style={{ backgroundColor: categoryMeta.accent }}
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
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                      />
                    </div>

                    <div className="p-3.5 flex flex-col gap-1 flex-1 bg-white/70 backdrop-blur-md">
                      <p className="text-[9px] font-black uppercase tracking-[0.6px]" style={{ color: categoryMeta.accent }}>
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

                      <div className="mt-auto pt-2.5 border-t border-[#f0f5f1] flex items-center justify-between">
                        <div>
                          <span className="font-['Manrope',sans-serif] font-black text-[#0369a1] text-sm sm:text-base">
                            {p.price}
                          </span>
                          {p.orig && (
                            <span className="text-[#8aa08e] text-[10px] line-through ml-1 font-semibold">
                              MRP {p.orig}
                            </span>
                          )}
                        </div>

                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
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
                            className="w-8 h-8 rounded-2xl flex items-center justify-center text-white shrink-0 hover:scale-110 active:scale-95 transition-all shadow-md shadow-emerald-950/15 cursor-pointer border border-white/30"
                            style={{ backgroundColor: categoryMeta.accent }}
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

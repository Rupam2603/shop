import { useState, useEffect, useMemo } from "react";
import { useCart } from "../contexts/CartContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import ProductDetailModal, { nameToId, type PopupProduct } from "../components/ProductModal";
import KeyCategoriesBar, { KeyCategoryItem } from "../components/KeyCategoriesBar";
import InsuranceModal from "../components/InsuranceModal";
import type { Page } from "../App";
import imgMainFeatured from "@/imports/HealthSupplementsSubhOne/12180d12bdb759cb4c1126433eb9617bcf5f0e37.png";
import imgVitamins from "@/imports/HealthSupplementsSubhOne/82fde6fb40fb3f0de4e0ae8e660633ef3205b656.png";
import imgAyurveda from "@/imports/HealthSupplementsSubhOne/5bf6c30bcdaa73c2f154fa0056e19083a2be7538.png";

interface OffersPageProps {
  userRole?: string;
  onNavigate?: (page: Page, category?: string) => void;
}

const categoryTabs = [
  "All Supplements",
  "Protein",
  "Vitamins & Minerals",
  "Omega & Fish Oil",
  "Immunity Boosters",
  "Weight Management",
];

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L8.85 5.19L13.5 5.82L10.25 8.99L11.09 13.62L7 11.38L2.91 13.62L3.75 8.99L0.5 5.82L5.15 5.19L7 1Z" fill="#FFB703" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
      <path
        d="M10 17L1.73 8.73C0.6 7.6 0 6.08 0 4.5C0 1.42 2.42 0 4 0C5.58 0 7.21 0.68 8.41 1.84L10 3.36L11.59 1.84C12.79 0.68 14.42 0 16 0C17.58 0 20 1.42 20 4.5C20 6.08 19.4 7.6 18.27 8.73L10 17Z"
        fill={filled ? "#e53e3e" : "none"}
        stroke={filled ? "#e53e3e" : "#6d7a6f"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 1H3L3.4 3M4 7H13L14 3H3.4M4 7L2.7 10.3C2.31 10.87 2.72 11.67 3.4 11.67H13M13 11.67C12.07 11.67 11.33 12.41 11.33 13.33C11.33 14.26 12.07 15 13 15C13.93 15 14.67 14.26 14.67 13.33C14.67 12.41 13.93 11.67 13 11.67ZM5.67 13.33C5.67 14.26 4.93 15 4 15C3.07 15 2.33 14.26 2.33 13.33C2.33 12.41 3.07 11.67 4 11.67C4.93 11.67 5.67 12.41 5.67 13.33Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OffersPage({ userRole, onNavigate }: OffersPageProps) {
  const { addToCart } = useCart();
  const isRetailer = userRole === "retailer";
  const [activeTab, setActiveTab] = useState("All Supplements");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [dbProducts, setDbProducts] = useState<DbProduct[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);

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

    // Real-time Supabase subscription for stock and product updates
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

  const displayProducts = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];

    const suppProducts = dbProducts.filter((p) =>
      p.category_name === "Daily Wellness & Immunity" ||
      p.category_name === "Skin Care & Ointments" ||
      p.category_name === "Energy, Hydration & Supplements" ||
      p.category_name === "Skin Care, Powders & Ointments" ||
      p.discount_percent >= 15
    );

    const baseList = suppProducts.length > 0 ? suppProducts : dbProducts;

    let filtered = baseList;
    if (activeTab === "Protein") {
      filtered = baseList.filter((p) => /protein|glucon|horlicks/i.test(p.name + " " + (p.details || "")));
    } else if (activeTab === "Vitamins & Minerals") {
      filtered = baseList.filter((p) => /vitamin|zinc|chyawanprash|mineral/i.test(p.name + " " + (p.details || "")));
    } else if (activeTab === "Omega & Fish Oil") {
      filtered = baseList.filter((p) => /omega|oil/i.test(p.name + " " + (p.details || "")));
    } else if (activeTab === "Immunity Boosters") {
      filtered = baseList.filter((p) => /chyawanprash|honey|ors|immunity/i.test(p.name + " " + (p.details || "")));
    }

    if (filtered.length === 0) filtered = baseList;

    return filtered.slice(0, 8).map((p) => ({
      dbId: p.id,
      id: p.numeric_id,
      img: p.image_url,
      badge: p.discount_percent >= 25 ? "BEST VALUE" : p.discount_percent > 0 ? `${p.discount_percent}% OFF` : "",
      brand: p.brand,
      brandColor: "#006a39",
      name: p.name,
      sub: p.details || p.subtitle || p.brand,
      rating: "4.8",
      reviews: `(${p.stock + 120})`,
      price: isRetailer ? `₹${Math.round(p.retailer_price)}` : `₹${Math.round(p.customer_price)}`,
      orig: p.mrp > p.customer_price ? `₹${Math.round(p.mrp)}` : "",
      disc: p.discount_percent > 0 ? `${p.discount_percent}%` : "",
      cat: p.category_name,
      subCat: p.sub_category_name || "",
      stock: p.stock ?? 50,
      customer_price: p.customer_price,
      retailer_price: p.retailer_price,
    }));
  }, [dbProducts, activeTab, isRetailer]);

  const toggleWishlist = (i: number) => {
    setWishlist((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct({
      id: typeof product.id === "number" ? product.id : nameToId(product.name),
      dbId: product.dbId,
      name: product.name,
      brand: product.brand,
      cat: product.cat || "Supplements",
      subCat: product.subCat,
      sub: product.sub || product.brand,
      orig: product.orig || product.price,
      price: product.price,
      disc: product.disc || "",
      img: product.img,
      stock: product.stock ?? 50,
    });
  };

  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [activeKeyCat, setActiveKeyCat] = useState("50-off");

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    setActiveKeyCat(cat.id);
    if (cat.id === "insurance") {
      setShowInsuranceModal(true);
      return;
    }
    if (cat.route && onNavigate) {
      onNavigate(cat.route as Page);
      return;
    }
    if (onNavigate) {
      onNavigate("category", cat.id);
    }
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col gap-3.5 sm:gap-6">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e4ede2] shadow-xs overflow-hidden">
          <KeyCategoriesBar
            selectedId={activeKeyCat}
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* Featured Hero Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main hero */}
          <div className="md:col-span-2 rounded-2xl overflow-hidden relative min-h-[280px] sm:min-h-[340px] md:h-[400px] shadow-sm flex flex-col justify-end">
            <img
              src={imgMainFeatured}
              alt="Premium Sports Nutrition"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,59,76,0.85)] via-[rgba(7,59,76,0.3)] to-transparent" />
            <div className="relative z-10 p-5 sm:p-8 flex flex-col gap-2">
              <span className="bg-[#0f9d58] text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full w-fit tracking-[0.6px]">
                Premium Sports Nutrition
              </span>
              <h2 className="font-['Manrope',sans-serif] font-bold text-white text-2xl sm:text-3xl leading-tight">
                Fuel Your Performance
              </h2>
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed max-w-[448px]">
                Discover our clinical-grade whey proteins and pre-workout formulas designed for peak results.
              </p>
              <button
                onClick={() => onNavigate?.("medicines", "Energy, Hydration & Supplements")}
                className="bg-white text-[#073b4c] font-bold text-xs sm:text-sm tracking-[0.6px] px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg w-fit hover:bg-[#f0f7f0] transition-colors shadow-sm mt-1"
              >
                Shop Proteins
              </button>
            </div>
          </div>

          {/* Sub tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
            {/* Daily Vitamins tile */}
            <div
              onClick={() => onNavigate?.("medicines", "Energy, Hydration & Supplements")}
              className="rounded-2xl overflow-hidden relative h-[180px] sm:h-[190px] shadow-sm flex flex-col justify-end cursor-pointer group"
            >
              <img src={imgVitamins} alt="Daily Vitamins" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,59,76,0.75)] to-transparent" />
              <div className="relative z-10 p-4">
                <p className="font-['Manrope',sans-serif] font-semibold text-white text-lg sm:text-xl leading-tight">
                  Daily Vitamins
                </p>
                <p className="text-[#82fde6] text-xs tracking-[0.6px] uppercase mt-0.5">Explore</p>
              </div>
            </div>

            {/* Ayurvedic Blends tile */}
            <div
              onClick={() => onNavigate?.("medicines", "Energy, Hydration & Supplements")}
              className="rounded-2xl overflow-hidden relative h-[180px] sm:h-[190px] shadow-sm flex flex-col justify-end cursor-pointer group"
            >
              <img src={imgAyurveda} alt="Ayurvedic Blends" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,59,76,0.75)] to-transparent" />
              <div className="relative z-10 p-4">
                <p className="font-['Manrope',sans-serif] font-semibold text-white text-lg sm:text-xl leading-tight">
                  Ayurvedic Blends
                </p>
                <p className="text-[#82fde6] text-xs tracking-[0.6px] uppercase mt-0.5">Explore</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#006a39] text-white"
                  : "bg-white border border-[#d5dcd3] text-[#3e4a3f] hover:border-[#006a39] hover:text-[#006a39]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Best Sellers */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl sm:text-2xl lg:text-3xl leading-tight">
                Best Sellers
              </h2>
              <p className="text-[#3e4a3f] text-xs sm:text-sm mt-0.5 sm:mt-1">Highly rated clinical-grade formulations with real-time stock updates.</p>
            </div>
            <button
              onClick={() => onNavigate?.("medicines")}
              className="font-bold text-[#006a39] text-xs sm:text-sm tracking-[0.6px] flex items-center gap-1 hover:underline"
            >
              View All
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M9 3L13 7L9 11" stroke="#006a39" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayProducts.map((p, i) => {
              const isOutOfStock = p.stock !== undefined && p.stock <= 0;
              const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);

              return (
                <div
                  key={p.name}
                  onClick={() => handleProductClick(p)}
                  className={`bg-white/85 backdrop-blur-xl rounded-3xl border ${
                    isOutOfStock ? "border-rose-200/80 opacity-75" : "border-white/90 hover:border-emerald-300/80"
                  } hover:shadow-xl hover:shadow-emerald-950/8 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer`}
                >
                  <div className="bg-gradient-to-b from-white/90 to-slate-50/50 h-36 sm:h-44 relative flex items-center justify-center p-3">
                    {p.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-xs border border-white/30">
                        {p.badge}
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
                    <img src={p.img} alt={p.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300" />
                  </div>

                  <div className="p-3.5 sm:p-4 flex flex-col gap-1.5 flex-1 bg-white/70 backdrop-blur-md">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.6px] text-[#006a39]">
                      {p.brand}
                    </span>
                    <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xs sm:text-sm line-clamp-2 leading-snug min-h-[36px] group-hover:text-[#006a39] transition-colors">
                      {p.name}
                    </p>
                    {p.subCat && (
                      <span className="inline-block text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full leading-none w-fit">
                        {p.subCat}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#6d7a6f]">
                      <StarIcon />
                      <span className="font-extrabold text-[#073b4c] text-xs">{p.rating}</span>
                      <span className="text-[#8aa08e] text-[11px] font-medium">{p.reviews}</span>
                    </div>

                    <div className="mt-auto pt-2.5 border-t border-[#f0f5f1] flex items-center justify-between">
                      <div>
                        <span className="font-['Manrope',sans-serif] font-black text-[#073b4c] text-sm sm:text-base">
                          {p.price}
                        </span>
                        {p.orig && (
                          <span className="text-[#8aa08e] text-[10px] sm:text-xs line-through ml-1.5 font-semibold">
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
                              id: (p as any).dbId || (p as any).id || nameToId(p.name),
                              dbId: (p as any).dbId,
                              numeric_id: (p as any).id,
                              name: p.name,
                              brand: p.brand,
                              cat: p.cat || "Energy, Hydration & Supplements",
                              price: (p as any).retailer_price ?? (p as any).customer_price ?? p.price,
                              customer_price: (p as any).customer_price,
                              retailer_price: (p as any).retailer_price,
                              orig: p.orig,
                              img: p.img,
                            });
                          }}
                          className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-r from-[#006a39] to-[#008749] text-white shadow-md shadow-emerald-950/15 hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/30"
                          title="Add to Cart"
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


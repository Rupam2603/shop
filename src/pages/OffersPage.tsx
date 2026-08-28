import { useState, useEffect, useMemo } from "react";
import { useCart } from "../contexts/CartContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import ProductDetailModal, { nameToId, type PopupProduct } from "../components/ProductModal";
import type { Page } from "../App";
import imgMainFeatured from "@/imports/HealthSupplementsSubhOne/12180d12bdb759cb4c1126433eb9617bcf5f0e37.png";
import imgVitamins from "@/imports/HealthSupplementsSubhOne/82fde6fb40fb3f0de4e0ae8e660633ef3205b656.png";
import imgAyurveda from "@/imports/HealthSupplementsSubhOne/5bf6c30bcdaa73c2f154fa0056e19083a2be7538.png";
import imgWheyProtein from "@/imports/HealthSupplementsSubhOne/d5d15fa3258f8a08d359a05ee21c14dc9b5772a4.png";
import imgOmega3 from "@/imports/HealthSupplementsSubhOne/f2d5336de26350e80b974508f11f2c0dd8b163aa.png";
import imgMultivitamins from "@/imports/HealthSupplementsSubhOne/3c99917897bd535bf5e0599101f9a9230ad0a63d.png";
import imgAshwagandha from "@/imports/HealthSupplementsSubhOne/572e3e713ff3505ed972644010e32394fe453e53.png";

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

const bestSellers = [
  {
    img: imgWheyProtein,
    badge: "",
    brand: "OPTIMUM NUTRITION",
    brandColor: "#006a39",
    name: "Gold Standard 100% Whey Protein Isolate",
    rating: "4.8",
    reviews: "(1.2k)",
    price: "₹3,499",
    orig: "₹3,999",
    disc: "12%",
    cat: "Energy, Hydration & Supplements",
    stock: 50,
  },
  {
    img: imgOmega3,
    badge: "",
    brand: "NATURE'S BOUNTY",
    brandColor: "#006a39",
    name: "Triple Strength Omega-3 Fish Oil 1400mg",
    rating: "4.6",
    reviews: "(850)",
    price: "₹1,249",
    orig: "₹1,499",
    disc: "16%",
    cat: "Energy, Hydration & Supplements",
    stock: 35,
  },
  {
    img: imgMultivitamins,
    badge: "BEST VALUE",
    brand: "CENTRUM",
    brandColor: "#006a39",
    name: "Adult Multivitamin & Multimineral Supplement",
    rating: "4.9",
    reviews: "(2.1k)",
    price: "₹999",
    orig: "₹1,299",
    disc: "23%",
    cat: "Energy, Hydration & Supplements",
    stock: 40,
  },
  {
    img: imgAshwagandha,
    badge: "",
    brand: "HIMALAYA",
    brandColor: "#006a39",
    name: "Organic Ashwagandha Root Extract",
    rating: "4.7",
    reviews: "(420)",
    price: "₹649",
    orig: "₹799",
    disc: "18%",
    cat: "Energy, Hydration & Supplements",
    stock: 25,
  },
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
      if (mounted && data && data.length > 0) {
        setDbProducts(data);
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
    if (!dbProducts || dbProducts.length === 0) return bestSellers;

    const suppProducts = dbProducts.filter((p) =>
      p.category_name === "Energy, Hydration & Supplements" ||
      p.category_name === "Skin Care, Powders & Ointments" ||
      p.discount_percent >= 15
    );

    if (suppProducts.length === 0) return bestSellers;

    let filtered = suppProducts;
    if (activeTab === "Protein") {
      filtered = suppProducts.filter((p) => p.name.toLowerCase().includes("protein") || p.name.toLowerCase().includes("glucon"));
    } else if (activeTab === "Vitamins & Minerals") {
      filtered = suppProducts.filter((p) => p.name.toLowerCase().includes("vitamin") || p.name.toLowerCase().includes("zinc") || p.name.toLowerCase().includes("chyawanprash"));
    } else if (activeTab === "Omega & Fish Oil") {
      filtered = suppProducts.filter((p) => p.name.toLowerCase().includes("omega") || p.name.toLowerCase().includes("oil"));
    } else if (activeTab === "Immunity Boosters") {
      filtered = suppProducts.filter((p) => p.name.toLowerCase().includes("chyawanprash") || p.name.toLowerCase().includes("honey") || p.name.toLowerCase().includes("ors"));
    }

    if (filtered.length === 0) filtered = suppProducts;

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
      stock: p.stock ?? 50,
    }));
  }, [dbProducts, activeTab, isRetailer]);

  const toggleWishlist = (i: number) => {
    setWishlist((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">

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
                  onClick={() => setSelectedProduct({
                    id: (p as any).id || nameToId(p.name),
                    dbId: (p as any).dbId,
                    name: p.name,
                    sub: p.sub || p.brand,
                    price: p.price,
                    orig: p.orig || "",
                    disc: p.disc || "",
                    cat: p.cat || "Energy, Hydration & Supplements",
                    brand: p.brand,
                    img: p.img,
                    stock: p.stock ?? 50,
                  })}
                  className={`bg-white rounded-xl border ${isOutOfStock ? "border-red-200 opacity-80" : "border-[#d5dcd3]"} overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col cursor-pointer group`}
                >
                  <div className="relative bg-[#f8fafb] h-44 sm:h-48 flex items-center justify-center p-4">
                    {p.badge && (
                      <span className="absolute top-2 left-2 z-10 bg-[#ffb703] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        {p.badge}
                      </span>
                    )}

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="absolute top-2 right-2 z-10 bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                        {isRetailer ? "Stock Out (0)" : "Out of Stock"}
                      </span>
                    ) : isLowStock ? (
                      <span className="absolute top-2 right-2 z-10 bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase animate-pulse shadow-sm">
                        {isRetailer ? `Low Stock (${p.stock})` : `Only ${p.stock} Left`}
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 z-10 bg-[#d1fae5]/90 text-[#047857] text-[8px] font-bold px-2 py-0.5 rounded shadow-sm">
                        {isRetailer ? `📦 ${p.stock} units` : `${p.stock} in stock`}
                      </span>
                    )}

                    <img
                      src={p.img}
                      alt={p.name}
                      className="h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3.5 sm:p-4 flex flex-col gap-1.5 flex-1">
                    <p
                      className="text-[10px] sm:text-xs font-bold tracking-[0.6px] uppercase"
                      style={{ color: p.brandColor }}
                    >
                      {p.brand}
                    </p>
                    <h4 className="font-bold text-[#073b4c] text-xs sm:text-sm leading-snug line-clamp-2">{p.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarIcon />
                      <span className="font-bold text-[#073b4c] text-xs sm:text-sm">{p.rating}</span>
                      <span className="text-[#6d7a6f] text-[10px] sm:text-xs">{p.reviews}</span>
                    </div>

                    <div className="mt-auto pt-2">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg leading-6">
                            {p.price}
                          </span>
                          {p.orig && <span className="text-[#9aa89b] text-[10px] sm:text-xs line-through">{p.orig}</span>}
                        </div>
                        {isRetailer && (
                          <span className="text-[9px] bg-[#dbeafe] text-[#1d4ed8] px-1.5 py-0.5 rounded font-bold uppercase">
                            Wholesale
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] mb-2">
                        {isOutOfStock ? (
                          <span className="text-[#dc2626] font-bold">🔴 Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-[#d97706] font-semibold">⚠️ {p.stock} units remaining</span>
                        ) : (
                          <span className="text-[#059669] font-medium">🟢 {p.stock} units available</span>
                        )}
                      </div>

                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full py-2 bg-[#f3f4f6] text-[#9ca3af] font-bold text-xs rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          Out of Stock
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              id: (p as any).id || nameToId(p.name),
                              numeric_id: (p as any).id,
                              name: p.name,
                              brand: p.brand,
                              cat: p.cat || "Energy, Hydration & Supplements",
                              price: p.price,
                              orig: p.orig,
                              img: p.img,
                            });
                          }}
                          className="w-full py-2 bg-[#006a39] text-white font-bold text-xs rounded-lg hover:bg-[#005a30] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          aria-label="Add to cart"
                          title="Add to Cart"
                        >
                          <CartIcon />
                          <span>Add to Cart</span>
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
    </div>
  );
}


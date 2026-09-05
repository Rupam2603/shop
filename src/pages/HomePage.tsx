import { useState, useEffect, useMemo } from "react";
import type { Page } from "../App";
import ProductDetailModal, { nameToId, type PopupProduct } from "../components/ProductModal";
import KeyCategoriesBar, { KEY_CATEGORIES, KeyCategoryItem } from "../components/KeyCategoriesBar";
import { KEY_CATEGORIES_CONFIG, isProductInCategory } from "../lib/keyCategories";
import InsuranceModal from "../components/InsuranceModal";
import { useCart } from "../contexts/CartContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import imgHeroBg from "@/assets/hero-banner.jpg";
import imgPromoShelf from "@/assets/pharmacy-shelf.jpg";
import imgProduct1 from "@/imports/SubhOneHomeYourWellnessPartner/ed2cee3d70ea8b6d972ea44b1746b961d47ff5b3.png";
import imgProduct2 from "@/imports/SubhOneHomeYourWellnessPartner/a57c492ebf391250fdba394a1ec646ea8a83b1ed.png";
import imgProduct3 from "@/imports/SubhOneHomeYourWellnessPartner/fd45459640081f88735ba0ccaedc003e03983ae7.png";
import imgProduct4 from "@/imports/SubhOneHomeYourWellnessPartner/025be39c0ac7528a3968899be77492c149730632.png";

interface HomePageProps {
  onNavigate: (page: Page, category?: string) => void;
  userRole?: string;
}

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&q=80`;

function useCountdown(initial: number) {
  const [s, setS] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(sec).padStart(2, "0")}s`;
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 7.5H12M8.5 4L12 7.5L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FlashIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <path d="M9 1L1 11H8L7 19L15 9H8L9 1Z" fill="#FFB703" stroke="#FFB703" strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  );
}

export interface HomeCategoryProduct {
  id?: number;
  dbId?: string;
  numeric_id?: number;
  name: string;
  sub: string;
  price: string;
  orig?: string;
  disc?: string;
  img: string;
  brand?: string;
  cat?: string;
  stock?: number;
  customer_price?: number;
  retailer_price?: number;
}

export interface HomeCategorySectionItem {
  id?: string;
  cat: string;
  short: string;
  accent: string;
  lightBg: string;
  iconBg: string;
  tagline?: string;
  count: number;
  icon: React.ReactNode;
  products: HomeCategoryProduct[];
}



function ProductCard({
  p,
  accent,
  onAddToCart,
  onClick,
  isRetailer,
}: {
  p: HomeCategoryProduct;
  accent: string;
  onAddToCart?: () => void;
  onClick?: () => void;
  isRetailer?: boolean;
}) {
  const isOutOfStock = p.stock !== undefined && p.stock <= 0;
  const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);

  return (
    <div
      onClick={onClick}
      className={`w-[155px] sm:w-[195px] lg:w-auto shrink-0 lg:shrink snap-start bg-white/85 backdrop-blur-xl rounded-3xl border ${
        isOutOfStock ? "border-rose-200/80 opacity-75" : "border-white/90 hover:border-emerald-300/80"
      } shadow-xs hover:shadow-xl hover:shadow-emerald-950/8 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer`}
    >
      <div className="bg-gradient-to-b from-white/90 to-slate-50/50 h-28 sm:h-36 relative overflow-hidden flex items-center justify-center p-2.5">
        {p.disc && (
          <span
            className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-xs border border-white/30 backdrop-blur-md"
            style={{ backgroundColor: accent }}
          >
            {p.disc} OFF
          </span>
        )}
        {isOutOfStock ? (
          <span className="absolute top-2.5 right-2.5 z-10 bg-rose-50/90 text-rose-700 border border-rose-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-2xs backdrop-blur-md">
            {isRetailer ? "Stock Out" : "Out of Stock"}
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2.5 right-2.5 z-10 bg-amber-50/90 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse shadow-2xs backdrop-blur-md">
            {isRetailer ? `Low (${p.stock})` : `Only ${p.stock} Left`}
          </span>
        ) : (
          <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-50/90 text-emerald-800 border border-emerald-200 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
            {isRetailer ? `📦 ${p.stock} units` : `${p.stock} in stock`}
          </span>
        )}
        <img
          src={p.img}
          alt={p.name}
          className="h-full w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }}
        />
      </div>
      <div className="p-3 sm:p-3.5 flex flex-col gap-1 flex-1 bg-white/70 backdrop-blur-md">
        <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[34px] group-hover:text-[#006a39] transition-colors">
          {p.name}
        </p>
        <p className="text-[#8aa08e] text-[10px] sm:text-[11px] truncate font-medium">{p.sub}</p>

        {/* Real-time stock status indicator */}
        <div className="text-[9px] mt-0.5">
          {isOutOfStock ? (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of stock
            </span>
          ) : isLowStock ? (
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> {p.stock} units left
            </span>
          ) : (
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {p.stock} in stock
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-[#f0f5f1]">
          <div>
            <span className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base">
              {p.price}
            </span>
            {p.orig && (
              <span className="text-[#9aa89b] text-[10px] sm:text-xs line-through ml-1 font-semibold">
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
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.();
              }}
              className="w-8 h-8 rounded-2xl flex items-center justify-center text-white shrink-0 hover:scale-110 active:scale-95 transition-all shadow-md shadow-emerald-950/15 cursor-pointer border border-white/40"
              style={{ backgroundColor: accent }}
              title="Add to cart"
            >
              <PlusIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  item,
  isRetailer,
  onViewAll,
  onProductClick,
  onAddToCart,
}: {
  item: HomeCategorySectionItem;
  isRetailer?: boolean;
  onViewAll: () => void;
  onProductClick: (p: PopupProduct) => void;
  onAddToCart: (p: HomeCategoryProduct, cat: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <div
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4.5 rounded-3xl backdrop-blur-xl border border-white/80 shadow-xs"
        style={{
          background: `linear-gradient(135deg, ${item.lightBg}cc 0%, rgba(255, 255, 255, 0.9) 100%)`,
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-white/40 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: item.iconBg, color: item.accent }}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-['Manrope',sans-serif] font-extrabold text-base sm:text-xl truncate" style={{ color: item.accent }}>
              {item.cat}
            </h2>
            <p className="text-[#657969] text-[11px] sm:text-xs mt-0.5 font-medium truncate">
              {item.tagline ? item.tagline : `${item.count} certified medicines · Express Dispatch`}
            </p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white text-xs sm:text-sm font-extrabold shadow-2xs hover:shadow-xs border border-white transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
          style={{ color: item.accent }}
        >
          <span>View All</span>
          <ArrowRight />
        </button>
      </div>

      <div className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 pt-0.5 snap-x">
        {item.products.map((p) => (
          <ProductCard
            key={p.name}
            p={p}
            accent={item.accent}
            isRetailer={isRetailer}
            onClick={() => onProductClick({
              id: p.numeric_id || p.id || nameToId(p.name),
              dbId: p.dbId,
              name: p.name,
              sub: p.sub,
              price: p.price,
              orig: p.orig || "",
              disc: p.disc || "",
              cat: item.cat,
              brand: p.brand || p.name.split(" ")[0],
              img: p.img,
              stock: p.stock ?? 50,
              customer_price: p.customer_price,
              retailer_price: p.retailer_price,
            })}
            onAddToCart={() => onAddToCart(p, item.cat)}
          />
        ))}
        <button
          onClick={onViewAll}
          className="w-[140px] sm:w-[160px] lg:w-auto shrink-0 snap-start rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 p-4 hover:bg-white transition-all group min-h-[190px] sm:min-h-[220px]"
          style={{ borderColor: item.iconBg }}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: item.lightBg, color: item.accent }}>
            <ArrowRight />
          </div>
          <p className="text-xs font-semibold text-center" style={{ color: item.accent }}>See all {item.short}</p>
        </button>
      </div>
    </section>
  );
}

export default function HomePage({ onNavigate, userRole }: HomePageProps) {
  const countdown = useCountdown(2 * 3600 + 45 * 60 + 12);
  const isRetailer = userRole === "retailer";
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);
  const [dbProducts, setDbProducts] = useState<DbProduct[] | null>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [activeKeyCat, setActiveKeyCat] = useState("all");

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    setActiveKeyCat(cat.id);
    if (cat.id === "insurance") {
      setShowInsuranceModal(true);
      return;
    }
    if (cat.route) {
      onNavigate(cat.route as Page);
      return;
    }
  };

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

    // Real-time Supabase subscription for stock and product changes
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

  const categoriesData = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];

    // Eligible key categories (excluding purely service routes like insurance and lab-tests)
    const eligibleConfigs = KEY_CATEGORIES_CONFIG.filter((c) => c.id !== "all" && !c.route);

    const sections = eligibleConfigs.map((catConfig) => {
      const prodsForCat = dbProducts.filter((p) => {
        if (catConfig.filterFn) {
          return catConfig.filterFn({
            name: p.name,
            sub: p.details || p.subtitle || "",
            cat: p.category_name,
            disc: p.discount_percent > 0 ? `${p.discount_percent}%` : "",
            price: String(p.customer_price),
          });
        }
        return isProductInCategory(p.category_name, catConfig.id);
      });

      if (prodsForCat.length === 0) return null;

      const keyCat = KEY_CATEGORIES.find((k) => k.id === catConfig.id);

      return {
        id: catConfig.id,
        cat: catConfig.name,
        short: catConfig.short,
        accent: catConfig.accent,
        lightBg: catConfig.lightBg,
        iconBg: catConfig.iconBg,
        tagline: catConfig.tagline,
        count: prodsForCat.length,
        icon: keyCat?.icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          </svg>
        ),
        products: prodsForCat.slice(0, 8).map((p) => ({
          id: p.numeric_id,
          dbId: p.id,
          numeric_id: p.numeric_id,
          name: p.name,
          sub: p.details || p.subtitle || p.brand,
          price: `₹${Math.round(p.retailer_price || p.customer_price)}`,
          orig: p.mrp > (p.retailer_price || p.customer_price) ? `₹${Math.round(p.mrp)}` : "",
          disc: p.retailer_discount_percent > 0 ? `${p.retailer_discount_percent}%` : (p.discount_percent > 0 ? `${p.discount_percent}%` : ""),
          img: p.image_url,
          brand: p.brand,
          cat: p.category_name,
          stock: p.stock ?? 50,
          customer_price: p.customer_price,
          retailer_price: p.retailer_price,
        })),
      };
    }).filter(Boolean) as HomeCategorySectionItem[];

    if (activeKeyCat && activeKeyCat !== "all") {
      const selectedOnly = sections.filter((s) => s.id === activeKeyCat);
      if (selectedOnly.length > 0) return selectedOnly;
    }

    return sections;
  }, [dbProducts, isRetailer, activeKeyCat]);

  const flashSaleData = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return [];

    const flashFromDb = dbProducts.filter((p) => p.is_flash_sale || p.discount_percent >= 15);
    const list = flashFromDb.length > 0 ? flashFromDb : dbProducts.filter((p) => p.discount_percent > 0);
    if (list.length === 0) return [];

    return list.slice(0, 4).map((p) => ({
      id: p.numeric_id,
      dbId: p.id,
      numeric_id: p.numeric_id,
      name: p.name,
      sub: p.details || p.subtitle || p.brand,
      price: `₹${Math.round(p.retailer_price || p.customer_price)}`,
      orig: p.mrp > (p.retailer_price || p.customer_price) ? `₹${Math.round(p.mrp)}` : "",
      disc: `${p.discount_percent}%`,
      cat: p.category_name,
      brand: p.brand,
      img: p.image_url,
      badge: `${p.discount_percent}% OFF`,
      color: "#ba1a1a",
      stock: p.stock ?? 50,
      customer_price: p.customer_price,
      retailer_price: p.retailer_price,
    }));
  }, [dbProducts, isRetailer]);

  const handleAddToCartFromCategory = (p: HomeCategoryProduct, cat: string) => {
    addToCart({
      id: p.numeric_id || p.id || nameToId(p.name),
      dbId: p.dbId,
      numeric_id: p.numeric_id || p.id,
      name: p.name,
      sub: p.sub,
      cat,
      brand: p.brand || p.name.split(" ")[0],
      price: p.retailer_price ?? p.customer_price ?? p.price,
      customer_price: p.customer_price,
      retailer_price: p.retailer_price,
      orig: p.orig,
      img: p.img,
    });
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col gap-3.5 sm:gap-6">

        {/* ── Key Categories Bar (ABOVE BANNER IMAGE - SLEEK COMPACT PROFILE) ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e4ede2] shadow-xs overflow-hidden">
          <KeyCategoriesBar
            selectedId={activeKeyCat}
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[360px] md:h-[400px] shadow-lg border border-[#e4ede2]/60 flex items-center bg-[#073b4c]">
          {/* High-res background image with progressive gradient overlay */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={imgHeroBg}
              alt="SubhOne Pharmacy & Healthcare"
              className="w-full h-full object-cover object-right sm:object-center"
            />
            {/* Multi-stage progressive gradient overlay for ultra-crisp text readability & ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#073b4c]/95 via-[#073b4c]/85 sm:via-[#073b4c]/70 md:via-[#073b4c]/40 to-transparent" />
            <div className="absolute inset-0 bg-radial at-top-left from-[#006a39]/30 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col gap-3 sm:gap-4 p-6 sm:p-10 lg:p-14 max-w-[620px] justify-center h-full">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#ba1a1a] text-white text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Limited Time Offer
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium border border-white/20">
                ✨ 100% Genuine Pharmacy
              </span>
            </div>

            <h1 className="font-['Manrope',sans-serif] font-extrabold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight sm:leading-[1.15] tracking-tight">
              Flat <span className="text-[#82fde6] underline decoration-[#006a39] underline-offset-4">20% Off</span> on First Order
            </h1>

            <p className="text-white/90 text-xs sm:text-base leading-relaxed font-normal max-w-lg drop-shadow-xs">
              Genuine medicines, certified wellness supplements, baby care & emergency essentials — delivered to your doorstep in 30 mins.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate("medicines")}
                className="bg-[#006a39] hover:bg-[#005a30] text-white text-xs sm:text-sm font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg hover:shadow-emerald-900/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Shop Medicines</span>
                <ArrowRight />
              </button>

              <button
                onClick={() => onNavigate("offers")}
                className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md text-xs sm:text-sm font-semibold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-white/30 hover:border-white transition-all cursor-pointer"
              >
                Explore Deals & Offers
              </button>
            </div>

            {/* Micro Trust badges */}
            <div className="flex items-center gap-4 sm:gap-6 pt-2 border-t border-white/15 text-white/85 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">⚡</span>
                <span>30-Min Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">🛡️</span>
                <span>Batch Verified</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">🩺</span>
                <span>Licensed Pharmacists</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Key Category Filter Indicator */}
        {activeKeyCat !== "all" && (
          <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#006a39]">Key Category:</span>
              <span className="text-xs font-extrabold text-[#073b4c] bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                {KEY_CATEGORIES.find((k) => k.id === activeKeyCat)?.name || activeKeyCat}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveKeyCat("all")}
              className="text-xs font-extrabold text-[#006a39] hover:underline cursor-pointer flex items-center gap-1"
            >
              Show All Key Categories ✕
            </button>
          </div>
        )}

        {/* Key Category sections */}
        {categoriesData.map((item) => (
          <CategorySection
            key={item.id || item.cat}
            item={item}
            isRetailer={isRetailer}
            onViewAll={() => onNavigate("category" as any, item.id || item.cat)}
            onProductClick={setSelectedProduct}
            onAddToCart={handleAddToCartFromCategory}
          />
        ))}

        {categoriesData.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e4ede2] p-8 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-[#073b4c]">No products found in this key category yet.</p>
            <button
              type="button"
              onClick={() => setActiveKeyCat("all")}
              className="px-4 py-2 bg-[#006a39] text-white text-xs font-bold rounded-xl hover:bg-[#00522c] transition-colors cursor-pointer"
            >
              View All Key Categories
            </button>
          </div>
        )}

        {/* Flash Sale */}
        {flashSaleData.length > 0 && (
          <>
            <div className="border-t border-[#dee4db]" />
            <section className="flex flex-col gap-3.5 sm:gap-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <div className="flex items-center gap-2">
                    <FlashIcon />
                    <h2 className="font-['Manrope',sans-serif] font-semibold text-[#073b4c] text-lg sm:text-2xl">Flash Sale</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3e4a3f] text-xs sm:text-sm">Ends in:</span>
                    <span className="bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold px-2 py-0.5 rounded">{countdown}</span>
                  </div>
                </div>
                <button onClick={() => onNavigate("offers")} className="font-bold text-[#006a39] text-xs sm:text-sm hover:underline">View All</button>
              </div>
              <div className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 pt-0.5 snap-x">
                {flashSaleData.map((p) => {
                  const isOutOfStock = (p as any).stock !== undefined && (p as any).stock <= 0;
                  const isLowStock = (p as any).stock !== undefined && (p as any).stock > 0 && (p as any).stock <= (isRetailer ? 20 : 10);
                  const pStock = (p as any).stock ?? 50;

                  return (
                    <div
                      key={p.name}
                      onClick={() => setSelectedProduct({
                        id: (p as any).numeric_id || nameToId(p.name),
                        dbId: (p as any).dbId,
                        name: p.name,
                        sub: p.sub,
                        price: p.price,
                        orig: p.orig || "",
                        disc: p.disc,
                        cat: p.cat,
                        brand: p.brand,
                        img: p.img,
                        stock: pStock,
                        customer_price: (p as any).customer_price,
                        retailer_price: (p as any).retailer_price,
                      })}
                      className={`w-[170px] sm:w-[220px] lg:w-auto shrink-0 snap-start bg-white rounded-2xl border ${isOutOfStock ? "border-red-200 opacity-80" : "border-[rgba(189,202,188,0.4)]"} overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
                    >
                      <div className="bg-[#f8fafb] h-32 sm:h-40 relative overflow-hidden flex items-center justify-center">
                        <span className="absolute top-2 left-2 z-10 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm" style={{ backgroundColor: p.color }}>{p.badge}</span>
                        {isOutOfStock ? (
                          <span className="absolute top-2 right-2 z-10 bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shadow-sm">
                            {isRetailer ? "Stock Out" : "Out of Stock"}
                          </span>
                        ) : isLowStock ? (
                          <span className="absolute top-2 right-2 z-10 bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse shadow-sm">
                            {isRetailer ? `Low (${pStock})` : `Only ${pStock} Left`}
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 z-10 bg-[#d1fae5]/90 text-[#047857] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            {isRetailer ? `📦 ${pStock} units` : `${pStock} in stock`}
                          </span>
                        )}
                        <img src={p.img} alt={p.name} className="h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
                        <p className="font-bold text-[#073b4c] text-xs sm:text-sm leading-5 line-clamp-2">{p.name}</p>
                        <p className="text-[#3e4a3f] text-[10px] sm:text-xs">{p.sub}</p>

                        {/* Stock status indicator */}
                        <div className="text-[10px] mt-0.5">
                          {isOutOfStock ? (
                            <span className="text-[#dc2626] font-bold">🔴 Out of stock</span>
                          ) : isLowStock ? (
                            <span className="text-[#d97706] font-semibold">⚠️ {pStock} units remaining</span>
                          ) : (
                            <span className="text-[#059669] font-medium">🟢 {pStock} in stock</span>
                          )}
                        </div>

                        <div className="flex items-end justify-between mt-auto pt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm sm:text-lg">{p.price}</span>
                            {p.orig && <span className="text-[#9aa89b] text-[10px] sm:text-xs line-through">MRP {p.orig}</span>}
                          </div>
                          {isOutOfStock ? (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Out</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart({
                                  id: (p as any).numeric_id || nameToId(p.name),
                                  dbId: (p as any).dbId,
                                  numeric_id: (p as any).numeric_id,
                                  name: p.name,
                                  sub: p.sub,
                                  cat: p.cat,
                                  brand: p.brand,
                                  price: (p as any).retailer_price ?? (p as any).customer_price ?? p.price,
                                  customer_price: (p as any).customer_price,
                                  retailer_price: (p as any).retailer_price,
                                  orig: p.orig,
                                  img: p.img,
                                });
                              }}
                              className="w-7 h-7 sm:w-8 sm:h-8 bg-[#e9f0e7] rounded-full flex items-center justify-center hover:bg-[#006a39] hover:text-white text-[#006a39] transition-colors"
                              aria-label="Add to cart"
                            >
                              <PlusIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Quality Promise & Certified Pharmacy Banner */}
        <section className="relative rounded-3xl overflow-hidden shadow-lg border border-[#e4ede2]/70 bg-[#073b4c] text-white">
          <div className="absolute inset-0">
            <img
              src={imgPromoShelf}
              alt="Certified Pharmacy & Laboratory"
              className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#073b4c] via-[#073b4c]/90 to-[#073b4c]/65" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2.5 max-w-xl text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] sm:text-xs font-extrabold text-[#82fde6] uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
                  🛡️ SubhOne Certified Quality Network
                </span>
              </div>
              <h3 className="font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl text-white leading-tight">
                Direct from Licensed Distributors with 100% Cold-Chain Integrity
              </h3>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Every medication, wellness supplement, and baby care product undergoes strict batch-tracking and climate-controlled storage before reaching your hands.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => onNavigate("medicines")}
                className="bg-[#006a39] hover:bg-[#005a30] text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-md text-center active:scale-[0.98] cursor-pointer"
              >
                Browse All Medicines
              </button>
              <button
                onClick={() => onNavigate("lab-tests")}
                className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all border border-white/30 text-center backdrop-blur-md cursor-pointer"
              >
                Book Home Lab Tests
              </button>
            </div>
          </div>
        </section>

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

import { useState, useEffect, useMemo } from "react";
import type { Page } from "../App";
import ProductDetailModal, { nameToId, type PopupProduct } from "../components/ProductModal";
import KeyCategoriesBar, { KEY_CATEGORIES, KeyCategoryItem } from "../components/KeyCategoriesBar";
import HeroBannerSlider from "../components/HeroBannerSlider";
import { KEY_CATEGORIES_CONFIG, isProductInCategory } from "../lib/keyCategories";
import InsuranceModal from "../components/InsuranceModal";
import { useCart } from "../contexts/CartContext";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import InfinityLoader from "../components/InfinityLoader";
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
  subCat?: string;
  price: string;
  orig?: string;
  disc?: string;
  img: string;
  brand?: string;
  cat?: string;
  stock?: number;
  customer_price?: number;
  retailer_price?: number;
  return_policy?: string;
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

export const TOP_CATEGORIES = [
  {
    id: "monsoon",
    name: "Monsoon Care",
    cat: "Monsoon Health & Antiseptics",
    img: "/categories/monsoon-care.png",
  },
  {
    id: "immunity",
    name: "Immunity Boosters",
    cat: "Daily Wellness & Immunity",
    img: "/categories/immunity-boosters.png",
  },
  {
    id: "pain-relief",
    name: "Pain Relief",
    cat: "Pain Relief & Muscle Care",
    img: "/categories/pain-relief.png",
  },
  {
    id: "baby",
    name: "Baby Care",
    cat: "Baby Care & Infant Nutrition",
    img: "/categories/baby-care.png",
  },
  {
    id: "personal-care",
    name: "Personal Care",
    cat: "Skin Care & Ointments",
    img: "/categories/personal-care.png",
  },
  {
    id: "devices",
    name: "Health Devices",
    cat: "Medical Supplies & Devices",
    img: "/categories/health-devices.png",
  },
];

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
      className={`w-[155px] sm:w-[195px] lg:w-auto shrink-0 lg:shrink snap-start bg-white/90 backdrop-blur-xl rounded-3xl border ${
        isOutOfStock ? "border-rose-200/80 opacity-75" : "border-slate-200/85 hover:border-[#ff3366]/40"
      } shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer`}
    >
      <div className="bg-slate-50/70 h-28 sm:h-36 relative overflow-hidden flex items-center justify-center p-2.5">
        {p.disc && (
          <span
            className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-xs bg-[#ff3366]"
          >
            {p.disc} OFF
          </span>
        )}
        {isOutOfStock ? (
          <span className="absolute top-2.5 right-2.5 z-10 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-2xs backdrop-blur-md">
            {isRetailer ? "Stock Out" : "Out of Stock"}
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2.5 right-2.5 z-10 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse shadow-2xs backdrop-blur-md">
            {isRetailer ? `Low (${p.stock})` : `Only ${p.stock} Left`}
          </span>
        ) : (
          <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
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
      <div className="p-3 sm:p-3.5 flex flex-col gap-1 flex-1 bg-white">
        <p className="font-['Manrope',sans-serif] font-extrabold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[34px] group-hover:text-[#ff3366] transition-colors">
          {p.name}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-slate-400 text-[10px] sm:text-[11px] truncate font-medium">{p.sub}</p>
          {p.subCat && (
            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full">
              {p.subCat}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100">
          <div>
            <span className="font-['Manrope',sans-serif] font-extrabold text-slate-900 text-sm sm:text-base">
              {p.price}
            </span>
            {p.orig && (
              <span className="text-slate-400 text-[10px] sm:text-xs line-through ml-1 font-semibold">
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
              className="w-8 h-8 rounded-2xl flex items-center justify-center text-white shrink-0 hover:scale-110 active:scale-95 transition-all shadow-md bg-[#ff3366] hover:bg-[#e02958] cursor-pointer"
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
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4.5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xs"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-rose-100 bg-rose-50 text-[#ff3366] group-hover:scale-105 transition-transform"
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-['Manrope',sans-serif] font-extrabold text-base sm:text-xl text-slate-900 truncate">
              {item.cat}
            </h2>
            <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 font-medium truncate">
              {item.tagline ? item.tagline : `${item.count} certified medicines · Express Dispatch`}
            </p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#ff3366] text-xs sm:text-sm font-extrabold shadow-2xs hover:shadow-xs border border-rose-200/80 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
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
              subCat: p.subCat,
              price: p.price,
              orig: p.orig || "",
              disc: p.disc || "",
              cat: item.cat,
              brand: p.brand || p.name.split(" ")[0],
              img: p.img,
              stock: p.stock ?? 50,
              customer_price: p.customer_price,
              retailer_price: p.retailer_price,
              return_policy: p.return_policy || "Non-Returnable",
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
          subCat: p.sub_category_name || "",
          stock: p.stock ?? 50,
          customer_price: p.customer_price,
          retailer_price: p.retailer_price,
          return_policy: p.return_policy || "Non-Returnable",
        })),
      };
    }).filter(Boolean) as HomeCategorySectionItem[];

    if (activeKeyCat && activeKeyCat !== "all") {
      return sections.filter((s) => s.id === activeKeyCat);
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
      return_policy: p.return_policy || "Non-Returnable",
    }));
  }, [dbProducts, isRetailer]);

  const dealsOfTheDayList = useMemo(() => {
    const defaultDeals = [
      {
        name: "Dettol Liquid 250ml",
        sub: "Antiseptic Disinfectant Liquid",
        price: 110,
        origPrice: 155,
        disc: "29% OFF",
        img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
        brand: "Dettol",
        cat: "Monsoon Health & Antiseptics",
      },
      {
        name: "Crocin Advance",
        sub: "Fast Relief Paracetamol 500mg",
        price: 45,
        origPrice: 60,
        disc: "25% OFF",
        img: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80",
        brand: "Crocin",
        cat: "Pain Relief & Muscle Care",
      },
      {
        name: "Accu-Chek 50 Strips",
        sub: "Active Blood Glucose Test Strips",
        price: 849,
        origPrice: 965,
        disc: "12% OFF",
        img: "https://images.unsplash.com/photo-1583912267670-6575ad472688?w=300&q=80",
        brand: "Accu-Chek",
        cat: "Medical Supplies & Devices",
      },
      {
        name: "Dolo-650 Tablet",
        sub: "Paracetamol 650mg Antipyretic",
        price: 18,
        origPrice: 20,
        disc: "10% OFF",
        img: "https://images.unsplash.com/photo-1550572017-ed20015ade08?w=300&q=80",
        brand: "Micro Labs",
        cat: "Pain Relief & Muscle Care",
      },
    ];

    if (!dbProducts || dbProducts.length === 0) {
      return defaultDeals.map((d, idx) => ({
        id: idx + 101,
        numeric_id: idx + 101,
        dbId: `deal-${idx}`,
        name: d.name,
        sub: d.sub,
        price: `₹${d.price}`,
        orig: `₹${d.origPrice}`,
        disc: d.disc,
        rawPrice: d.price,
        rawOrig: d.origPrice,
        brand: d.brand,
        cat: d.cat,
        img: d.img,
        stock: 50,
      }));
    }

    return defaultDeals.map((d, idx) => {
      const match = dbProducts.find((p) => p.name.toLowerCase().includes(d.name.split(" ")[0].toLowerCase()));
      if (match) {
        const pPrice = Math.round(match.retailer_price || match.customer_price || d.price);
        const pMrp = Math.round(match.mrp || d.origPrice);
        return {
          id: match.numeric_id || idx + 101,
          numeric_id: match.numeric_id || idx + 101,
          dbId: match.id,
          name: match.name,
          sub: match.details || match.subtitle || d.sub,
          price: `₹${pPrice}`,
          orig: pMrp > pPrice ? `₹${pMrp}` : `₹${d.origPrice}`,
          disc: match.discount_percent ? `${match.discount_percent}% OFF` : d.disc,
          rawPrice: pPrice,
          rawOrig: pMrp,
          brand: match.brand || d.brand,
          cat: match.category_name || d.cat,
          img: match.image_url || d.img,
          stock: match.stock ?? 50,
          customer_price: match.customer_price,
          retailer_price: match.retailer_price,
          return_policy: match.return_policy || "Non-Returnable",
        };
      }
      return {
        id: idx + 101,
        numeric_id: idx + 101,
        dbId: `deal-${idx}`,
        name: d.name,
        sub: d.sub,
        price: `₹${d.price}`,
        orig: `₹${d.origPrice}`,
        disc: d.disc,
        rawPrice: d.price,
        rawOrig: d.origPrice,
        brand: d.brand,
        cat: d.cat,
        img: d.img,
        stock: 50,
      };
    });
  }, [dbProducts]);

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
    <div className="bg-transparent min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col gap-4 sm:gap-6">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <KeyCategoriesBar
            selectedId={activeKeyCat}
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* ── Hero Banner Sliding Carousel (Professional UI/UX Animation) ── */}
        <HeroBannerSlider onNavigate={onNavigate} />

        {/* ── Trust Badges Bar ── */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/85 p-4 sm:p-5 shadow-2xs grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff3366] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900">30-Min Fast Delivery</span>
              <span className="text-[11px] sm:text-xs text-slate-500">At your doorstep</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff3366] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900">Batch Verified</span>
              <span className="text-[11px] sm:text-xs text-slate-500">100% genuine products</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff3366] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900">Licensed Pharmacists</span>
              <span className="text-[11px] sm:text-xs text-slate-500">Expert advice</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff3366] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900">Secure Payments</span>
              <span className="text-[11px] sm:text-xs text-slate-500">Safe & hassle-free</span>
            </div>
          </div>
        </div>

        {/* ── Top Categories & Deals of the Day (Side-by-Side as in Reference) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Top Categories */}
          <section className="xl:col-span-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/85 p-4 sm:p-5 shadow-2xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-['Manrope',sans-serif] font-black text-slate-900 text-lg sm:text-xl">
                Top Categories
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("category" as any, "all")}
                className="text-xs sm:text-sm font-bold text-[#ff3366] hover:text-[#e62657] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
              {TOP_CATEGORIES.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigate("category" as any, c.cat)}
                  className="group bg-white hover:bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-sky-100/90 hover:border-rose-200 p-2 sm:p-2.5 flex flex-col items-center justify-between text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer min-h-[136px] sm:min-h-[156px]"
                >
                  <div className="w-full aspect-square max-w-[116px] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center bg-sky-50/50 shadow-2xs">
                    <img
                      src={c.img}
                      alt={c.name}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-black text-[#003b6d] group-hover:text-[#ff3366] leading-tight line-clamp-2 mt-1.5 transition-colors">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Deals of the Day */}
          <section className="xl:col-span-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/85 p-4 sm:p-5 shadow-2xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-['Manrope',sans-serif] font-black text-slate-900 text-lg sm:text-xl">
                Deals of the Day
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("offers")}
                className="text-xs sm:text-sm font-bold text-[#ff3366] hover:text-[#e62657] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {dealsOfTheDayList.map((deal) => (
                <div
                  key={deal.name}
                  onClick={() => setSelectedProduct({
                    id: deal.numeric_id || deal.id,
                    dbId: deal.dbId,
                    name: deal.name,
                    sub: deal.sub,
                    brand: deal.brand,
                    cat: deal.cat,
                    price: deal.price,
                    customer_price: (deal as any).customer_price || deal.rawPrice,
                    retailer_price: (deal as any).retailer_price,
                    orig: deal.orig,
                    disc: deal.disc,
                    img: deal.img,
                    stock: deal.stock,
                    return_policy: (deal as any).return_policy || "Non-Returnable",
                  })}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300/80 p-2.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
                >
                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                      {deal.disc}
                    </span>
                  </div>

                  <div className="w-full h-24 sm:h-28 flex items-center justify-center p-1 bg-slate-50/50 rounded-xl overflow-hidden mt-3 mb-2">
                    <img
                      src={deal.img}
                      alt={deal.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#ff3366] line-clamp-1 transition-colors">
                      {deal.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {deal.price}
                      </span>
                      {deal.orig && (
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                          {deal.orig}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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

        {/* Loading state indicator */}
        {dbProducts === null && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-[#e4ede2] p-10 text-center flex flex-col items-center justify-center my-6 shadow-sm">
            <InfinityLoader size={100} text="Loading verified medicines & healthcare catalog…" variant="brand" />
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

        {dbProducts !== null && categoriesData.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e4ede2] p-8 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-[#073b4c]">
              {activeKeyCat !== "all"
                ? `No products found in ${KEY_CATEGORIES.find((k) => k.id === activeKeyCat)?.name || "this key category"} yet.`
                : "No products currently available in the catalog."}
            </p>
            {activeKeyCat !== "all" && (
              <button
                type="button"
                onClick={() => setActiveKeyCat("all")}
                className="px-4 py-2 bg-[#006a39] text-white text-xs font-bold rounded-xl hover:bg-[#00522c] transition-colors cursor-pointer"
              >
                View All Key Categories
              </button>
            )}
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
                        subCat: (p as any).subCat || (p as any).sub_category_name || "",
                        brand: p.brand,
                        img: p.img,
                        stock: pStock,
                        customer_price: (p as any).customer_price,
                        retailer_price: (p as any).retailer_price,
                        return_policy: (p as any).return_policy || "Non-Returnable",
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[#3e4a3f] text-[10px] sm:text-xs">{p.sub}</p>
                          {((p as any).subCat || (p as any).sub_category_name) && (
                            <span className="text-[9px] font-bold text-[#0f766e] bg-teal-50 border border-teal-200/70 px-1.5 py-0.2 rounded-full">
                              {(p as any).subCat || (p as any).sub_category_name}
                            </span>
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

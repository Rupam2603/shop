import { useState, useEffect, useMemo } from "react";
import type { Page } from "../App";
import ProductDetailModal, { nameToId, type PopupProduct } from "../components/ProductModal";
import KeyCategoriesBar, { KeyCategoryItem } from "../components/KeyCategoriesBar";
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

const QUICK_ACTIONS = [
  { label: "Upload Prescription", bg: "bg-[#bde9ff]",
    icon: <svg width="24" height="26" viewBox="0 0 24 26" fill="none"><path d="M19 2H5C3.9 2 3 2.9 3 4V22C3 23.1 3.9 24 5 24H19C20.1 24 21 23.1 21 22V4C21 2.9 20.1 2 19 2ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="#3F6A7C"/></svg> },
  { label: "Consult Doctor",       bg: "bg-[rgba(0,134,73,0.15)]",
    icon: <svg width="26" height="21" viewBox="0 0 26 21" fill="none"><path d="M13 0C10.2 0 8 2.2 8 5C8 7.8 10.2 10 13 10C15.8 10 18 7.8 18 5C18 2.2 15.8 0 13 0ZM13 12C8.33 12 0 14.17 0 18.5V21H26V18.5C26 14.17 17.67 12 13 12Z" fill="#006A39"/></svg> },
  { label: "Book Lab Test",         bg: "bg-[#b3ebff]",
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M9 0V9L3 15C1.7 16.3 1.7 18.4 3 19.7C3.6 20.3 4.4 20.7 5.3 20.7H15.7C16.6 20.7 17.4 20.3 18 19.7C19.3 18.4 19.3 16.3 18 15L12 9V0H9Z" fill="#001F27"/></svg> },
  { label: "Special Offers",        bg: "bg-[rgba(255,183,3,0.18)]",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12.79 2.71L2.71 12.79C2.32 13.18 2.32 13.82 2.71 14.21L9.79 21.29C10.18 21.68 10.82 21.68 11.21 21.29L21.29 11.21C21.68 10.82 21.68 10.18 21.29 9.79L14.21 2.71C13.82 2.32 13.18 2.32 12.79 2.71Z" fill="#073B4C"/></svg> },
];

/* ─── 8 real store categories from Categorized_Items_List ─── */
const ALL_CATEGORIES = [
  {
    cat: "Pain Relief & Balms",
    short: "Pain Relief",
    accent: "#c0392b", lightBg: "#fff0ee", iconBg: "#ffd5cf",
    count: 17,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v3.01h.01L3 8c0 1.65 1.19 3.02 2.76 3.28L9 11.72V19c0 1.1.89 2 2 2h2c1.11 0 2-.9 2-2v-7.28l3.24-.44C19.81 11.02 21 9.65 21 8V5c0-1.1-.9-2-2-2z" fill="#c0392b"/></svg>,
    products: [
      { name: "Volini Spray 249ml",       sub: "Pain Relief Spray",   price: "₹177",  orig: "₹249",  disc: "29%", img: U("photo-1583687809174-d8db66b1b7fd") },
      { name: "Amrutanjan Strong 44g",    sub: "Fast Relief Balm",    price: "₹36",   orig: "₹44",   disc: "18%", img: U("photo-1638609927040-8a7e97cd9d6a") },
      { name: "Volini Pain Relief Gel 50g",sub:"Diclofenac Gel",      price: "₹130",  orig: "₹180",  disc: "28%", img: U("photo-1691096675075-de995918f3ce") },
      { name: "Zandu Balm 45ml",          sub: "Headache & Pain",     price: "₹40",   orig: "₹45",   disc: "12%", img: U("photo-1614162063681-1adc832305b1") },
    ],
  },
  {
    cat: "Energy, Hydration & Supplements",
    short: "Energy & Supplements",
    accent: "#d97706", lightBg: "#fffbeb", iconBg: "#fde68a",
    count: 22,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="#d97706"/></svg>,
    products: [
      { name: "Glucon D Orange 415g Jar", sub: "Orange Energy Jar",   price: "₹332",  orig: "₹415",  disc: "20%", img: U("photo-1693996045463-6ea86d10a2e7") },
      { name: "Dabur Chyawanprash 860g",  sub: "Ayurvedic Tonic",     price: "₹671",  orig: "₹860",  disc: "22%", img: U("photo-1629240830845-e4a550a6bbde") },
      { name: "Dabur Honey 125g",         sub: "Pure Natural Honey",  price: "₹105",  orig: "₹125",  disc: "16%", img: U("photo-1613548058193-1cd24c1bebcf") },
      { name: "Cipla ORS Powder Box",     sub: "Oral Rehydration",    price: "₹250",  orig: "₹978",  disc: "74%", img: U("photo-1606607728103-1b48747ad318") },
    ],
  },
  {
    cat: "First Aid & Antiseptics",
    short: "First Aid",
    accent: "#047857", lightBg: "#ecfdf5", iconBg: "#a7f3d0",
    count: 8,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="#047857"/></svg>,
    products: [
      { name: "Dettol Antiseptic 250ml",  sub: "Antiseptic Solution", price: "₹131",  orig: "₹155",  disc: "15%", img: U("photo-1627495395570-d2c94e3319f5") },
      { name: "Dettol Antiseptic 550ml",  sub: "Antiseptic Solution", price: "₹223",  orig: "₹259",  disc: "14%", img: U("photo-1559743344-950d2d9458cc") },
      { name: "Hansaplast Regular Band-Aid",sub:"Adhesive Bandage Box",price: "₹165", orig: "₹240",  disc: "31%", img: U("photo-1635091237278-a882f31bc310") },
      { name: "Hansaplast Washproof Band-Aid",sub:"Waterproof Box",   price: "₹195",  orig: "₹300",  disc: "35%", img: U("photo-1776047129625-50b8c7299705") },
    ],
  },
  {
    cat: "Antacids, Digestion & Laxatives",
    short: "Digestion",
    accent: "#1d4ed8", lightBg: "#eff6ff", iconBg: "#bfdbfe",
    count: 8,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#1d4ed8"/></svg>,
    products: [
      { name: "Eno Lemon 30 Pcs Pack",    sub: "Antacid Sachet Pack", price: "₹230",  orig: "",      disc: "",    img: U("photo-1664956617303-83e06c068f7f") },
      { name: "Zandu Nityam Tablets",     sub: "Constipation Relief", price: "₹61",   orig: "₹99",   disc: "38%", img: U("photo-1734607403132-40350099c752") },
      { name: "Softovac SF Powder 229g",  sub: "Laxative Powder",     price: "₹150",  orig: "₹229",  disc: "34%", img: U("photo-1664956617303-83e06c068f7f") },
      { name: "Baidya Isabgol 360g",      sub: "Psyllium Husk Fibre", price: "₹305",  orig: "₹360",  disc: "15%", img: U("photo-1664956617303-83e06c068f7f") },
    ],
  },
  {
    cat: "Skin Care, Powders & Ointments",
    short: "Skin Care",
    accent: "#7c3aed", lightBg: "#f5f3ff", iconBg: "#ddd6fe",
    count: 13,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#7c3aed"/></svg>,
    products: [
      { name: "Nycil Cool Powder 130g",   sub: "Prickly Heat Powder", price: "₹104",  orig: "₹130",  disc: "20%", img: U("photo-1733348188703-ad5a2e7d0d76") },
      { name: "Candid Dusting Powder 174g",sub:"Antifungal Powder",   price: "₹122",  orig: "₹174",  disc: "30%", img: U("photo-1750780536033-483faf4d28b2") },
      { name: "Boroline Antiseptic Cream 45g",sub:"Antiseptic Cream", price: "₹39",   orig: "₹45",   disc: "13%", img: U("photo-1638609927040-8a7e97cd9d6a") },
      { name: "Ring Guard Cream 96g",     sub: "Antifungal Cream",    price: "₹78",   orig: "₹96",   disc: "19%", img: U("photo-1616750819574-7e38aa8046fa") },
    ],
  },
  {
    cat: "Personal Care, Hygiene & Others",
    short: "Personal Care",
    accent: "#0e7490", lightBg: "#ecfeff", iconBg: "#a5f3fc",
    count: 11,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#0e7490"/></svg>,
    products: [
      { name: "Love Nature Hair Oil 299ml",sub: "Natural Hair Oil",   price: "₹165",  orig: "₹299",  disc: "45%", img: U("photo-1768548658056-f5cbb2d3d795") },
      { name: "Jac Body Oil 275ml",       sub: "Moisturising Body Oil",price: "₹193", orig: "₹275",  disc: "30%", img: U("photo-1700107650012-36feae7e18ed") },
      { name: "Dettol Hand Sanitizer 30ml",sub:"Hand Sanitizer",      price: "₹26",   orig: "₹30",   disc: "13%", img: U("photo-1628771066235-78f074cdc9d6") },
      { name: "Vicks Cough Drops 130 Pcs",sub: "Menthol Cough Drops", price: "₹100",  orig: "",      disc: "",    img: U("photo-1655313719848-23d645684e4a") },
    ],
  },
  {
    cat: "Baby Care",
    short: "Baby Care",
    accent: "#0369a1", lightBg: "#f0f9ff", iconBg: "#bae6fd",
    count: 2,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13H9v-2h2v2zm0-4H9V7h2v4zm4 4h-2v-2h2v2zm0-4h-2V7h2v4z" fill="#0369a1"/></svg>,
    products: [
      { name: "Morisons Baby Nipple",     sub: "Silicone Nipple",     price: "₹21",   orig: "₹30",   disc: "30%", img: U("photo-1623707430616-d9f956bcac2b") },
      { name: "Morisons Feeding Bottle",  sub: "Baby Feeding Bottle", price: "₹72",   orig: "",      disc: "",    img: U("photo-1635258559918-ed56f88004de") },
    ],
  },
  {
    cat: "Medical Supplies & General",
    short: "Medical Supplies",
    accent: "#374151", lightBg: "#f9fafb", iconBg: "#e5e7eb",
    count: 3,
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="#374151"/></svg>,
    products: [
      { name: "Surgical Face Mask 75pc",  sub: "3-Ply Disposable",    price: "₹75",   orig: "",      disc: "",    img: U("photo-1586975949231-9374052a0d63") },
      { name: "Surgical Face Mask 100pc", sub: "3-Ply Disposable",    price: "₹100",  orig: "",      disc: "",    img: U("photo-1604116395843-94f7b28a8080") },
      { name: "Glandiner Oil 145ml",      sub: "Massage Oil",         price: "₹120",  orig: "₹145",  disc: "17%", img: U("photo-1700107650012-36feae7e18ed") },
    ],
  },
];

const FLASH = [
  { img: imgProduct1, badge: "30% OFF", color: "#ba1a1a", name: "Omega 3 Fish Oil 1000mg",      sub: "Vitamins & Supplements", price: "₹349", orig: "₹499", cat: "Energy, Hydration & Supplements", brand: "Generic",     disc: "30%" },
  { img: imgProduct2, badge: "20% OFF", color: "#ba1a1a", name: "Glucon D Orange 415g Jar",     sub: "Energy & Hydration",     price: "₹332", orig: "₹415", cat: "Energy, Hydration & Supplements", brand: "Glucon D",    disc: "20%" },
  { img: imgProduct3, badge: "22% OFF", color: "#006a39", name: "Dabur Chyawanprash 860g",      sub: "Ayurvedic Supplement",   price: "₹671", orig: "₹860", cat: "Energy, Hydration & Supplements", brand: "Dabur",       disc: "22%" },
  { img: imgProduct4, badge: "35% OFF", color: "#ba1a1a", name: "Hansaplast Washproof Band-Aid", sub: "First Aid",             price: "₹195", orig: "₹300", cat: "First Aid & Antiseptics",         brand: "Hansaplast",  disc: "35%" },
];

function MiniCard({
  p,
  accent,
  category,
  isRetailer,
  onClick,
  onAddToCart,
}: {
  p: { name: string; sub: string; price: string; orig: string; disc: string; img: string; stock?: number };
  accent: string;
  category?: string;
  isRetailer?: boolean;
  onClick: () => void;
  onAddToCart?: () => void;
}) {
  const isOutOfStock = p.stock !== undefined && p.stock <= 0;
  const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= (isRetailer ? 20 : 10);

  return (
    <div onClick={onClick} className={`w-[155px] sm:w-[185px] lg:w-auto shrink-0 snap-start bg-white rounded-2xl border ${isOutOfStock ? "border-red-200 opacity-80" : "border-[#e4ede2]"} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer`}>
      <div className="relative bg-[#f8fafb] h-32 sm:h-36 overflow-hidden">
        {p.disc && (
          <span className="absolute top-2 left-2 z-10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm" style={{ backgroundColor: accent }}>
            {p.disc} OFF
          </span>
        )}
        {isOutOfStock ? (
          <span className="absolute top-2 right-2 z-10 bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shadow-sm">
            {isRetailer ? "Stock Out" : "Out of Stock"}
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2 right-2 z-10 bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse shadow-sm">
            {isRetailer ? `Low (${p.stock})` : `Only ${p.stock} Left`}
          </span>
        ) : (
          <span className="absolute top-2 right-2 z-10 bg-[#d1fae5]/90 text-[#047857] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            {isRetailer ? `📦 ${p.stock} units` : `${p.stock} in stock`}
          </span>
        )}
        <img src={p.img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }} />
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col gap-1 flex-1">
        <p className="font-bold text-[#073b4c] text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[32px]">{p.name}</p>
        <p className="text-[#9aa89b] text-[10px] sm:text-[11px] truncate">{p.sub}</p>

        {/* Real-time stock status indicator */}
        <div className="text-[9px] mt-0.5">
          {isOutOfStock ? (
            <span className="text-[#dc2626] font-bold">🔴 Out of stock</span>
          ) : isLowStock ? (
            <span className="text-[#d97706] font-semibold">⚠️ {p.stock} units left</span>
          ) : (
            <span className="text-[#059669] font-medium">🟢 {p.stock} in stock</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm sm:text-base">{p.price}</span>
            {p.orig && <span className="text-[#9aa89b] text-[10px] sm:text-xs line-through ml-1">MRP {p.orig}</span>}
          </div>
          {isOutOfStock ? (
            <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Out</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-sm"
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
  item: typeof ALL_CATEGORIES[0];
  isRetailer?: boolean;
  onViewAll: () => void;
  onProductClick: (p: PopupProduct) => void;
  onAddToCart: (p: typeof ALL_CATEGORIES[0]["products"][0], cat: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-3 px-3.5 sm:px-5 py-3 sm:py-4 rounded-2xl" style={{ backgroundColor: item.lightBg }}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.iconBg }}>
            {item.icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-['Manrope',sans-serif] font-bold text-base sm:text-xl truncate" style={{ color: item.accent }}>{item.cat}</h2>
            <p className="text-[#6d7a6f] text-[11px] sm:text-xs mt-0.5">{item.count} products available · Live Inventory</p>
          </div>
        </div>
        <button onClick={onViewAll} className="flex items-center gap-1 text-xs sm:text-sm font-bold hover:underline shrink-0 whitespace-nowrap" style={{ color: item.accent }}>
          View All ({item.count}) <ArrowRight />
        </button>
      </div>

      <div className="flex lg:grid lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 pt-0.5 snap-x">
        {item.products.map((p) => (
          <MiniCard
            key={p.name}
            p={p}
            accent={item.accent}
            category={item.cat}
            isRetailer={isRetailer}
            onClick={() => onProductClick({
              id: nameToId(p.name),
              name: p.name,
              sub: p.sub,
              price: p.price,
              orig: p.orig,
              disc: p.disc,
              cat: item.cat,
              brand: p.name.split(" ")[0],
              img: p.img,
              stock: (p as any).stock ?? 50,
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
    onNavigate("medicines", cat.filterCat || cat.name);
  };

  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted && data && data.length > 0) {
        setDbProducts(data);
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
    if (!dbProducts || dbProducts.length === 0) return ALL_CATEGORIES;

    return ALL_CATEGORIES.map((catConfig) => {
      const prodsForCat = dbProducts.filter((p) => p.category_name === catConfig.cat);
      if (prodsForCat.length === 0) return catConfig;

      return {
        ...catConfig,
        count: prodsForCat.length,
        products: prodsForCat.slice(0, 4).map((p) => ({
          name: p.name,
          sub: p.details || p.subtitle || p.brand,
          price: isRetailer ? `₹${Math.round(p.retailer_price)}` : `₹${Math.round(p.customer_price)}`,
          orig: p.mrp > p.customer_price ? `₹${Math.round(p.mrp)}` : "",
          disc: p.discount_percent > 0 ? `${p.discount_percent}%` : "",
          img: p.image_url,
          brand: p.brand,
          cat: p.category_name,
          stock: p.stock ?? 50,
        })),
      };
    });
  }, [dbProducts, isRetailer]);

  const flashSaleData = useMemo(() => {
    if (!dbProducts || dbProducts.length === 0) return FLASH;

    const flashFromDb = dbProducts.filter((p) => p.is_flash_sale || p.discount_percent >= 20);
    if (flashFromDb.length === 0) return FLASH;

    return flashFromDb.slice(0, 4).map((p) => ({
      name: p.name,
      sub: p.details || p.subtitle || p.brand,
      price: isRetailer ? `₹${Math.round(p.retailer_price)}` : `₹${Math.round(p.customer_price)}`,
      orig: p.mrp > p.customer_price ? `₹${Math.round(p.mrp)}` : "",
      disc: `${p.discount_percent}%`,
      cat: p.category_name,
      brand: p.brand,
      img: p.image_url,
      badge: `${p.discount_percent}% OFF`,
      color: "#ba1a1a",
      stock: p.stock ?? 50,
    }));
  }, [dbProducts, isRetailer]);

  const handleAddToCartFromCategory = (p: typeof ALL_CATEGORIES[0]["products"][0], cat: string) => {
    addToCart({
      id: nameToId(p.name),
      name: p.name,
      sub: p.sub,
      cat,
      brand: p.name.split(" ")[0],
      price: p.price,
      orig: p.orig,
      img: p.img,
    });
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5 sm:gap-8">

        {/* ── Key Categories Bar (ABOVE BANNER IMAGE) ── */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#e4ede2] shadow-sm overflow-hidden">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} className="bg-white rounded-2xl border border-[rgba(189,202,188,0.3)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-3 sm:p-5 flex flex-col items-center gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${a.bg} flex items-center justify-center shrink-0`}>{a.icon}</div>
              <span className="font-bold text-[#073b4c] text-xs sm:text-sm tracking-[0.5px] text-center">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Category browser — compact */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-xl">Browse All Categories</h2>
            <button onClick={() => onNavigate("medicines", "All")} className="font-bold text-[#006a39] text-xs flex items-center gap-1 hover:underline">
              View All <ArrowRight />
            </button>
          </div>
          <div className="flex md:grid md:grid-cols-8 gap-2 sm:gap-2.5 overflow-x-auto md:overflow-visible no-scrollbar pb-2 pt-0.5 snap-x">
            {categoriesData.map((c) => (
              <button
                key={c.cat}
                onClick={() => onNavigate("medicines", c.cat)}
                className="w-[84px] sm:w-[94px] md:w-auto shrink-0 snap-start group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl border border-[#e4ede2] bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: c.lightBg }}>
                  <div style={{ transform: "scale(0.8)" }}>{c.icon}</div>
                </div>
                <p className="font-semibold text-[10px] sm:text-[11px] leading-tight text-center line-clamp-2" style={{ color: c.accent }}>{c.short}</p>
                <p className="text-[#9aa89b] text-[9px]">{c.count} items</p>
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-[#dee4db]" />

        {/* Category sections */}
        {categoriesData.map((item) => (
          <CategorySection
            key={item.cat}
            item={item}
            isRetailer={isRetailer}
            onViewAll={() => onNavigate("medicines", item.cat)}
            onProductClick={setSelectedProduct}
            onAddToCart={handleAddToCartFromCategory}
          />
        ))}

        <div className="border-t border-[#dee4db]" />

        {/* Flash Sale */}
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
                  onClick={() => setSelectedProduct({ id: nameToId(p.name), name: p.name, sub: p.sub, price: p.price, orig: p.orig, disc: p.disc, cat: p.cat, brand: p.brand, img: p.img, stock: pStock })}
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
                              id: nameToId(p.name),
                              name: p.name,
                              sub: p.sub,
                              cat: p.cat,
                              brand: p.brand,
                              price: p.price,
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

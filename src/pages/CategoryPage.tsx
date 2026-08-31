import { useState, useMemo, useEffect } from "react";
import type { Page } from "../App";
import KeyCategoriesBar, { KEY_CATEGORIES, KeyCategoryItem } from "../components/KeyCategoriesBar";
import InsuranceModal from "../components/InsuranceModal";
import ProductDetailModal, { retailerPrice, PopupProduct } from "../components/ProductModal";
import { KEY_CATEGORIES_CONFIG, KeyCategoryMeta } from "../lib/keyCategories";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { useCart } from "../contexts/CartContext";

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&q=80`;

/* ─── Default Static Catalog ─── */
const ALL_PRODUCTS = [
  // Pain Relief
  { id: 1,  name: "Volini Gel 15g", sub: "Pain Relief Gel", price: "₹11", orig: "₹15", disc: "27%", cat: "Pain Relief & Balms", brand: "Volini", img: U("photo-1691096675075-de995918f3ce") },
  { id: 2,  name: "Amrutanjan Strong Balm 44g", sub: "Fast Relief Balm", price: "₹36", orig: "₹44", disc: "18%", cat: "Pain Relief & Balms", brand: "Amrutanjan", img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 3,  name: "Volini Spray 249ml", sub: "Pain Relief Spray", price: "₹177", orig: "₹249", disc: "29%", cat: "Pain Relief & Balms", brand: "Volini", img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 4,  name: "Volini Spray 340ml", sub: "Pain Relief Spray", price: "₹241", orig: "₹340", disc: "29%", cat: "Pain Relief & Balms", brand: "Volini", img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 5,  name: "Volini Gel 54g", sub: "Diclofenac Gel", price: "₹38", orig: "₹54", disc: "29%", cat: "Pain Relief & Balms", brand: "Volini", img: U("photo-1691096675075-de995918f3ce") },
  { id: 6,  name: "Moov Chain 15g", sub: "Pain Relief Chain", price: "₹13", orig: "₹15", disc: "13%", cat: "Pain Relief & Balms", brand: "Moov", img: U("photo-1616750819574-7e38aa8046fa") },
  { id: 11, name: "Volini Pain Relief Gel 50g", sub: "Diclofenac Gel", price: "₹130", orig: "₹180", disc: "28%", cat: "Pain Relief & Balms", brand: "Volini", img: U("photo-1691096675075-de995918f3ce") },
  { id: 17, name: "Zandu Balm 45ml", sub: "Headache & Pain Balm", price: "₹40", orig: "₹45", disc: "12%", cat: "Pain Relief & Balms", brand: "Zandu", img: U("photo-1614162063681-1adc832305b1") },

  // Energy & Supplements
  { id: 18, name: "Glucon D Orange 173g", sub: "Glucose Energy Drink", price: "₹138", orig: "₹173", disc: "20%", cat: "Energy, Hydration & Supplements", brand: "Glucon D", img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 22, name: "Glucon D Nimbu Pani 415g Jar", sub: "Lemon Flavour Energy Jar", price: "₹332", orig: "₹415", disc: "20%", cat: "Energy, Hydration & Supplements", brand: "Glucon D", img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 23, name: "Glucon D Orange 415g Jar", sub: "Orange Flavour Energy Jar", price: "₹332", orig: "₹415", disc: "20%", cat: "Energy, Hydration & Supplements", brand: "Glucon D", img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 30, name: "Cipla ORS Powder Box", sub: "Oral Rehydration Salts", price: "₹250", orig: "₹978", disc: "74%", cat: "Energy, Hydration & Supplements", brand: "Cipla", img: U("photo-1606607728103-1b48747ad318") },
  { id: 31, name: "Johnson ORS Orange Liquid", sub: "Oral Rehydration", price: "₹28", orig: "₹42", disc: "33%", cat: "Energy, Hydration & Supplements", brand: "Johnson's", img: U("photo-1732901379250-03be48f04241") },
  { id: 36, name: "Dabur Honey 125g", sub: "Pure Natural Honey", price: "₹105", orig: "₹125", disc: "16%", cat: "Energy, Hydration & Supplements", brand: "Dabur", img: U("photo-1613548058193-1cd24c1bebcf") },
  { id: 37, name: "Dabur Chyawanprash 860g", sub: "Ayurvedic Health Tonic", price: "₹671", orig: "₹860", disc: "22%", cat: "Energy, Hydration & Supplements", brand: "Dabur", img: U("photo-1629240830845-e4a550a6bbde") },
  { id: 39, name: "Sugar Free Gold 40 Tabs", sub: "Low Calorie Sweetener", price: "₹32", orig: "₹40", disc: "19%", cat: "Energy, Hydration & Supplements", brand: "Zydus", img: U("photo-1664956617303-83e06c068f7f") },

  // First Aid
  { id: 40, name: "Dettol Antiseptic Liquid 250ml", sub: "Antiseptic Solution", price: "₹131", orig: "₹155", disc: "15%", cat: "First Aid & Antiseptics", brand: "Dettol", img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 43, name: "Dettol Antiseptic Liquid 550ml", sub: "Antiseptic Solution", price: "₹223", orig: "₹259", disc: "14%", cat: "First Aid & Antiseptics", brand: "Dettol", img: U("photo-1559743344-950d2d9458cc") },
  { id: 46, name: "Hansaplast Regular Band-Aid", sub: "Adhesive Bandage Box", price: "₹165", orig: "₹240", disc: "31%", cat: "First Aid & Antiseptics", brand: "Hansaplast", img: U("photo-1635091237278-a882f31bc310") },
  { id: 47, name: "Hansaplast Washproof Band-Aid", sub: "Waterproof Bandage Box", price: "₹195", orig: "₹300", disc: "35%", cat: "First Aid & Antiseptics", brand: "Hansaplast", img: U("photo-1776047129625-50b8c7299705") },

  // Digestion
  { id: 48, name: "Eno Lemon 30 Pcs Pack", sub: "Antacid Sachet Pack", price: "₹230", orig: "", disc: "", cat: "Antacids, Digestion & Laxatives", brand: "Eno", img: U("photo-1664956617303-83e06c068f7f") },
  { id: 50, name: "Eno Lemon Sachet 5g", sub: "Antacid Sachet", price: "₹7.50", orig: "₹9", disc: "17%", cat: "Antacids, Digestion & Laxatives", brand: "Eno", img: U("photo-1606607728103-1b48747ad318") },
  { id: 51, name: "Zandu Nityam Tablets", sub: "Constipation Relief", price: "₹61", orig: "₹99", disc: "38%", cat: "Antacids, Digestion & Laxatives", brand: "Zandu", img: U("photo-1734607403132-40350099c752") },
  { id: 52, name: "Softovac SF Powder 229g", sub: "Laxative Powder", price: "₹150", orig: "₹229", disc: "34%", cat: "Antacids, Digestion & Laxatives", brand: "Lupin", img: U("photo-1664956617303-83e06c068f7f") },
  { id: 53, name: "Pet Safa Herbal Laxative", sub: "Constipation Relief", price: "₹94", orig: "₹115", disc: "18%", cat: "Antacids, Digestion & Laxatives", brand: "Pet Safa", img: U("photo-1664956617303-83e06c068f7f") },
  { id: 54, name: "Baidya Isabgol 360g", sub: "Psyllium Husk Fibre", price: "₹305", orig: "₹360", disc: "15%", cat: "Antacids, Digestion & Laxatives", brand: "Baidya", img: U("photo-1664956617303-83e06c068f7f") },

  // Skin Care
  { id: 56, name: "Nycil Cool Powder 130g", sub: "Prickly Heat Powder", price: "₹104", orig: "₹130", disc: "20%", cat: "Skin Care, Powders & Ointments", brand: "Nycil", img: U("photo-1733348188703-ad5a2e7d0d76") },
  { id: 58, name: "Ring Guard Cream 96g", sub: "Antifungal Cream", price: "₹78", orig: "₹96", disc: "19%", cat: "Skin Care, Powders & Ointments", brand: "Ring Guard", img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 60, name: "Itch Guard Cream 16.5g", sub: "Antifungal Cream", price: "₹14", orig: "₹17", disc: "15%", cat: "Skin Care, Powders & Ointments", brand: "Itch Guard", img: U("photo-1616750819574-7e38aa8046fa") },
  { id: 61, name: "Candid Dusting Powder 174g", sub: "Antifungal Dusting Powder", price: "₹122", orig: "₹174", disc: "30%", cat: "Skin Care, Powders & Ointments", brand: "Candid", img: U("photo-1750780536033-483faf4d28b2") },
  { id: 63, name: "B-Tex Antifungal Cream 30g", sub: "Skin Infection Cream", price: "₹21", orig: "₹30", disc: "30%", cat: "Skin Care, Powders & Ointments", brand: "B-Tex", img: U("photo-1614162063681-1adc832305b1") },
  { id: 64, name: "Salical Cream 25g", sub: "Skin Care Cream", price: "₹18", orig: "₹25", disc: "28%", cat: "Skin Care, Powders & Ointments", brand: "Salical", img: U("photo-1614162063681-1adc832305b1") },
  { id: 65, name: "Suthol Neem Antiseptic 50ml", sub: "Antiseptic Liquid", price: "₹41", orig: "₹50", disc: "18%", cat: "Skin Care, Powders & Ointments", brand: "Suthol", img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 66, name: "Suthol Neem Spray 80ml", sub: "Antiseptic Spray", price: "₹66", orig: "₹80", disc: "17%", cat: "Skin Care, Powders & Ointments", brand: "Suthol", img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 67, name: "Boroline Antiseptic Cream Jar", sub: "Night Cream 480g", price: "₹420", orig: "₹480", disc: "13%", cat: "Skin Care, Powders & Ointments", brand: "Boroline", img: U("photo-1620306805869-1bd9ea04b055") },
  { id: 68, name: "Boroline Antiseptic Cream 45g", sub: "Antiseptic Cream", price: "₹39", orig: "₹45", disc: "13%", cat: "Skin Care, Powders & Ointments", brand: "Boroline", img: U("photo-1638609927040-8a7e97cd9d6a") },

  // Personal Care & Hair
  { id: 69, name: "Jac Body Oil 75ml", sub: "Moisturising Body Oil", price: "₹53", orig: "₹75", disc: "29%", cat: "Personal Care, Hygiene & Others", brand: "Jac", img: U("photo-1700107650012-36feae7e18ed") },
  { id: 72, name: "Jac Body Oil 275ml", sub: "Moisturising Body Oil", price: "₹193", orig: "₹275", disc: "30%", cat: "Personal Care, Hygiene & Others", brand: "Jac", img: U("photo-1700107650012-36feae7e18ed") },
  { id: 73, name: "Love Nature Hair Oil 299ml", sub: "Natural Hair Oil", price: "₹165", orig: "₹299", disc: "45%", cat: "Personal Care, Hygiene & Others", brand: "Love Nature", img: U("photo-1768548658056-f5cbb2d3d795") },
  { id: 74, name: "Veet Hair Remover 99g", sub: "Hair Removal Cream", price: "₹87", orig: "₹99", disc: "12%", cat: "Personal Care, Hygiene & Others", brand: "Veet", img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 75, name: "V Wash Plus 50ml", sub: "Intimate Hygiene Wash", price: "₹40", orig: "₹50", disc: "20%", cat: "Personal Care, Hygiene & Others", brand: "V Wash", img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 76, name: "Dettol Hand Sanitizer 30ml", sub: "Hand Sanitizer", price: "₹26", orig: "₹30", disc: "13%", cat: "Personal Care, Hygiene & Others", brand: "Dettol", img: U("photo-1628771066235-78f074cdc9d6") },
  { id: 79, name: "Vicks Cough Drops 130 Pcs", sub: "Menthol Cough Drops", price: "₹100", orig: "", disc: "", cat: "Personal Care, Hygiene & Others", brand: "Vicks", img: U("photo-1655313719848-23d645684e4a") },

  // Baby Care
  { id: 80, name: "Morisons Baby Nipple", sub: "Silicone Nipple", price: "₹21", orig: "₹30", disc: "30%", cat: "Baby Care", brand: "Morisons", img: U("photo-1623707430616-d9f956bcac2b") },
  { id: 81, name: "Morisons Feeding Bottle", sub: "Baby Feeding Bottle", price: "₹72", orig: "", disc: "", cat: "Baby Care", brand: "Morisons", img: U("photo-1635258559918-ed56f88004de") },
  { id: 50, name: "Dexolac Infant Formula 490g", sub: "Baby Nutrition Formula", price: "₹410", orig: "₹490", disc: "16%", cat: "Baby Care", brand: "Wockhardt", img: U("photo-1691480208637-6ed63aac6694") },

  // Medical Supplies
  { id: 82, name: "Surgical Face Mask Box 75pc", sub: "3-Ply Disposable Mask", price: "₹75", orig: "", disc: "", cat: "Medical Supplies & General", brand: "Generic", img: U("photo-1586975949231-9374052a0d63") },
  { id: 83, name: "Surgical Face Mask Box 100pc", sub: "3-Ply Disposable Mask", price: "₹100", orig: "", disc: "", cat: "Medical Supplies & General", brand: "Generic", img: U("photo-1604116395843-94f7b28a8080") },
  { id: 84, name: "Glandiner Oil 145ml", sub: "Massage Oil", price: "₹120", orig: "₹145", disc: "17%", cat: "Medical Supplies & General", brand: "Glandiner", img: U("photo-1700107650012-36feae7e18ed") },
];

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

  // Lookup current Category Configuration
  const categoryMeta: KeyCategoryMeta = useMemo(() => {
    const found = KEY_CATEGORIES_CONFIG.find(
      (c) => c.id.toLowerCase() === categoryId.toLowerCase() || c.short.toLowerCase() === categoryId.toLowerCase()
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
        filterFn: () => true,
      }
    );
  }, [categoryId]);

  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted && data && data.length > 0) {
        setDbProducts(data);
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
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.numeric_id,
        dbId: p.id,
        name: p.name,
        sub: p.details || p.subtitle || "",
        price: `₹${Math.round(p.customer_price)}`,
        retailerPrice: `₹${Math.round(p.retailer_price)}`,
        orig: p.mrp > p.customer_price ? `₹${Math.round(p.mrp)}` : "",
        disc: p.discount_percent > 0 ? `${p.discount_percent}%` : "",
        cat: p.category_name,
        brand: p.brand,
        img: p.image_url,
        stock: p.stock ?? 50,
      }));
    }
    return ALL_PRODUCTS.map((p) => ({ ...p, stock: 50 }));
  }, [dbProducts]);

  const filteredProducts = useMemo(() => {
    let list = productList;

    // Filter by specific Category's logic
    if (categoryMeta.filterFn) {
      list = list.filter(categoryMeta.filterFn);
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
  }, [productList, categoryMeta, searchQuery, sortBy, isRetailer]);

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
                      {p.sub && (
                        <span className="inline-block text-[9px] font-bold bg-emerald-50/80 text-[#006a39] border border-emerald-200/80 px-2 py-0.5 rounded-full leading-none mt-0.5 w-fit">
                          {p.sub}
                        </span>
                      )}

                      <div className="mt-auto pt-2.5 border-t border-[#f0f5f1] flex items-center justify-between">
                        <div>
                          <span className="font-['Manrope',sans-serif] font-black text-[#073b4c] text-sm sm:text-base">
                            {isRetailer ? retailerPrice(p.price) : p.price}
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
                                name: p.name,
                                sub: p.sub,
                                cat: p.cat,
                                brand: p.brand,
                                price: isRetailer ? retailerPrice(p.price) : p.price,
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

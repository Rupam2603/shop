import { useState, useEffect, useMemo } from "react";
import { useCart } from "../contexts/CartContext";

export interface PopupProduct {
  id: number;
  dbId?: string;
  name: string;
  sub: string;
  price: string;
  orig: string;
  disc: string;
  cat: string;
  brand: string;
  img: string;
  stock?: number;
}

export const CAT_COLORS: Record<string, string> = {
  "Pain Relief & Balms":             "#c0392b",
  "Energy, Hydration & Supplements": "#e07b00",
  "First Aid & Antiseptics":         "#006a39",
  "Antacids, Digestion & Laxatives": "#0077b6",
  "Skin Care, Powders & Ointments":  "#7b2d8b",
  "Personal Care, Hygiene & Others": "#00838f",
  "Baby Care":                       "#0077b6",
  "Medical Supplies & General":      "#37474f",
};

export const HSN_BY_CAT: Record<string, string> = {
  "Pain Relief & Balms":             "3004",
  "Energy, Hydration & Supplements": "2106",
  "First Aid & Antiseptics":         "3808",
  "Antacids, Digestion & Laxatives": "3004",
  "Skin Care, Powders & Ointments":  "3304",
  "Personal Care, Hygiene & Others": "3305",
  "Baby Care":                       "3924",
  "Medical Supplies & General":      "9018",
};

export function retailerPrice(priceStr: string): string {
  const n = parseFloat(priceStr.replace(/[₹,]/g, "")) || 0;
  return `₹${Math.round(n * 0.85)}`;
}

export function nameToId(name: string): number {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0;
  return (Math.abs(h) % 80) + 1;
}

const REVIEW_POOL = [
  { name: "Sunita R.",  rating: 5, date: "Aug 20, 2026", verified: true,  helpful: 12, text: "Works great! Applied at night and woke up feeling much better. Will definitely buy again." },
  { name: "Ravi K.",    rating: 4, date: "Aug 18, 2026", verified: true,  helpful: 8,  text: "Good product. Effective and fast-acting. The fragrance is a bit strong but gets the job done." },
  { name: "Ananya S.",  rating: 5, date: "Aug 15, 2026", verified: false, helpful: 5,  text: "Exactly as described. Very happy with this purchase. Delivered quickly and well-packaged." },
  { name: "Mohan P.",   rating: 3, date: "Aug 12, 2026", verified: true,  helpful: 3,  text: "Decent product but the effect could last a bit longer. Gets the job done for everyday use." },
  { name: "Shanti D.",  rating: 5, date: "Aug 9, 2026",  verified: true,  helpful: 15, text: "My go-to brand for years. Reliable, effective, and trusted. Always satisfied with the quality." },
  { name: "Arun V.",    rating: 2, date: "Aug 6, 2026",  verified: false, helpful: 1,  text: "Not as effective as I expected for the price. Maybe works for others. Probably won't repurchase." },
  { name: "Priya M.",   rating: 5, date: "Aug 24, 2026", verified: true,  helpful: 19, text: "Excellent quality! My entire family loves it. Genuine product, fast delivery, great packaging." },
  { name: "Rahul B.",   rating: 4, date: "Aug 22, 2026", verified: true,  helpful: 7,  text: "Good value for money. Dissolves quickly and tastes great. Kids approve, which is the real test!" },
  { name: "Kavita S.",  rating: 5, date: "Aug 19, 2026", verified: true,  helpful: 11, text: "Perfect product! Using it every day. Highly recommend to anyone looking for quality at this price." },
  { name: "Deepa N.",   rating: 5, date: "Aug 25, 2026", verified: true,  helpful: 21, text: "Works beautifully. Stays on for hours even through washing. Noticed improvement from day one." },
  { name: "Sanjay T.",  rating: 4, date: "Aug 23, 2026", verified: true,  helpful: 6,  text: "Good quality product. Results are visible and consistent. Will be repurchasing regularly." },
  { name: "Meera J.",   rating: 5, date: "Aug 21, 2026", verified: false, helpful: 9,  text: "Love this! Using for over 2 years. Never switching to anything else. Perfect for my needs." },
  { name: "Bindu R.",   rating: 4, date: "Aug 17, 2026", verified: true,  helpful: 4,  text: "Works well for the intended purpose. No adverse effects. Good quality for the price." },
  { name: "Kiran H.",   rating: 3, date: "Aug 14, 2026", verified: true,  helpful: 2,  text: "Average product. Works for mild issues. Might not be the best for more severe cases." },
  { name: "Vikram S.",  rating: 5, date: "Aug 11, 2026", verified: true,  helpful: 16, text: "Superb product! Exactly what I needed. Fast-acting and long-lasting. 10/10 would recommend." },
  { name: "Lalita P.",  rating: 4, date: "Aug 8, 2026",  verified: false, helpful: 3,  text: "Good product. Does what it promises. Packaging is hygienic and sealed properly on arrival." },
  { name: "Suresh A.",  rating: 5, date: "Aug 26, 2026", verified: true,  helpful: 14, text: "Been buying this for 3 years. Consistent quality, genuine product. Best brand in this category!" },
  { name: "Nirmala K.", rating: 4, date: "Aug 16, 2026", verified: true,  helpful: 8,  text: "Noticed results quickly. Good quality and genuine product. Happy with this purchase overall." },
  { name: "Ramesh G.",  rating: 2, date: "Aug 13, 2026", verified: false, helpful: 0,  text: "Packaging was damaged on arrival, though the product itself worked fine. Customer service helped." },
  { name: "Anjali T.",  rating: 5, date: "Aug 10, 2026", verified: true,  helpful: 22, text: "Absolutely fantastic! My family's must-have. Effective, genuine, and delivered fresh every time." },
  { name: "Dev M.",     rating: 4, date: "Aug 7, 2026",  verified: true,  helpful: 5,  text: "Great product for daily use. Results are visible and consistent. Worth every rupee spent." },
  { name: "Pooja S.",   rating: 5, date: "Aug 5, 2026",  verified: true,  helpful: 13, text: "Perfect! Works exactly as described. Genuine product, great quality, will order again." },
  { name: "Harish N.",  rating: 3, date: "Aug 3, 2026",  verified: false, helpful: 1,  text: "It is okay for basic use. Nothing exceptional but does the job. Would suggest trying the larger pack." },
  { name: "Sheela V.",  rating: 5, date: "Aug 1, 2026",  verified: true,  helpful: 17, text: "Top quality! Consistently great results every time. My favourite brand on this platform." },
];

export function getProductReviews(productId: number) {
  const start = (productId * 7) % REVIEW_POOL.length;
  const count = 4 + (productId % 3);
  return Array.from({ length: count }, (_, i) => REVIEW_POOL[(start + i) % REVIEW_POOL.length]);
}

const CATEGORY_FEATURES: Record<string, string[]> = {
  "Pain Relief & Balms":             ["Fast-acting formula with targeted deep relief", "Proven for back pain, joint aches, and sprains", "Non-greasy; absorbs quickly into skin", "Safe for daily use on adults"],
  "Energy, Hydration & Supplements": ["Enriched with electrolytes and essential vitamins", "Instant glucose replenishment after activity", "Pleasant taste; dissolves easily in water", "Safe for adults and children above 2 years"],
  "First Aid & Antiseptics":         ["Kills 99.9% of bacteria and germs on contact", "Non-stinging formula safe for all skin types", "Promotes faster healing of minor wounds", "Suitable for cuts, burns, and abrasions"],
  "Antacids, Digestion & Laxatives": ["Provides acid relief within 3–5 minutes", "Balances stomach pH safely and effectively", "No artificial preservatives or harsh chemicals", "Safe for regular use; non-habit forming"],
  "Skin Care, Powders & Ointments":  ["Dermatologically tested and clinically proven", "Suitable for sensitive and normal skin types", "Free from parabens, sulfates, and harsh dyes", "Provides 12-hour protection with regular use"],
  "Personal Care, Hygiene & Others": ["Gentle daily-use formula for all skin types", "Paraben-free and dermatologist approved", "Long-lasting freshness with no irritation", "Cruelty-free and responsibly manufactured"],
  "Baby Care":                       ["Clinically tested for infant skin safety", "Hypoallergenic and paediatrician recommended", "No harmful dyes, parabens, or fragrances", "Approved for daily use from birth onwards"],
  "Medical Supplies & General":      ["Medical-grade quality with ISO certification", "Sterile packaging for safe hygienic use", "Meets national and international safety standards", "Suitable for both home and clinical settings"],
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Pain Relief & Balms":             "Targeted pain relief formulated with proven analgesic and anti-inflammatory agents. Penetrates fast to provide sustained relief from muscle soreness, joint pain, and stiffness. Ideal for back pain, neck aches, sports injuries, and post-workout recovery.",
  "Energy, Hydration & Supplements": "A trusted nutritional formulation enriched with essential glucose, electrolytes, and micronutrients. Replenishes energy reserves, restores hydration balance, and supports active wellness throughout the day. Suitable for all age groups.",
  "First Aid & Antiseptics":         "Clinically proven antiseptic formulation that eliminates pathogens on contact. Safe for use on cuts, abrasions, minor burns, and skin injuries. Promotes healing while protecting against secondary infections.",
  "Antacids, Digestion & Laxatives": "Fast-acting digestive relief formulation that neutralises excess gastric acid within minutes. Alleviates heartburn, acid reflux, bloating, and indigestion discomfort. Gentle on the stomach lining with no harsh side effects.",
  "Skin Care, Powders & Ointments":  "Dermatologically tested formula designed to soothe, protect, and nourish skin. Free from harsh chemicals and suitable for daily use. Provides lasting relief from common skin concerns while maintaining the skin's natural barrier.",
  "Personal Care, Hygiene & Others": "Premium hygiene formulation that delivers effective cleansing and lasting freshness. Clinically tested, dermatologist approved, and safe for everyday use. Gentle yet thorough, with no parabens or harsh additives.",
  "Baby Care":                       "Specially formulated for the delicate needs of infant skin. Hypoallergenic, paediatrician-recommended, and free from harmful chemicals. Provides safe, gentle care that parents can trust for everyday use.",
  "Medical Supplies & General":      "Medical-grade quality product manufactured to international safety standards. Designed for reliable, consistent performance across clinical and home use. Rigorous quality control ensures every unit meets strict safety requirements.",
};

export function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= Math.floor(rating);
        const half   = !filled && s - 0.5 <= rating;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 14 14" fill="none">
            <defs>
              <linearGradient id={`pm-h${s}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path
              d="M7 1L8.854 5.09L13.5 5.835L10.25 8.995L11.021 13.5L7 11.277L2.979 13.5L3.75 8.995L0.5 5.835L5.146 5.09Z"
              fill={filled ? "#f59e0b" : half ? `url(#pm-h${s})` : "#e5e7eb"}
            />
          </svg>
        );
      })}
    </div>
  );
}

export default function ProductDetailModal({
  product,
  isRetailer,
  onClose,
}: {
  product: PopupProduct;
  isRetailer: boolean;
  onClose: () => void;
}) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const reviews = useMemo(() => getProductReviews(product.id), [product.id]);
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const accentColor = CAT_COLORS[product.cat] || "#006a39";
  const features = CATEGORY_FEATURES[product.cat] ?? ["Quality assured", "Genuine product", "Fast delivery", "Clinically tested"];
  const description = CATEGORY_DESCRIPTIONS[product.cat] ?? `${product.name} is a quality product by ${product.brand}, trusted by customers across India.`;
  const hsn = HSN_BY_CAT[product.cat] ?? "—";

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center sm:items-start justify-center p-2 sm:p-4 sm:pt-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[920px] shadow-2xl my-auto sm:my-8 overflow-hidden max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top: Image + Details ── */}
        <div className="flex flex-col md:flex-row">
          {/* Image panel */}
          <div className="w-full md:w-72 shrink-0 flex flex-col" style={{ backgroundColor: accentColor + "0d" }}>
            <div className="relative h-56 sm:h-64 overflow-hidden">
              {product.disc && (
                <span
                  className="absolute top-3 left-3 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase"
                  style={{ backgroundColor: accentColor }}
                >
                  {product.disc} OFF
                </span>
              )}
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.12"; }}
              />
            </div>
            <div className="flex-1 p-4 sm:p-5 grid grid-cols-2 md:flex md:flex-col gap-3 bg-white/60 backdrop-blur-sm">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">Category</p>
                <span
                  className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ color: accentColor, backgroundColor: accentColor + "18" }}
                >
                  {product.cat}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">HSN Code</p>
                <span className="font-mono text-sm font-bold bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-2 py-0.5 rounded">{hsn}</span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">Brand</p>
                <p className="text-[#073b4c] font-bold text-sm">{product.brand}</p>
              </div>
              {product.sub && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">Pack Size</p>
                  <p className="text-[#073b4c] font-semibold text-sm">{product.sub}</p>
                </div>
              )}
              <div className="col-span-2 md:col-span-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">Availability</p>
                {product.stock !== undefined && product.stock <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[#b91c1c] text-xs font-bold bg-[#fee2e2] px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c] inline-block" />
                    Out of Stock
                  </span>
                ) : product.stock !== undefined && product.stock <= 10 ? (
                  <span className="inline-flex items-center gap-1.5 text-[#b45309] text-xs font-bold bg-[#fef3c7] px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] inline-block animate-pulse" />
                    Only {product.stock} left in stock!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[#047857] text-xs font-semibold bg-[#d1fae5] px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#047857] inline-block" />
                    In Stock {product.stock !== undefined ? `(${product.stock} units)` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details panel */}
          <div className="flex-1 p-4 sm:p-7 flex flex-col overflow-hidden">
            <div className="flex justify-end mb-2 sm:mb-3">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center hover:bg-[#e4ede2] transition-colors"
                aria-label="Close modal"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="#073b4c" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.6px]" style={{ color: accentColor }}>{product.brand}</span>
              <span className="text-[#d0d8cf]">·</span>
              <span className="text-[10px] text-[#9aa89b] truncate">{product.cat}</span>
            </div>

            <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl sm:text-2xl leading-tight mb-2">{product.name}</h2>

            {product.sub && (
              <span className="inline-block text-[10px] font-bold bg-[#f0fdf4] text-[#047857] border border-[#bbf7d0] px-2 py-0.5 rounded-full mb-3 w-fit">
                {product.sub}
              </span>
            )}

            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <StarRow rating={avgRating} size={15} />
              <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm">{avgRating.toFixed(1)}</span>
              <span className="text-[#9aa89b] text-xs">({reviews.length} reviews)</span>
            </div>

            {/* Pricing */}
            <div className="rounded-xl p-3.5 sm:p-4 mb-4 border" style={{ backgroundColor: accentColor + "08", borderColor: accentColor + "28" }}>
              {isRetailer ? (
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-['Manrope',sans-serif] font-extrabold text-[#0369a1] text-2xl sm:text-3xl">{retailerPrice(product.price)}</span>
                    <span className="text-[10px] font-bold bg-[#dbeafe] text-[#1d4ed8] px-2 py-0.5 rounded uppercase">Trade Price</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                    <span className="text-[#9aa89b] text-xs">Customer MRP: <span className="line-through">{product.price}</span></span>
                    {product.orig && <span className="text-[#9aa89b] text-xs">Max. MRP: <span className="line-through">{product.orig}</span></span>}
                  </div>
                  <p className="text-[#0369a1] text-[10px] font-semibold mt-1.5">Approx. 15% below customer price · Margin opportunity included</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl sm:text-3xl">{product.price}</span>
                    {product.disc && (
                      <span className="text-xs sm:text-sm font-bold bg-[#d1fae5] text-[#047857] px-2 py-0.5 rounded-full">{product.disc} OFF</span>
                    )}
                  </div>
                  {product.orig && (
                    <p className="text-[#9aa89b] text-xs sm:text-sm mt-0.5">MRP <span className="line-through">{product.orig}</span></p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-[#6d7a6f] text-xs sm:text-sm leading-relaxed mb-4">{description}</p>

            {/* Feature list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-5">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accentColor + "22" }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4L3 6.5L7 1.5" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[#073b4c] text-[11px]">{f}</span>
                </div>
              ))}
            </div>

            {/* Qty + CTA */}
            <div className="flex items-center gap-2 sm:gap-3 mt-auto">
              <div className="flex items-center border border-[#e4ede2] rounded-xl overflow-hidden">
                <button
                  disabled={product.stock !== undefined && product.stock <= 0}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 sm:w-9 h-9 sm:h-10 flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-base sm:text-lg"
                >
                  −
                </button>
                <span className="w-8 sm:w-10 text-center font-['Manrope',sans-serif] font-bold text-sm sm:text-base text-[#073b4c]">
                  {product.stock !== undefined && product.stock <= 0 ? 0 : qty}
                </span>
                <button
                  disabled={product.stock !== undefined && (product.stock <= 0 || qty >= product.stock)}
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 sm:w-9 h-9 sm:h-10 flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-base sm:text-lg"
                >
                  +
                </button>
              </div>
              {product.stock !== undefined && product.stock <= 0 ? (
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl bg-[#e5e7eb] text-[#9ca3af] font-bold text-xs sm:text-sm cursor-not-allowed"
                >
                  Out of Stock
                </button>
              ) : (
                <button
                  onClick={() => {
                    addToCart(product, qty);
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: accentColor }}
                >
                  Add to Cart
                </button>
              )}
              <button
                className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl border border-[#e4ede2] flex items-center justify-center hover:bg-[#f0f4f0] transition-colors shrink-0"
                title="Add to Wishlist"
              >
                <svg width="17" height="15" viewBox="0 0 18 16" fill="none">
                  <path d="M15.62 1.51C14.01 0.15 11.66 0.43 10.24 1.93L9 3.23L7.76 1.93C6.35 0.43 3.99 0.15 2.38 1.51C0.54 3.07 0.47 5.9 2.14 7.65L9 15L15.86 7.65C17.53 5.9 17.46 3.07 15.62 1.51Z" stroke="#6d7a6f" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-[#047857] font-medium mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857] inline-block" />
              {isRetailer
                ? "Ready to ship within 24 hours · FREE Delivery on all retailer orders"
                : "Ready to ship within 24 hours · Free delivery on orders above ₹150"}
            </p>
          </div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="border-t border-[#e4ede2] p-4 sm:p-7">
          <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg mb-4 sm:mb-6">Customer Reviews</h3>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-6 sm:mb-8">
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0 min-w-[110px]">
              <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-4xl sm:text-6xl leading-none">{avgRating.toFixed(1)}</p>
              <div className="flex flex-col items-start sm:items-center">
                <StarRow rating={avgRating} size={16} />
                <p className="text-[#9aa89b] text-xs mt-0.5">{reviews.length} reviews</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1 justify-center">
              {ratingBreakdown.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-[#9aa89b] w-5 text-right shrink-0">{star}★</span>
                  <div className="flex-1 h-2 bg-[#f0f4f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${reviews.length ? (count / reviews.length) * 100 : 0}%`,
                        backgroundColor: star >= 4 ? "#006a39" : star === 3 ? "#d97706" : "#b91c1c",
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#9aa89b] w-4 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            {reviews.map((r, idx) => (
              <div key={idx} className="border-b border-[#f0f4f0] pb-4 sm:pb-5 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="font-semibold text-[#073b4c] text-xs sm:text-sm">{r.name}</p>
                        {r.verified && (
                          <span className="text-[8px] sm:text-[9px] font-bold bg-[#d1fae5] text-[#047857] px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRow rating={r.rating} size={11} />
                        <span className="text-[#9aa89b] text-[10px]">{r.date}</span>
                      </div>
                    </div>
                  </div>
                  {r.helpful > 0 && (
                    <span className="text-[10px] text-[#9aa89b] shrink-0">{r.helpful} helpful</span>
                  )}
                </div>
                <p className="text-[#6d7a6f] text-xs sm:text-sm leading-relaxed sm:ml-12">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

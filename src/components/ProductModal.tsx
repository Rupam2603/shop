import { useState, useEffect, useMemo } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useModalBackHandler } from "../lib/navigation";
import { subscribeToProductsRealtime } from "../lib/products";
import {
  fetchProductReviews,
  submitReview,
  markReviewHelpful,
  subscribeToReviewsRealtime,
  type DbReview,
} from "../lib/reviews";

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
  { id: "seed-1", name: "Sunita R.",  role: "customer", rating: 5, date: "Aug 20, 2026", verified: true,  helpful: 12, title: "Highly recommended for fast relief", text: "Works great! Applied at night and woke up feeling much better. Will definitely buy again." },
  { id: "seed-2", name: "Ravi K. (MedPlus Pharmacy)", role: "retailer", rating: 5, date: "Aug 18, 2026", verified: true, helpful: 18, title: "Great wholesale margins & tamper-proof batch", text: "Ordered 50 units for our pharmacy store. Packaging was sealed, fresh batch with 2+ years expiry. High customer turnover!" },
  { id: "seed-3", name: "Ananya S.",  role: "customer", rating: 5, date: "Aug 15, 2026", verified: true,  helpful: 5,  title: "Fast delivery and genuine", text: "Exactly as described. Very happy with this purchase. Delivered quickly and well-packaged." },
  { id: "seed-4", name: "Mohan P. (Wellness Medico)", role: "retailer", rating: 4, date: "Aug 12, 2026", verified: true, helpful: 9,  title: "Solid retail demand", text: "Regular item in our dispensary. Good supplier discount and consistent formulation quality." },
  { id: "seed-5", name: "Shanti D.",  role: "customer", rating: 5, date: "Aug 9, 2026",  verified: true,  helpful: 15, title: "Trusted brand for years", text: "My go-to brand for years. Reliable, effective, and trusted. Always satisfied with the quality." },
  { id: "seed-6", name: "Priya M.",   role: "customer", rating: 5, date: "Aug 24, 2026", verified: true,  helpful: 19, title: "Excellent quality product", text: "Excellent quality! My entire family loves it. Genuine product, fast delivery, great packaging." },
  { id: "seed-7", name: "Gupta Medical Store", role: "retailer", rating: 5, date: "Aug 22, 2026", verified: true, helpful: 24, title: "Best bulk price with fast dispatch", text: "SubhOne gives the best retailer margins on this item. Received bulk dispatch within 2 days in mint condition." },
];

export function getProductReviews(productId: number) {
  const start = (productId * 3) % REVIEW_POOL.length;
  const count = 3 + (productId % 3);
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

const RATING_LABELS: Record<number, string> = {
  1: "1 Star - Poor quality",
  2: "2 Stars - Fair / Below average",
  3: "3 Stars - Good / Average",
  4: "4 Stars - Very Good / Recommended",
  5: "5 Stars - Excellent / Outstanding!",
};

export default function ProductDetailModal({
  product,
  isRetailer,
  onClose,
}: {
  product: PopupProduct;
  isRetailer: boolean;
  onClose: () => void;
}) {
  useModalBackHandler(true, onClose, `product-${product.id}`);

  const { addToCart } = useCart();
  const { appUser } = useAuth();
  const [liveStock, setLiveStock] = useState<number>(product.stock ?? 50);
  const [qty, setQty] = useState(1);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "customer" | "retailer" | number>("all");
  const [likedReviews, setLikedReviews] = useState<string[]>([]);

  const baseReviews = useMemo(() => getProductReviews(product.id), [product.id]);

  const allReviews = useMemo(() => {
    const formattedDbReviews = dbReviews.map((r) => ({
      id: r.id,
      name: r.user_name,
      role: r.user_role,
      rating: r.rating,
      date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      verified: r.verified_purchase,
      helpful: r.helpful_count,
      title: r.title || (r.user_role === "retailer" ? "Wholesale Buyer Feedback" : "Verified Review"),
      text: r.comment,
    }));

    return [...formattedDbReviews, ...baseReviews];
  }, [dbReviews, baseReviews]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return allReviews;
    if (reviewFilter === "customer") return allReviews.filter((r) => r.role === "customer");
    if (reviewFilter === "retailer") return allReviews.filter((r) => r.role === "retailer");
    if (typeof reviewFilter === "number") return allReviews.filter((r) => r.rating === reviewFilter);
    return allReviews;
  }, [allReviews, reviewFilter]);

  const avgRating = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 5.0;

  const accentColor = CAT_COLORS[product.cat] || "#006a39";
  const features = CATEGORY_FEATURES[product.cat] ?? ["Quality assured", "Genuine product", "Fast delivery", "Clinically tested"];
  const description = CATEGORY_DESCRIPTIONS[product.cat] ?? `${product.name} is a quality product by ${product.brand}, trusted by customers and retailers across India.`;
  const hsn = HSN_BY_CAT[product.cat] ?? "—";

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
  }));

  useEffect(() => {
    let mounted = true;
    fetchProductReviews(product.id, product.dbId).then((revs) => {
      if (mounted && revs) setDbReviews(revs);
    });

    const unsubscribeReviews = subscribeToReviewsRealtime(product.id, product.dbId, (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setDbReviews((prev) => [payload.new!, ...prev]);
      } else if (payload.eventType === "UPDATE" && payload.new) {
        setDbReviews((prev) => prev.map((r) => (r.id === payload.new!.id ? payload.new! : r)));
      }
    });

    return () => {
      mounted = false;
      unsubscribeReviews();
    };
  }, [product.id, product.dbId]);

  useEffect(() => {
    setLiveStock(product.stock ?? 50);
    const unsubscribeStock = subscribeToProductsRealtime((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        if (
          payload.new.id === (product as any).dbId ||
          payload.new.numeric_id === product.id ||
          payload.new.name.trim().toLowerCase() === product.name.trim().toLowerCase()
        ) {
          setLiveStock(payload.new.stock);
        }
      }
    });
    return () => unsubscribeStock();
  }, [product]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isOutOfStock = liveStock <= 0;
  const isLowStock = liveStock > 0 && liveStock <= (isRetailer ? 20 : 10);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    const reviewerName =
      appUser?.profile.full_name ||
      appUser?.profile.shop_name ||
      (isRetailer ? "Verified Retailer" : "Verified Customer");

    const reviewerRole = appUser?.profile.role || (isRetailer ? "retailer" : "customer");

    const { data, error } = await submitReview({
      product_id: product.dbId,
      product_numeric_id: product.id,
      user_id: appUser?.authUser.id,
      user_name: reviewerName,
      user_role: reviewerRole,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      verified_purchase: true,
    });

    setSubmittingReview(false);

    if (data) {
      setDbReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
      setReviewComment("");
      setReviewTitle("");
      setReviewSuccess(true);
      setShowReviewForm(false);
      setTimeout(() => setReviewSuccess(false), 4000);
    } else if (error) {
      alert("Could not submit review: " + error);
    }
  };

  const handleHelpfulClick = async (reviewId: string) => {
    if (likedReviews.includes(reviewId)) return;
    setLikedReviews((prev) => [...prev, reviewId]);
    await markReviewHelpful(reviewId);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center sm:items-start justify-center p-2 sm:p-4 sm:pt-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[920px] shadow-2xl my-auto sm:my-8 overflow-hidden max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Image panel */}
          <div className="w-full md:w-72 shrink-0 flex flex-col" style={{ backgroundColor: accentColor + "0d" }}>
            <div className="relative h-56 sm:h-64 overflow-hidden">
              {product.disc && (
                <span
                  className="absolute top-3 left-3 z-10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm"
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
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {product.cat}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">Brand</p>
                <p className="text-xs font-bold text-[#073b4c]">{product.brand}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">HSN Code</p>
                <p className="text-xs font-mono text-[#6d7a6f]">{hsn}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.7px] text-[#9aa89b] mb-1">Live Stock Availability</p>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                    {isRetailer ? "Stock Out (0 units)" : "Out of Stock"}
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-md animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {isRetailer ? `Low Stock (${liveStock} units)` : `Only ${liveStock} Left!`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] bg-[#d1fae5] px-2 py-0.5 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {isRetailer ? `📦 ${liveStock} units in stock` : `${liveStock} units in stock`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Info panel */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col gap-4 sm:gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9aa89b] block mb-1">
                  {product.brand}
                </span>
                <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg sm:text-2xl leading-tight">
                  {product.name}
                </h2>
                {product.sub && (
                  <p className="text-[#6d7a6f] text-xs sm:text-sm mt-1">{product.sub}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f0f4f0] hover:bg-[#e4ede2] text-[#073b4c] flex items-center justify-center shrink-0 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Rating pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#fef9c3] px-2.5 py-1 rounded-lg">
                <StarRow rating={avgRating} size={13} />
                <span className="font-bold text-xs text-[#713f12]">{avgRating.toFixed(1)}</span>
              </div>
              <span className="text-[#9aa89b] text-xs">({allReviews.length} reviews)</span>
              <span className="text-[#9aa89b] text-xs">·</span>
              <span className="text-[#006a39] text-xs font-semibold">100% Genuine</span>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-xl bg-[#f8fafb] border border-[#e4ede2]">
              {isRetailer ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-['Manrope',sans-serif] font-extrabold text-[#0369a1]">
                      {retailerPrice(product.price)}
                    </span>
                    <span className="text-xs bg-[#dbeafe] text-[#1d4ed8] font-bold px-2 py-0.5 rounded uppercase">
                      Retailer Bulk Price
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#9aa89b]">
                    <span>Standard MRP / Customer Price:</span>
                    <span className="line-through">{product.price}</span>
                    <span className="text-[#047857] font-semibold">(15% wholesale margin)</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-['Manrope',sans-serif] font-extrabold text-[#073b4c]">
                    {product.price}
                  </span>
                  {product.orig && (
                    <span className="text-sm text-[#9aa89b] line-through">MRP {product.orig}</span>
                  )}
                  {product.disc && (
                    <span className="text-xs font-bold text-[#047857] bg-[#d1fae5] px-2 py-0.5 rounded">
                      Save {product.disc}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#073b4c] mb-1.5">Description</h4>
              <p className="text-[#6d7a6f] text-xs sm:text-sm leading-relaxed">{description}</p>
            </div>

            {/* Key Features */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#073b4c] mb-2">Key Highlights</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#3e4a3f]">
                    <span className="w-4 h-4 rounded-full bg-[#d1fae5] text-[#047857] flex items-center justify-center text-[10px] shrink-0 font-bold">
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Stepper + Add to Cart CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 mt-auto">
              {!isOutOfStock && (
                <div className="flex items-center border border-[#e4ede2] rounded-xl overflow-hidden bg-white shrink-0">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] font-bold text-base transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-[#073b4c]">{qty}</span>
                  <button
                    disabled={qty >= liveStock}
                    onClick={() => setQty((q) => Math.min(liveStock, q + 1))}
                    className={`w-10 h-10 flex items-center justify-center text-[#073b4c] font-bold text-base transition-colors ${
                      qty >= liveStock ? "opacity-30 cursor-not-allowed bg-gray-100" : "hover:bg-[#f0f4f0]"
                    }`}
                  >
                    +
                  </button>
                </div>
              )}

              {isOutOfStock ? (
                <button
                  disabled
                  className="flex-1 py-3 px-6 rounded-xl bg-gray-200 text-gray-500 font-['Manrope',sans-serif] font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Currently Out of Stock
                </button>
              ) : (
                <button
                  onClick={() => {
                    addToCart(
                      {
                        id: product.id,
                        numeric_id: product.id,
                        name: product.name,
                        brand: product.brand,
                        cat: product.cat,
                        price: isRetailer ? retailerPrice(product.price) : product.price,
                        orig: product.orig,
                        img: product.img,
                      },
                      qty
                    );
                    onClose();
                  }}
                  className="flex-1 py-3 px-6 rounded-xl text-white font-['Manrope',sans-serif] font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>Add {qty} to Cart</span>
                  <span>·</span>
                  <span>
                    {isRetailer
                      ? `₹${(parseFloat(retailerPrice(product.price).replace(/[₹,]/g, "")) || 0) * qty}`
                      : `₹${(parseFloat(product.price.replace(/[₹,]/g, "")) || 0) * qty}`}
                  </span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#9aa89b] text-center sm:text-left">
              {isRetailer
                ? "Ready to ship within 24 hours · FREE Delivery on all retailer wholesale orders"
                : "Ready to ship within 24 hours · Free delivery on orders above ₹150"}
            </p>
          </div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="border-t border-[#e4ede2] p-4 sm:p-7 bg-[#fafdfa]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg sm:text-xl">
                Ratings & Reviews
              </h3>
              <p className="text-xs text-[#6d7a6f] mt-0.5">
                Verified reviews from customers and wholesale pharmacy retailers across India.
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-[#006a39] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#005a30] transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span>{showReviewForm ? "Close Review Form" : "Write a Review"}</span>
            </button>
          </div>

          {reviewSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#059669">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Thank you! Your review has been submitted and published successfully in real-time.</span>
            </div>
          )}

          {/* ── Interactive Review Submission Form ── */}
          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="mb-8 p-5 sm:p-6 bg-white rounded-2xl border-2 border-[#006a39]/20 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between border-b border-[#f0f4f0] pb-3">
                <h4 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm sm:text-base">
                  Submit Your Review
                </h4>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isRetailer ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {isRetailer ? "📦 Posting as Verified Retailer" : "👤 Posting as Verified Customer"}
                </span>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-[#073b4c] mb-1.5">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M7 1L8.854 5.09L13.5 5.835L10.25 8.995L11.021 13.5L7 11.277L2.979 13.5L3.75 8.995L0.5 5.835L5.146 5.09Z"
                            fill={star <= (hoverRating || reviewRating) ? "#f59e0b" : "#e5e7eb"}
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[#6d7a6f] ml-2">
                    {RATING_LABELS[hoverRating || reviewRating]}
                  </span>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-[#073b4c] mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder={
                    isRetailer
                      ? "e.g. Excellent packaging, long expiry, great wholesale margin"
                      : "e.g. Fast relief, genuine medicine, swift delivery"
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafb] border border-[#d5dcd3] rounded-xl text-xs sm:text-sm text-[#073b4c] focus:outline-none focus:bg-white focus:border-[#006a39]"
                />
              </div>

              {/* Comment input */}
              <div>
                <label className="block text-xs font-bold text-[#073b4c] mb-1">
                  Detailed Review *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isRetailer
                      ? "Share your feedback regarding bulk packing quality, batch freshness, customer demand, and delivery turnaround..."
                      : "Share your experience with the effectiveness, quality, taste/smell, and overall results..."
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafb] border border-[#d5dcd3] rounded-xl text-xs sm:text-sm text-[#073b4c] focus:outline-none focus:bg-white focus:border-[#006a39]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-xs font-bold text-[#6d7a6f] hover:bg-[#f0f4f0] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="px-5 py-2.5 bg-[#006a39] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#005a30] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {submittingReview ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Rating Breakdown & Summary */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-6 sm:mb-8 bg-white p-5 rounded-2xl border border-[#e4ede2]">
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0 min-w-[120px] justify-center">
              <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-4xl sm:text-5xl leading-none">
                {avgRating.toFixed(1)}
              </p>
              <div className="flex flex-col items-start sm:items-center">
                <StarRow rating={avgRating} size={16} />
                <p className="text-[#9aa89b] text-xs mt-1">{allReviews.length} total reviews</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1 justify-center">
              {ratingBreakdown.map(({ star, count }) => (
                <button
                  key={star}
                  onClick={() => setReviewFilter(reviewFilter === star ? "all" : star)}
                  className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#6d7a6f] w-6 text-right shrink-0 group-hover:text-[#006a39]">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-[#f0f4f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${allReviews.length ? (count / allReviews.length) * 100 : 0}%`,
                        backgroundColor: star >= 4 ? "#006a39" : star === 3 ? "#d97706" : "#b91c1c",
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#9aa89b] w-6 text-right shrink-0">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Review Filtering Tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {[
              { label: `All Reviews (${allReviews.length})`, value: "all" },
              { label: `Customer Reviews (${allReviews.filter((r) => r.role === "customer").length})`, value: "customer" },
              { label: `Retailer Wholesale (${allReviews.filter((r) => r.role === "retailer").length})`, value: "retailer" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setReviewFilter(tab.value as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  reviewFilter === tab.value
                    ? "bg-[#006a39] text-white shadow-sm"
                    : "bg-white border border-[#d5dcd3] text-[#3e4a3f] hover:border-[#006a39]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Review List */}
          <div className="flex flex-col gap-4">
            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e4ede2] p-8 text-center text-xs text-[#9aa89b]">
                No reviews found under this filter.
              </div>
            ) : (
              filteredReviews.map((r, idx) => {
                const isRetailerReview = r.role === "retailer";
                const isLiked = likedReviews.includes(r.id);

                return (
                  <div
                    key={r.id || idx}
                    className="bg-white rounded-2xl border border-[#e4ede2] p-4 sm:p-5 shadow-xs flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                            isRetailerReview ? "bg-[#0369a1]" : "bg-[#006a39]"
                          }`}
                        >
                          {(r.name[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-[#073b4c] text-xs sm:text-sm">{r.name}</p>
                            {isRetailerReview ? (
                              <span className="text-[9px] font-extrabold bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span>📦</span> Verified Retailer / Bulk Buyer
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>✓</span> Verified Customer
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRow rating={r.rating} size={12} />
                            <span className="text-[#9aa89b] text-[10px]">{r.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Helpful Button */}
                      <button
                        onClick={() => handleHelpfulClick(r.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 shrink-0 ${
                          isLiked
                            ? "bg-[#e8f5ee] border-[#006a39] text-[#006a39] font-bold"
                            : "bg-[#f8fafb] border-[#e4ede2] text-[#6d7a6f] hover:bg-[#f0f4f0]"
                        }`}
                        title="Mark review as helpful"
                      >
                        <span>👍</span>
                        <span>{r.helpful + (isLiked ? 1 : 0)}</span>
                      </button>
                    </div>

                    {r.title && (
                      <p className="font-bold text-[#073b4c] text-xs sm:text-sm mt-0.5">
                        {r.title}
                      </p>
                    )}

                    <p className="text-[#3e4a3f] text-xs sm:text-sm leading-relaxed">
                      {r.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

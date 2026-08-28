import { useState } from "react";
import imgMainFeatured from "@/imports/HealthSupplementsSubhOne/12180d12bdb759cb4c1126433eb9617bcf5f0e37.png";
import imgVitamins from "@/imports/HealthSupplementsSubhOne/82fde6fb40fb3f0de4e0ae8e660633ef3205b656.png";
import imgAyurveda from "@/imports/HealthSupplementsSubhOne/5bf6c30bcdaa73c2f154fa0056e19083a2be7538.png";
import imgWheyProtein from "@/imports/HealthSupplementsSubhOne/d5d15fa3258f8a08d359a05ee21c14dc9b5772a4.png";
import imgOmega3 from "@/imports/HealthSupplementsSubhOne/f2d5336de26350e80b974508f11f2c0dd8b163aa.png";
import imgMultivitamins from "@/imports/HealthSupplementsSubhOne/3c99917897bd535bf5e0599101f9a9230ad0a63d.png";
import imgAshwagandha from "@/imports/HealthSupplementsSubhOne/572e3e713ff3505ed972644010e32394fe453e53.png";

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

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState("All Supplements");
  const [wishlist, setWishlist] = useState<number[]>([]);

  const toggleWishlist = (i: number) => {
    setWishlist((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-10 py-8 flex flex-col gap-8">

        {/* Featured Hero Grid */}
        <div className="grid grid-cols-3 grid-rows-2 gap-4">
          {/* Main hero - spans 2 rows, 2 cols */}
          <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden relative h-[400px] shadow-sm">
            <img
              src={imgMainFeatured}
              alt="Premium Sports Nutrition"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,59,76,0.8)] via-[rgba(7,59,76,0.2)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-2">
              <span className="bg-[#0f9d58] text-white text-sm font-bold px-3 py-1 rounded-full w-fit tracking-[0.7px]">
                Premium Sports Nutrition
              </span>
              <h2 className="font-['Manrope',sans-serif] font-bold text-white text-3xl leading-10">
                Fuel Your Performance
              </h2>
              <p className="text-white text-sm leading-6 max-w-[448px]">
                Discover our clinical-grade whey proteins and pre-workout formulas designed for peak results.
              </p>
              <button className="bg-white text-[#073b4c] font-bold text-sm tracking-[0.7px] px-6 py-2 rounded-lg w-fit hover:bg-[#f0f7f0] transition-colors shadow-sm mt-1">
                Shop Proteins
              </button>
            </div>
          </div>

          {/* Daily Vitamins tile */}
          <div className="rounded-2xl overflow-hidden relative h-[190px] shadow-sm">
            <img src={imgVitamins} alt="Daily Vitamins" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,59,76,0.7)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-['Manrope',sans-serif] font-semibold text-white text-xl leading-8">
                Daily Vitamins
              </p>
              <p className="text-[#82fde6] text-xs tracking-[0.6px] uppercase">Explore</p>
            </div>
          </div>

          {/* Ayurvedic Blends tile */}
          <div className="rounded-2xl overflow-hidden relative h-[190px] shadow-sm">
            <img src={imgAyurveda} alt="Ayurvedic Blends" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,59,76,0.7)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-['Manrope',sans-serif] font-semibold text-white text-xl leading-8">
                Ayurvedic Blends
              </p>
              <p className="text-[#82fde6] text-xs tracking-[0.6px] uppercase">Explore</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
        <div className="flex flex-col gap-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-3xl leading-10">
                Best Sellers
              </h2>
              <p className="text-[#3e4a3f] text-sm mt-1">Highly rated clinical-grade formulations.</p>
            </div>
            <button className="font-bold text-[#006a39] text-sm tracking-[0.7px] flex items-center gap-1 hover:underline">
              View All
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M9 3L13 7L9 11" stroke="#006a39" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {bestSellers.map((p, i) => (
              <div
                key={p.name}
                className="bg-white rounded-xl border border-[#d5dcd3] overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative bg-[#f8fafb] h-48 flex items-center justify-center p-4">
                  {p.badge && (
                    <span className="absolute top-2 left-2 bg-[#ffb703] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {p.badge}
                    </span>
                  )}
                  <button
                    onClick={() => toggleWishlist(i)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-sm hover:scale-110 transition-transform"
                  >
                    <HeartIcon filled={wishlist.includes(i)} />
                  </button>
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-full max-w-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <p
                    className="text-xs font-bold tracking-[0.6px] uppercase"
                    style={{ color: p.brandColor }}
                  >
                    {p.brand}
                  </p>
                  <h4 className="font-bold text-[#073b4c] text-sm leading-5">{p.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarIcon />
                    <span className="font-bold text-[#073b4c] text-sm">{p.rating}</span>
                    <span className="text-[#6d7a6f] text-xs">{p.reviews}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg leading-6">
                      {p.price}
                    </span>
                    <button className="w-9 h-9 bg-[#006a39] rounded-lg flex items-center justify-center hover:bg-[#005a30] transition-colors shrink-0">
                      <CartIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

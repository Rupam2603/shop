import React, { useState, useRef, useEffect, useCallback } from "react";

export interface KeyCategoryItem {
  id: string;
  name: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  filterCat?: string; // maps to internal category name or filter type
  route?: string; // optional page route like "lab-tests" or "offers"
}

export const KEY_CATEGORIES: KeyCategoryItem[] = [
  {
    id: "all",
    name: "All",
    filterCat: "All",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      </svg>
    ),
  },
  {
    id: "skin",
    name: "Skin",
    filterCat: "Skin Care & Ointments",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: "pain-relief",
    name: "Pain Relief",
    filterCat: "Pain Relief & Muscle Care",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
  {
    id: "weight-loss",
    name: "Weight Loss",
    filterCat: "Weight Loss & Metabolism",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 8v4l2 2" />
      </svg>
    ),
  },
  {
    id: "wellness",
    name: "Wellness",
    filterCat: "Daily Wellness & Immunity",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9z" />
        <path d="M12 7c-2.76 0-5 2.24-5 5 0 2.5 3 6 5 8 2-2 5-5.5 5-8 0-2.76-2.24-5-5-5z" />
      </svg>
    ),
  },
  {
    id: "baby",
    name: "Baby Care",
    filterCat: "Baby Care & Infant Nutrition",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
        <path d="M10 15a2 2 0 0 0 4 0" />
        <path d="M12 4c.5-1.5 2-2 3-2" />
      </svg>
    ),
  },
  {
    id: "women",
    name: "Women",
    filterCat: "Women's Health & Hygiene",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="5" />
        <line x1="12" y1="14" x2="12" y2="21" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    ),
  },
  {
    id: "men",
    name: "Men",
    filterCat: "Men's Health & Vitality",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="14" r="5" />
        <line x1="19" y1="5" x2="13.6" y2="10.4" />
        <polyline points="15 5 19 5 19 9" />
      </svg>
    ),
  },
  {
    id: "diet",
    name: "Diet",
    filterCat: "Diet & Digestive Health",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11h16a8 8 0 0 1-16 0z" />
        <path d="M12 3c-1.5 1.5-1.5 4 0 5.5" />
        <path d="M8 4c-1.5 1.5-1.5 3.5 0 4.5" />
      </svg>
    ),
  },
  {
    id: "hair",
    name: "Hair Care",
    filterCat: "Hair Care & Scalp Therapy",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.5 2 6 5 6 9c0 5 4 11 6 13 2-2 6-8 6-13 0-4-2.5-7-6-7z" />
        <path d="M12 6v6" />
      </svg>
    ),
  },
  {
    id: "medical-supplies",
    name: "Medical Supplies",
    filterCat: "Medical Supplies & Devices",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: "insurance",
    name: "Insurance",
    filterCat: "Insurance",
    route: "insurance",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    id: "checkups",
    name: "Health Checkups",
    filterCat: "Checkups",
    route: "lab-tests",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31a2 2 0 0 1-.3.79l-4.4 7.6A2 2 0 0 0 7 21h10a2 2 0 0 0 1.7-3.3l-4.4-7.6a2 2 0 0 1-.3-.79V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
      </svg>
    ),
  },
];

function ChevronLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface KeyCategoriesBarProps {
  selectedId?: string;
  onSelectCategory: (category: KeyCategoryItem) => void;
  className?: string;
}

export default function KeyCategoriesBar({
  selectedId = "all",
  onSelectCategory,
  className = "",
}: KeyCategoriesBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    window.addEventListener("resize", checkScroll);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.65, 240);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={`w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-2xs relative ${className}`}>
      {/* Left Scroll Arrow (visible only when scrolling left is required) */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 pl-1.5 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none transition-all duration-200">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-[#ff3366] border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronLeftIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      )}

      {/* Right Scroll Arrow (visible only when scrolling right is required) */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 pr-1.5 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none transition-all duration-200">
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-[#ff3366] border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronRightIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      )}

      <div className="w-full px-2 sm:px-4">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 overflow-x-auto py-1.5 sm:py-2 scroll-smooth select-none no-scrollbar"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {KEY_CATEGORIES.map((cat) => {
            const isSelected = selectedId.toLowerCase() === cat.id.toLowerCase() ||
              selectedId.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`relative flex flex-col items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl group shrink-0 transition-all duration-200 cursor-pointer outline-none min-w-[64px] ${
                  isSelected
                    ? "bg-rose-50 text-[#ff3366] border border-rose-200/90 shadow-2xs scale-102 font-black"
                    : "bg-transparent hover:bg-slate-50/80 border border-transparent hover:border-slate-200/60 text-slate-700 hover:text-[#ff3366]"
                }`}
              >
                {/* Badge (e.g. GET CIRCLE) */}
                {cat.badge && (
                  <span
                    className="absolute -top-1.5 z-10 text-[7px] sm:text-[8px] font-black tracking-wide px-1.5 py-0.2 rounded-full shadow-2xs whitespace-nowrap animate-pulse border border-white/40"
                    style={{
                      backgroundColor: cat.badgeBg || "#ff3366",
                      color: cat.badgeColor || "#ffffff",
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                {/* Category Icon */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${
                    isSelected
                      ? "text-[#ff3366]"
                      : "text-slate-600 group-hover:text-[#ff3366]"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {cat.icon}
                  </div>
                </div>

                {/* Category Name Label */}
                <span
                  className={`text-[11px] sm:text-xs tracking-tight whitespace-nowrap transition-colors duration-150 ${
                    isSelected
                      ? "font-extrabold text-[#ff3366]"
                      : "font-bold text-slate-700 group-hover:text-[#ff3366]"
                  }`}
                >
                  {cat.name}
                </span>

                {/* Active Indicator Underline / Glow */}
                <div
                  className={`h-0.5 w-4/5 rounded-full transition-all duration-200 mt-0.5 ${
                    isSelected ? "bg-[#ff3366] opacity-100 shadow-xs" : "bg-transparent opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

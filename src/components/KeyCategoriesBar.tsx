import React from "react";

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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
        <path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
        <line x1="12" y1="11" x2="12" y2="15" />
        <line x1="10" y1="13" x2="14" y2="13" />
      </svg>
    ),
  },
  {
    id: "skin",
    name: "Skin",
    filterCat: "Skin Care, Powders & Ointments",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 4.418 3.582 10 8 12 4.418-2 8-7.582 8-12a8 8 0 0 0-8-8z" />
        <path d="M9 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" stroke="none" />
        <path d="M15 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" stroke="none" />
        <path d="M18 4l.5 1.5L20 6l-1.5.5L18 8l-.5-1.5L16 6l1.5-.5L18 4z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "insurance",
    name: "Insurance",
    badge: "GET CIRCLE",
    badgeBg: "#f59e0b",
    badgeColor: "#ffffff",
    filterCat: "Insurance",
    route: "insurance",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    id: "checkups",
    name: "Checkups",
    filterCat: "Checkups",
    route: "lab-tests",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2h8" />
        <path d="M9 2v4.5a3 3 0 0 1-.88 2.12L4.5 12.24A4 4 0 0 0 3.32 15.08v3.42A3.5 3.5 0 0 0 6.82 22h10.36a3.5 3.5 0 0 0 3.5-3.5v-3.42a4 4 0 0 0-1.18-2.84l-3.62-3.62A3 3 0 0 1 15 6.5V2" />
        <line x1="6" y1="16" x2="18" y2="16" />
      </svg>
    ),
  },
  {
    id: "50-off",
    name: "50% OFF",
    filterCat: "50% OFF",
    route: "offers",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 2.4 3.4-.4 1.4 3.1 3.1 1.4-.4 3.4L22 12l-2.1 2.1.4 3.4-3.1 1.4-1.4 3.1-3.4-.4L12 22l-2.4-2.4-3.4.4-1.4-3.1-3.1-1.4.4-3.4L2 12l2.1-2.1-.4-3.4 3.1-1.4 1.4-3.1 3.4.4L12 2z" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <circle cx="9.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "weight-loss",
    name: "Weight Loss",
    filterCat: "Weight Loss",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M8 8a4 4 0 0 1 8 0" />
        <line x1="12" y1="8" x2="12" y2="5" />
        <circle cx="12" cy="14" r="3.5" />
        <polyline points="10.5 14 12 15.5 13.5 14" />
        <line x1="12" y1="12.5" x2="12" y2="15.5" />
      </svg>
    ),
  },
  {
    id: "wellness",
    name: "Wellness",
    filterCat: "Energy, Hydration & Supplements",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 15a4 4 0 0 0 8 0H8z" />
        <path d="M10 12c1-1 3-1 4 0" />
      </svg>
    ),
  },
  {
    id: "monsoon",
    name: "Monsoon",
    filterCat: "Monsoon",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 14a4.5 4.5 0 0 0 .5-8.97A7 7 0 0 0 4.1 8.5 5 5 0 0 0 5 18h12" />
        <line x1="8" y1="19" x2="7" y2="22" />
        <line x1="12" y1="19" x2="11" y2="22" />
        <line x1="16" y1="19" x2="15" y2="22" />
      </svg>
    ),
  },
  {
    id: "baby",
    name: "Baby",
    filterCat: "Baby Care",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="11" r="7" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M10 14a2 2 0 0 0 4 0" />
        <path d="M5 11a2 2 0 0 1-2-2 2 2 0 0 1 2-2" />
        <path d="M19 11a2 2 0 0 0 2-2 2 2 0 0 0-2-2" />
        <path d="M17.5 17.5c-.8.8-1.7 1.2-2.5 1.5 1-.8 1.5-1.7 1.5-2.5a1.5 1.5 0 0 0-3 0c0 1.5 2 3.5 4 4.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "women",
    name: "Women",
    filterCat: "Personal Care, Hygiene & Others",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 0-5 5c0 2.5 1.5 4.5 3 5v1a2 2 0 0 0-2 2v2h8v-2a2 2 0 0 0-2-2v-1c1.5-.5 3-2.5 3-5a5 5 0 0 0-5-5z" />
        <path d="M7 8c1 4 4 6 5 6s4-2 5-6" />
      </svg>
    ),
  },
  {
    id: "men",
    name: "Men",
    filterCat: "Men",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M9 4.5c1.5-1 4.5-1 6 0" />
      </svg>
    ),
  },
  {
    id: "vaccines",
    name: "Vaccines",
    filterCat: "Vaccines",
    route: "lab-tests",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="8" height="12" rx="2" />
        <path d="M6 8V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3" />
        <line x1="8" y1="12" x2="8" y2="16" />
        <path d="M18 3l3 3-8 8-3-3 8-8z" />
        <line x1="14" y1="7" x2="17" y2="10" />
        <line x1="12" y1="16" x2="9" y2="19" />
        <line x1="9" y1="19" x2="7" y2="21" />
      </svg>
    ),
  },
  {
    id: "diet",
    name: "Diet",
    filterCat: "Antacids, Digestion & Laxatives",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14a8 8 0 0 0 16 0H4z" />
        <circle cx="12" cy="9" r="3.5" />
        <path d="M12 5.5V3c0-.5 1-1 2-1" />
        <path d="M16 10a2.5 2.5 0 0 0 2.5-2.5" />
      </svg>
    ),
  },
  {
    id: "hair",
    name: "Hair",
    filterCat: "Skin Care, Powders & Ointments",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3C8 3 5 6.5 5 11c0 6 3 10 7 10 2 0 3-1 4-3s1.5-4 1.5-6.5c0-4.5-2.5-8.5-5.5-8.5z" />
        <path d="M9 13c1 3 3 5 4 5" />
        <path d="M18 5l.5 1.5L20 7l-1.5.5L18 9l-.5-1.5L16 7l1.5-.5L18 5z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

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
  return (
    <div className={`w-full bg-white border-b border-[#e4ede2] ${className}`}>
      <div className="max-w-[1280px] mx-auto px-2 sm:px-4 lg:px-8">
        <div
          className="flex items-end gap-1.5 sm:gap-4 overflow-x-auto py-2.5 sm:py-3.5 scroll-smooth select-none"
          style={{
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
                className="relative flex flex-col items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 group shrink-0 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#006a39] rounded-xl"
              >
                {/* Badge (e.g. GET CIRCLE) */}
                {cat.badge && (
                  <span
                    className="absolute -top-1.5 z-10 text-[8px] sm:text-[9px] font-black tracking-wide px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap animate-pulse"
                    style={{
                      backgroundColor: cat.badgeBg || "#f59e0b",
                      color: cat.badgeColor || "#ffffff",
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                {/* Category Icon */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-transform duration-150 group-hover:scale-110 ${
                    isSelected
                      ? "text-[#073b4c] bg-[#eef5ee]"
                      : "text-[#3e4a3f] group-hover:text-[#006a39] bg-transparent"
                  }`}
                >
                  {cat.icon}
                </div>

                {/* Category Name Label */}
                <span
                  className={`text-[11px] sm:text-xs tracking-tight whitespace-nowrap transition-colors duration-150 ${
                    isSelected
                      ? "font-extrabold text-[#073b4c]"
                      : "font-semibold text-[#4a5568] group-hover:text-[#073b4c]"
                  }`}
                >
                  {cat.name}
                </span>

                {/* Active Indicator Underline */}
                <div
                  className={`h-0.5 w-full rounded-full transition-all duration-200 mt-1 ${
                    isSelected ? "bg-[#073b4c] opacity-100" : "bg-transparent opacity-0 group-hover:bg-[#006a39]/30 group-hover:opacity-100"
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

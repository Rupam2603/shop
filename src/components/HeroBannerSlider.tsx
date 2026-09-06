import { useState, useEffect, useRef, useCallback } from "react";
import type { Page } from "../App";

interface SlideData {
  id: string;
  badgeTag: string;
  badgeSubtitle: string;
  badgeIcon?: string;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineSuffix?: string;
  description: string;
  primaryBtnText: string;
  primaryBtnAction: () => void;
  secondaryBtnText: string;
  secondaryBtnAction: () => void;
  imageSrc: string;
  imageAlt: string;
  badgeTopText: string;
  badgeMiddleText: string;
  badgeBottomText: string;
  gradientClass: string;
  borderColorClass: string;
  highlightColor: string;
  primaryBtnClass: string;
  badgeTextColor: string;
}

interface HeroBannerSliderProps {
  onNavigate: (page: Page, category?: string) => void;
}

export default function HeroBannerSlider({ onNavigate }: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Touch tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const SLIDE_DURATION = 5500; // 5.5 seconds per slide
  const TICK_INTERVAL = 50; // Update progress bar every 50ms

  const slides: SlideData[] = [
    {
      id: "slide-first-order",
      badgeTag: "LIMITED TIME OFFER",
      badgeSubtitle: "100% Genuine Pharmacy",
      badgeIcon: "🛡️",
      headlinePrefix: "Flat ",
      headlineHighlight: "20% Off",
      headlineSuffix: " on First Order",
      description:
        "Genuine medicines, certified wellness supplements, baby care & emergency essentials – delivered to your doorstep in 30 mins.",
      primaryBtnText: "Shop Medicines",
      primaryBtnAction: () => onNavigate("medicines"),
      secondaryBtnText: "Explore Deals",
      secondaryBtnAction: () => onNavigate("offers"),
      imageSrc: "/delivery_hero.jpg",
      imageAlt: "SubhOne Delivery Partner",
      badgeTopText: "30",
      badgeMiddleText: "MIN",
      badgeBottomText: "Delivery",
      gradientClass: "from-rose-50/95 via-pink-50/85 to-rose-100/70",
      borderColorClass: "border-rose-100/90",
      highlightColor: "#ff3366",
      primaryBtnClass: "bg-[#ff3366] hover:bg-[#e62657] text-white shadow-rose-500/25",
      badgeTextColor: "text-[#ff3366]",
    },
    {
      id: "slide-prescription-care",
      badgeTag: "EXPERT CARE & DIAGNOSTIC",
      badgeSubtitle: "Licensed Pharmacists",
      badgeIcon: "🩺",
      headlinePrefix: "Instant ",
      headlineHighlight: "Prescription Check",
      headlineSuffix: " & Express Delivery",
      description:
        "Upload your doctor's prescription for instant verification by licensed clinical pharmacists. Cold-chain storage with batch verification.",
      primaryBtnText: "Order with Prescription",
      primaryBtnAction: () => onNavigate("medicines"),
      secondaryBtnText: "Consult Pharmacist",
      secondaryBtnAction: () => onNavigate("consult" as any),
      imageSrc: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
      imageAlt: "Registered Pharmacist Care",
      badgeTopText: "100%",
      badgeMiddleText: "VERIFIED",
      badgeBottomText: "Safe Care",
      gradientClass: "from-sky-50/95 via-blue-50/85 to-indigo-50/70",
      borderColorClass: "border-sky-100/90",
      highlightColor: "#0284c7",
      primaryBtnClass: "bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sky-500/25",
      badgeTextColor: "text-[#0284c7]",
    },
    {
      id: "slide-wholesale-retailer",
      badgeTag: "B2B WHOLESALE PHARMACY",
      badgeSubtitle: "High Retailer Margins",
      badgeIcon: "⚡",
      headlinePrefix: "Direct Supply for ",
      headlineHighlight: "Licensed Retailers",
      headlineSuffix: " & Clinics",
      description:
        "Special distributor prices for registered pharmacies. Bulk medicine orders, batch test documentation, GST invoices & priority scheduled dispatch.",
      primaryBtnText: "Explore Wholesale Deals",
      primaryBtnAction: () => onNavigate("offers"),
      secondaryBtnText: "Wholesale Catalog",
      secondaryBtnAction: () => onNavigate("category" as any, "all"),
      imageSrc: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80",
      imageAlt: "Wholesale Pharmacy Supply",
      badgeTopText: "Up to",
      badgeMiddleText: "45%",
      badgeBottomText: "Margin",
      gradientClass: "from-amber-50/95 via-orange-50/85 to-rose-50/70",
      borderColorClass: "border-amber-100/90",
      highlightColor: "#ea580c",
      primaryBtnClass: "bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-orange-500/25",
      badgeTextColor: "text-[#ea580c]",
    },
    {
      id: "slide-wellness-immunity",
      badgeTag: "DAILY IMMUNITY & DEFENSE",
      badgeSubtitle: "100% Genuine Brands",
      badgeIcon: "🌿",
      headlinePrefix: "Boost Family Health with ",
      headlineHighlight: "Immunity Essentials",
      headlineSuffix: "",
      description:
        "Clinically tested multivitamins, Ayurvedic tonics, antiseptic washes & modern diagnostic monitors with guaranteed fast doorstep dispatch.",
      primaryBtnText: "Shop Immunity Care",
      primaryBtnAction: () => onNavigate("category" as any, "Daily Wellness & Immunity"),
      secondaryBtnText: "Explore Top Brands",
      secondaryBtnAction: () => onNavigate("offers"),
      imageSrc: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&q=80",
      imageAlt: "Daily Wellness & Immunity",
      badgeTopText: "FAST",
      badgeMiddleText: "30 MIN",
      badgeBottomText: "Doorstep",
      gradientClass: "from-emerald-50/95 via-teal-50/85 to-green-50/70",
      borderColorClass: "border-emerald-100/90",
      highlightColor: "#059669",
      primaryBtnClass: "bg-[#059669] hover:bg-[#047857] text-white shadow-emerald-500/25",
      badgeTextColor: "text-[#059669]",
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  // Auto-slide effect with progress tracking
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((old) => {
        const step = (TICK_INTERVAL / SLIDE_DURATION) * 100;
        if (old + step >= 100) {
          nextSlide();
          return 0;
        }
        return old + step;
      });
    }, TICK_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch gesture handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 45) {
      // Swiped Left -> Next slide
      nextSlide();
    } else if (diff < -45) {
      // Swiped Right -> Previous slide
      prevSlide();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <div
      className="group relative rounded-3xl overflow-hidden shadow-sm border select-none transition-colors duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Track of Slides */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((s, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={s.id}
              className={`w-full shrink-0 relative min-h-[340px] sm:min-h-[380px] lg:h-[400px] bg-gradient-to-r ${s.gradientClass} border ${s.borderColorClass} flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 lg:px-14 lg:py-8 overflow-hidden`}
            >
              {/* Soft Atmospheric Blur Backdrops */}
              <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/40 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-white/40 blur-3xl pointer-events-none" />

              {/* Left Content Area with Staggered Entrance */}
              <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4 max-w-xl justify-center text-left">
                {/* Badges */}
                <div
                  className={`flex flex-wrap items-center gap-2 transition-all duration-700 delay-100 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 bg-white/90 text-slate-800 text-[10px] sm:text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-black shadow-2xs border border-white/60">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ backgroundColor: s.highlightColor }}
                    />
                    {s.badgeTag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold bg-white/40 backdrop-blur-xs border border-white/40">
                    <span>{s.badgeIcon || "🛡️"}</span> {s.badgeSubtitle}
                  </span>
                </div>

                {/* Main Headline */}
                <h1
                  className={`font-['Manrope',sans-serif] font-black text-slate-900 text-3xl sm:text-4xl lg:text-5xl leading-tight sm:leading-[1.15] tracking-tight transition-all duration-700 delay-200 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  {s.headlinePrefix}
                  <span style={{ color: s.highlightColor }}>{s.headlineHighlight}</span>
                  {s.headlineSuffix}
                </h1>

                {/* Subtitle Description */}
                <p
                  className={`text-slate-600 text-xs sm:text-base leading-relaxed font-medium max-w-lg transition-all duration-700 delay-300 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  {s.description}
                </p>

                {/* Call To Action Buttons */}
                <div
                  className={`flex flex-wrap items-center gap-3 pt-1 transition-all duration-700 delay-400 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <button
                    type="button"
                    onClick={s.primaryBtnAction}
                    className={`${s.primaryBtnClass} text-xs sm:text-sm font-extrabold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer`}
                  >
                    <span>{s.primaryBtnText}</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M3 7.5H12M8.5 4L12 7.5L8.5 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={s.secondaryBtnAction}
                    className="bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                  >
                    {s.secondaryBtnText}
                  </button>
                </div>
              </div>

              {/* Right Hero Image & Floating Badge */}
              <div
                className={`relative z-10 mt-6 md:mt-0 flex items-center justify-center shrink-0 w-full md:w-auto transition-all duration-700 delay-200 ${
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-[240px] sm:w-[280px] lg:w-[320px] h-[220px] sm:h-[270px] lg:h-[310px] rounded-3xl overflow-hidden shadow-xl border border-white/80 bg-white/60 p-2 flex items-center justify-center backdrop-blur-md">
                    <img
                      src={s.imageSrc}
                      alt={s.imageAlt}
                      className="max-h-full max-w-full object-contain rounded-2xl group-hover:scale-102 transition-transform duration-500"
                    />
                  </div>

                  {/* Floating Circular Luxury Badge */}
                  <div className="absolute -right-3 sm:-right-4 top-1/4 bg-white/95 backdrop-blur-md rounded-full w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center border border-white shadow-xl text-center">
                    <span
                      className="text-lg sm:text-xl font-black leading-none"
                      style={{ color: s.highlightColor }}
                    >
                      {s.badgeTopText}
                    </span>
                    <span
                      className="text-[10px] sm:text-xs font-black tracking-wider leading-tight"
                      style={{ color: s.highlightColor }}
                    >
                      {s.badgeMiddleText}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 leading-tight">
                      {s.badgeBottomText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Glass Navigation Arrows */}
      <button
        type="button"
        aria-label="Previous Slide"
        onClick={prevSlide}
        className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-[#ff3366] backdrop-blur-xl border border-white/80 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Next Slide"
        onClick={nextSlide}
        className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-[#ff3366] backdrop-blur-xl border border-white/80 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Bottom Floating Glass Pagination Capsule with Animated Progress Indicator */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-white/90 px-3.5 py-1.5 rounded-full shadow-xs">
        {slides.map((s, idx) => {
          const isActive = idx === currentIndex;

          return (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => goToSlide(idx)}
              className="cursor-pointer transition-all duration-300 focus:outline-none"
            >
              {isActive ? (
                <div className="w-8 sm:w-10 h-2 bg-slate-200/80 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-75 ease-linear"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: s.highlightColor,
                    }}
                  />
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-300/80 hover:bg-slate-400 transition-all hover:scale-125" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

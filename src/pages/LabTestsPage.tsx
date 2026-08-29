import React, { useState, useEffect, useMemo } from "react";
import imgLabTesting from "@/imports/LabTestsCheckupsSubhOne/95108217d5cffd6c578e7bce86ceab631910923e.png";
import LabBookingModal from "../components/LabBookingModal";
import KeyCategoriesBar, { KeyCategoryItem } from "../components/KeyCategoriesBar";
import { fetchLabPackages, DbLabPackage, DbLabBooking } from "../lib/labTests";
import type { CurrentUser, Page } from "../App";

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 mt-0.5">
      <path d="M7.5 0C3.36 0 0 3.36 0 7.5C0 11.64 3.36 15 7.5 15C11.64 15 15 11.64 15 7.5C15 3.36 11.64 0 7.5 0ZM6 11.25L2.25 7.5L3.31 6.44L6 9.12L11.69 3.43L12.75 4.5L6 11.25Z" fill="#006a39" />
    </svg>
  );
}

function LabIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 3H6v6L2 15c-.83 1.39-.83 3.08 0 4.47C2.83 20.86 4.33 22 6 22h12c1.67 0 3.17-1.14 4-2.53.83-1.39.83-3.08 0-4.47L18 9V3h-3M9 3v6l-4 6h14L15 9V3M9 3h6" stroke="#007F9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PillIcon() {
  return <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 1C4.24 1 2 3.24 2 6V12C2 14.76 4.24 17 7 17C9.76 17 12 14.76 12 12V6C12 3.24 9.76 1 7 1ZM7 3C8.66 3 10 4.34 10 6V9H4V6C4 4.34 5.34 3 7 3Z" fill="#007F9A" /></svg>;
}
function GlucoseIcon() {
  return <svg width="20" height="18" viewBox="0 0 20 18" fill="none"><path d="M10 1L1 10H5V17H15V10H19L10 1ZM10 3.83L16.17 10H13V15H7V10H3.83L10 3.83Z" fill="#007F9A" /></svg>;
}
function HeartIcon() {
  return <svg width="20" height="16" viewBox="0 0 20 16" fill="none"><path d="M10 15.5L1.82 7.32C0.63 6.13 0 4.52 0 2.86C0 1.28 1.28 0 2.86 0C4.09 0 5.17 0.75 5.74 1.89C6.31 0.75 7.39 0 8.62 0C10.2 0 11.48 1.28 11.48 2.86H8.62C8.62 2.86 8.62 2.86 8.62 2.86C8.62 2.86 8.62 2.86 8.62 2.86L10 4.24L11.38 2.86C11.38 1.28 12.66 0 14.24 0C15.47 0 16.55 0.75 17.12 1.89C17.69 0.75 18.77 0 20 0V2.86C18.62 2.86 17.51 4.31 17.51 5.69L10 15.5Z" fill="#007F9A" /></svg>;
}

const FALLBACK_PACKAGES: DbLabPackage[] = [
  {
    id: "pkg-1",
    name: "Advanced Full Body Checkup",
    category: "Full Body Checkup",
    badge: "BESTSELLER",
    tests_count: 85,
    tests_summary: "Includes 85 tests (CBC, Lipid, Thyroid, LFT, KFT, Blood Sugar, Urine RE)",
    included_tests: [
      "Complete Blood Count (CBC - 24 parameters)",
      "Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)",
      "Liver Function Test (SGOT, SGPT, Bilirubin, Albumin)",
      "Kidney Function Test (Creatinine, Urea, Uric Acid)",
      "Thyroid Profile (T3, T4, TSH)",
      "Fasting Blood Sugar",
      "Urine Routine & Microscopy",
    ],
    features: ["Home sample collection", "Reports in 24 hours", "Free Doctor Consultation on Report"],
    mrp: 1999,
    price: 999,
    discount_percent: 50,
    fasting_required: true,
    fasting_hours: 10,
    sample_type: "Blood & Urine Sample",
    report_turnaround: "24 Hours",
    created_at: new Date().toISOString(),
  },
  {
    id: "pkg-2",
    name: "Essential Diabetic Care",
    category: "Diabetes Screening",
    badge: "POPULAR",
    tests_count: 32,
    tests_summary: "Includes 32 tests (HbA1c Glycated Hemoglobin, Fasting Blood Sugar, Lipid Profile)",
    included_tests: [
      "HbA1c (Glycated Hemoglobin)",
      "Estimated Average Glucose (eAG)",
      "Fasting Blood Glucose",
      "Lipid Profile Basic",
      "Microalbuminuria Urine Test",
      "Serum Creatinine with eGFR",
    ],
    features: ["Home sample collection", "Reports in 12 hours", "Dietary Guidance Chart Included"],
    mrp: 999,
    price: 499,
    discount_percent: 50,
    fasting_required: true,
    fasting_hours: 10,
    sample_type: "Blood & Urine Sample",
    report_turnaround: "12 Hours",
    created_at: new Date().toISOString(),
  },
  {
    id: "pkg-3",
    name: "Women's Wellness Plus",
    category: "Women's Health",
    badge: "RECOMMENDED",
    tests_count: 65,
    tests_summary: "Includes 65 tests (Vitamin D, Vitamin B12, Iron Studies, Thyroid Profile, CBC)",
    included_tests: [
      "Vitamin D 25-Hydroxy",
      "Vitamin B12",
      "Complete Iron Profile (Serum Iron, Ferritin, TIBC)",
      "Thyroid Panel (TSH, Free T3, Free T4)",
      "Complete Hemogram (CBC)",
      "Serum Calcium & Phosphorus",
    ],
    features: ["Female Phlebotomists available", "Reports in 24 hours", "Nutritional Assessment Call"],
    mrp: 2499,
    price: 1299,
    discount_percent: 48,
    fasting_required: false,
    fasting_hours: 0,
    sample_type: "Blood Sample",
    report_turnaround: "24 Hours",
    created_at: new Date().toISOString(),
  },
  {
    id: "pkg-4",
    name: "Comprehensive Cardiac Care",
    category: "Heart Health",
    badge: "",
    tests_count: 45,
    tests_summary: "Includes 45 tests (High-Sensitivity CRP, Lipid Profile, Apolipoprotein, Homocysteine)",
    included_tests: [
      "High-Sensitivity C-Reactive Protein (hs-CRP)",
      "Lipid Profile Extended",
      "Homocysteine",
      "Apolipoprotein A1 & B",
      "Blood Sugar Fasting",
      "Kidney Function Test",
    ],
    features: ["Free Home Collection", "Cardiac Risk Stratification", "Digital Report in 24 Hours"],
    mrp: 2999,
    price: 1499,
    discount_percent: 50,
    fasting_required: true,
    fasting_hours: 12,
    sample_type: "Blood Sample",
    report_turnaround: "24 Hours",
    created_at: new Date().toISOString(),
  },
  {
    id: "pkg-5",
    name: "Vitamin & Mineral Deficiency Panel",
    category: "Vitamins & Minerals",
    badge: "",
    tests_count: 18,
    tests_summary: "Includes 18 tests (Vitamin D3, Vitamin B12, Calcium, Iron, Magnesium, Zinc)",
    included_tests: [
      "Vitamin D (25-OH)",
      "Vitamin B12 (Cyanocobalamin)",
      "Serum Calcium",
      "Serum Magnesium",
      "Serum Zinc",
      "Total Iron Binding Capacity",
      "Serum Ferritin",
    ],
    features: ["Home sample collection", "Detailed Deficiency Insights", "Reports in 24 Hours"],
    mrp: 1899,
    price: 899,
    discount_percent: 53,
    fasting_required: false,
    fasting_hours: 0,
    sample_type: "Blood Sample",
    report_turnaround: "24 Hours",
    created_at: new Date().toISOString(),
  },
];

const CATEGORIES = [
  "All Packages",
  "Full Body Checkup",
  "Diabetes Screening",
  "Women's Health",
  "Heart Health",
  "Vitamins & Minerals",
];

const WHY_CHOOSE = [
  { icon: <LabIcon />, title: "NABL Accredited Labs", desc: "Testing in state-of-the-art, certified laboratories ensuring 100% accuracy." },
  { icon: <svg width="21" height="24" viewBox="0 0 21 24" fill="none"><path d="M10.5 0L0 4.5V10.5C0 16.28 4.48 21.67 10.5 24C16.52 21.67 21 16.28 21 10.5V4.5L10.5 0ZM9 17.25L5.25 13.5L6.31 12.44L9 15.12L14.69 9.43L15.75 10.5L9 17.25Z" fill="#006a39" /></svg>, title: "Free Home Collection", desc: "Trained, vaccinated professionals collect samples safely from your home." },
  { icon: <svg width="27" height="21" viewBox="0 0 27 21" fill="none"><path d="M13.5 0L0 5.25L13.5 10.5L27 5.25L13.5 0ZM0 8.75L13.5 14L27 8.75V13.5C27 17.09 20.96 20.25 13.5 20.25C6.04 20.25 0 17.09 0 13.5V8.75Z" fill="#006a39" /></svg>, title: "Fast Digital Reports", desc: "Get smart, easy-to-understand reports on your app & WhatsApp within 24 hours." },
  { icon: <svg width="21" height="27" viewBox="0 0 21 27" fill="none"><path d="M10.5 0L0 4.5V12C0 18.63 4.48 24.78 10.5 27C16.52 24.78 21 18.63 21 12V4.5L10.5 0ZM10.5 5.25L18.375 8.25V12C18.375 17.24 14.93 22.12 10.5 24.09C6.07 22.12 2.625 17.24 2.625 12V8.25L10.5 5.25Z" fill="#006a39" /></svg>, title: "100% Secure Data", desc: "Your health records are encrypted and kept strictly confidential." },
];

export default function LabTestsPage({
  user,
  onNavigate,
}: {
  user?: CurrentUser;
  onNavigate?: (page: Page, category?: string) => void;
}) {
  const [packages, setPackages] = useState<DbLabPackage[]>(FALLBACK_PACKAGES);
  const [selectedCat, setSelectedCat] = useState("All Packages");
  const [search, setSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<DbLabPackage | null>(null);
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchLabPackages().then((data) => {
      if (mounted && data && data.length > 0) {
        setPackages(data);
      }
    });
    return () => { mounted = false; };
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const matchesCat = selectedCat === "All Packages" || p.category === selectedCat;
      const matchesSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tests_summary.toLowerCase().includes(search.toLowerCase()) ||
        p.included_tests.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [packages, selectedCat, search]);

  const handleBookingSuccess = (booking: DbLabBooking) => {
    setToastMessage(`Booking ${booking.booking_number} confirmed! Home collection scheduled.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    if (cat.id === "checkups") return;
    if (cat.route && onNavigate) {
      onNavigate(cat.route as Page);
      return;
    }
    if (onNavigate) {
      onNavigate("category", cat.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5fbf2]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#006a39] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex flex-col gap-4 sm:gap-6">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e4ede2] shadow-xs overflow-hidden">
          <KeyCategoriesBar
            selectedId="checkups"
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* Hero Section */}
        <div className="bg-[#eff6ec] rounded-3xl shadow-sm overflow-hidden border border-[#e4ede2]">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between p-5 sm:p-8 lg:p-10 gap-6 sm:gap-8 relative">
            <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0 relative z-10">
              <span className="inline-flex bg-[#006a39] text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full w-fit uppercase tracking-wide">
                Certified Home Diagnostic Services
              </span>
              <div>
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-3xl sm:text-4xl lg:text-5xl leading-tight sm:leading-[48px] lg:leading-[56px] tracking-tight">
                  Precision Diagnostics,
                </h1>
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-3xl sm:text-4xl lg:text-5xl leading-tight sm:leading-[48px] lg:leading-[56px] tracking-tight">
                  Delivered Home.
                </h1>
              </div>
              <p className="text-[#3e4a3f] text-sm sm:text-base lg:text-lg leading-relaxed max-w-[512px]">
                Book certified pathology lab tests from the comfort of your home. Free sample pickup by certified phlebotomists with digital reports within 24 hours.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
                <button
                  onClick={() => {
                    const topPkg = packages[0];
                    if (topPkg) setSelectedPackage(topPkg);
                  }}
                  className="bg-[#006a39] text-white font-['Hanken_Grotesk',sans-serif] font-bold text-xs sm:text-sm tracking-[0.6px] px-6 py-3 rounded-xl shadow-md hover:bg-[#005a30] transition-all hover:scale-[1.02]"
                >
                  Book Full Body Checkup (₹999)
                </button>
              </div>
            </div>
            <div
              className="w-full lg:w-auto flex-1 h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-md shrink-0 max-w-[420px] border border-[#e4ede2]"
            >
              <img src={imgLabTesting} alt="Lab testing" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa89b" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages or tests (e.g. Thyroid, Vitamin D, HbA1c, CBC, Lipid)…"
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-[#e4ede2] rounded-2xl focus:outline-none focus:border-[#006a39] transition-colors"
              />
            </div>
            <span className="text-xs text-[#9aa89b] font-semibold whitespace-nowrap self-end sm:self-center">
              {filteredPackages.length} package{filteredPackages.length !== 1 ? "s" : ""} available
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedCat === cat
                    ? "bg-[#006a39] text-white shadow-sm"
                    : "bg-white text-[#6d7a6f] border border-[#e4ede2] hover:border-[#006a39]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Health Packages Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl sm:text-2xl lg:text-3xl leading-tight">
              Diagnostic Health Packages
            </h2>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#e4ede2] py-16 text-center flex flex-col items-center gap-3">
              <p className="font-bold text-[#073b4c] text-lg">No packages found</p>
              <p className="text-[#9aa89b] text-sm">Try searching for a different test parameter or select &apos;All Packages&apos;.</p>
              <button
                onClick={() => { setSelectedCat("All Packages"); setSearch(""); }}
                className="px-5 py-2 rounded-xl bg-[#006a39] text-white text-xs font-bold mt-1"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-3xl border border-[#d5dcd3] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                >
                  <div className="bg-[#eff6ec] p-5 border-b border-[#e4ede2] relative">
                    <div className="flex items-center justify-between mb-2">
                      {pkg.badge ? (
                        <span className="bg-[#006a39] text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {pkg.badge}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-[#6d7a6f] bg-[#e4ede2] px-2 py-0.5 rounded-full">
                          {pkg.category}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-[#006a39] bg-white border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                        {pkg.tests_count} Tests
                      </span>
                    </div>

                    <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl leading-snug">
                      {pkg.name}
                    </h3>
                    <p className="text-[#3e4a3f] text-xs leading-relaxed mt-1 line-clamp-2">
                      {pkg.tests_summary}
                    </p>

                    {pkg.fasting_required && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-1 rounded-lg">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Fasting: {pkg.fasting_hours || 10}h required
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-1 gap-5">
                    <div className="flex flex-col gap-3">
                      <ul className="flex flex-col gap-2">
                        {pkg.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-[#171d18] leading-tight">
                            <CheckCircleIcon />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* Expandable test list */}
                      {pkg.included_tests && pkg.included_tests.length > 0 && (
                        <div className="border-t border-[#f0f4f0] pt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedPkgId(expandedPkgId === pkg.id ? null : pkg.id)}
                            className="text-[11px] font-bold text-[#006a39] hover:underline flex items-center justify-between w-full py-1"
                          >
                            <span>{expandedPkgId === pkg.id ? "Hide Included Tests ▲" : `View ${pkg.included_tests.length} Tests Breakdown ▼`}</span>
                          </button>
                          {expandedPkgId === pkg.id && (
                            <div className="mt-2 bg-[#f8fafb] p-3 rounded-2xl border border-[#e4ede2] flex flex-col gap-1.5 max-h-48 overflow-y-auto text-xs text-[#3e4a3f]">
                              {pkg.included_tests.map((t, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 leading-tight">
                                  <span className="text-[#006a39] font-bold">•</span>
                                  <span>{t}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[#f0f4f0] pt-3">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl">
                            ₹{pkg.price.toLocaleString()}
                          </span>
                          {pkg.mrp > pkg.price && (
                            <span className="text-[#9aa89b] text-xs line-through">MRP ₹{pkg.mrp.toLocaleString()}</span>
                          )}
                        </div>
                        {pkg.discount_percent > 0 && (
                          <span className="bg-[#dcfce7] text-[#15803d] text-xs font-bold px-2 py-0.5 rounded-full">
                            {pkg.discount_percent}% OFF
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm tracking-[0.4px] transition-all bg-[#006a39] text-white hover:bg-[#005a30] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Book Home Sample Collection
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Why Choose SubhOne Labs */}
        <div className="bg-white rounded-3xl border border-[#e4ede2] p-6 sm:p-10 flex flex-col gap-6 sm:gap-8 shadow-xs">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#006a39]">Safety & Accuracy First</span>
            <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl sm:text-2xl lg:text-3xl mt-1">
              Why 100,000+ Families Choose SubhOne Diagnostics
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2.5">
                <div className="bg-[#eff6ec] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-1 shrink-0 text-[#006a39]">
                  {item.icon}
                </div>
                <h4 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base sm:text-lg leading-snug">
                  {item.title}
                </h4>
                <p className="text-[#6d7a6f] text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Lab Booking Modal */}
      {selectedPackage && (
        <LabBookingModal
          open={!!selectedPackage}
          packageItem={selectedPackage}
          onClose={() => setSelectedPackage(null)}
          onBookingSuccess={handleBookingSuccess}
          user={user ? { name: user.name, email: user.email, phone: user.phone } : undefined}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import type { Page } from "../App";
import KeyCategoriesBar, { KeyCategoryItem } from "../components/KeyCategoriesBar";
import { useCart } from "../contexts/CartContext";

const VACCINE_CATALOG = [
  {
    id: "v-flu",
    name: "Influenza (Flu) Quadrivalent Vaccine",
    target: "Adults & Children above 6 months",
    protects: "Seasonal Flu, Swine Flu (H1N1, H3N2), Viral respiratory fevers",
    dose: "1 Dose Annual Shot",
    price: "₹1,499",
    retailerPrice: "₹1,199",
    orig: "₹1,850",
    badge: "Seasonal Essential",
    color: "#0284c7",
    img: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&q=80",
  },
  {
    id: "v-hpv",
    name: "HPV Gardasil 9 Vaccine",
    target: "Females & Males (9-45 Years)",
    protects: "Cervical Cancer, HPV Strains 6, 11, 16, 18, 31, 33, 45, 52, 58",
    dose: "2 or 3 Dose Schedule",
    price: "₹3,850",
    retailerPrice: "₹3,150",
    orig: "₹4,500",
    badge: "High Clinical Impact",
    color: "#db2777",
    img: "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=300&q=80",
  },
  {
    id: "v-hepb",
    name: "Hepatitis B Recombinant Vaccine",
    target: "All Age Groups & Healthcare Workers",
    protects: "Liver Cirrhosis, Chronic Hepatitis B infection, Liver failure",
    dose: "3 Dose Schedule (0, 1, 6 months)",
    price: "₹450",
    retailerPrice: "₹320",
    orig: "₹600",
    badge: "Lifelong Immunity",
    color: "#059669",
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
  },
  {
    id: "v-typhoid",
    name: "Typhoid Conjugate (TCV) Vaccine",
    target: "Adults & Children above 6 months",
    protects: "Salmonella Typhi, Enteric severe waterborne typhoid fever",
    dose: "Single Dose (Long Lasting)",
    price: "₹1,250",
    retailerPrice: "₹980",
    orig: "₹1,550",
    badge: "Monsoon Essential",
    color: "#d97706",
    img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80",
  },
  {
    id: "v-pneumo",
    name: "Pneumococcal (PCV-13) Vaccine",
    target: "Seniors (50+), Smokers & Infants",
    protects: "Pneumonia, Meningitis, Septicemia, Middle ear infections",
    dose: "Single Dose for Adults",
    price: "₹3,200",
    retailerPrice: "₹2,650",
    orig: "₹3,800",
    badge: "Senior Respiratory Care",
    color: "#7c3aed",
    img: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&q=80",
  },
  {
    id: "v-tetanus",
    name: "Tetanus Toxoid (TT) + Diphtheria (Td)",
    target: "Injury Cases, Adults & Pregnant Women",
    protects: "Lockjaw, Tetanus wound infection, Diphtheria",
    dose: "Single Booster Dose",
    price: "₹120",
    retailerPrice: "₹85",
    orig: "₹180",
    badge: "First Aid Emergency",
    color: "#ba1a1a",
    img: "https://images.unsplash.com/photo-1583687809174-d8db66b1b7fd?w=300&q=80",
  },
];

interface VaccinesPageProps {
  userRole?: string;
  onNavigate: (page: Page, category?: string) => void;
}

export default function VaccinesPage({ userRole, onNavigate }: VaccinesPageProps) {
  const { addToCart } = useCart();
  const isRetailer = userRole === "retailer";
  const [selectedVaccine, setSelectedVaccine] = useState<typeof VACCINE_CATALOG[0] | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    if (cat.id === "vaccines") return;
    if (cat.route) {
      onNavigate(cat.route as Page);
      return;
    }
    onNavigate("category" as any, cat.id);
  };

  const handleBookVaccine = (v: typeof VACCINE_CATALOG[0]) => {
    setSelectedVaccine(v);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex flex-col gap-5 sm:gap-8">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e4ede2] shadow-xs overflow-hidden">
          <KeyCategoriesBar
            selectedId="vaccines"
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-[#6d7a6f] px-1 font-medium">
          <button onClick={() => onNavigate("home")} className="hover:text-[#006a39] hover:underline cursor-pointer">
            Home
          </button>
          <span>/</span>
          <span className="font-bold text-[#073b4c]">Vaccines & Immunization</span>
        </div>

        {/* ── Hero Banner ── */}
        <div className="rounded-3xl bg-linear-to-r from-[#073b4c] via-[#0f766e] to-[#047857] p-6 sm:p-10 lg:p-14 text-white relative overflow-hidden shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[10px] sm:text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-xs border border-white/20 shadow-xs">
                💉 Certified Clinical Immunization
              </span>
              <span className="text-white/90 text-xs font-semibold">
                WHO & Drug Controller Approved
              </span>
            </div>

            <h1 className="font-['Manrope',sans-serif] font-black text-3xl sm:text-4xl lg:text-5xl leading-tight sm:leading-[1.15] text-white">
              Safe Vaccines & Home Immunization by Certified Nurses
            </h1>

            <p className="text-white/90 text-xs sm:text-base leading-relaxed max-w-xl font-normal">
              Book scheduled vaccinations for adults, children, and seniors. Guaranteed strict 2°C to 8°C cold-chain maintenance, single-use sterile supplies, and licensed healthcare nurse visits.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-white/90">
              <div className="flex items-center gap-1.5">
                <span className="text-[#82fde6] font-black text-base">✓</span>
                <span>2°C–8°C Cold-Chain Tracked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#82fde6] font-black text-base">✓</span>
                <span>Trained Phlebotomist Home Visit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#82fde6] font-black text-base">✓</span>
                <span>Digital Immunization Certificate</span>
              </div>
            </div>
          </div>

          {/* Quick Cold Chain Assurance Card */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col gap-3 shrink-0 z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#82fde6]">Cold Chain Guarantee</p>
            <p className="font-bold text-white text-base leading-snug">Monitored temperature logger inside every vaccine carrier</p>
            <p className="text-white/80 text-xs">Ensuring 100% biological potency and zero spoilage from warehouse to your doorstep.</p>
            <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/15 px-3 py-2 rounded-xl border border-white/20">
              <span>❄️ 2°C – 8°C Certified</span>
            </div>
          </div>
        </div>

        {/* ── Vaccine Catalog Section ── */}
        <section className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#006a39] uppercase tracking-wider">Clinical Formulations</span>
              <h2 className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c]">
                Available Scheduled Vaccines ({VACCINE_CATALOG.length})
              </h2>
            </div>
            {isRetailer && (
              <span className="bg-[#dbeafe] text-[#1e40af] text-xs font-bold px-3 py-1.5 rounded-xl self-start sm:self-auto">
                🏬 Wholesale Retailer Bulk Pricing Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {VACCINE_CATALOG.map((v) => {
              const currentPrice = isRetailer ? v.retailerPrice : v.price;

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e4ede2] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-5 group"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: v.color }}
                      >
                        {v.badge}
                      </span>
                      <span className="text-[11px] font-bold text-[#6d7a6f] bg-[#f0f4f0] px-2 py-0.5 rounded-full">
                        {v.dose}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-['Manrope',sans-serif] font-black text-base sm:text-lg text-[#073b4c] leading-snug group-hover:text-[#006a39] transition-colors">
                        {v.name}
                      </h3>
                      <p className="text-xs text-[#047857] font-semibold mt-0.5">Target: {v.target}</p>
                    </div>

                    <div className="bg-[#f8fafb] rounded-xl p-3 border border-[#f0f4f0] text-xs text-[#3e4a3f] flex flex-col gap-1">
                      <span className="font-bold text-[#073b4c] text-[11px]">Protects Against:</span>
                      <p className="text-[#6d7a6f] text-[11px] leading-relaxed">{v.protects}</p>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="border-t border-[#f0f4f0] pt-4 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-['Manrope',sans-serif] font-black text-xl text-[#073b4c]">
                          {currentPrice}
                        </span>
                        {v.orig && !isRetailer && (
                          <span className="text-xs text-[#9aa89b] line-through">{v.orig}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#047857] font-semibold">Includes Home Nurse Visit</span>
                    </div>

                    <button
                      onClick={() => handleBookVaccine(v)}
                      className="px-4 py-2.5 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white font-extrabold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      Book Vaccine
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Booking Modal ── */}
        {selectedVaccine && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#e4ede2] animate-in fade-in zoom-in-95">
              <div className="bg-linear-to-r from-[#073b4c] to-[#006a39] p-5 text-white relative">
                <button
                  onClick={() => {
                    setSelectedVaccine(null);
                    setBookingSuccess(false);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#82fde6]">Vaccination Appointment</span>
                <h3 className="font-['Manrope',sans-serif] font-black text-xl mt-1">{selectedVaccine.name}</h3>
                <p className="text-white/80 text-xs mt-0.5">Price: {isRetailer ? selectedVaccine.retailerPrice : selectedVaccine.price} (Inclusive of Cold-Chain & Nurse Visit)</p>
              </div>

              <div className="p-5 sm:p-6">
                {bookingSuccess ? (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                    <span className="text-4xl">💉</span>
                    <h4 className="font-bold text-[#047857] text-lg">Vaccination Slot Confirmed!</h4>
                    <p className="text-xs text-[#3e4a3f] leading-relaxed">
                      Booking Reference <strong>#VAC-{Math.floor(100000 + Math.random() * 900000)}</strong> has been booked for <strong>{patientName}</strong>. Our certified nurse will arrive with cold-chain carrier on the selected date.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedVaccine(null);
                        setBookingSuccess(false);
                      }}
                      className="mt-2 px-6 py-2.5 bg-[#006a39] text-white rounded-xl font-bold text-xs"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmBooking} className="flex flex-col gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Patient Full Name *</label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Subhasis Chakraborty"
                        className="w-full bg-[#f8fafb] border border-[#d5dcd3] rounded-xl px-3.5 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="e.g. 9836000000"
                          className="w-full bg-[#f8fafb] border border-[#d5dcd3] rounded-xl px-3.5 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Patient Age *</label>
                        <input
                          type="number"
                          required
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          placeholder="e.g. 28"
                          className="w-full bg-[#f8fafb] border border-[#d5dcd3] rounded-xl px-3.5 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Home Visit Address & Pincode *</label>
                      <input
                        type="text"
                        required
                        value={patientAddress}
                        onChange={(e) => setPatientAddress(e.target.value)}
                        placeholder="e.g. Flat 4B, Green Park, Kolkata 700001"
                        className="w-full bg-[#f8fafb] border border-[#d5dcd3] rounded-xl px-3.5 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Preferred Date *</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[#f8fafb] border border-[#d5dcd3] rounded-xl px-3.5 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#006a39] hover:bg-[#005a30] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer mt-1"
                    >
                      Confirm Home Vaccination Booking
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

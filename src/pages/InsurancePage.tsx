import { useState } from "react";
import type { Page } from "../App";
import KeyCategoriesBar, { KeyCategoryItem } from "../components/KeyCategoriesBar";

interface InsurancePageProps {
  userRole?: string;
  onNavigate: (page: Page, category?: string) => void;
}

export default function InsurancePage({ userRole = "retailer", onNavigate }: InsurancePageProps) {
  const isRetailer = userRole !== "admin";
  const [selectedPlan, setSelectedPlan] = useState<string>("retailer");
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimPolicy, setClaimPolicy] = useState("");
  const [claimBillAmount, setClaimBillAmount] = useState("");

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    if (cat.id === "insurance") return;
    if (cat.route) {
      onNavigate(cat.route as Page);
      return;
    }
    onNavigate("category" as any, cat.id);
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimName || !claimPhone) return;
    setClaimSubmitted(true);
  };

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex flex-col gap-5 sm:gap-8">

        {/* ── Key Categories Bar ── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e4ede2] shadow-xs overflow-hidden">
          <KeyCategoriesBar
            selectedId="insurance"
            onSelectCategory={handleSelectKeyCategory}
          />
        </div>

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs text-[#6d7a6f] px-1 font-medium">
          <button onClick={() => onNavigate("home")} className="hover:text-[#006a39] hover:underline cursor-pointer">
            Home
          </button>
          <span>/</span>
          <span className="font-bold text-[#073b4c]">Health & Pharmacy Insurance</span>
        </div>

        {/* ── Hero Banner ── */}
        <div className="rounded-3xl bg-linear-to-r from-[#073b4c] via-[#006a39] to-[#0f9d58] p-6 sm:p-10 lg:p-14 text-white relative overflow-hidden shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[10px] sm:text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-xs border border-white/20 shadow-xs">
                🛡️ SubhOne Care Shield
              </span>
              <span className="text-white/90 text-xs font-semibold">
                IRDAI Certified Partner Network
              </span>
            </div>

            <h1 className="font-['Manrope',sans-serif] font-black text-3xl sm:text-4xl lg:text-5xl leading-tight sm:leading-[1.15] text-white">
              100% Cashless Pharmacy & Family Health Insurance
            </h1>

            <p className="text-white/90 text-xs sm:text-base leading-relaxed max-w-xl font-normal">
              Never pay out-of-pocket for essential prescription medicines. Get zero-copay pharmacy coverage, free annual full-body diagnostic blood tests, and instant cashless reimbursements.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-white/90">
              <div className="flex items-center gap-1.5">
                <span className="text-[#82fde6] font-black text-base">✓</span>
                <span>Zero Copay on Medicines</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#82fde6] font-black text-base">✓</span>
                <span>Free Annual Lab Checkups</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#82fde6] font-black text-base">✓</span>
                <span>24-Hr Cashless Approval</span>
              </div>
            </div>
          </div>

          {/* Quick Enrol Card in Hero */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col gap-3 shrink-0 z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#82fde6]">Quick Coverage Check</p>
            <p className="font-bold text-white text-base leading-snug">Plans starting at just ₹499/year</p>
            <p className="text-white/80 text-xs">Protect your entire family from rising medicine bills with one simple plan.</p>
            <button
              onClick={() => {
                const el = document.getElementById("plans-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-white text-[#006a39] font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl hover:bg-[#eef7f0] transition-all text-center shadow-md active:scale-98 cursor-pointer mt-1"
            >
              View Protection Plans ↓
            </button>
          </div>
        </div>

        {/* ── Insurance Plans Grid ── */}
        <section id="plans-section" className="flex flex-col gap-5 pt-2">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#006a39] uppercase tracking-wider">Choose Your Plan</span>
            <h2 className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c]">
              Tailored Healthcare & Stock Protection
            </h2>
            <p className="text-xs sm:text-sm text-[#4a5568]">
              Select the plan that matches your healthcare needs or business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-3">
            {/* Plan 1: Essential Individual */}
            <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 transition-all flex flex-col justify-between gap-6 shadow-sm hover:shadow-xl ${selectedPlan === "individual" ? "border-[#006a39] ring-2 ring-[#006a39]/20" : "border-[#e4ede2]"}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-[#eef7f0] text-[#006a39] flex items-center justify-center text-xl font-bold">
                    👤
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f0f4f0] text-[#4a5568] px-2 py-0.5 rounded-full">Individual</span>
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-black text-xl text-[#073b4c]">Essential Care</h3>
                  <p className="text-xs text-[#6d7a6f] mt-0.5">Ideal for individuals & senior citizens</p>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-['Manrope',sans-serif] font-black text-3xl text-[#073b4c]">₹499</span>
                  <span className="text-xs text-[#9aa89b] font-medium">/ year</span>
                </div>

                <div className="border-t border-[#f0f4f0] pt-4 flex flex-col gap-2.5 text-xs text-[#3e4a3f]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Up to <strong>₹25,000</strong> Cashless Pharmacy Cover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span><strong>1 Free</strong> Annual Full-Body Blood Panel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Flat <strong>15% OFF</strong> on all OTC Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Instant Digital Health Card in App</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan("individual")}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${selectedPlan === "individual" ? "bg-[#006a39] text-white shadow-md" : "bg-[#f0f7f0] text-[#006a39] hover:bg-[#006a39] hover:text-white"}`}
              >
                {selectedPlan === "individual" ? "Selected Plan" : "Choose Essential Plan"}
              </button>
            </div>

            {/* Plan 2: Family Shield (Popular) */}
            <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 relative transition-all flex flex-col justify-between gap-6 shadow-md hover:shadow-xl ${selectedPlan === "family" ? "border-[#006a39] ring-4 ring-[#006a39]/20" : "border-[#006a39]/50"}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ba1a1a] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                ⭐ Most Popular
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center text-xl font-bold">
                    👨‍👩‍👧‍👦
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full">Up to 4 Members</span>
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-black text-xl text-[#073b4c]">Family Shield Pro</h3>
                  <p className="text-xs text-[#6d7a6f] mt-0.5">Complete family healthcare & diagnostic safety</p>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-['Manrope',sans-serif] font-black text-3xl text-[#073b4c]">₹999</span>
                  <span className="text-xs text-[#9aa89b] font-medium">/ year</span>
                </div>

                <div className="border-t border-[#f0f4f0] pt-4 flex flex-col gap-2.5 text-xs text-[#3e4a3f]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Up to <strong>₹75,000</strong> Cashless Pharmacy Cover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span><strong>4 Free</strong> Full-Body Health Checkups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Unlimited <strong>24/7 Doctor Tele-consultations</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Flat <strong>20% OFF</strong> on all Medicine Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#006a39] font-bold">✓</span>
                    <span>Zero Paperwork 1-Tap Claims Portal</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan("family")}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${selectedPlan === "family" ? "bg-[#006a39] text-white shadow-lg hover:bg-[#005a30]" : "bg-[#006a39] text-white"}`}
              >
                {selectedPlan === "family" ? "Selected Plan" : "Choose Family Shield"}
              </button>
            </div>

            {/* Plan 3: Retailer & Store Shield */}
            <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 transition-all flex flex-col justify-between gap-6 shadow-sm hover:shadow-xl ${selectedPlan === "retailer" ? "border-[#0369a1] ring-2 ring-[#0369a1]/20" : "border-[#e4ede2]"}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center text-xl font-bold">
                    🏬
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#dbeafe] text-[#1e40af] px-2 py-0.5 rounded-full">B2B Retailers</span>
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-black text-xl text-[#073b4c]">Retailer Business Shield</h3>
                  <p className="text-xs text-[#6d7a6f] mt-0.5">Wholesale store inventory & transit insurance</p>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-['Manrope',sans-serif] font-black text-3xl text-[#073b4c]">₹1,999</span>
                  <span className="text-xs text-[#9aa89b] font-medium">/ year</span>
                </div>

                <div className="border-t border-[#f0f4f0] pt-4 flex flex-col gap-2.5 text-xs text-[#3e4a3f]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0369a1] font-bold">✓</span>
                    <span>Up to <strong>₹5,00,000</strong> Store Inventory Insurance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0369a1] font-bold">✓</span>
                    <span><strong>100% In-Transit Damage Cover</strong> on Bulk Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0369a1] font-bold">✓</span>
                    <span>Fire, Water & Burglary Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0369a1] font-bold">✓</span>
                    <span>Priority B2B Credit Default Cover</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan("retailer")}
                className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${selectedPlan === "retailer" ? "bg-[#0369a1] text-white shadow-md" : "bg-[#f0f9ff] text-[#0369a1] hover:bg-[#0369a1] hover:text-white"}`}
              >
                {selectedPlan === "retailer" ? "Selected Plan" : "Choose Retailer Shield"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Instant Claim Filing Section ── */}
        <section className="bg-white rounded-3xl border border-[#e4ede2] p-6 sm:p-10 shadow-sm flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-lg">
            <span className="text-xs font-bold text-[#006a39] uppercase tracking-wider">Fast Cashless Portal</span>
            <h2 className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c]">
              Submit a Cashless Medicine Claim
            </h2>
            <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed">
              Already enrolled? File your pharmacy claim in seconds. Our automated clinical verification engine processes approvals within 24 hours directly to your verified UPI or bank account.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#eef7f0] text-[#006a39] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span className="text-xs text-[#3e4a3f]">Enter policy details and patient information</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#eef7f0] text-[#006a39] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span className="text-xs text-[#3e4a3f]">Attach your digital pharmacy invoice or doctor prescription</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#eef7f0] text-[#006a39] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span className="text-xs text-[#3e4a3f]">Receive instant cashless settlement verification</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="w-full lg:w-[440px] bg-[#f8fafb] rounded-2xl p-5 sm:p-6 border border-[#e4ede2] flex flex-col gap-4">
            {claimSubmitted ? (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-6 text-center flex flex-col items-center gap-2">
                <span className="text-3xl">🎉</span>
                <p className="font-bold text-[#047857] text-base">Claim Submitted Successfully!</p>
                <p className="text-xs text-[#3e4a3f]">
                  Claim Reference <strong>#SBH-CLM-{Math.floor(100000 + Math.random() * 900000)}</strong> has been registered. You will receive an SMS and WhatsApp confirmation shortly.
                </p>
                <button
                  onClick={() => setClaimSubmitted(false)}
                  className="mt-3 px-5 py-2 bg-[#006a39] text-white rounded-xl font-bold text-xs"
                >
                  Submit Another Claim
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitClaim} className="flex flex-col gap-3">
                <h3 className="font-bold text-[#073b4c] text-sm">Quick Claim Application</h3>

                <div>
                  <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    placeholder="e.g. Subhasis Chakraborty"
                    className="w-full bg-white border border-[#d5dcd3] rounded-xl px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      placeholder="e.g. 9836000000"
                      className="w-full bg-white border border-[#d5dcd3] rounded-xl px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Policy / Member ID</label>
                    <input
                      type="text"
                      value={claimPolicy}
                      onChange={(e) => setClaimPolicy(e.target.value)}
                      placeholder="e.g. SBH-99281"
                      className="w-full bg-white border border-[#d5dcd3] rounded-xl px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4a5568] mb-1">Pharmacy Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={claimBillAmount}
                    onChange={(e) => setClaimBillAmount(e.target.value)}
                    placeholder="e.g. 1450"
                    className="w-full bg-white border border-[#d5dcd3] rounded-xl px-3 py-2 text-xs text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#006a39] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:bg-[#005a30] transition-all cursor-pointer mt-1"
                >
                  Submit Cashless Claim
                </button>
              </form>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

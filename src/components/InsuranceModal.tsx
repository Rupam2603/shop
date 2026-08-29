import React from "react";

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRetailer?: boolean;
}

export default function InsuranceModal({
  isOpen,
  onClose,
  isRetailer = false,
}: InsuranceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col border border-[#e4ede2]">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#073b4c] via-[#006a39] to-[#0f9d58] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 text-white text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full shadow-2xs border border-white/20">
              🛡️ SubhOne Insurance
            </span>
            <span className="text-white/80 text-xs font-semibold">Health & Pharmacy Care Protection</span>
          </div>

          <h2 className="font-['Manrope',sans-serif] font-black text-xl sm:text-2xl leading-tight">
            {isRetailer ? "Retailer Business & Stock Insurance" : "Complete Family Health & Pharmacy Insurance"}
          </h2>
          <p className="text-white/80 text-xs mt-1.5 leading-relaxed">
            {isRetailer
              ? "Comprehensive transit insurance, fire & burglary cover, and credit risk protection for wholesale medical stores."
              : "Get 100% cashless pharmacy reimbursement, zero copay on genuine medicines, and free annual full-body checkups."}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 bg-[#fafcfa] text-[#073b4c]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#6d7a6f]">Key Coverage & Privileges</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: "🛡️",
                title: "100% Cashless Pharmacy",
                desc: "Direct settlement at SubhOne stores and partner medical networks.",
              },
              {
                icon: "🧪",
                title: "Free Annual Health Checkup",
                desc: "Includes 60+ parameters, lipid profile, CBC, and home sample collection.",
              },
              {
                icon: "⚡",
                title: "Instant 24-hr Claim Approval",
                desc: "Submit bills on WhatsApp or app for swift cashless reimbursement.",
              },
              {
                icon: "💊",
                title: isRetailer ? "B2B Credit & Loss Cover" : "Extra 10% Off All Medicines",
                desc: isRetailer ? "Coverage for transit damage & inventory expiration." : "Stackable discounts on all prescription & OTC wellness orders.",
              },
            ].map((b, i) => (
              <div key={i} className="p-3.5 bg-white rounded-2xl border border-[#e4ede2] flex items-start gap-3 shadow-2xs">
                <span className="text-xl shrink-0">{b.icon}</span>
                <div>
                  <h4 className="font-bold text-xs text-[#073b4c]">{b.title}</h4>
                  <p className="text-[11px] text-[#6d7a6f] mt-0.5 leading-snug">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Banner */}
          <div className="p-4 bg-[#e8f5ee] rounded-2xl border border-[#bbf7d0] flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-[#006a39] uppercase tracking-wider">SubhOne Circle Plan</p>
              <p className="text-base sm:text-lg font-black text-[#073b4c] mt-0.5">
                ₹{isRetailer ? "999/month" : "299/year"} <span className="text-xs font-normal text-[#6d7a6f]">per member</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                alert("Thank you for your interest in SubhOne Care Circle Insurance! An insurance representative will reach out to you within 15 minutes.");
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Get Circle Protection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useStoreSettings } from "../contexts/StoreSettingsContext";

function BotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v3" />
      <rect width="18" height="13" x="3" y="6" rx="4" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <path d="M10 15h4" />
      <path d="M2 13h1" />
      <path d="M21 13h1" />
    </svg>
  );
}

export default function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-white/70 backdrop-blur-2xl border-t border-white/80 mt-12 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        
        {/* Dedicated 24/7 Chatbot Feature Banner in Footer */}
        <div className="mb-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#006a39] via-[#037a41] to-[#047857] text-white shadow-xl shadow-emerald-950/15 border border-emerald-400/30 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 z-10 w-full md:w-auto">
            <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-md">
              <BotIcon className="w-8 h-8 text-white" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#006a39] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#006a39] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2.5 py-0.5 rounded-full">
                  ● 24/7 SubhOne AI & Care Desk
                </span>
              </div>
              <h4 className="font-['Manrope',sans-serif] font-black text-lg sm:text-xl text-white tracking-tight">
                Need Help? Chat with SubhOne Support Bot
              </h4>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl mt-0.5">
                Instant answers for medicine deliveries, prescription verification, live order tracking, and wholesale pharmacy supplies.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("subhone:open_support_chat"))}
            className="z-10 w-full md:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-[#006a39] font-['Manrope',sans-serif] font-extrabold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-white/60"
          >
            <BotIcon className="w-5 h-5 text-[#006a39]" />
            <span>Open Support Chatbot</span>
            <span className="text-xs">→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#006a39] to-[#00aa5b] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                +
              </div>
              <p className="font-['Manrope',sans-serif] font-black text-[#073b4c] text-2xl">
                {settings.storeName || "SubhOne"}
              </p>
            </div>
            <p className="text-[#596b5e] text-xs sm:text-sm leading-relaxed max-w-sm font-medium">
              Your trusted certified pharmacy partner for authentic medicines, fast deliveries, and expert healthcare consultations.
            </p>
            {settings.address && (
              <p className="text-[#596b5e] text-xs leading-relaxed mt-3.5 flex items-start gap-2 font-medium">
                <span>📍</span>
                <span>{settings.address}</span>
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <p className="font-extrabold text-[#073b4c] text-sm tracking-[0.7px] mb-3.5">
              Company
            </p>
            <ul className="space-y-2.5">
              {["About Us", "Careers", "Blog", "Our Pharmacists"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#596b5e] text-xs sm:text-sm font-medium hover:text-[#006a39] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-extrabold text-[#073b4c] text-sm tracking-[0.7px] mb-3.5">
              Legal & Compliance
            </p>
            <ul className="space-y-2.5">
              {["Terms of Service", "Privacy Policy", "Return Policy", "Pharmacy License"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[#596b5e] text-xs sm:text-sm font-medium hover:text-[#006a39] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Support & Contact Details */}
          <div>
            <p className="font-extrabold text-[#073b4c] text-sm tracking-[0.7px] mb-3.5">
              Support & Contact
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#596b5e]">
              <li className="pb-1">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("subhone:open_support_chat"))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-[#006a39] text-xs font-black transition-all cursor-pointer shadow-2xs group"
                >
                  <BotIcon className="w-4 h-4 text-[#006a39] transition-transform group-hover:scale-110" />
                  <span>24/7 Chatbot Assistant</span>
                  <span className="ml-auto text-[9px] bg-[#006a39] text-white px-2 py-0.5 rounded-full uppercase font-bold">Online</span>
                </button>
              </li>
              {settings.email && (
                <li className="flex items-center gap-2 font-medium">
                  <span>✉️</span>
                  <a href={`mailto:${settings.email}`} className="hover:text-[#006a39] transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("subhone:open_support_chat"));
                  }}
                  className="text-[#596b5e] font-medium hover:text-[#006a39] transition-colors"
                >
                  FAQs & Order Tracking
                </a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[11px] bg-emerald-50 text-[#006a39] border border-emerald-200 rounded-full px-3 py-0.5 font-bold shadow-2xs">
                ✓ 100% Genuine
              </span>
              <span className="text-[11px] bg-sky-50 text-[#0369a1] border border-sky-200 rounded-full px-3 py-0.5 font-bold shadow-2xs">
                ⚡ Express Dispatch
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e4ede2]/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8aa08e]">
          <p>© {new Date().getFullYear()} {settings.storeName || "SubhOne"} Healthcare. All rights reserved.</p>
          <p className="font-medium">Licensed Pharmacy · Fast & Safe Logistics</p>
        </div>
      </div>
    </footer>
  );
}

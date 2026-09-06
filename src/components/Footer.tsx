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
    <footer className="bg-white/75 backdrop-blur-2xl border-t border-slate-200/80 mt-12 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        
        {/* Dedicated 24/7 Chatbot Feature Banner in Footer */}
        <div className="mb-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white shadow-xl shadow-slate-950/15 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 z-10 w-full md:w-auto">
            <div className="relative w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-md">
              <BotIcon className="w-8 h-8 text-[#ff3366]" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff3366] border-2 border-slate-900 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff3366] border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-200 border border-rose-400/30 px-2.5 py-0.5 rounded-full">
                  ● 24/7 SubhOne AI & Care Desk
                </span>
              </div>
              <h4 className="font-['Manrope',sans-serif] font-black text-lg sm:text-xl text-white tracking-tight">
                Need Help? Chat with SubhOne Support Bot
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl mt-0.5 font-medium">
                Instant answers for medicine deliveries, prescription verification, live order tracking, and wholesale pharmacy supplies.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("subhone:open_support_chat"))}
            className="z-10 w-full md:w-auto px-6 py-3 rounded-2xl bg-[#ff3366] hover:bg-[#e62657] text-white font-['Manrope',sans-serif] font-extrabold text-sm transition-all shadow-lg hover:shadow-rose-600/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-white/20"
          >
            <BotIcon className="w-5 h-5 text-white" />
            <span>Open Support Chatbot</span>
            <span className="text-xs">→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/logo.png"
                alt="SubhOne Health Group"
                className="w-9 h-9 rounded-xl object-contain bg-white shadow-md p-0.5 shrink-0 border border-slate-200/90"
              />
              <p className="font-['Manrope',sans-serif] font-black text-slate-900 text-2xl">
                {settings.storeName || "SubhOne Health Group"}
              </p>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm font-medium">
              Your trusted certified pharmacy partner for authentic medicines, fast deliveries, and expert healthcare consultations.
            </p>
            {settings.address && (
              <p className="text-slate-500 text-xs leading-relaxed mt-3.5 flex items-start gap-2 font-medium">
                <span>📍</span>
                <span>{settings.address}</span>
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <p className="font-extrabold text-slate-900 text-sm tracking-[0.7px] mb-3.5">
              Company
            </p>
            <ul className="space-y-2.5">
              {["About Us", "Careers", "Blog", "Our Pharmacists"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-slate-500 text-xs sm:text-sm font-medium hover:text-[#ff3366] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-extrabold text-slate-900 text-sm tracking-[0.7px] mb-3.5">
              Legal & Compliance
            </p>
            <ul className="space-y-2.5">
              {["Terms of Service", "Privacy Policy", "Return Policy", "Pharmacy License"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-slate-500 text-xs sm:text-sm font-medium hover:text-[#ff3366] transition-colors"
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
            <p className="font-extrabold text-slate-900 text-sm tracking-[0.7px] mb-3.5">
              Support & Contact
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-500">
              <li className="pb-1">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("subhone:open_support_chat"))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-[#ff3366] text-xs font-black transition-all cursor-pointer shadow-2xs group"
                >
                  <BotIcon className="w-4 h-4 text-[#ff3366] transition-transform group-hover:scale-110" />
                  <span>24/7 Chatbot Assistant</span>
                  <span className="ml-auto text-[9px] bg-[#ff3366] text-white px-2 py-0.5 rounded-full uppercase font-bold">Online</span>
                </button>
              </li>
              {settings.email && (
                <li className="flex items-center gap-2 font-medium">
                  <span>✉️</span>
                  <a href={`mailto:${settings.email}`} className="hover:text-[#ff3366] transition-colors">
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
                  className="text-slate-500 font-medium hover:text-[#ff3366] transition-colors"
                >
                  FAQs & Order Tracking
                </a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-0.5 font-bold shadow-2xs">
                ✓ 100% Genuine
              </span>
              <span className="text-[11px] bg-rose-50 text-[#ff3366] border border-rose-200 rounded-full px-3 py-0.5 font-bold shadow-2xs">
                ⚡ Express Dispatch
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {settings.storeName || "SubhOne"} Healthcare. All rights reserved.</p>
          <p className="font-medium">Licensed Pharmacy · Fast & Safe Logistics</p>
        </div>
      </div>
    </footer>
  );
}

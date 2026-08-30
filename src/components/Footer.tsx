import { useStoreSettings } from "../contexts/StoreSettingsContext";

export default function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-white/70 backdrop-blur-2xl border-t border-white/80 mt-12 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
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
              {settings.phone && (
                <li className="flex items-center gap-2 font-bold text-[#073b4c]">
                  <span>📞</span>
                  <a href={`tel:${settings.phone}`} className="hover:text-[#006a39] transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
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

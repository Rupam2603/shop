import { useStoreSettings } from "../contexts/StoreSettingsContext";

export default function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-[#dee4db] border-t border-[#bdcabc] mt-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-['Manrope',sans-serif] font-extrabold text-[#171d18] text-2xl leading-8 mb-2">
              {settings.storeName || "SubhOne"}
            </p>
            <p className="text-[#3e4a3f] text-sm leading-relaxed max-w-sm">
              Your trusted partner for authentic medicines, fast deliveries, and
              expert healthcare consultations.
            </p>
            {settings.address && (
              <p className="text-[#5b6e5d] text-xs leading-relaxed mt-3 flex items-start gap-1.5 font-medium">
                <span>📍</span>
                <span>{settings.address}</span>
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <p className="font-bold text-[#073b4c] text-sm tracking-[0.7px] mb-3">
              Company
            </p>
            <ul className="space-y-2">
              {["About Us", "Careers", "Blog"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#3e4a3f] text-sm leading-5 hover:text-[#006a39] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-bold text-[#073b4c] text-sm tracking-[0.7px] mb-3">
              Legal
            </p>
            <ul className="space-y-2">
              {["Terms of Service", "Privacy Policy", "Return Policy"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[#3e4a3f] text-sm leading-5 hover:text-[#006a39] transition-colors"
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
            <p className="font-bold text-[#073b4c] text-sm tracking-[0.7px] mb-3">
              Support & Contact
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#3e4a3f]">
              {settings.phone && (
                <li className="flex items-center gap-1.5 font-semibold text-[#073b4c]">
                  <span>📞</span>
                  <a href={`tel:${settings.phone}`} className="hover:text-[#006a39] transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-1.5">
                  <span>✉️</span>
                  <a href={`mailto:${settings.email}`} className="hover:text-[#006a39] transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
              <li>
                <a
                  href="#"
                  className="text-[#3e4a3f] text-sm leading-5 hover:text-[#006a39] transition-colors"
                >
                  FAQs & Assistance
                </a>
              </li>
            </ul>
            <div className="flex gap-2 mt-4">
              <span className="text-xs border border-[#006a39] text-[#006a39] rounded px-2 py-0.5 font-medium">
                ✓ GENUINE
              </span>
              <span className="text-xs border border-[#006a39] text-[#006a39] rounded px-2 py-0.5 font-medium">
                🔒 SECURE
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#bdcabc] mt-8 pt-4 text-[#3e4a3f] text-xs sm:text-sm text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {settings.storeName || "SubhOne Health Group"}. All rights reserved.</p>
          <p className="text-xs text-[#6e8270]">Verified Healthcare E-Commerce Platform</p>
        </div>
      </div>
    </footer>
  );
}

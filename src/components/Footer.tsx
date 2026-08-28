export default function Footer() {
  return (
    <footer className="bg-[#dee4db] border-t border-[#bdcabc] mt-8">
      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <p
              className="font-['Manrope',sans-serif] font-extrabold text-[#171d18] text-2xl leading-8 mb-4"
            >
              SubhOne
            </p>
            <p className="text-[#3e4a3f] text-sm leading-5">
              Your trusted partner for authentic medicines, fast deliveries, and
              expert healthcare consultations.
            </p>
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

          {/* Support */}
          <div>
            <p className="font-bold text-[#073b4c] text-sm tracking-[0.7px] mb-3">
              Support
            </p>
            <ul className="space-y-2">
              {["Contact Support", "FAQs", "Shipping & Returns"].map((item) => (
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

        <div className="border-t border-[#bdcabc] mt-8 pt-4 text-[#3e4a3f] text-sm">
          © 2024 SubhOne Wellness. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

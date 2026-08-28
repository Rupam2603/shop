import imgLabTesting from "@/imports/LabTestsCheckupsSubhOne/95108217d5cffd6c578e7bce86ceab631910923e.png";

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 mt-0.5">
      <path d="M7.5 0C3.36 0 0 3.36 0 7.5C0 11.64 3.36 15 7.5 15C11.64 15 15 11.64 15 7.5C15 3.36 11.64 0 7.5 0ZM6 11.25L2.25 7.5L3.31 6.44L6 9.12L11.69 3.43L12.75 4.5L6 11.25Z" fill="#2D6A4F" />
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

const categoryIcons = [<LabIcon />, <PillIcon />, <GlucoseIcon />, <HeartIcon />];
const categories = ["Full Body Checkup", "Vitamins & Minerals", "Diabetes Screening", "Heart Health"];

const packages = [
  {
    badge: "BESTSELLER",
    badgeBg: "bg-[#00818a]",
    name: "Advanced Full Body Checkup",
    tests: "Includes 85 tests (CBC, Lipid, Thyroid, LFT, KFT)",
    features: ["Home sample collection", "Reports in 24 hours", "Free Doctor Consultation"],
    price: "$149",
    original: "$299",
    discount: "50% OFF",
    buttonVariant: "solid" as const,
  },
  {
    badge: "",
    badgeBg: "",
    name: "Essential Diabetic Care",
    tests: "Includes 32 tests (HbA1c, Fasting Blood Sugar, Lipid Profile)",
    features: ["Home sample collection", "Reports in 12 hours"],
    price: "$79",
    original: "$120",
    discount: "34% OFF",
    buttonVariant: "solid" as const,
  },
  {
    badge: "",
    badgeBg: "",
    name: "Women's Wellness Plus",
    tests: "Includes 65 tests (Iron, Vitamin D, B12, Thyroid, CBC)",
    features: ["Female Phlebotomists available", "Reports in 24 hours", "Dietitian Consultation"],
    price: "$129",
    original: "$250",
    discount: "48% OFF",
    buttonVariant: "outline" as const,
  },
];

const whyChoose = [
  { icon: <LabIcon />, title: "NABL Accredited Labs", desc: "Testing in state-of-the-art, certified laboratories ensuring 100% accuracy." },
  { icon: <svg width="21" height="24" viewBox="0 0 21 24" fill="none"><path d="M10.5 0L0 4.5V10.5C0 16.28 4.48 21.67 10.5 24C16.52 21.67 21 16.28 21 10.5V4.5L10.5 0ZM9 17.25L5.25 13.5L6.31 12.44L9 15.12L14.69 9.43L15.75 10.5L9 17.25Z" fill="#007F9A" /></svg>, title: "Free Home Collection", desc: "Trained professionals collect samples safely from your home." },
  { icon: <svg width="27" height="21" viewBox="0 0 27 21" fill="none"><path d="M13.5 0L0 5.25L13.5 10.5L27 5.25L13.5 0ZM0 8.75L13.5 14L27 8.75V13.5C27 17.09 20.96 20.25 13.5 20.25C6.04 20.25 0 17.09 0 13.5V8.75Z" fill="#007F9A" /></svg>, title: "Fast Digital Reports", desc: "Get smart, easy-to-understand reports on your app within 24 hours." },
  { icon: <svg width="21" height="27" viewBox="0 0 21 27" fill="none"><path d="M10.5 0L0 4.5V12C0 18.63 4.48 24.78 10.5 27C16.52 24.78 21 18.63 21 12V4.5L10.5 0ZM10.5 5.25L18.375 8.25V12C18.375 17.24 14.93 22.12 10.5 24.09C6.07 22.12 2.625 17.24 2.625 12V8.25L10.5 5.25Z" fill="#007F9A" /></svg>, title: "100% Secure Data", desc: "Your health records are encrypted and kept strictly confidential." },
];

export default function LabTestsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #f5fbf2 0%, #f5fbf2 100%)" }}
    >
      <div className="max-w-[1280px] mx-auto px-10 py-8 flex flex-col gap-8">

        {/* Hero */}
        <div className="bg-[#eff6ec] rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-8 gap-8 relative">
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ boxShadow: "0px 4px 6px -2px rgba(7,59,76,0.1)" }}
            />
            <div className="flex flex-col gap-4 flex-1 min-w-0 relative z-10">
              <div>
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-5xl leading-[56px] tracking-[-0.96px]">
                  Precision Diagnostics,
                </h1>
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-5xl leading-[56px] tracking-[-0.96px]">
                  Delivered Home.
                </h1>
              </div>
              <p className="text-[#3e4a3f] text-lg leading-7 max-w-[512px]">
                Book certified lab tests from the comfort of your home. Fast, accurate, and hygienic sample collection by trained professionals.
              </p>
              <div className="flex gap-4 pt-4">
                <button className="bg-[#006a39] text-white font-['Hanken_Grotesk',sans-serif] font-bold text-sm tracking-[0.7px] px-6 py-3 rounded-lg shadow-md hover:bg-[#005a30] transition-colors">
                  Book a Test Now
                </button>
                <button className="border border-[#073b4c] text-[#073b4c] font-['Hanken_Grotesk',sans-serif] font-bold text-sm tracking-[0.7px] px-6 py-3 rounded-lg hover:bg-[#073b4c] hover:text-white transition-colors">
                  Upload Prescription
                </button>
              </div>
            </div>
            <div
              className="flex-1 h-80 rounded-xl overflow-hidden shadow-md shrink-0 min-w-0 max-w-[420px]"
              style={{ boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)" }}
            >
              <img src={imgLabTesting} alt="Lab testing" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="flex flex-col gap-4">
          <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-3xl leading-10">
            Popular Categories
          </h2>
          <div className="grid grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className="bg-white rounded-lg border border-[#d5dcd3] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 p-[17px]"
              >
                <div className="bg-[#bde9ff] w-12 h-12 rounded-full flex items-center justify-center">
                  {categoryIcons[i]}
                </div>
                <span className="font-bold text-[#073b4c] text-sm tracking-[0.7px] text-center">
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Health Packages */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-3xl leading-10">
              Comprehensive Health Packages
            </h2>
            <button className="font-bold text-[#006a39] text-sm tracking-[0.7px] hover:underline">
              View All Packages
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="bg-white rounded-xl border border-[#d5dcd3] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                style={{ boxShadow: "0px 4px 6px -2px rgba(7,59,76,0.1)" }}
              >
                <div className="bg-[#e9f0e7] p-4 border-b border-[#d5dcd3]">
                  {pkg.badge && (
                    <span className={`${pkg.badgeBg} text-white text-[10px] uppercase px-2 py-1 rounded-full mb-2 inline-block`}>
                      {pkg.badge}
                    </span>
                  )}
                  {!pkg.badge && <div className="h-6" />}
                  <h3 className="font-['Manrope',sans-serif] font-semibold text-[#073b4c] text-2xl leading-8 mt-1">
                    {pkg.name}
                  </h3>
                  <p className="text-[#3e4a3f] text-sm leading-5 mt-1">{pkg.tests}</p>
                </div>
                <div className="p-4 flex flex-col justify-between flex-1 gap-4">
                  <ul className="flex flex-col gap-2">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#171d18] leading-5">
                        <CheckCircleIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl leading-6">{pkg.price}</span>
                      <span className="text-[#6d7a6f] text-sm line-through">{pkg.original}</span>
                      <span className="bg-[#e3eae1] text-[#2d6a4f] text-xs px-2 py-0.5 rounded">
                        {pkg.discount}
                      </span>
                    </div>
                    <button
                      className={`w-full py-3 rounded-lg font-bold text-sm tracking-[0.7px] transition-colors ${
                        pkg.buttonVariant === "solid"
                          ? "bg-[#006a39] text-white hover:bg-[#005a30]"
                          : "border border-[#006a39] text-[#006a39] hover:bg-[#006a39] hover:text-white"
                      }`}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose SubhOne */}
        <div className="bg-[#f8fafb] rounded-xl border border-[#d5dcd3] p-8 flex flex-col gap-8">
          <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-3xl leading-10 text-center">
            Why Choose SubhOne Labs
          </h2>
          <div className="grid grid-cols-4 gap-8">
            {whyChoose.map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <div className="bg-[#bde9ff] w-16 h-16 rounded-full flex items-center justify-center mb-2">
                  {item.icon}
                </div>
                <h4 className="font-['Manrope',sans-serif] font-semibold text-[#073b4c] text-xl text-center leading-8">
                  {item.title}
                </h4>
                <p className="text-[#3e4a3f] text-sm leading-5 text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

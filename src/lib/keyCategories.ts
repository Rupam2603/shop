export interface KeyCategoryMeta {
  id: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  accent: string;
  lightBg: string;
  iconBg: string;
  badge?: string;
  route?: string;
  filterFn?: (product: { name: string; sub?: string; cat: string; disc?: string; price?: string }) => boolean;
}

/**
 * Canonical product categories matching the Key Categories showcased across the storefront
 * for both retail customers and wholesale retailers.
 */
export const KEY_PRODUCT_CATEGORIES = [
  "Skin Care & Ointments",
  "Pain Relief & Muscle Care",
  "Weight Loss & Metabolism",
  "Daily Wellness & Immunity",
  "Monsoon Health & Antiseptics",
  "Baby Care & Infant Nutrition",
  "Women's Health & Hygiene",
  "Men's Health & Vitality",
  "Diet & Digestive Health",
  "Hair Care & Scalp Therapy",
  "Vaccines & Medical Disposables",
  "Medical Supplies & Devices",
] as const;

export type KeyProductCategory = typeof KEY_PRODUCT_CATEGORIES[number];

export const KEY_CATEGORIES_CONFIG: KeyCategoryMeta[] = [
  {
    id: "all",
    name: "All Products & Essentials",
    short: "All",
    tagline: "Explore our complete verified pharmacy & medical supplies catalog",
    description: "Browse 85+ genuine OTC medicines, prescription healthcare, clinical supplies, and wellness essentials with real-time stock and 30-min express delivery.",
    accent: "#006a39",
    lightBg: "#eef7f0",
    iconBg: "#bbf7d0",
    filterFn: () => true,
  },
  {
    id: "skin",
    name: "Skin Care & Ointments",
    short: "Skin",
    tagline: "Dermatologist-tested skincare, prickly heat powders & healing creams",
    description: "Treat fungal infections, rashes, sunburns, and dry skin with proven therapeutic creams, antiseptic solutions, and cooling powders from Candid, Boroline, Ring Guard, and Nycil.",
    accent: "#7c3aed",
    lightBg: "#f5f3ff",
    iconBg: "#ddd6fe",
    filterFn: (p) =>
      p.cat.includes("Skin") ||
      /cream|powder|ointment|antifungal|gel|boroline|salical|b-tex|ring guard|itch guard|nycil|candid/i.test(
        p.name + " " + (p.sub || "")
      ),
  },
  {
    id: "pain-relief",
    name: "Pain Relief & Muscle Care",
    short: "Pain Relief",
    tagline: "Instant pain relief balms, joint gels & muscular sprays",
    description: "Target aches, sprains, joint stiffness, and inflammation with Volini, Amrutanjan, Moov, and fast-acting analgesic remedies.",
    accent: "#c0392b",
    lightBg: "#fff0ee",
    iconBg: "#ffd5cf",
    filterFn: (p) =>
      p.cat.includes("Pain") ||
      /pain|balm|volini|amrutanjan|spray|gel|sprain|muscle|joint|ache|moov|fast relief/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "weight-loss",
    name: "Weight Loss & Metabolism",
    short: "Weight Loss",
    tagline: "Nutritional metabolism boosters, dietary fibers & sugar substitutes",
    description: "Achieve healthy weight goals safely with Sugar Free Gold calorie-control sweeteners, Baidya Isabgol husk, Softovac SF digestion fibers, and natural detox tonics.",
    accent: "#ea580c",
    lightBg: "#fff7ed",
    iconBg: "#fed7aa",
    filterFn: (p) =>
      /sugar free|isabgol|softovac|weight|slimming|supplement|diet|chyawanprash|fiber|fitness/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "wellness",
    name: "Daily Wellness & Immunity",
    short: "Wellness",
    tagline: "Ayurvedic stamina tonics, rehydration salts & vital supplements",
    description: "Strengthen respiratory immunity and physical vitality with Dabur Chyawanprash, 100% Pure Natural Honey, Glucon-D energy jars, and Cipla ORS electrolyte solutions.",
    accent: "#d97706",
    lightBg: "#fffbeb",
    iconBg: "#fde68a",
    filterFn: (p) =>
      p.cat.includes("Wellness") ||
      p.cat.includes("Immunity") ||
      p.cat.includes("Energy") ||
      /wellness|chyawanprash|honey|ors|glucon|tonic|ayurvedic|immunity|glucose/i.test(
        p.name + " " + (p.sub || "")
      ),
  },
  {
    id: "monsoon",
    name: "Monsoon Health & Antiseptics",
    short: "Monsoon",
    tagline: "Rainy season infection defense, waterproof band-aids & cold relief",
    description: "Protect against water-borne microbes, prickly heat, and sudden viral flu with Dettol antiseptic liquids, Hansaplast washproof bandages, Suthol neem sprays, and Vicks lozenges.",
    accent: "#0891b2",
    lightBg: "#ecfeff",
    iconBg: "#a5f3fc",
    filterFn: (p) =>
      p.cat.includes("Monsoon") ||
      p.cat.includes("Antiseptic") ||
      p.cat.includes("First Aid") ||
      /dettol|antiseptic|hansaplast|suthol|dusting|candid|cough|vicks|boroline|bandage|washproof/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "baby",
    name: "Baby Care & Infant Nutrition",
    short: "Baby",
    tagline: "BPA-free feeding bottles, silicone nipples & gentle baby nutrition",
    description: "Pediatrician-approved baby essentials including Morisons feeding bottles, anti-colic silicone nipples, infant formula, and soothing massage body oils.",
    accent: "#0284c7",
    lightBg: "#f0f9ff",
    iconBg: "#bae6fd",
    filterFn: (p) =>
      p.cat.includes("Baby") || /baby|nipple|bottle|infant|dexolac/i.test(p.name + " " + (p.sub || "")),
  },
  {
    id: "women",
    name: "Women's Health & Hygiene",
    short: "Women",
    tagline: "Intimate care washes, hair removal creams & nourishing oils",
    description: "Specialized female personal hygiene with V Wash Plus pH-balanced washes, Veet gentle hair removal, moisturizing Jac body oils, and prenatal multivitamins.",
    accent: "#db2777",
    lightBg: "#fdf2f8",
    iconBg: "#fbcfe8",
    filterFn: (p) =>
      p.cat.includes("Women") ||
      p.cat.includes("Personal Care") ||
      p.cat.includes("Hygiene") ||
      /v wash|veet|hair remover|body oil|intimate|women|hygiene|skincare|boroline|moistur/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "men",
    name: "Men's Health & Vitality",
    short: "Men",
    tagline: "Fast muscle relief sprays, stamina boosters & daily grooming",
    description: "Relieve workout sprains and backaches instantly with Volini and Amrutanjan sprays, plus daily grooming essentials and vitality glucose fuels.",
    accent: "#0f766e",
    lightBg: "#f0fdfa",
    iconBg: "#99f6e4",
    filterFn: (p) =>
      p.cat.includes("Men") ||
      /balm|volini|amrutanjan|energy|glucon|pain relief|oil|soap|sanitizer|spray|moov/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "diet",
    name: "Diet & Digestive Health",
    short: "Diet",
    tagline: "Fast antacids, herbal laxatives & natural dietary fiber",
    description: "Instant relief from acidity, gas, and constipation with Eno fruit salt sachets, Softovac SF powder, Pet Safa, Kayam Churna, and Baidya Isabgol.",
    accent: "#16a34a",
    lightBg: "#f0fdf4",
    iconBg: "#bbf7d0",
    filterFn: (p) =>
      p.cat.includes("Diet") ||
      p.cat.includes("Digest") ||
      p.cat.includes("Antacid") ||
      p.cat.includes("Laxative") ||
      /eno|sugar free|isabgol|softovac|pet safa|honey|ors|laxative|churna|nityam/i.test(
        p.name + " " + (p.sub || "")
      ),
  },
  {
    id: "hair",
    name: "Hair Care & Scalp Therapy",
    short: "Hair",
    tagline: "Natural herbal oils, anti-dandruff treatments & root nutrition",
    description: "Promote thick hair growth and prevent breakage with Love Nature cold-pressed herbal hair oils, vitamin-infused scalp tonics, and deep-conditioning oils.",
    accent: "#9333ea",
    lightBg: "#faf5ff",
    iconBg: "#e9d5ff",
    filterFn: (p) =>
      p.cat.includes("Hair") ||
      /hair|oil|love nature|scalp|shampoo|dandruff|body oil|jac/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "medical-supplies",
    name: "Medical Supplies & Devices",
    short: "Medical Supplies",
    tagline: "Clinical diagnostics, surgical disposables & health monitors",
    description: "Hospital-grade home clinical equipment including digital thermometers, pulse oximeters, blood pressure monitors, glucose meters, sterile dressings, and surgical gloves.",
    accent: "#374151",
    lightBg: "#f8fafc",
    iconBg: "#e2e8f0",
    filterFn: (p) =>
      p.cat.includes("Medical") ||
      p.cat.includes("Supplies") ||
      p.cat.includes("Device") ||
      /thermometer|oximeter|monitor|cuff|glove|mask|disposable|bandage|syringe|needle|device/i.test(
        p.name + " " + (p.sub || "") + " " + p.cat
      ),
  },
  {
    id: "insurance",
    name: "Health & Pharmacy Insurance",
    short: "Insurance",
    tagline: "100% cashless medicine reimbursement & comprehensive family coverage",
    description: "SubhOne Health Protection guarantees zero copay on all genuine pharmacy orders, free annual full-body blood panels, and instant 24-hr claim approvals.",
    accent: "#0284c7",
    lightBg: "#f0f9ff",
    iconBg: "#bae6fd",
    route: "insurance",
    filterFn: () => true,
  },
  {
    id: "checkups",
    name: "Full Body Health Checkups",
    short: "Checkups",
    tagline: "Certified NABL lab diagnostics with free home sample collection",
    description: "Book advanced pathology tests including Complete Blood Count (CBC), Lipid Profile, Diabetes HbA1c, Liver Function (LFT), Thyroid Profile, and Vitamin panels.",
    accent: "#059669",
    lightBg: "#ecfdf5",
    iconBg: "#a7f3d0",
    route: "lab-tests",
    filterFn: () => true,
  },
  {
    id: "50-off",
    name: "Super Saver Deals & 50% OFF",
    short: "50% OFF",
    tagline: "Maximum value on high-demand healthcare and bulk supply packages",
    description: "Exclusive clearance discounts, wholesale bonus bundles, and seasonal offers with up to 50%+ off across top pharmaceutical brands.",
    accent: "#ba1a1a",
    lightBg: "#fef2f2",
    iconBg: "#fecaca",
    route: "offers",
    filterFn: (p) => parseInt(p.disc || "0") >= 20,
  },
  {
    id: "vaccines",
    name: "Vaccines & Immunization Services",
    short: "Vaccines",
    tagline: "Certified Cold-Chain Vaccines & Safe Home Immunization",
    description: "Book adult & pediatric vaccines with 2°C–8°C strict cold-chain tracking and licensed nurse visits for Flu, HPV, Hepatitis B, Tetanus, Typhoid, and Pneumonia.",
    accent: "#0f766e",
    lightBg: "#f0fdfa",
    iconBg: "#99f6e4",
    route: "vaccines",
    filterFn: (p) =>
      p.cat.includes("Vaccine") ||
      /vaccine|immuniz|injection|syringe|needle/i.test(p.name + " " + (p.sub || "") + " " + p.cat),
  },
];

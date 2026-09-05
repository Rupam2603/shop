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

/**
 * Mapping from category ID to canonical Category Name
 */
export const KEY_CATEGORY_MAP: Record<string, string> = {
  skin: "Skin Care & Ointments",
  "pain-relief": "Pain Relief & Muscle Care",
  "weight-loss": "Weight Loss & Metabolism",
  wellness: "Daily Wellness & Immunity",
  monsoon: "Monsoon Health & Antiseptics",
  baby: "Baby Care & Infant Nutrition",
  women: "Women's Health & Hygiene",
  men: "Men's Health & Vitality",
  diet: "Diet & Digestive Health",
  hair: "Hair Care & Scalp Therapy",
  vaccines: "Vaccines & Medical Disposables",
  "medical-supplies": "Medical Supplies & Devices",
};

/**
 * Robust check to see if a product belongs strictly to the targeted key category.
 * Prevents products from leaking into other categories due to arbitrary keywords in names/descriptions.
 */
export function isProductInCategory(productCat?: string, targetCatIdOrName?: string): boolean {
  if (!productCat || !targetCatIdOrName) return false;
  const pCat = productCat.trim().toLowerCase();
  const target = targetCatIdOrName.trim().toLowerCase();

  // "all" matches every product
  if (target === "all") return true;

  const canonicalName = (KEY_CATEGORY_MAP[target] || targetCatIdOrName).trim().toLowerCase();

  // 1. Exact matches (either to the ID or canonical name)
  if (pCat === canonicalName || pCat === target) return true;

  // 2. Strict prefix/component checks to allow legacy slight variations while preventing cross-leakage
  if (target === "skin" || canonicalName.startsWith("skin")) {
    return pCat.startsWith("skin");
  }
  if (target === "pain-relief" || canonicalName.startsWith("pain")) {
    return pCat.startsWith("pain");
  }
  if (target === "weight-loss" || canonicalName.startsWith("weight")) {
    return pCat.startsWith("weight");
  }
  if (target === "wellness" || canonicalName.includes("wellness") || canonicalName.includes("immunity")) {
    return pCat.includes("wellness") || pCat.includes("immunity") || pCat === "energy, hydration & supplements";
  }
  if (target === "monsoon" || canonicalName.startsWith("monsoon")) {
    return pCat.startsWith("monsoon");
  }
  if (target === "baby" || canonicalName.startsWith("baby")) {
    return pCat.startsWith("baby");
  }
  if (target === "women" || canonicalName.startsWith("women")) {
    return pCat.startsWith("women");
  }
  if (target === "men" || canonicalName.startsWith("men")) {
    return pCat.startsWith("men");
  }
  if (target === "diet" || canonicalName.startsWith("diet") || canonicalName.includes("digest")) {
    return pCat.startsWith("diet") || pCat.includes("digest");
  }
  if (target === "hair" || canonicalName.startsWith("hair")) {
    return pCat.startsWith("hair");
  }
  if (target === "vaccines" || canonicalName.startsWith("vaccine")) {
    return pCat.startsWith("vaccine");
  }
  if (target === "medical-supplies" || canonicalName.startsWith("medical supplies")) {
    return pCat.startsWith("medical supplies") || pCat.includes("devices");
  }

  return false;
}

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
    filterFn: (p) => isProductInCategory(p.cat, "skin"),
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
    filterFn: (p) => isProductInCategory(p.cat, "pain-relief"),
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
    filterFn: (p) => isProductInCategory(p.cat, "weight-loss"),
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
    filterFn: (p) => isProductInCategory(p.cat, "wellness"),
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
    filterFn: (p) => isProductInCategory(p.cat, "monsoon"),
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
    filterFn: (p) => isProductInCategory(p.cat, "baby"),
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
    filterFn: (p) => isProductInCategory(p.cat, "women"),
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
    filterFn: (p) => isProductInCategory(p.cat, "men"),
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
    filterFn: (p) => isProductInCategory(p.cat, "diet"),
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
    filterFn: (p) => isProductInCategory(p.cat, "hair"),
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
    filterFn: (p) => isProductInCategory(p.cat, "medical-supplies"),
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
    short: "Vaccine",
    tagline: "Certified Cold-Chain Vaccines & Safe Home Immunization",
    description: "Book adult & pediatric vaccines with 2°C–8°C strict cold-chain tracking and licensed nurse visits for Flu, HPV, Hepatitis B, Tetanus, Typhoid, and Pneumonia.",
    accent: "#0f766e",
    lightBg: "#f0fdfa",
    iconBg: "#99f6e4",
    route: "vaccines",
    filterFn: (p) => isProductInCategory(p.cat, "vaccines"),
  },
];

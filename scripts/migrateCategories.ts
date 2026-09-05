import "dotenv/config";
import { createCategory as dbCreateCategory } from "../src/lib/categories";
import { KEY_PRODUCT_CATEGORIES } from "../src/lib/keyCategories";

const INITIAL_CATEGORIES: string[] = [
  ...KEY_PRODUCT_CATEGORIES,
  "Skin Care, Powders & Ointments",
  "Pain Relief & Balms",
  "Energy, Hydration & Supplements",
  "First Aid & Antiseptics",
  "Antacids, Digestion & Laxatives",
  "Personal Care, Hygiene & Others",
  "Baby Care",
  "Medical Supplies & General",
  "Health & Pharmacy Insurance",
  "Full Body Health Checkups",
];

const CAT_HSN: Record<string, string> = {
  "Skin Care & Ointments": "3304",
  "Pain Relief & Muscle Care": "3004",
  "Weight Loss & Metabolism": "2106",
  "Daily Wellness & Immunity": "2106",
  "Monsoon Health & Antiseptics": "3808",
  "Baby Care & Infant Nutrition": "3924",
  "Women's Health & Hygiene": "3305",
  "Men's Health & Vitality": "3004",
  "Diet & Digestive Health": "3004",
  "Hair Care & Scalp Therapy": "3305",
  "Vaccines & Medical Disposables": "3002",
  "Medical Supplies & Devices": "9018",
  "Skin Care, Powders & Ointments": "3304",
  "Pain Relief & Balms": "3004",
  "Energy, Hydration & Supplements": "2106",
  "First Aid & Antiseptics": "3808",
  "Antacids, Digestion & Laxatives": "3004",
  "Personal Care, Hygiene & Others": "3305",
  "Baby Care": "3924",
  "Medical Supplies & General": "9018",
  "Health & Pharmacy Insurance": "9971",
  "Full Body Health Checkups": "9971",
};

async function migrate() {
  console.log("Migrating categories...");
  for (const catName of INITIAL_CATEGORIES) {
    const hsn = CAT_HSN[catName] || "3004";
    const res = await dbCreateCategory(catName, hsn);
    if (res.data) {
      console.log(`Created: ${catName} (HSN: ${hsn})`);
    } else {
      console.log(`Failed or exists: ${catName} - ${res.error}`);
    }
  }
  console.log("Migration complete.");
}

migrate();

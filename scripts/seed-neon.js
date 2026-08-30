import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function seed() {
  console.log("Seeding Neon database with catalog items...");

  const sampleProducts = [
    {
      numeric_id: 1,
      name: "Volini Pain Relief Gel 15g",
      subtitle: "Fast Pain Relief Gel",
      category_name: "Pain Relief & Balms",
      brand: "Volini",
      mrp: 15,
      customer_price: 11,
      retailer_price: 9,
      discount_percent: 27,
      stock: 120,
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      is_featured: true,
    },
    {
      numeric_id: 2,
      name: "Amrutanjan Strong Pain Balm 44g",
      subtitle: "Headache & Back Pain",
      category_name: "Pain Relief & Balms",
      brand: "Amrutanjan",
      mrp: 44,
      customer_price: 36,
      retailer_price: 30,
      discount_percent: 18,
      stock: 85,
      image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80",
      is_featured: true,
    },
    {
      numeric_id: 3,
      name: "Dettol Antiseptic Liquid 250ml",
      subtitle: "First Aid Antiseptic",
      category_name: "First Aid & Antiseptics",
      brand: "Dettol",
      mrp: 155,
      customer_price: 131,
      retailer_price: 110,
      discount_percent: 15,
      stock: 200,
      image_url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80",
      is_featured: true,
    },
    {
      numeric_id: 4,
      name: "Glucon-D Instant Energy Orange 400g",
      subtitle: "Glucose Energy Drink",
      category_name: "Energy, Hydration & Supplements",
      brand: "Glucon-D",
      mrp: 173,
      customer_price: 138,
      retailer_price: 115,
      discount_percent: 20,
      stock: 95,
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      is_featured: true,
    },
    {
      numeric_id: 5,
      name: "Eno Lemon Fast Action Sachet 5g",
      subtitle: "Acidity Relief in 6 Seconds",
      category_name: "Antacids, Digestion & Laxatives",
      brand: "Eno",
      mrp: 9,
      customer_price: 7.5,
      retailer_price: 6.5,
      discount_percent: 17,
      stock: 350,
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      is_featured: true,
    },
    {
      numeric_id: 6,
      name: "Dabur Honey 100% Pure 250g",
      subtitle: "Natural Health & Immunity Booster",
      category_name: "Energy, Hydration & Supplements",
      brand: "Dabur",
      mrp: 125,
      customer_price: 105,
      retailer_price: 88,
      discount_percent: 16,
      stock: 140,
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      is_featured: true,
    },
  ];

  for (const p of sampleProducts) {
    await sql.query(
      `INSERT INTO public.products (numeric_id, name, subtitle, category_name, brand, mrp, customer_price, retailer_price, discount_percent, stock, image_url, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (numeric_id) DO UPDATE SET stock = $10, customer_price = $7, retailer_price = $8`,
      [
        p.numeric_id,
        p.name,
        p.subtitle,
        p.category_name,
        p.brand,
        p.mrp,
        p.customer_price,
        p.retailer_price,
        p.discount_percent,
        p.stock,
        p.image_url,
        p.is_featured,
      ]
    );
  }

  // Seed sample lab packages
  const packages = [
    {
      id: "pkg-1",
      name: "Advanced Full Body Checkup",
      category: "Full Body Checkup",
      badge: "BESTSELLER",
      tests_count: 85,
      tests_summary: "Includes 85 tests (CBC, Lipid, Thyroid, LFT, KFT, Blood Sugar, Urine RE)",
      included_tests: JSON.stringify([
        "Complete Blood Count (CBC - 24 parameters)",
        "Lipid Profile (Cholesterol, HDL, LDL, Triglycerides)",
        "Liver Function Test (SGOT, SGPT, Bilirubin, Albumin)",
        "Kidney Function Test (Creatinine, Urea, Uric Acid)",
        "Thyroid Profile (T3, T4, TSH)",
        "Fasting Blood Sugar",
        "Urine Routine & Microscopy",
      ]),
      features: JSON.stringify(["Home sample collection", "Reports in 24 hours", "Free Doctor Consultation"]),
      mrp: 1999,
      price: 999,
      discount_percent: 50,
      fasting_required: true,
      fasting_hours: 10,
    },
    {
      id: "pkg-2",
      name: "Essential Diabetic Care",
      category: "Diabetes Screening",
      badge: "POPULAR",
      tests_count: 32,
      tests_summary: "Includes 32 tests (HbA1c Glycated Hemoglobin, Fasting Blood Sugar, Lipid Profile)",
      included_tests: JSON.stringify([
        "HbA1c (Glycated Hemoglobin)",
        "Estimated Average Glucose (eAG)",
        "Fasting Blood Glucose",
        "Lipid Profile Basic",
        "Microalbuminuria Urine Test",
      ]),
      features: JSON.stringify(["Home sample collection", "Reports in 12 hours", "Dietary Guidance Chart Included"]),
      mrp: 999,
      price: 499,
      discount_percent: 50,
      fasting_required: true,
      fasting_hours: 10,
    },
  ];

  for (const pkg of packages) {
    await sql.query(
      `INSERT INTO public.lab_packages (id, name, category, badge, tests_count, tests_summary, included_tests, features, mrp, price, discount_percent, fasting_required, fasting_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING`,
      [
        pkg.id,
        pkg.name,
        pkg.category,
        pkg.badge,
        pkg.tests_count,
        pkg.tests_summary,
        pkg.included_tests,
        pkg.features,
        pkg.mrp,
        pkg.price,
        pkg.discount_percent,
        pkg.fasting_required,
        pkg.fasting_hours,
      ]
    );
  }

  console.log("Seeding completed successfully in Neon!");
}

seed().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});

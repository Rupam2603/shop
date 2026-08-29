import React, { useState, useMemo, useRef, useEffect } from "react";
import type { CurrentUser } from "../App";
import { supabase } from "../lib/supabase";
import {
  fetchProducts,
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  updateProductStock as dbUpdateStock,
  subscribeToProductsRealtime,
} from "../lib/products";
import {
  fetchAllOrders,
  updateOrderStatus as dbUpdateOrderStatus,
  deleteOrder as dbDeleteOrder,
  getDeletedOrderIds,
  markOrderAsDeletedLocally,
  DbOrder,
} from "../lib/orders";
import { fetchAllLabBookings, updateLabBookingStatus as dbUpdateLabBookingStatus, DbLabBooking } from "../lib/labTests";
import {
  fetchAllRetailers,
  updateRetailerApprovalStatus,
  RetailerAccount,
} from "../lib/retailers";
import {
  printOrDownloadInvoice,
  downloadInvoiceFile,
  printOrDownloadDailyReport,
  downloadDailyReportFile,
  generateInvoiceHtml,
  generateDailyReportHtml,
  InvoiceOrderData,
} from "../lib/invoiceGenerator";

interface Props {
  user: CurrentUser;
  onLogout: () => void;
}

type AdminTab = "dashboard" | "products" | "inventory" | "orders" | "retailers" | "lab-tests" | "revenue" | "settings";

export type ProductBadge = {
  id: string;
  name: string;
  checked: boolean;
};

export const DEFAULT_PRODUCT_BADGES: ProductBadge[] = [
  { id: "featured", name: "Featured Product", checked: true },
  { id: "rx", name: "Prescription Required (Rx)", checked: false },
  { id: "cold-chain", name: "Cold-Chain Storage (2°C - 8°C)", checked: false },
  { id: "bestseller", name: "Best Seller", checked: false },
  { id: "genuine", name: "100% Genuine Guaranteed", checked: true },
  { id: "fast-delivery", name: "30-Min Fast Delivery", checked: true },
  { id: "flash-deal", name: "Flash Sale Deal", checked: false },
  { id: "bulk-discount", name: "Wholesale Bulk Pack", checked: false },
];

type Product = {
  id: number;
  dbId?: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  hsn: string;
  mrp: number;
  customerPrice: number;
  retailerPrice: number;
  stock: number;
  image?: string;
  details?: string;
  badges?: ProductBadge[];
};

type Settings = {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  lowThreshold: string;
  defaultDisc: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  autoReorder: boolean;
};

const INITIAL_CATEGORIES = [
  "Skin Care, Powders & Ointments",
  "Weight Loss & Metabolism",
  "Daily Wellness & Immunity",
  "Monsoon Health & Antiseptics",
  "Baby Care & Infant Nutrition",
  "Women's Health & Hygiene",
  "Men's Health & Vitality",
  "Vaccines & Medical Disposables",
  "Diet & Digestive Health",
  "Hair Care & Scalp Therapy",
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
  "Skin Care, Powders & Ointments": "3304",
  "Skin Care & Ointments": "3304",
  "Weight Loss & Metabolism": "2106",
  "Daily Wellness & Immunity": "2106",
  "Monsoon Health & Antiseptics": "3808",
  "Baby Care & Infant Nutrition": "3924",
  "Women's Health & Hygiene": "3305",
  "Men's Health & Vitality": "3004",
  "Vaccines & Medical Disposables": "3002",
  "Diet & Digestive Health": "3004",
  "Hair Care & Scalp Therapy": "3305",
  "Pain Relief & Balms": "3004",
  "Energy, Hydration & Supplements": "2106",
  "First Aid & Antiseptics": "3808",
  "Antacids, Digestion & Laxatives": "3004",
  "Personal Care, Hygiene & Others": "3305",
  "Baby Care": "3924",
  "Medical Supplies & General": "9018",
  "Health & Pharmacy Insurance": "9971",
  "Full Body Health Checkups": "9993",
};

const CAT_ACCENT: Record<string, string> = {
  "Skin Care, Powders & Ointments": "#7c3aed",
  "Skin Care & Ointments": "#7c3aed",
  "Weight Loss & Metabolism": "#ea580c",
  "Daily Wellness & Immunity": "#d97706",
  "Monsoon Health & Antiseptics": "#0891b2",
  "Baby Care & Infant Nutrition": "#0284c7",
  "Women's Health & Hygiene": "#db2777",
  "Men's Health & Vitality": "#0f766e",
  "Vaccines & Medical Disposables": "#475569",
  "Diet & Digestive Health": "#16a34a",
  "Hair Care & Scalp Therapy": "#9333ea",
  "Pain Relief & Balms": "#c0392b",
  "Energy, Hydration & Supplements": "#d97706",
  "First Aid & Antiseptics": "#047857",
  "Antacids, Digestion & Laxatives": "#1d4ed8",
  "Personal Care, Hygiene & Others": "#0e7490",
  "Baby Care": "#0369a1",
  "Medical Supplies & General": "#374151",
  "Health & Pharmacy Insurance": "#0284c7",
  "Full Body Health Checkups": "#059669",
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Volini Gel 15g", category: "Pain Relief & Balms", brand: "Volini", sku: "VLN-001", hsn: "3004", mrp: 15, customerPrice: 11, retailerPrice: 10, stock: 145, details: "15g gel tube" },
  { id: 2, name: "Volini Spray 249ml", category: "Pain Relief & Balms", brand: "Volini", sku: "VLN-002", hsn: "3004", mrp: 249, customerPrice: 177, retailerPrice: 151, stock: 67, details: "249ml spray can" },
  { id: 3, name: "Amrutanjan Strong Balm 44g", category: "Pain Relief & Balms", brand: "Amrutanjan", sku: "AMR-001", hsn: "3004", mrp: 44, customerPrice: 36, retailerPrice: 32, stock: 92, details: "44g balm jar" },
  { id: 4, name: "Zandu Balm 45ml", category: "Pain Relief & Balms", brand: "Zandu", sku: "ZAN-001", hsn: "3004", mrp: 45, customerPrice: 40, retailerPrice: 35, stock: 8, details: "45ml roll-on bottle" },
  { id: 5, name: "Moov Chain 15g", category: "Pain Relief & Balms", brand: "Moov", sku: "MOV-001", hsn: "3004", mrp: 15, customerPrice: 13, retailerPrice: 11, stock: 231, details: "15g roll-on applicator" },
  { id: 6, name: "Glucon D Orange 415g Jar", category: "Energy, Hydration & Supplements", brand: "Glucon D", sku: "GLD-001", hsn: "2106", mrp: 415, customerPrice: 332, retailerPrice: 272, stock: 203, details: "415g storage jar" },
  { id: 7, name: "Glucon D Regular 65g", category: "Energy, Hydration & Supplements", brand: "Glucon D", sku: "GLD-002", hsn: "2106", mrp: 65, customerPrice: 50, retailerPrice: 44, stock: 312, details: "65g refill pack" },
  { id: 8, name: "Dabur Honey 125g", category: "Energy, Hydration & Supplements", brand: "Dabur", sku: "DBR-001", hsn: "2106", mrp: 125, customerPrice: 105, retailerPrice: 89, stock: 78, details: "125g squeeze bottle" },
  { id: 9, name: "Chyawanprash 860g", category: "Energy, Hydration & Supplements", brand: "Dabur", sku: "DBR-002", hsn: "2106", mrp: 860, customerPrice: 671, retailerPrice: 550, stock: 3, details: "860g glass jar" },
  { id: 10, name: "Cipla ORS Powder Box", category: "Energy, Hydration & Supplements", brand: "Cipla", sku: "CPL-001", hsn: "2106", mrp: 978, customerPrice: 250, retailerPrice: 205, stock: 34, details: "Box of 21 sachets" },
  { id: 11, name: "Sugar Free Gold 40 Tabs", category: "Energy, Hydration & Supplements", brand: "Zydus", sku: "SGF-001", hsn: "2106", mrp: 40, customerPrice: 32, retailerPrice: 28, stock: 156, details: "40 tablets strip" },
  { id: 12, name: "Electrol Powder Sachet", category: "Energy, Hydration & Supplements", brand: "Electrol", sku: "ELC-001", hsn: "2106", mrp: 23, customerPrice: 16, retailerPrice: 14, stock: 187, details: "Single 22g sachet" },
  { id: 13, name: "Dettol Antiseptic 250ml", category: "First Aid & Antiseptics", brand: "Dettol", sku: "DTL-001", hsn: "3808", mrp: 155, customerPrice: 131, retailerPrice: 111, stock: 287, details: "250ml bottle" },
  { id: 14, name: "Dettol Antiseptic 550ml", category: "First Aid & Antiseptics", brand: "Dettol", sku: "DTL-002", hsn: "3808", mrp: 259, customerPrice: 223, retailerPrice: 183, stock: 145, details: "550ml bottle" },
  { id: 15, name: "Dettol Antiseptic 60ml", category: "First Aid & Antiseptics", brand: "Dettol", sku: "DTL-003", hsn: "3808", mrp: 30, customerPrice: 27, retailerPrice: 24, stock: 312, details: "60ml pocket bottle" },
  { id: 16, name: "Hansaplast Regular Band-Aid", category: "First Aid & Antiseptics", brand: "Hansaplast", sku: "HNS-001", hsn: "3808", mrp: 240, customerPrice: 165, retailerPrice: 140, stock: 62, details: "Box of 20 strips" },
  { id: 17, name: "Hansaplast Washproof Band-Aid", category: "First Aid & Antiseptics", brand: "Hansaplast", sku: "HNS-002", hsn: "3808", mrp: 300, customerPrice: 195, retailerPrice: 166, stock: 9, details: "Box of 20 waterproof strips" },
  { id: 18, name: "Eno Lemon 30 Pcs Pack", category: "Antacids, Digestion & Laxatives", brand: "Eno", sku: "ENO-001", hsn: "3004", mrp: 230, customerPrice: 230, retailerPrice: 189, stock: 89, details: "Pack of 30 sachets" },
  { id: 19, name: "Eno Lemon Sachet 5g", category: "Antacids, Digestion & Laxatives", brand: "Eno", sku: "ENO-002", hsn: "3004", mrp: 9, customerPrice: 8, retailerPrice: 7, stock: 543, details: "5g single sachet" },
  { id: 20, name: "Zandu Nityam Tablets", category: "Antacids, Digestion & Laxatives", brand: "Zandu", sku: "ZAN-002", hsn: "3004", mrp: 99, customerPrice: 61, retailerPrice: 52, stock: 0, details: "Strip of 10 tablets" },
  { id: 21, name: "Softovac SF 229g", category: "Antacids, Digestion & Laxatives", brand: "Softovac", sku: "SFT-001", hsn: "3004", mrp: 229, customerPrice: 150, retailerPrice: 128, stock: 23, details: "229g powder jar" },
  { id: 22, name: "Baidya Isabgol 360g", category: "Antacids, Digestion & Laxatives", brand: "Baidya", sku: "BDY-001", hsn: "3004", mrp: 360, customerPrice: 305, retailerPrice: 250, stock: 7, details: "360g powder jar" },
  { id: 23, name: "Kayam Churna 115g", category: "Antacids, Digestion & Laxatives", brand: "Kayam", sku: "KYM-001", hsn: "3004", mrp: 115, customerPrice: 93, retailerPrice: 79, stock: 44, details: "115g powder" },
  { id: 24, name: "Nycil Cool Powder 130g", category: "Skin Care, Powders & Ointments", brand: "Nycil", sku: "NYC-001", hsn: "3304", mrp: 130, customerPrice: 104, retailerPrice: 88, stock: 198, details: "130g dusting powder" },
  { id: 25, name: "Candid Dusting Powder 174g", category: "Skin Care, Powders & Ointments", brand: "Candid", sku: "CND-001", hsn: "3304", mrp: 174, customerPrice: 122, retailerPrice: 104, stock: 5, details: "174g powder tin" },
  { id: 26, name: "Boroline Antiseptic Cream 45g", category: "Skin Care, Powders & Ointments", brand: "Boroline", sku: "BRL-001", hsn: "3304", mrp: 45, customerPrice: 39, retailerPrice: 34, stock: 267, details: "45g cream tube" },
  { id: 27, name: "Ring Guard Cream 96g", category: "Skin Care, Powders & Ointments", brand: "Ring Guard", sku: "RNG-001", hsn: "3304", mrp: 96, customerPrice: 78, retailerPrice: 66, stock: 41, details: "96g cream tube" },
  { id: 28, name: "Love Nature Hair Oil 299ml", category: "Personal Care, Hygiene & Others", brand: "Love Nature", sku: "LVN-001", hsn: "3305", mrp: 299, customerPrice: 165, retailerPrice: 140, stock: 73, details: "299ml bottle" },
  { id: 29, name: "Jac Body Oil 275ml", category: "Personal Care, Hygiene & Others", brand: "Jac", sku: "JAC-001", hsn: "3305", mrp: 275, customerPrice: 193, retailerPrice: 164, stock: 56, details: "275ml bottle" },
  { id: 30, name: "Dettol Hand Sanitizer 30ml", category: "Personal Care, Hygiene & Others", brand: "Dettol", sku: "DTL-004", hsn: "3305", mrp: 30, customerPrice: 26, retailerPrice: 23, stock: 334, details: "30ml pocket bottle" },
  { id: 31, name: "Vicks Cough Drops 130 Pcs", category: "Personal Care, Hygiene & Others", brand: "Vicks", sku: "VCK-001", hsn: "3305", mrp: 100, customerPrice: 100, retailerPrice: 85, stock: 88, details: "Pack of 130 drops" },
  { id: 32, name: "Morisons Baby Nipple", category: "Baby Care", brand: "Morisons", sku: "MRS-001", hsn: "3924", mrp: 30, customerPrice: 21, retailerPrice: 18, stock: 17, details: "Single silicone nipple" },
  { id: 33, name: "Morisons Feeding Bottle", category: "Baby Care", brand: "Morisons", sku: "MRS-002", hsn: "3924", mrp: 72, customerPrice: 72, retailerPrice: 61, stock: 29, details: "250ml capacity bottle" },
  { id: 34, name: "Surgical Face Mask 75pc", category: "Medical Supplies & General", brand: "Generic", sku: "SRG-001", hsn: "9018", mrp: 75, customerPrice: 75, retailerPrice: 64, stock: 412, details: "Box of 75 masks, 3-ply" },
  { id: 35, name: "Surgical Face Mask 100pc", category: "Medical Supplies & General", brand: "Generic", sku: "SRG-002", hsn: "9018", mrp: 100, customerPrice: 100, retailerPrice: 85, stock: 287, details: "Box of 100 masks, 3-ply" },
  { id: 36, name: "Glandiner Oil 145ml", category: "Medical Supplies & General", brand: "Glandiner", sku: "GLD-003", hsn: "9018", mrp: 145, customerPrice: 120, retailerPrice: 102, stock: 64, details: "145ml massage oil bottle" },
];

const MOCK_REVENUE_HISTORY = [
  { date: "Aug 28, 2026", orders: 23, revenue: 14283, upi: 8234, card: 3849, cod: 2200 },
  { date: "Aug 27, 2026", orders: 19, revenue: 12847, upi: 6420, card: 4190, cod: 2237 },
  { date: "Aug 26, 2026", orders: 25, revenue: 16734, upi: 9340, card: 5120, cod: 2274 },
  { date: "Aug 25, 2026", orders: 21, revenue: 13920, upi: 7840, card: 3980, cod: 2100 },
  { date: "Aug 24, 2026", orders: 17, revenue: 10560, upi: 5823, card: 2940, cod: 1797 },
  { date: "Aug 23, 2026", orders: 29, revenue: 18492, upi: 10234, card: 6010, cod: 2248 },
  { date: "Aug 22, 2026", orders: 22, revenue: 15103, upi: 8470, card: 4320, cod: 2313 },
];

const MOCK_ORDERS = [
  { id: "ORD-2847", customer: "Priya Sharma", phone: "98765 43210", items: 3, amount: 763, status: "Delivered", date: "Aug 27, 2026", payment: "UPI", role: "customer" as const },
  { id: "ORD-2846", customer: "Sharma Medical & Surgical", phone: "87654 32109", items: 12, amount: 4890, status: "Shipped", date: "Aug 27, 2026", payment: "Card", role: "retailer" as const, shopName: "Sharma Medical Store" },
  { id: "ORD-2845", customer: "Anita Patel", phone: "76543 21098", items: 5, amount: 1247, status: "Processing", date: "Aug 27, 2026", payment: "COD", role: "customer" as const },
  { id: "ORD-2844", customer: "Apex Pharma Distributors", phone: "65432 10987", items: 25, amount: 12450, status: "Delivered", date: "Aug 26, 2026", payment: "UPI", role: "retailer" as const, shopName: "Apex Pharma" },
  { id: "ORD-2843", customer: "Meera Nair", phone: "54321 09876", items: 1, amount: 332, status: "Shipped", date: "Aug 26, 2026", payment: "UPI", role: "customer" as const },
  { id: "ORD-2842", customer: "Kolkata City Meds", phone: "43210 98765", items: 18, amount: 7650, status: "Cancelled", date: "Aug 26, 2026", payment: "Card", role: "retailer" as const, shopName: "Kolkata City Meds" },
  { id: "ORD-2841", customer: "Deepa Krishnan", phone: "32109 87654", items: 2, amount: 519, status: "Delivered", date: "Aug 25, 2026", payment: "UPI", role: "customer" as const },
  { id: "ORD-2840", customer: "Apollo Care Chemist", phone: "21098 76543", items: 30, amount: 14834, status: "Processing", date: "Aug 25, 2026", payment: "Card", role: "retailer" as const, shopName: "Apollo Care Chemist" },
  { id: "ORD-2839", customer: "Sunita Rao", phone: "10987 65432", items: 1, amount: 105, status: "Delivered", date: "Aug 25, 2026", payment: "COD", role: "customer" as const },
  { id: "ORD-2838", customer: "Gupta Health Pharmacy", phone: "09876 54321", items: 15, amount: 6271, status: "Shipped", date: "Aug 24, 2026", payment: "UPI", role: "retailer" as const, shopName: "Gupta Health Pharmacy" },
];

const TAB_ITEMS: { id: AdminTab; label: string; icon: React.ReactElement }[] = [
  { id: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1H8V8H1V1ZM10 1H17V8H10V1ZM1 10H8V17H1V10ZM10 10H17V17H10V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
  { id: "products", label: "Products", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L17 5V13L9 17L1 13V5L9 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 9L17 5M9 9L1 5M9 9V17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
  { id: "inventory", label: "Inventory", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 13L5 15L9 13L13 15L17 13V5L13 3L9 5L5 3L1 5V13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 5V13M5 3V15M13 3V15" stroke="currentColor" strokeWidth="1.5" /></svg> },
  { id: "orders", label: "Orders", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 1H14C15.1 1 16 1.9 16 3V17L13 15.5L9 17L5 15.5L2 17V3C2 1.9 2.9 1 4 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M5 6H13M5 9H13M5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
  { id: "retailers", label: "Retailers", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: "lab-tests", label: "Lab Bookings", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 3H6v6L2 15c-.83 1.39-.83 3.08 0 4.47C2.83 20.86 4.33 22 6 22h12c1.67 0 3.17-1.14 4-2.53.83-1.39.83-3.08 0-4.47L18 9V3h-3M9 3v6l-4 6h14L15 9V3M9 3h6"/></svg> },
  { id: "revenue", label: "Revenue", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 13L5 9L8 11L12 6L17 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 17H17M13 2H17V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  { id: "settings", label: "Settings", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 11.5C10.38 11.5 11.5 10.38 11.5 9C11.5 7.62 10.38 6.5 9 6.5C7.62 6.5 6.5 7.62 6.5 9C6.5 10.38 7.62 11.5 9 11.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="M15.1 9C15.1 8.71 15.07 8.43 15.04 8.15L16.86 6.74L14.86 3.26L12.74 4.22C12.27 3.87 11.77 3.57 11.22 3.34L10.9 1H7.1L6.78 3.34C6.23 3.57 5.73 3.87 5.26 4.22L3.14 3.26L1.14 6.74L2.96 8.15C2.93 8.43 2.9 8.71 2.9 9C2.9 9.29 2.93 9.57 2.96 9.85L1.14 11.26L3.14 14.74L5.26 13.78C5.73 14.13 6.23 14.43 6.78 14.66L7.1 17H10.9L11.22 14.66C11.77 14.43 12.27 14.13 12.74 13.78L14.86 14.74L16.86 11.26L15.04 9.85C15.07 9.57 15.1 9.29 15.1 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
];

function stockStatus(s: number): { label: string; color: string; bg: string } {
  if (s === 0) return { label: "Out of Stock", color: "#b91c1c", bg: "#fee2e2" };
  if (s <= 10) return { label: "Low Stock", color: "#c2410c", bg: "#ffedd5" };
  return { label: "In Stock", color: "#047857", bg: "#d1fae5" };
}

function orderStatus(s: string): { color: string; bg: string } {
  switch (s) {
    case "Delivered": return { color: "#047857", bg: "#d1fae5" };
    case "Out for Delivery": return { color: "#0284c7", bg: "#e0f2fe" };
    case "Shipped": return { color: "#1d4ed8", bg: "#dbeafe" };
    case "Dispatched":
    case "Dispatch": return { color: "#7c3aed", bg: "#ede9fe" };
    case "Processing": return { color: "#d97706", bg: "#fef3c7" };
    case "Cancelled": return { color: "#b91c1c", bg: "#fee2e2" };
    default: return { color: "#374151", bg: "#f3f4f6" };
  }
}

type ProductFormState = Omit<Product, "id"> & { id?: number };
const emptyForm = (category = INITIAL_CATEGORIES[0]): ProductFormState => ({
  name: "", category, brand: "", sku: "", hsn: CAT_HSN[category] ?? "", mrp: 0,
  customerPrice: 0, retailerPrice: 0, stock: 0, image: undefined, details: "",
  badges: DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
});

/* ─── Product Modal ─── */
function ProductModal({
  open, mode, form, setForm, categories,
  onAddCategory, onSave, onClose,
}: {
  open: boolean; mode: "add" | "edit";
  form: ProductFormState; setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: string[]; onAddCategory: (name: string) => void;
  onSave: () => void; onClose: () => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    if (open) { setShowAddCat(false); setNewCatName(""); }
  }, [open]);

  // Auto-fill HSN when category changes (only if HSN matches a default or is blank)
  useEffect(() => {
    const defaultHsns = Object.values(CAT_HSN);
    if (!form.hsn || defaultHsns.includes(form.hsn)) {
      setForm((p) => ({ ...p, hsn: CAT_HSN[form.category] ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submitNewCat = () => {
    const trimmed = newCatName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onAddCategory(trimmed);
      setForm((p) => ({ ...p, category: trimmed, hsn: "" }));
    }
    setShowAddCat(false);
    setNewCatName("");
  };

  const currentBadges = form.badges || DEFAULT_PRODUCT_BADGES;

  const handleToggleBadge = (index: number, checked: boolean) => {
    setForm((p) => {
      const updated = [...(p.badges || DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })))];
      updated[index] = { ...updated[index], checked };
      return { ...p, badges: updated };
    });
  };

  const handleUpdateBadgeName = (index: number, name: string) => {
    setForm((p) => {
      const updated = [...(p.badges || DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })))];
      updated[index] = { ...updated[index], name };
      return { ...p, badges: updated };
    });
  };

  const handleAddCustomBadge = () => {
    setForm((p) => {
      const updated = [...(p.badges || DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })))];
      const newId = `custom-badge-${Date.now()}`;
      updated.push({ id: newId, name: "New Feature Tag", checked: true });
      return { ...p, badges: updated };
    });
  };

  const handleRemoveBadge = (index: number) => {
    setForm((p) => {
      const updated = [...(p.badges || DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })))];
      updated.splice(index, 1);
      return { ...p, badges: updated };
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl my-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#e4ede2]">
          <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center hover:bg-[#e4ede2] transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="#073b4c" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-7 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-2">Product Image</label>
            <div
              className="relative rounded-xl border-2 border-dashed border-[#e4ede2] overflow-hidden cursor-pointer hover:border-[#073b4c] transition-colors group bg-[#f8fafb]"
              style={{ minHeight: "120px" }}
              onClick={() => galleryRef.current?.click()}
            >
              {form.image ? (
                <div className="relative flex items-center justify-center">
                  <img src={form.image} alt="Product" className="max-h-36 object-contain p-2" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, image: undefined })); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#073b4c" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center gap-1.5 text-[#9aa89b] group-hover:text-[#073b4c] transition-colors">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4C14 4 8 4 5 7C2 10 2 14 2 14C2 14 2 18 5 21C8 24 14 24 14 24C14 24 20 24 23 21C26 18 26 14 26 14C26 14 26 10 23 7C20 4 14 4Z" stroke="currentColor" strokeWidth="1.5" /><path d="M14 9V14M14 19H14.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-[11px]">JPG, PNG or WebP</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#e4ede2] text-xs font-semibold text-[#073b4c] hover:bg-[#f0f4f0] transition-colors"
              >
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none"><path d="M5 1H9L10.5 3H13C13.55 3 14 3.45 14 4V12C14 12.55 13.55 13 13 13H1C0.45 13 0 12.55 0 12V4C0 3.45 0.45 3 1 3H3.5L5 1Z" fill="#073b4c" /><circle cx="7" cy="8" r="2.5" fill="white" /></svg>
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#e4ede2] text-xs font-semibold text-[#073b4c] hover:bg-[#f0f4f0] transition-colors"
              >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M13 0H1C0.45 0 0 0.45 0 1V11C0 11.55 0.45 12 1 12H13C13.55 12 14 11.55 14 11V1C14 0.45 13.55 0 13 0ZM4 2.5C4.83 2.5 5.5 3.17 5.5 4C5.5 4.83 4.83 5.5 4 5.5C3.17 5.5 2.5 4.83 2.5 4C2.5 3.17 3.17 2.5 4 2.5ZM12 10H2L5.5 6.5L7 8L9 5L12 10Z" fill="#073b4c" /></svg>
                Upload from Gallery
              </button>
            </div>
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageFile} />
          </div>

          {/* Product Name */}
          <Field label="Product Name">
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Volini Spray 249ml" className={INPUT_CLS} required />
          </Field>

          {/* Product Details */}
          <Field label="Product Details / Pack Size">
            <input type="text" value={form.details ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
              placeholder="e.g. 249ml spray can, Pack of 20 strips, 50g tube"
              className={INPUT_CLS} />
            <p className="text-[10px] text-[#9aa89b] mt-1">Pack size or quantity shown under the product name to customers and retailers</p>
          </Field>

          {/* Category + Add Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px]">Category</label>
              <button type="button" onClick={() => setShowAddCat(!showAddCat)}
                className="text-[10px] font-bold text-[#006a39] hover:underline flex items-center gap-1 cursor-pointer">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Add Category
              </button>
            </div>
            <select
              value={form.category}
              onChange={(e) => {
                const selected = e.target.value;
                setForm((p) => ({
                  ...p,
                  category: selected,
                  hsn: CAT_HSN[selected] || p.hsn || "3004",
                }));
              }}
              className={INPUT_CLS}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {showAddCat && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name"
                  onKeyDown={(e) => e.key === "Enter" && submitNewCat()}
                  className={`${INPUT_CLS} flex-1`} />
                <button type="button" onClick={submitNewCat}
                  className="px-4 py-2 rounded-xl bg-[#073b4c] text-white text-xs font-bold hover:opacity-90 shrink-0">
                  Add
                </button>
                <button type="button" onClick={() => { setShowAddCat(false); setNewCatName(""); }}
                  className="px-3 py-2 rounded-xl border border-[#e4ede2] text-xs font-semibold text-[#073b4c] hover:bg-[#f0f4f0] shrink-0">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Brand + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand">
              <input type="text" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. Volini" className={INPUT_CLS} />
            </Field>
            <Field label="SKU Code">
              <input type="text" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="e.g. VLN-001" className={INPUT_CLS} />
            </Field>
          </div>

          {/* HSN Code */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px]">HSN Code</label>
              <span className="text-[9px] bg-[#e0f2fe] text-[#0369a1] px-1.5 py-0.5 rounded font-medium">Required for GST</span>
            </div>
            <input type="text" value={form.hsn}
              onChange={(e) => setForm((p) => ({ ...p, hsn: e.target.value }))}
              placeholder="e.g. 3004, 2106, 9018"
              className={INPUT_CLS} maxLength={8} />
            <p className="text-[10px] text-[#9aa89b] mt-1">Harmonized System of Nomenclature code for GST classification. Auto-filled based on category.</p>
          </div>

          {/* MRP / Customer Price / Retailer Price */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="MRP (₹)">
              <input type="number" min="0" value={form.mrp || ""}
                onChange={(e) => setForm((p) => ({ ...p, mrp: Number(e.target.value) }))}
                placeholder="0" className={INPUT_CLS} />
            </Field>
            <Field label="Customer Price (₹)">
              <input type="number" min="0" value={form.customerPrice || ""}
                onChange={(e) => setForm((p) => ({ ...p, customerPrice: Number(e.target.value) }))}
                placeholder="0" className={INPUT_CLS} />
            </Field>
            <Field label="Retailer Price (₹)">
              <input type="number" min="0" value={form.retailerPrice || ""}
                onChange={(e) => setForm((p) => ({ ...p, retailerPrice: Number(e.target.value) }))}
                placeholder="0" className={`${INPUT_CLS} border-[#bae6fd] focus:border-[#0369a1]`} />
            </Field>
          </div>

          {/* Price preview */}
          {(form.customerPrice > 0 && form.retailerPrice > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f0f9ff] rounded-xl p-3 text-center border border-[#bae6fd]">
                <p className="text-[10px] text-[#0369a1] font-semibold uppercase tracking-wide mb-0.5">Customer Sees</p>
                <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl">₹{form.customerPrice}</p>
                {form.mrp > form.customerPrice && (
                  <p className="text-[10px] text-[#047857]">{Math.round(((form.mrp - form.customerPrice) / form.mrp) * 100)}% off MRP</p>
                )}
              </div>
              <div className="bg-[#f0fdf4] rounded-xl p-3 text-center border border-[#bbf7d0]">
                <p className="text-[10px] text-[#047857] font-semibold uppercase tracking-wide mb-0.5">Retailer Sees</p>
                <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl">₹{form.retailerPrice}</p>
                {form.customerPrice > form.retailerPrice && (
                  <p className="text-[10px] text-[#047857]">{Math.round(((form.customerPrice - form.retailerPrice) / form.customerPrice) * 100)}% off customer</p>
                )}
              </div>
            </div>
          )}

          {/* Stock */}
          <Field label="Stock (units)">
            <input type="number" min="0" value={form.stock || ""}
              onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
              placeholder="0" className={INPUT_CLS} />
          </Field>

          {/* ── Custom Feature Badges & Tags (Editable Name Checkboxes) ── */}
          <div className="bg-[#f8fafb] rounded-2xl p-4 border border-[#e4ede2] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block">
                  Product Badges & Tags (Checkboxes)
                </label>
                <p className="text-[10px] text-[#6d7a6f]">Toggle checkboxes & edit tag names directly</p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomBadge}
                className="text-[10px] font-bold text-[#006a39] bg-[#eef7f0] hover:bg-[#dcfce7] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#bbf7d0]"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                + Add Checkbox
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {currentBadges.map((badge, idx) => (
                <div
                  key={badge.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    badge.checked
                      ? "bg-white border-[#006a39] shadow-2xs ring-1 ring-[#006a39]/20"
                      : "bg-white/70 border-[#e4ede2] opacity-80 hover:opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`badge-${badge.id}-${idx}`}
                    checked={badge.checked}
                    onChange={(e) => handleToggleBadge(idx, e.target.checked)}
                    className="w-4 h-4 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39] shrink-0"
                  />
                  <input
                    type="text"
                    value={badge.name}
                    onChange={(e) => handleUpdateBadgeName(idx, e.target.value)}
                    placeholder="Badge Name (Click to edit)"
                    className="flex-1 bg-transparent text-xs font-semibold text-[#073b4c] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006a39] px-1.5 py-0.5 rounded transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBadge(idx)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[#9aa89b] hover:text-[#ba1a1a] hover:bg-[#fee2e2] text-xs font-bold transition-colors cursor-pointer shrink-0"
                    title="Remove this checkbox"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 pb-7 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#e4ede2] text-[#073b4c] text-sm font-bold hover:bg-[#f0f4f0] transition-colors">Cancel</button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl bg-[#073b4c] text-white text-sm font-bold hover:opacity-90 transition-opacity">
            {mode === "add" ? "Add Product" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = "w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#073b4c] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/* ─── Main Component ─── */
export default function AdminDashboard({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [retailers, setRetailers] = useState<RetailerAccount[]>([]);
  const [isRefreshingRetailers, setIsRefreshingRetailers] = useState(false);

  // Product management state
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit" }>({ open: false, mode: "add" });
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Inventory state
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});
  const [invFilter, setInvFilter] = useState("All");
  const [invSearch, setInvSearch] = useState("");

  // Settings state with localStorage persistence
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("subhone_admin_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load saved settings:", e);
    }
    return {
      storeName: "SubhOne Health Group",
      phone: "+91 98765 43210",
      email: "support@subhone.com",
      address: "14/B Central Avenue, Kolkata, West Bengal 700012",
      lowThreshold: "10",
      defaultDisc: "15",
      emailAlerts: true,
      smsAlerts: false,
      autoReorder: true,
    };
  });

  const lowStockCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= 10).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock === 0).length, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (catFilter !== "All") list = list.filter((p) => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) || p.hsn.includes(q)
      );
    }
    return list;
  }, [products, catFilter, search]);

  const filteredInventory = useMemo(() => {
    let list = [...products].sort((a, b) => a.stock - b.stock);
    if (invFilter === "Out of Stock") list = list.filter((p) => p.stock === 0);
    else if (invFilter === "Low Stock") list = list.filter((p) => p.stock > 0 && p.stock <= 10);
    else if (invFilter === "In Stock") list = list.filter((p) => p.stock > 10);
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, invFilter, invSearch]);

  // Orders state
  const [orderFilter, setOrderFilter] = useState("All");
  const [dbOrders, setDbOrders] = useState<DbOrder[]>([]);

  // Fetch live products & orders on mount
  useEffect(() => {
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted && data && data.length > 0) {
        setProducts(
          data.map((p) => ({
            id: p.numeric_id,
            dbId: p.id,
            name: p.name,
            category: p.category_name,
            brand: p.brand,
            sku: p.sku || `SKU-${p.numeric_id}`,
            hsn: p.hsn || "3004",
            mrp: Number(p.mrp),
            customerPrice: Number(p.customer_price),
            retailerPrice: Number(p.retailer_price),
            stock: p.stock,
            image: p.image_url,
            details: p.details || "",
          }))
        );
      }
    });

    fetchAllOrders().then((data) => {
      if (mounted && data) {
        setDbOrders(data);
      }
    });

    fetchAllLabBookings().then((data) => {
      if (mounted && data) {
        setDbLabBookings(data);
      }
    });

    fetchAllRetailers().then((data) => {
      if (mounted && data) {
        setRetailers(data);
      }
    });

    // Real-time Supabase product & inventory listener
    const unsubscribeProducts = subscribeToProductsRealtime((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        setProducts((prev) =>
          prev.map((p) =>
            p.dbId === payload.new.id || p.id === payload.new.numeric_id
              ? {
                  ...p,
                  dbId: payload.new.id,
                  name: payload.new.name,
                  category: payload.new.category_name,
                  brand: payload.new.brand,
                  mrp: Number(payload.new.mrp),
                  customerPrice: Number(payload.new.customer_price),
                  retailerPrice: Number(payload.new.retailer_price),
                  stock: payload.new.stock,
                  image: payload.new.image_url,
                  details: payload.new.details || "",
                }
              : p
          )
        );
      } else if (payload.eventType === "INSERT" && payload.new) {
        const newP = payload.new;
        setProducts((prev) => [
          {
            id: newP.numeric_id,
            dbId: newP.id,
            name: newP.name,
            category: newP.category_name,
            brand: newP.brand,
            sku: newP.sku || `SKU-${newP.numeric_id}`,
            hsn: newP.hsn || "3004",
            mrp: Number(newP.mrp),
            customerPrice: Number(newP.customer_price),
            retailerPrice: Number(newP.retailer_price),
            stock: newP.stock,
            image: newP.image_url,
            details: newP.details || "",
          },
          ...prev,
        ]);
      } else if (payload.eventType === "DELETE" && payload.old) {
        setProducts((prev) => prev.filter((p) => p.dbId !== payload.old.id));
      }
    });

    return () => {
      mounted = false;
      unsubscribeProducts();
    };
  }, []);

  const [dbLabBookings, setDbLabBookings] = useState<DbLabBooking[]>([]);
  const [deletedOrderIds, setDeletedOrderIds] = useState<string[]>(() => getDeletedOrderIds());

  const handleUpdateLabBookingStatus = async (
    bookingId: string,
    newStatus: DbLabBooking["status"]
  ) => {
    setDbLabBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    await dbUpdateLabBookingStatus(bookingId, newStatus);
  };

  const liveOrders = useMemo(() => {
    if (dbOrders.length > 0) {
      return dbOrders
        .filter((o) => !deletedOrderIds.includes(o.id) && !deletedOrderIds.includes(o.order_number))
        .map((o) => {
          const shipAddr = (o.shipping_address || {}) as any;
          const isExplicitRetailer = o.user_role === "retailer" || shipAddr?.user_role === "retailer";
          const isExplicitCustomer = o.user_role === "customer" || shipAddr?.user_role === "customer";

          const finalRole: "retailer" | "customer" = isExplicitRetailer
            ? "retailer"
            : isExplicitCustomer
            ? "customer"
            : o.shop_name ||
              shipAddr?.shop_name ||
              o.customer_name?.toLowerCase().includes("store") ||
              o.customer_name?.toLowerCase().includes("pharmacy") ||
              o.customer_name?.toLowerCase().includes("medical") ||
              o.customer_name?.toLowerCase().includes("pharma")
            ? "retailer"
            : "customer";

          const finalShopName =
            o.shop_name ||
            shipAddr?.shop_name ||
            (finalRole === "retailer" ? o.customer_name : undefined);

          const dateObj = new Date(o.created_at);
          const dateStr = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "Today";
          const rawDateStr = !isNaN(dateObj.getTime())
            ? dateObj.toISOString().split("T")[0]
            : undefined;

          return {
            id: o.order_number,
            dbId: o.id,
            customer: o.customer_name,
            phone: o.customer_phone,
            items: o.order_items?.length || 1,
            amount: Number(o.total_amount),
            status: o.status,
            date: dateStr,
            rawDate: rawDateStr,
            payment: o.payment_method,
            role: finalRole,
            shopName: finalShopName,
          };
        });
    }
    return MOCK_ORDERS
      .filter((o) => !deletedOrderIds.includes(o.id))
      .map((o) => ({ ...o, dbId: "", rawDate: undefined }));
  }, [dbOrders, deletedOrderIds]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "All") return liveOrders;
    return liveOrders.filter((o) => o.status === orderFilter);
  }, [liveOrders, orderFilter]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: "Processing" | "Dispatched" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled"
  ) => {
    setDbOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, status: newStatus } : o))
    );
    const target = dbOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (target?.id) {
      await dbUpdateOrderStatus(target.id, newStatus);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    markOrderAsDeletedLocally(orderId);
    const target = dbOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (target) {
      markOrderAsDeletedLocally(target.id, target.order_number);
    }
    const allDeleted = getDeletedOrderIds();
    setDeletedOrderIds([...allDeleted]);
    setDbOrders((prev) =>
      prev.filter((o) => o.id !== orderId && o.order_number !== orderId && (target ? o.id !== target.id : true))
    );
    await dbDeleteOrder(target?.id || orderId);
  };

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const freshOrders = await fetchAllOrders();
      if (freshOrders) {
        setDbOrders(freshOrders);
      }
      const allDeleted = getDeletedOrderIds();
      setDeletedOrderIds([...allDeleted]);
    } catch (err) {
      console.error("Error refreshing orders:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshingOrders(false);
      }, 500);
    }
  };

  const handleUpdateRetailerApproval = async (
    retailerId: string,
    newStatus: "pending" | "approved" | "rejected"
  ) => {
    setRetailers((prev) =>
      prev.map((r) => (r.id === retailerId || r.email.toLowerCase() === retailerId.toLowerCase() ? { ...r, approvalStatus: newStatus } : r))
    );
    await updateRetailerApprovalStatus(retailerId, newStatus);
  };

  const handleRefreshRetailers = async () => {
    setIsRefreshingRetailers(true);
    try {
      const fresh = await fetchAllRetailers();
      if (fresh) setRetailers(fresh);
    } catch (e) {
      console.error("Error refreshing retailers:", e);
    } finally {
      setTimeout(() => {
        setIsRefreshingRetailers(false);
      }, 400);
    }
  };

  const pendingRetailersCount = useMemo(
    () => retailers.filter((r) => r.approvalStatus === "pending").length,
    [retailers]
  );

  const openAdd = () => { setForm(emptyForm(categories[0])); setModal({ open: true, mode: "add" }); };
  const openEdit = (p: Product) => {
    setForm({
      ...p,
      badges: p.badges && p.badges.length > 0 ? p.badges : DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
    });
    setModal({ open: true, mode: "edit" });
  };
  const closeModal = () => setModal({ open: false, mode: "add" });

  const addCategory = (name: string) => {
    setCategories((prev) => [...prev, name]);
  };

  const saveProduct = async () => {
    const isFeatured = form.badges?.some((b) => b.id === "featured" && b.checked) ?? false;
    const isFlashSale = form.badges?.some((b) => b.id === "flash-deal" && b.checked) ?? false;

    if (modal.mode === "add") {
      const tempId = Date.now();
      const newProd: Product = { ...form, id: tempId } as Product;
      setProducts((prev) => [newProd, ...prev]);
      closeModal();

      // Persist to Supabase
      const { data } = await dbCreateProduct({
        name: form.name,
        subtitle: form.details || null,
        category_id: "00000000-0000-0000-0000-000000000000", // placeholder UUID
        category_name: form.category,
        brand: form.brand,
        sku: form.sku || `SKU-${tempId}`,
        hsn: form.hsn || "3004",
        mrp: form.mrp,
        customer_price: form.customerPrice,
        retailer_price: form.retailerPrice || Math.round(form.customerPrice * 0.85),
        discount_percent: form.mrp > form.customerPrice ? Math.round(((form.mrp - form.customerPrice) / form.mrp) * 100) : 0,
        stock: form.stock || 0,
        image_url: form.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
        details: form.details || null,
        is_flash_sale: isFlashSale,
        is_featured: isFeatured,
      });

      if (data) {
        setProducts((prev) => prev.map((p) => p.id === tempId ? { ...p, id: data.numeric_id, dbId: data.id } : p));
      }
    } else {
      const target = products.find((p) => p.id === form.id);
      setProducts((prev) => prev.map((p) => (p.id === form.id ? ({ ...form, dbId: target?.dbId } as Product) : p)));
      closeModal();

      // Persist edit to Supabase
      let dbId = target?.dbId;
      if (!dbId) {
        const { data: found } = await supabase
          .from("products")
          .select("id")
          .or(`numeric_id.eq.${form.id},name.eq.${form.name}`)
          .maybeSingle();
        if (found) dbId = found.id;
      }

      if (dbId) {
        const { data: updated } = await dbUpdateProduct(dbId, {
          name: form.name,
          category_name: form.category,
          brand: form.brand,
          sku: form.sku,
          hsn: form.hsn,
          mrp: form.mrp,
          customer_price: form.customerPrice,
          retailer_price: form.retailerPrice,
          discount_percent: form.mrp > form.customerPrice ? Math.round(((form.mrp - form.customerPrice) / form.mrp) * 100) : 0,
          stock: form.stock,
          image_url: form.image,
          details: form.details,
        });
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === form.id ? ({ ...form, dbId: updated.id } as Product) : p)));
        }
      }
    }
  };

  const deleteProduct = async (id: number) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    let dbId = target?.dbId;
    if (!dbId) {
      const { data: found } = await supabase
        .from("products")
        .select("id")
        .eq("numeric_id", id)
        .maybeSingle();
      if (found) dbId = found.id;
    }
    if (dbId) {
      await dbDeleteProduct(dbId);
    }
  };

  const applyStockUpdate = async (id: number) => {
    const val = parseInt(stockEdits[id] ?? "");
    if (!isNaN(val) && val >= 0) {
      const target = products.find((p) => p.id === id);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: val } : p));
      let dbId = target?.dbId;
      if (!dbId) {
        const { data: found } = await supabase
          .from("products")
          .select("id")
          .eq("numeric_id", id)
          .maybeSingle();
        if (found) dbId = found.id;
      }
      if (dbId) {
        await dbUpdateStock(dbId, val);
      }
    }
    setStockEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SIDEBAR_BG = "#073b4c";

  return (
    <div className="min-h-screen flex bg-[#f0f4f0]" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[240px] shrink-0 flex flex-col fixed inset-y-0 left-0 z-50 md:static transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        style={{ backgroundColor: SIDEBAR_BG, minHeight: "100vh" }}
      >
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-['Manrope',sans-serif] font-extrabold text-white text-xl tracking-tight">SubhOne</p>
            <span className="inline-block bg-white/15 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded mt-1 tracking-wider uppercase">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {TAB_ITEMS.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left cursor-pointer"
              style={activeTab === t.id ? { backgroundColor: "white", color: SIDEBAR_BG } : { color: "rgba(255,255,255,0.65)" }}>
              <span style={{ color: activeTab === t.id ? SIDEBAR_BG : "rgba(255,255,255,0.5)" }}>{t.icon}</span>
              {t.label}
              {t.id === "inventory" && (lowStockCount + outOfStockCount > 0) && (
                <span className="ml-auto bg-[#ef4444] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {lowStockCount + outOfStockCount}
                </span>
              )}
              {t.id === "retailers" && pendingRetailersCount > 0 && (
                <span className="ml-auto bg-[#d97706] text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] text-center animate-pulse">
                  {pendingRetailersCount}
                </span>
              )}
            </button>
          ))}

          {/* User Profile & Sign Out - DIRECTLY UNDER SETTINGS OPTION */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-9 h-9 rounded-full bg-[#006a39] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs ring-1 ring-white/20">
                {(user?.name?.[0] || user?.email?.[0] || "A").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-none truncate">{user.name || "SubhOne Admin"}</p>
                <p className="text-white/50 text-[11px] mt-0.5 truncate">{user.email || "admin@subhone.com"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#ff6b6b] hover:bg-white/10 transition-colors text-sm font-semibold cursor-pointer active:scale-95 text-left"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 14H3C2.45 14 2 13.55 2 13V3C2 2.45 2.45 2 3 2H6M10 11L14 8M14 8L10 5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-[#e4ede2] px-4 sm:px-8 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-[#d5dcd3] text-[#073b4c] hover:bg-[#f0f7ee]"
              aria-label="Open navigation menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg sm:text-xl capitalize">{activeTab}</h1>
              <p className="text-[#9aa89b] text-[11px] hidden sm:block">SubhOne Admin › {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
            </div>
          </div>
          {activeTab === "products" && (
            <button onClick={openAdd} className="flex items-center gap-1.5 sm:gap-2 bg-[#073b4c] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
              Add Product
            </button>
          )}
          {activeTab === "inventory" && (
            <p className="text-xs sm:text-sm text-[#9aa89b] hidden sm:block">Last synced: <span className="text-[#073b4c] font-semibold">Aug 28, 2026</span></p>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {activeTab === "dashboard" && (
            <DashboardTab products={products} lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} onNavigate={setActiveTab} />
          )}
          {activeTab === "products" && (
            <ProductsTab
              products={filteredProducts}
              allProductCount={products.length}
              categories={categories}
              search={search} setSearch={setSearch}
              catFilter={catFilter} setCatFilter={setCatFilter}
              onEdit={openEdit} onDelete={(id) => setDeleteId(id)}
            />
          )}
          {activeTab === "inventory" && (
            <InventoryTab
              products={filteredInventory} filter={invFilter} setFilter={setInvFilter}
              search={invSearch} setSearch={setInvSearch}
              stockEdits={stockEdits}
              setStockEdits={setStockEdits as React.Dispatch<React.SetStateAction<Record<number, string>>>}
              onApplyStock={applyStockUpdate}
              lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} allCount={products.length}
            />
          )}
          {activeTab === "orders" && (
            <OrdersTab
              orders={filteredOrders}
              filter={orderFilter}
              setFilter={setOrderFilter}
              onUpdateStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onRefresh={handleRefreshOrders}
              isRefreshing={isRefreshingOrders}
              settings={settings}
            />
          )}
          {activeTab === "retailers" && (
            <RetailersTab
              retailers={retailers}
              onUpdateApproval={handleUpdateRetailerApproval}
              onRefresh={handleRefreshRetailers}
              isRefreshing={isRefreshingRetailers}
            />
          )}
          {activeTab === "lab-tests" && (
            <LabBookingsTab
              bookings={dbLabBookings}
              onUpdateStatus={handleUpdateLabBookingStatus}
            />
          )}
          {activeTab === "revenue" && <RevenueTab />}
          {activeTab === "settings" && (
            <SettingsTab
              settings={settings}
              setSettings={setSettings}
              categories={categories}
              addCategory={addCategory}
              user={user}
              onLogout={onLogout}
            />
          )}
        </main>
      </div>

      {/* Product Modal */}
      <ProductModal
        open={modal.open} mode={modal.mode}
        form={form} setForm={setForm}
        categories={categories} onAddCategory={addCategory}
        onSave={saveProduct} onClose={closeModal}
      />

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#fee2e2] flex items-center justify-center mx-auto mb-4 text-[#ef4444]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 7L18.133 19.142A2 2 0 0 1 16.138 21H7.862A2 2 0 0 1 5.867 19.142L5 7M10 11V17M14 11V17M15 7V4A1 1 0 0 0 14 3H10A1 1 0 0 0 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg mb-1">Delete Product</h3>
            <p className="text-[#9aa89b] text-sm mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-[#e4ede2] text-[#6d7a6f] font-bold text-sm hover:bg-[#f8fafb] transition-colors">Cancel</button>
              <button onClick={() => deleteProduct(deleteId)} className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-bold text-sm hover:bg-[#dc2626] transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab({ products, lowStockCount, outOfStockCount, onNavigate }: {
  products: Product[]; lowStockCount: number; outOfStockCount: number; onNavigate: (t: AdminTab) => void;
}) {
  const stats = [
    { label: "Total Products", value: products.length, unit: "SKUs", color: "#073b4c" },
    { label: "Low / Out of Stock", value: lowStockCount + outOfStockCount, unit: "alerts", color: "#c2410c" },
    { label: "Categories", value: INITIAL_CATEGORIES.length, unit: "active", color: "#047857" },
    { label: "Today's Orders", value: 23, unit: "orders", color: "#1d4ed8" },
  ];
  const recentActivity = [
    { text: "Stock updated: Volini Spray 249ml (+50 units)", time: "10 min ago", dot: "#006a39" },
    { text: "New order: ORD-2847 — Priya Sharma, ₹763", time: "24 min ago", dot: "#1d4ed8" },
    { text: "Low stock alert: Chyawanprash 860g (3 units)", time: "1 hr ago", dot: "#c2410c" },
    { text: "Product added: Glucon D Regular Jar 219g", time: "2 hrs ago", dot: "#006a39" },
    { text: "Order delivered: ORD-2841 — Deepa Krishnan", time: "3 hrs ago", dot: "#047857" },
    { text: "Low stock alert: Candid Powder 174g (5 units)", time: "4 hrs ago", dot: "#c2410c" },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-7">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e4ede2] p-4 sm:p-5 flex flex-col gap-2 sm:gap-3">
            <p className="text-[#9aa89b] text-[11px] sm:text-xs font-semibold">{s.label}</p>
            <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl sm:text-4xl leading-none">{s.value}</p>
            <p className="text-[#9aa89b] text-[11px] sm:text-xs">{s.unit}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#073b4c] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-white/60 text-xs sm:text-sm">Today's Revenue</p>
          <p className="font-['Manrope',sans-serif] font-extrabold text-white text-3xl sm:text-4xl mt-1">₹14,283</p>
          <p className="text-white/50 text-xs mt-0.5">+12.4% vs yesterday</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button onClick={() => onNavigate("inventory")} className="bg-white/15 hover:bg-white/20 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-colors">Manage Stock</button>
          <button onClick={() => onNavigate("orders")} className="bg-[#0f9d58] hover:bg-[#0b8a4d] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-colors">View Orders</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-[#e4ede2] p-6">
          <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-3.5">
            {recentActivity.map((a) => (
              <div key={a.text} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: a.dot }} />
                <div>
                  <p className="text-[#073b4c] text-sm leading-snug">{a.text}</p>
                  <p className="text-[#9aa89b] text-xs mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e4ede2] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base">Stock Alerts</h3>
            <button onClick={() => onNavigate("inventory")} className="text-xs font-bold text-[#006a39] hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-2">
            {products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock).map((p) => {
              const st = stockStatus(p.stock);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#f0f4f0] last:border-0">
                  <div>
                    <p className="text-[#073b4c] text-sm font-medium leading-none">{p.name}</p>
                    <p className="text-[#9aa89b] text-xs mt-0.5">HSN: {p.hsn}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: st.color, backgroundColor: st.bg }}>
                    {p.stock === 0 ? "Out" : `${p.stock} left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Products Tab ─── */
function ProductsTab({ products, allProductCount, categories, search, setSearch, catFilter, setCatFilter, onEdit, onDelete }: {
  products: Product[]; allProductCount: number; categories: string[];
  search: string; setSearch: (v: string) => void; catFilter: string; setCatFilter: (v: string) => void;
  onEdit: (p: Product) => void; onDelete: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Search & Category Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa89b]">
            <path d="M13 13L10 10M11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, SKU or HSN…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#e4ede2] rounded-xl focus:outline-none focus:border-[#073b4c] transition-colors font-medium" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="bg-white border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#073b4c] focus:outline-none focus:border-[#073b4c] transition-colors w-full sm:w-auto cursor-pointer">
          <option value="All">All Categories ({allProductCount})</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <p className="text-[#9aa89b] text-xs sm:text-sm ml-auto font-medium">{products.length} product{products.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Responsive Compact Products Card List (Zero Horizontal Scrollbar) */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden shadow-xs">
        <div className="divide-y divide-[#f0f4f0]">
          {products.map((p) => {
            const st = stockStatus(p.stock);
            const catColor = CAT_ACCENT[p.category] ?? "#006a39";

            return (
              <div
                key={p.id}
                className="p-3.5 sm:p-4 hover:bg-[#fafcfa] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Left: Image, Product Name, SKU, HSN, Category, Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl border border-[#e4ede2] overflow-hidden shrink-0 bg-[#f8fafb] flex items-center justify-center p-1">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full max-w-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: catColor + "18", color: catColor }}>
                        {p.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-[#073b4c] text-sm truncate">{p.name}</p>
                      <span className="font-mono text-[10px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-1.5 py-0.2 rounded font-bold">
                        HSN: {p.hsn}
                      </span>
                      <span className="font-mono text-[10px] text-[#9aa89b]">
                        {p.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: catColor, backgroundColor: catColor + "18" }}
                      >
                        {p.category.split(",")[0].split(" & ")[0]}
                      </span>
                      <span className="text-xs text-[#6d7a6f] font-medium">{p.brand}</span>
                      {p.details && (
                        <span className="text-[10px] font-semibold bg-[#f0fdf4] text-[#047857] border border-[#bbf7d0] px-1.5 py-0.2 rounded">
                          {p.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Pricing Structure (MRP, Customer Price, Retailer Price) */}
                <div className="flex items-center gap-4 text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#f0f4f0] flex-wrap justify-between md:justify-end">
                  {/* MRP */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#9aa89b] uppercase">MRP</span>
                    <span className="text-xs text-[#9aa89b] line-through font-semibold">₹{p.mrp}</span>
                  </div>

                  {/* Customer Price */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#006a39] uppercase">Customer</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-extrabold text-[#073b4c]">₹{p.customerPrice}</span>
                      {p.mrp > p.customerPrice && (
                        <span className="text-[9px] bg-[#d1fae5] text-[#047857] px-1 py-0.2 rounded font-bold">
                          {Math.round(((p.mrp - p.customerPrice) / p.mrp) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Retailer Price */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#0369a1] uppercase">Retailer</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-extrabold text-[#0369a1]">₹{p.retailerPrice}</span>
                      {p.customerPrice > p.retailerPrice && (
                        <span className="text-[9px] bg-[#dbeafe] text-[#1d4ed8] px-1 py-0.2 rounded font-bold">
                          {Math.round(((p.customerPrice - p.retailerPrice) / p.customerPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock & Status */}
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-xs font-black text-[#073b4c]">{p.stock} units</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                      style={{ color: st.color, backgroundColor: st.bg }}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="p-2 rounded-xl bg-[#e0f2fe] text-[#0369a1] hover:bg-[#bae6fd] transition-colors cursor-pointer shadow-2xs"
                    title="Edit Product"
                  >
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none"><path d="M8.5 1.5L11.5 4.5M1 12L2 9L9.5 1.5L12.5 4.5L5 12H1V12Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    className="p-2 rounded-xl bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] transition-colors cursor-pointer shadow-2xs"
                    title="Delete Product"
                  >
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none"><path d="M2 4H11M4.5 4V2.5H8.5V4M5.5 6.5V10M7.5 6.5V10M3 4L3.75 11H9.25L10 4H3Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="py-16 text-center text-[#9aa89b] text-sm flex flex-col items-center gap-2">
            <span className="text-3xl">🔍</span>
            <p>No products match your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Inventory Tab ─── */
function InventoryTab({ products, filter, setFilter, search, setSearch, stockEdits, setStockEdits, onApplyStock, lowStockCount, outOfStockCount, allCount }: {
  products: Product[]; filter: string; setFilter: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  stockEdits: Record<number, string>;
  setStockEdits: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onApplyStock: (id: number) => void;
  lowStockCount: number; outOfStockCount: number; allCount: number;
}) {
  const inStockCount = allCount - lowStockCount - outOfStockCount;
  const FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock"];
  const filterCounts: Record<string, number> = { "All": allCount, "In Stock": inStockCount, "Low Stock": lowStockCount, "Out of Stock": outOfStockCount };

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <div className="relative">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa89b] pointer-events-none">
          <path d="M13 13L10 10M11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, SKU, brand or category…"
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#e4ede2] rounded-xl focus:outline-none focus:border-[#073b4c] transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa89b] hover:text-[#073b4c] transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[{ label: "In Stock", count: inStockCount, color: "#047857", bg: "#d1fae5" }, { label: "Low Stock", count: lowStockCount, color: "#c2410c", bg: "#ffedd5" }, { label: "Out of Stock", count: outOfStockCount, color: "#b91c1c", bg: "#fee2e2" }].map((s) => (
          <button key={s.label} onClick={() => setFilter(s.label)} className="bg-white rounded-2xl border border-[#e4ede2] p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow text-left cursor-pointer">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-['Manrope',sans-serif] font-extrabold text-lg sm:text-xl shrink-0" style={{ color: s.color, backgroundColor: s.bg }}>{s.count}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9aa89b]">{s.label}</p>
              <p className="text-xs text-[#6d7a6f] mt-0.5">{s.count === 0 ? "No items" : `${s.count} products`}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer"
            style={
              filter === f
                ? { backgroundColor: "#073b4c", color: "white" }
                : { backgroundColor: "white", color: "#6d7a6f", border: "1px solid #e4ede2" }
            }
          >
            {f} ({filterCounts[f] ?? 0})
          </button>
        ))}
      </div>

      {/* Inventory Compact List (Zero Horizontal Scrollbar) */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden shadow-xs">
        <div className="divide-y divide-[#f0f4f0]">
          {products.map((p) => {
            const st = stockStatus(p.stock);
            const catColor = CAT_ACCENT[p.category] ?? "#374151";
            const pct = Math.min((p.stock / 200) * 100, 100);

            return (
              <div
                key={p.id}
                className="p-3.5 sm:p-4 hover:bg-[#fafcfa] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Product Identity */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#073b4c] text-sm truncate">{p.name}</p>
                    <span className="font-mono text-[10px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-1.5 py-0.2 rounded font-bold">
                      HSN: {p.hsn}
                    </span>
                    <span className="font-mono text-[10px] text-[#9aa89b]">{p.sku}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: catColor, backgroundColor: catColor + "18" }}>
                      {p.category.split(",")[0].split(" & ")[0]}
                    </span>
                  </div>
                </div>

                {/* Stock Progress Bar & Count */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['Manrope',sans-serif] font-black text-sm text-[#073b4c] w-9 text-right">{p.stock}</span>
                    <div className="w-20 sm:w-28 h-2 bg-[#f0f4f0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: st.color, backgroundColor: st.bg }}>
                    {st.label}
                  </span>
                </div>

                {/* Quick Stock Updater Controls */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={stockEdits[p.id] ?? ""}
                      onChange={(e) => setStockEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") onApplyStock(p.id); }}
                      placeholder={String(p.stock)}
                      className="w-18 bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#073b4c] focus:outline-none focus:border-[#073b4c] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => onApplyStock(p.id)}
                      disabled={!stockEdits[p.id]}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#073b4c] text-white transition-colors disabled:opacity-30 hover:opacity-90 cursor-pointer shadow-2xs"
                    >
                      Save
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStockEdits((prev) => ({ ...prev, [p.id]: String(p.stock + 10) }));
                        setTimeout(() => onApplyStock(p.id), 50);
                      }}
                      className="text-[10px] font-black px-2 py-1 rounded-lg bg-[#e8f5ee] text-[#006a39] hover:bg-[#d1fae5] transition-colors cursor-pointer"
                      title="Add 10 units"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockEdits((prev) => ({ ...prev, [p.id]: String(p.stock + 50) }));
                        setTimeout(() => onApplyStock(p.id), 50);
                      }}
                      className="text-[10px] font-black px-2 py-1 rounded-lg bg-[#e8f5ee] text-[#006a39] hover:bg-[#d1fae5] transition-colors cursor-pointer"
                      title="Add 50 units"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockEdits((prev) => ({ ...prev, [p.id]: "0" }));
                        setTimeout(() => onApplyStock(p.id), 50);
                      }}
                      className="text-[10px] font-black px-2 py-1 rounded-lg bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] transition-colors cursor-pointer"
                      title="Set to Out of Stock (0)"
                    >
                      0
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab({
  orders,
  filter,
  setFilter,
  onUpdateStatus,
  onDeleteOrder,
  onRefresh,
  isRefreshing = false,
  settings,
}: {
  orders: {
    id: string;
    dbId: string;
    customer: string;
    phone: string;
    items: number;
    amount: number;
    status: string;
    date: string;
    payment: string;
    role?: "retailer" | "customer";
    shopName?: string;
  }[];
  filter: string;
  setFilter: (v: string) => void;
  onUpdateStatus?: (
    orderId: string,
    newStatus: "Processing" | "Dispatched" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled"
  ) => void;
  onDeleteOrder?: (orderId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  settings?: Settings;
}) {
  const [roleSegment, setRoleSegment] = useState<"all" | "retailer" | "customer">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Selected orders state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deletedIdsInTab, setDeletedIdsInTab] = useState<string[]>([]);

  // Delete confirmation modal states (asks second time for Yes / No)
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<{
    id: string;
    dbId?: string;
    customer: string;
    amount: number;
  } | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const handleConfirmSingleDelete = () => {
    if (!confirmDeleteOrder) return;
    const targetId = confirmDeleteOrder.dbId || confirmDeleteOrder.id;
    const targetOrderNumber = confirmDeleteOrder.id;

    // 1. Immediately remove from tab view & selection in 0ms
    setDeletedIdsInTab((prev) => Array.from(new Set([...prev, targetId, targetOrderNumber])));
    setSelectedOrderIds((prev) => prev.filter((id) => id !== targetOrderNumber && id !== targetId));
    setConfirmDeleteOrder(null);

    // 2. Execute deletion
    onDeleteOrder?.(targetId);
    if (targetOrderNumber && targetOrderNumber !== targetId) {
      onDeleteOrder?.(targetOrderNumber);
    }
  };

  const handleConfirmBulkDelete = () => {
    const idsToDelete = [...selectedOrderIds];
    setDeletedIdsInTab((prev) => Array.from(new Set([...prev, ...idsToDelete])));
    setSelectedOrderIds([]);
    setConfirmBulkDelete(false);

    for (const ordId of idsToDelete) {
      const target = orders.find((o) => o.id === ordId);
      onDeleteOrder?.(target?.dbId || ordId);
      if (target?.id && target.id !== target.dbId) {
        onDeleteOrder?.(target.id);
      }
    }
  };

  // Modal & download states
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceOrderData | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingDaily, setDownloadingDaily] = useState(false);

  const STATUS_FILTERS = ["All", "Processing", "Dispatched", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

  // Toggle single order selection
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Select/Deselect all visible orders
  const handleToggleSelectAllVisible = () => {
    if (selectedOrderIds.length === displayedOrders.length && displayedOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(displayedOrders.map((o) => o.id));
    }
  };

  // Select/Deselect all orders for a specific day
  const handleToggleSelectDay = (dayItems: { id: string }[]) => {
    const dayIds = dayItems.map((o) => o.id);
    const allDaySelected = dayIds.every((id) => selectedOrderIds.includes(id));
    if (allDaySelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !dayIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...dayIds])));
    }
  };

  // Bulk update status for all selected orders
  const handleBulkStatusUpdate = (newStatus: "Processing" | "Dispatched" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled") => {
    if (selectedOrderIds.length === 0) return;
    for (const ordId of selectedOrderIds) {
      const target = orders.find((o) => o.id === ordId);
      if (target) {
        onUpdateStatus?.(target.dbId || target.id, newStatus);
      }
    }
    setSelectedOrderIds([]);
  };

  // Bulk print/download invoices for selected orders
  const handleBulkPrintSelectedInvoices = () => {
    const selectedList = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selectedList.length === 0) return;
    printOrDownloadDailyReport(`Selected Batch (${selectedList.length} Orders)`, selectedList, settings);
  };

  // Selected orders summary metrics
  const selectedOrdersData = useMemo(
    () => orders.filter((o) => selectedOrderIds.includes(o.id)),
    [orders, selectedOrderIds]
  );
  const selectedTotalAmount = useMemo(
    () => selectedOrdersData.reduce((sum, o) => sum + o.amount, 0),
    [selectedOrdersData]
  );

  // Metrics computation
  const retailerOrders = useMemo(() => orders.filter((o) => o.role === "retailer"), [orders]);
  const customerOrders = useMemo(() => orders.filter((o) => o.role !== "retailer"), [orders]);

  const retailerRevenue = useMemo(
    () => retailerOrders.filter((o) => o.status !== "Cancelled").reduce((acc, o) => acc + o.amount, 0),
    [retailerOrders]
  );
  const customerRevenue = useMemo(
    () => customerOrders.filter((o) => o.status !== "Cancelled").reduce((acc, o) => acc + o.amount, 0),
    [customerOrders]
  );

  const retailerPending = useMemo(
    () => retailerOrders.filter((o) => o.status === "Processing" || o.status === "Shipped").length,
    [retailerOrders]
  );
  const customerPending = useMemo(
    () => customerOrders.filter((o) => o.status === "Processing" || o.status === "Shipped").length,
    [customerOrders]
  );

  // Filtered orders list
  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      // Exclude locally deleted orders in this tab
      if (deletedIdsInTab.includes(o.id) || (o.dbId && deletedIdsInTab.includes(o.dbId))) return false;

      // Role filter
      if (roleSegment === "retailer" && o.role !== "retailer") return false;
      if (roleSegment === "customer" && o.role === "retailer") return false;

      // Status filter
      if (filter !== "All" && o.status !== filter) return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchCustomer = o.customer.toLowerCase().includes(q);
        const matchShop = o.shopName ? o.shopName.toLowerCase().includes(q) : false;
        const matchPhone = o.phone.includes(q);
        if (!matchId && !matchCustomer && !matchShop && !matchPhone) return false;
      }

      return true;
    });
  }, [orders, roleSegment, filter, searchQuery, deletedIdsInTab]);

  // Group displayed orders chronologically by date/day
  const groupedOrdersByDate = useMemo(() => {
    const map = new Map<string, typeof displayedOrders>();
    for (const ord of displayedOrders) {
      const dKey = ord.date || "Recent";
      if (!map.has(dKey)) {
        map.set(dKey, []);
      }
      map.get(dKey)!.push(ord);
    }

    return Array.from(map.entries()).map(([date, items]) => {
      const totalAmount = items
        .filter((o) => o.status !== "Cancelled")
        .reduce((sum, o) => sum + o.amount, 0);
      const pendingCount = items.filter((o) => o.status === "Processing" || o.status === "Shipped").length;
      const deliveredCount = items.filter((o) => o.status === "Delivered").length;
      return {
        date,
        items,
        totalAmount,
        pendingCount,
        deliveredCount,
      };
    });
  }, [displayedOrders]);

  // Handle single invoice print/pdf dialog
  const handlePrintInvoice = (o: InvoiceOrderData) => {
    printOrDownloadInvoice(o, settings);
  };

  // Handle single invoice direct file download
  const handleDownloadInvoice = (o: InvoiceOrderData) => {
    setDownloadingId(o.id);
    downloadInvoiceFile(o, settings);
    setTimeout(() => setDownloadingId(null), 800);
  };

  // Extract available distinct order dates for easy dropdown picking
  const availableDatesList = useMemo(() => {
    const map = new Map<string, { dateStr: string; rawDate?: string; count: number }>();
    for (const ord of orders) {
      const d = ord.date || "Recent";
      if (!map.has(d)) {
        map.set(d, { dateStr: d, rawDate: (ord as any).rawDate, count: 1 });
      } else {
        map.get(d)!.count += 1;
      }
    }
    return Array.from(map.values());
  }, [orders]);

  // Format date string for report
  const getFormattedReportDate = (targetDate = reportDate) => {
    const dObj = new Date(targetDate);
    return isNaN(dObj.getTime())
      ? targetDate
      : dObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Get orders array strictly filtered for the selected daily report date
  const getDailyOrdersList = (targetDate = reportDate) => {
    const targetFormatted = getFormattedReportDate(targetDate);
    const targetIso = targetDate.includes("T") ? targetDate.split("T")[0] : targetDate;

    return orders.filter((o) => {
      const ordDate = o.date;
      const ordRaw = (o as any).rawDate;

      if (ordDate === targetFormatted || ordDate === targetDate) return true;
      if (ordRaw && ordRaw === targetIso) return true;

      // Date parsing fallback comparison
      const oDateObj = new Date(ordRaw || ordDate);
      const tDateObj = new Date(targetDate);
      if (!isNaN(oDateObj.getTime()) && !isNaN(tDateObj.getTime())) {
        return (
          oDateObj.getFullYear() === tDateObj.getFullYear() &&
          oDateObj.getMonth() === tDateObj.getMonth() &&
          oDateObj.getDate() === tDateObj.getDate()
        );
      }
      return false;
    });
  };

  const selectedDateOrders = useMemo(() => getDailyOrdersList(reportDate), [orders, reportDate]);

  // Handle Daily PDF print/save for selected date
  const handlePrintDailyPdf = (targetDate = reportDate) => {
    const dateFormatted = getFormattedReportDate(targetDate);
    const ordersForDay = getDailyOrdersList(targetDate);
    printOrDownloadDailyReport(dateFormatted, ordersForDay, settings);
  };

  // Handle Daily PDF direct file download for selected date
  const handleDownloadDailyFile = (targetDate = reportDate) => {
    setDownloadingDaily(true);
    const dateFormatted = getFormattedReportDate(targetDate);
    const ordersForDay = getDailyOrdersList(targetDate);
    downloadDailyReportFile(dateFormatted, ordersForDay, settings);
    setTimeout(() => setDownloadingDaily(false), 800);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Daily Orders PDF Export Banner with Custom Date Picker ── */}
      <div className="bg-gradient-to-r from-[#073b4c] via-[#045d5a] to-[#006a39] text-white p-5 sm:p-6 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-lg border border-white/10">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl bg-white/20 p-2 rounded-xl">📄</span>
            <div>
              <h3 className="font-['Manrope',sans-serif] font-extrabold text-base sm:text-xl text-white">
                Daily Orders Management & Invoice Center
              </h3>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                Download verified daily sales & orders reports strictly for your selected date.
              </p>
            </div>
          </div>

          {/* Selected Date Orders Indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="bg-white/15 px-2.5 py-1 rounded-lg border border-white/20 font-bold text-white">
              Selected: <strong>{getFormattedReportDate()}</strong>
            </span>
            <span className={`px-2.5 py-1 rounded-lg font-extrabold ${
              selectedDateOrders.length > 0
                ? "bg-[#00a86b] text-white"
                : "bg-amber-500/80 text-white"
            }`}>
              {selectedDateOrders.length} {selectedDateOrders.length === 1 ? "order" : "orders"} on this date
            </span>
          </div>
        </div>

        {/* Date Selector & Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
          {/* Option 1: Calendar Date Picker */}
          <div className="flex items-center gap-1.5 bg-white/15 px-3 py-2 rounded-xl border border-white/25">
            <span className="text-xs font-bold text-white/90">Pick Date:</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer"
              title="Select specific date for daily report"
            />
          </div>

          {/* Option 2: Quick Dropdown of Available Order Dates */}
          {availableDatesList.length > 0 && (
            <select
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/25 focus:outline-none cursor-pointer"
              title="Quick select date with orders"
            >
              <option value={reportDate} className="text-[#073b4c] font-bold">
                📅 Jump to Date...
              </option>
              {availableDatesList.map((d) => (
                <option
                  key={d.dateStr}
                  value={d.rawDate || d.dateStr}
                  className="text-[#073b4c] font-semibold"
                >
                  {d.dateStr} ({d.count} {d.count === 1 ? "order" : "orders"})
                </option>
              ))}
            </select>
          )}

          {/* Action: Reload Orders */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all border border-white/30 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                isRefreshing ? "opacity-75 cursor-not-allowed" : ""
              }`}
              title="Reload live orders from database"
            >
              <span className={`text-sm ${isRefreshing ? "animate-spin inline-block" : ""}`}>🔄</span>
              <span>{isRefreshing ? "Reloading…" : "Reload"}</span>
            </button>
          )}

          {/* Action: Preview */}
          <button
            type="button"
            onClick={() => setShowDailyModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all border border-white/30 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>👁️</span>
            <span>Preview ({selectedDateOrders.length})</span>
          </button>

          {/* Action: Print / Save PDF */}
          <button
            type="button"
            onClick={() => handlePrintDailyPdf()}
            className="bg-[#00a86b] hover:bg-[#00925c] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            title={`Download PDF Report for ${getFormattedReportDate()}`}
          >
            <span>🖨️</span>
            <span>Print / PDF Report</span>
          </button>

          {/* Action: Save HTML File */}
          <button
            type="button"
            onClick={() => handleDownloadDailyFile()}
            className="bg-white hover:bg-white/90 text-[#073b4c] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Download Daily Report File"
          >
            <span>📥</span>
            <span>{downloadingDaily ? "Saving..." : "Save File"}</span>
          </button>
        </div>
      </div>

      {/* ── Role Management Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* All Orders Card */}
        <div
          onClick={() => setRoleSegment("all")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            roleSegment === "all"
              ? "bg-[#073b4c] text-white border-[#073b4c] shadow-md ring-2 ring-[#073b4c]/30"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#073b4c]/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${roleSegment === "all" ? "text-white/70" : "text-[#9aa89b]"}`}>
              All Orders
            </span>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${roleSegment === "all" ? "bg-white/20 text-white" : "bg-[#f0f4f0] text-[#073b4c]"}`}>
              {orders.length} total
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${roleSegment === "all" ? "text-white" : "text-[#073b4c]"}`}>
            ₹{(retailerRevenue + customerRevenue).toLocaleString()}
          </p>
          <p className={`text-xs mt-1.5 ${roleSegment === "all" ? "text-white/60" : "text-[#6d7a6f]"}`}>
            {retailerPending + customerPending} active fulfillments pending
          </p>
        </div>

        {/* Retailer Orders Card */}
        <div
          onClick={() => setRoleSegment("retailer")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            roleSegment === "retailer"
              ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md ring-2 ring-[#0369a1]/30"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#0369a1]/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🏪</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${roleSegment === "retailer" ? "text-white/80" : "text-[#0369a1]"}`}>
                Retailer Wholesale
              </span>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${roleSegment === "retailer" ? "bg-white/20 text-white" : "bg-[#e0f2fe] text-[#0369a1]"}`}>
              {retailerOrders.length} orders
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${roleSegment === "retailer" ? "text-white" : "text-[#0369a1]"}`}>
            ₹{retailerRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className={roleSegment === "retailer" ? "text-white/70" : "text-[#6d7a6f]"}>
              B2B bulk wholesale orders
            </span>
            <span className={`font-bold ${roleSegment === "retailer" ? "text-amber-200" : "text-[#d97706]"}`}>
              {retailerPending} pending
            </span>
          </div>
        </div>

        {/* Customer Orders Card */}
        <div
          onClick={() => setRoleSegment("customer")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            roleSegment === "customer"
              ? "bg-[#006a39] text-white border-[#006a39] shadow-md ring-2 ring-[#006a39]/30"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#006a39]/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">👤</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${roleSegment === "customer" ? "text-white/80" : "text-[#006a39]"}`}>
                Customer Retail
              </span>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${roleSegment === "customer" ? "bg-white/20 text-white" : "bg-[#d1fae5] text-[#006a39]"}`}>
              {customerOrders.length} orders
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${roleSegment === "customer" ? "text-white" : "text-[#006a39]"}`}>
            ₹{customerRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className={roleSegment === "customer" ? "text-white/70" : "text-[#6d7a6f]"}>
              Direct consumer purchases
            </span>
            <span className={`font-bold ${roleSegment === "customer" ? "text-amber-200" : "text-[#d97706]"}`}>
              {customerPending} pending
            </span>
          </div>
        </div>
      </div>

      {/* ── Segment Toggle Tabs & Search Controls ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e4ede2]">
        {/* Role Segment Tabs */}
        <div className="flex items-center gap-1 bg-[#f0f4f0] p-1 rounded-xl">
          <button
            onClick={() => setRoleSegment("all")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              roleSegment === "all"
                ? "bg-white text-[#073b4c] shadow-xs"
                : "text-[#6d7a6f] hover:text-[#073b4c]"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setRoleSegment("retailer")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              roleSegment === "retailer"
                ? "bg-[#0369a1] text-white shadow-xs"
                : "text-[#6d7a6f] hover:text-[#0369a1]"
            }`}
          >
            <span>🏪 Retailer Orders</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${roleSegment === "retailer" ? "bg-white/20 text-white" : "bg-[#e0f2fe] text-[#0369a1]"}`}>
              {retailerOrders.length}
            </span>
          </button>
          <button
            onClick={() => setRoleSegment("customer")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              roleSegment === "customer"
                ? "bg-[#006a39] text-white shadow-xs"
                : "text-[#6d7a6f] hover:text-[#006a39]"
            }`}
          >
            <span>👤 Customer Orders</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${roleSegment === "customer" ? "bg-white/20 text-white" : "bg-[#d1fae5] text-[#006a39]"}`}>
              {customerOrders.length}
            </span>
          </button>
        </div>

        {/* Right: Search Input & Dedicated Reload Button */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa89b]">
              <path d="M13 13L10 10M11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID, customer name, pharmacy, phone…"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#f8fafb] border border-[#e4ede2] rounded-xl focus:outline-none focus:border-[#073b4c]"
            />
          </div>

          {/* Dedicated Reload Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
                isRefreshing
                  ? "bg-[#e8f5ee] text-[#006a39] border-[#bbf7d0] cursor-not-allowed"
                  : "bg-white text-[#073b4c] border-[#e4ede2] hover:bg-[#f0f7ee] hover:border-[#006a39]/40 hover:text-[#006a39]"
              }`}
              title="Reload live orders from database"
            >
              <span className={`text-sm ${isRefreshing ? "animate-spin inline-block" : ""}`}>🔄</span>
              <span>{isRefreshing ? "Reloading…" : "Reload"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Status Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer"
            style={
              filter === f
                ? { backgroundColor: "#073b4c", color: "white" }
                : { backgroundColor: "white", color: "#6d7a6f", border: "1px solid #e4ede2" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Selection Toolbar & Bulk Actions Bar (Checkboxes) ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e4ede2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Master Select All Checkbox */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={displayedOrders.length > 0 && selectedOrderIds.length === displayedOrders.length}
              onChange={handleToggleSelectAllVisible}
              className="w-4 h-4 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39]"
            />
            <span className="text-xs sm:text-sm font-bold text-[#073b4c]">
              Select All Visible ({displayedOrders.length})
            </span>
          </label>

          {selectedOrderIds.length > 0 && (
            <span className="bg-[#e8f5ee] text-[#006a39] text-xs font-extrabold px-2.5 py-1 rounded-full border border-[#bbf7d0]">
              {selectedOrderIds.length} Selected (₹{selectedTotalAmount.toLocaleString()})
            </span>
          )}
        </div>

        {/* Right: Bulk Action Controls */}
        {selectedOrderIds.length > 0 ? (
          <div className="flex items-center flex-wrap gap-2 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-[#6d7a6f] hidden md:inline">Update {selectedOrderIds.length} Orders:</span>
            
            {/* Bulk Status Buttons */}
            <button
              type="button"
              onClick={() => handleBulkStatusUpdate("Dispatched")}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>📦</span>
              <span>Mark Dispatched</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkStatusUpdate("Shipped")}
              className="bg-[#0369a1] hover:bg-[#0284c7] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>🚚</span>
              <span>Mark Shipped</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkStatusUpdate("Out for Delivery")}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>🛵</span>
              <span>Out for Delivery</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkStatusUpdate("Delivered")}
              className="bg-[#006a39] hover:bg-[#00542d] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>✅</span>
              <span>Mark Delivered</span>
            </button>

            {/* Quick Status Dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkStatusUpdate(e.target.value as any);
              }}
              defaultValue=""
              className="text-xs font-bold bg-[#f8fafb] border border-[#d2e0cf] rounded-xl px-2 py-1.5 text-[#073b4c] focus:outline-none focus:border-[#006a39] cursor-pointer"
            >
              <option value="" disabled>More Status...</option>
              <option value="Processing">Processing ⏳</option>
              <option value="Dispatched">Dispatched 📦</option>
              <option value="Shipped">Shipped 🚚</option>
              <option value="Out for Delivery">Out for Delivery 🛵</option>
              <option value="Delivered">Delivered ✅</option>
              <option value="Cancelled">Cancelled ❌</option>
            </select>

            <button
              type="button"
              onClick={handleBulkPrintSelectedInvoices}
              className="bg-[#073b4c] hover:bg-[#0f4b5e] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>🖨️</span>
              <span>Print Selected Bills</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmBulkDelete(true)}
              className="bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Delete all selected orders"
            >
              <span>🗑️</span>
              <span>Delete ({selectedOrderIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Clear selection"
            >
              Clear (✕)
            </button>
          </div>
        ) : (
          <div className="text-xs text-[#9aa89b] font-medium hidden sm:block">
            Tip: Check individual orders or click "Select All" to update delivery status to Dispatched, Shipped, Delivered or batch print.
          </div>
        )}
      </div>

      {/* ── Day-wise Separated Orders Section (Zero Horizontal Scrollbar, Compact Layout) ── */}
      <div className="flex flex-col gap-6">
        {groupedOrdersByDate.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e4ede2] py-16 text-center text-[#9aa89b] text-sm flex flex-col items-center gap-2 shadow-xs">
            <span className="text-4xl">📦</span>
            <p className="font-bold text-[#073b4c]">No orders found</p>
            <p className="text-xs text-[#6d7a6f]">No orders match the selected filters or search query.</p>
          </div>
        ) : (
          groupedOrdersByDate.map((group) => {
            const isDayAllSelected = group.items.length > 0 && group.items.every((item) => selectedOrderIds.includes(item.id));
            const isDayPartiallySelected = group.items.some((item) => selectedOrderIds.includes(item.id));

            return (
              <div
                key={group.date}
                className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden shadow-xs"
              >
                {/* Day Header Banner with Day Selection Checkbox & Delivery Status Update Section */}
                <div className="bg-[#f0f7f0] border-b border-[#d8ead8] px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isDayAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isDayPartiallySelected && !isDayAllSelected;
                      }}
                      onChange={() => handleToggleSelectDay(group.items)}
                      className="w-4 h-4 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39] shrink-0"
                      title="Select/Deselect all orders for this day"
                    />
                    <div className="w-8 h-8 rounded-xl bg-[#006a39] text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                      📅
                    </div>
                    <div>
                      <h4 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base">
                        {group.date}
                      </h4>
                      <p className="text-[11px] text-[#6d7a6f] font-medium">
                        {group.items.length} {group.items.length === 1 ? "Order" : "Orders"} placed on this day
                      </p>
                    </div>
                  </div>

                  {/* Day Summary Badges, Status Update Section, and 1-Click Day Report Button */}
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="bg-white border border-[#c3dec0] text-[#006a39] font-black px-2.5 py-1 rounded-xl shadow-2xs">
                      Day Total: ₹{group.totalAmount.toLocaleString()}
                    </span>
                    {group.pendingCount > 0 && (
                      <span className="bg-[#fef3c7] border border-[#fde68a] text-[#b45309] font-black px-2.5 py-1 rounded-xl">
                        {group.pendingCount} Pending
                      </span>
                    )}
                    {group.deliveredCount > 0 && (
                      <span className="bg-[#d1fae5] border border-[#a7f3d0] text-[#047857] font-black px-2.5 py-1 rounded-xl">
                        {group.deliveredCount} Delivered
                      </span>
                    )}

                    {/* ── Day Delivery Status Update Section ── */}
                    <div className="flex items-center gap-1.5 bg-white border border-[#bbf7d0] rounded-xl px-2.5 py-1 shadow-2xs">
                      <span className="text-[11px] font-extrabold text-[#006a39]">Status:</span>
                      <select
                        onChange={(e) => {
                          const newSt = e.target.value as any;
                          if (newSt) {
                            for (const item of group.items) {
                              onUpdateStatus?.(item.dbId || item.id, newSt);
                            }
                          }
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="bg-transparent text-xs font-bold text-[#073b4c] focus:outline-none cursor-pointer"
                        title="Update all orders on this date"
                      >
                        <option value="" disabled>Update Day ({group.items.length}) ▾</option>
                        <option value="Processing">Processing ⏳</option>
                        <option value="Dispatched">Dispatched 📦</option>
                        <option value="Shipped">Shipped 🚚</option>
                        <option value="Out for Delivery">Out for Delivery 🛵</option>
                        <option value="Delivered">Delivered ✅</option>
                        <option value="Cancelled">Cancelled ❌</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintDailyPdf(group.date)}
                      className="bg-[#006a39] hover:bg-[#00542d] text-white font-bold px-3 py-1 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 ml-1"
                      title={`Print or Download Daily Report for ${group.date}`}
                    >
                      <span>📄</span>
                      <span>Day PDF Report</span>
                    </button>
                  </div>
                </div>

                {/* Day Orders Compact List with Checkboxes (No Horizontal Scrollbar) */}
                <div className="divide-y divide-[#f0f4f0]">
                  {group.items.map((o) => {
                    const st = orderStatus(o.status);
                    const isRetailerOrder = o.role === "retailer";
                    const isDownloadingThis = downloadingId === o.id;
                    const isSelected = selectedOrderIds.includes(o.id);

                    return (
                      <div
                        key={o.id}
                        className={`p-3.5 sm:p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 ${
                          isSelected ? "bg-[#f4fbf5] ring-1 ring-[#006a39]/30" : "hover:bg-[#fafcfa]"
                        }`}
                      >
                        {/* Left: Row Selection Checkbox, Order ID, Role Badge, Customer / Shop Info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(o.id)}
                            className="w-4 h-4 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39] shrink-0 mt-2.5"
                            title={`Select Order #${o.id}`}
                          />

                          <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#006a39] flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                            {isRetailerOrder ? "🏪" : "👤"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-[#006a39]">
                                {o.id}
                              </span>
                              {isRetailerOrder ? (
                                <span className="inline-flex items-center gap-1 bg-[#e0f2fe] text-[#0369a1] text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border border-[#bae6fd]">
                                  Retailer
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-[#d1fae5] text-[#047857] text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border border-[#a7f3d0]">
                                  Customer
                                </span>
                              )}
                              <span className="text-[10px] text-[#9aa89b] font-medium">
                                {o.date}
                              </span>
                            </div>

                            <p className="font-bold text-[#073b4c] text-xs sm:text-sm mt-0.5 truncate">
                              {o.customer}
                              {isRetailerOrder && o.shopName && (
                                <span className="text-[#0369a1] font-semibold text-xs ml-1.5">
                                  · {o.shopName}
                                </span>
                              )}
                            </p>

                            <div className="flex items-center gap-2 text-[11px] text-[#6d7a6f] mt-0.5 flex-wrap">
                              <span className="font-mono">📞 {o.phone}</span>
                              <span>•</span>
                              <span>{o.items} {o.items === 1 ? "item" : "items"}</span>
                              <span>•</span>
                              <span className="bg-[#f0f4f0] text-[#475569] font-bold px-1.5 py-0.2 rounded text-[10px]">
                                {o.payment}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Amount & Status Dropdown with Dispatched & Out for Delivery */}
                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#f0f4f0]">
                          <div className="text-left md:text-right">
                            <p className="font-['Manrope',sans-serif] font-black text-sm sm:text-base text-[#073b4c]">
                              ₹{o.amount.toLocaleString()}
                            </p>
                            <span
                              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                              style={{ color: st.color, backgroundColor: st.bg }}
                            >
                              {o.status}
                            </span>
                          </div>

                          {/* Status dropdown */}
                          <select
                            value={o.status}
                            onChange={(e) =>
                              onUpdateStatus?.(
                                o.dbId || o.id,
                                e.target.value as any
                              )
                            }
                            className="text-xs font-bold bg-[#f8fafb] border border-[#d2e0cf] rounded-xl px-2.5 py-1.5 text-[#073b4c] focus:outline-none focus:border-[#006a39] cursor-pointer shadow-2xs"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Right: Compact Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(o)}
                            title="Print or Save PDF Invoice"
                            className="flex items-center gap-1 bg-[#006a39] hover:bg-[#00542d] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <span>🖨️</span>
                            <span className="hidden sm:inline">PDF Bill</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(o)}
                            title="Download Invoice HTML"
                            className="flex items-center gap-1 bg-[#f0f7ee] hover:bg-[#dcf0db] text-[#006a39] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border border-[#c3dec0] cursor-pointer"
                          >
                            <span>📥</span>
                            <span className="hidden sm:inline">{isDownloadingThis ? "..." : "Save"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(o)}
                            title="Inspect full order details"
                            className="flex items-center gap-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            <span>👁️</span>
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteOrder({
                                id: o.id,
                                dbId: o.dbId,
                                customer: o.customer,
                                amount: o.amount,
                              })
                            }
                            title="Delete this order"
                            className="flex items-center gap-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <span>🗑️</span>
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Compact Order Details & Invoice Preview Modal (Zero Horizontal Scrollbar) ── */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-[#073b4c] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="text-xl">🧾</span>
                <div className="truncate">
                  <span className="font-extrabold text-sm sm:text-base">Order Details & Invoice</span>
                  <span className="text-xs text-white/70 font-mono block sm:inline sm:ml-2">#{previewInvoice.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => printOrDownloadInvoice(previewInvoice, settings)}
                  className="bg-[#00a86b] hover:bg-[#00925c] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>🖨️</span>
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Compact Order Details Body */}
            <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden bg-[#f8fafb] flex flex-col gap-4 text-xs">
              {/* Order Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-[#e4ede2]">
                  <p className="text-[10px] font-bold text-[#9aa89b] uppercase tracking-wider">Customer Details</p>
                  <p className="font-bold text-[#073b4c] text-sm mt-1">{previewInvoice.customer}</p>
                  {previewInvoice.role === "retailer" && previewInvoice.shopName && (
                    <p className="text-[#0369a1] font-semibold text-xs mt-0.5">🏪 {previewInvoice.shopName}</p>
                  )}
                  <p className="text-[#6d7a6f] mt-1 font-mono">📞 {previewInvoice.phone}</p>
                  <p className="text-[11px] text-[#6d7a6f] mt-1">{previewInvoice.address || "Standard Express Delivery"}</p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#e4ede2]">
                  <p className="text-[10px] font-bold text-[#9aa89b] uppercase tracking-wider">Order & Payment Info</p>
                  <p className="font-mono font-bold text-[#006a39] text-sm mt-1">ID: {previewInvoice.id}</p>
                  <p className="text-[#6d7a6f] mt-0.5">Date: <strong>{previewInvoice.date}</strong></p>
                  <p className="text-[#6d7a6f] mt-0.5">Payment: <strong>{previewInvoice.payment}</strong></p>
                  <p className="text-[#6d7a6f] mt-0.5">Status: <strong className="text-[#006a39]">{previewInvoice.status}</strong></p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-xl border border-[#e4ede2] overflow-hidden">
                <div className="p-3 bg-[#f0f7f0] border-b border-[#e4ede2] flex items-center justify-between font-bold text-[#073b4c]">
                  <span>Ordered Items ({previewInvoice.items})</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-[#f0f4f0] p-3 flex flex-col gap-2">
                  {(previewInvoice.orderItems && previewInvoice.orderItems.length > 0) ? (
                    previewInvoice.orderItems.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-xs">
                        <div>
                          <p className="font-bold text-[#073b4c]">{it.name}</p>
                          <p className="text-[10px] text-[#9aa89b]">Qty: {it.quantity} × ₹{it.price}</p>
                        </div>
                        <span className="font-bold text-[#073b4c]">₹{(it.quantity * it.price).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between py-1 text-xs">
                      <div>
                        <p className="font-bold text-[#073b4c]">
                          {previewInvoice.role === "retailer" ? "Wholesale Medical Supplies Package" : "Pharmacy Health Package"}
                        </p>
                        <p className="text-[10px] text-[#9aa89b]">Qty: {previewInvoice.items} items</p>
                      </div>
                      <span className="font-bold text-[#073b4c]">₹{previewInvoice.amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="p-3 bg-[#f8fafb] border-t border-[#e4ede2] flex items-center justify-between font-extrabold text-sm text-[#073b4c]">
                  <span>Total Grand Amount</span>
                  <span className="text-[#006a39] text-base">₹{previewInvoice.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Bill View */}
              <div
                className="bg-white p-3 rounded-xl border border-[#e4ede2] overflow-x-hidden"
                dangerouslySetInnerHTML={{ __html: generateInvoiceHtml(previewInvoice, settings) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Daily Orders Report Preview Modal ── */}
      {showDailyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-[#073b4c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <span className="font-bold text-sm sm:text-base">
                  Daily Orders Report Preview ({getFormattedReportDate()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printOrDownloadDailyReport(getFormattedReportDate(), getDailyOrdersList(), settings)}
                  className="bg-[#00a86b] hover:bg-[#00925c] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => downloadDailyReportFile(getFormattedReportDate(), getDailyOrdersList(), settings)}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>📥</span>
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setShowDailyModal(false)}
                  className="text-white/80 hover:text-white text-lg font-bold px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content / Visual Preview */}
            <div
              className="p-6 overflow-y-auto bg-[#fafafa]"
              dangerouslySetInnerHTML={{
                __html: generateDailyReportHtml(getFormattedReportDate(), getDailyOrdersList(), settings),
              }}
            />
          </div>
        </div>
      )}

      {/* ── Single Order Delete Confirmation Modal (Yes / No) ── */}
      {confirmDeleteOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setConfirmDeleteOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#fee2e2] flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">
                  Delete Order #{confirmDeleteOrder.id}?
                </h3>
                <p className="text-xs text-[#9aa89b]">Please confirm if you want to permanently delete this order.</p>
              </div>
            </div>

            <div className="bg-[#fef2f2] border border-[#fecaca] p-3.5 rounded-xl text-xs text-[#7f1d1d] leading-relaxed">
              Are you sure you want to delete order <strong>#{confirmDeleteOrder.id}</strong> for <strong>{confirmDeleteOrder.customer}</strong> (₹{confirmDeleteOrder.amount.toLocaleString()})?
              <p className="mt-1 font-bold text-[#b91c1c]">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-[#e4ede2] text-xs font-bold text-[#073b4c] hover:bg-[#f0f4f0] transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Orders Delete Confirmation Modal (Yes / No) ── */}
      {confirmBulkDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setConfirmBulkDelete(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#fee2e2] flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">
                  Delete {selectedOrderIds.length} Orders?
                </h3>
                <p className="text-xs text-[#9aa89b]">Please confirm if you want to permanently delete these orders.</p>
              </div>
            </div>

            <div className="bg-[#fef2f2] border border-[#fecaca] p-3.5 rounded-xl text-xs text-[#7f1d1d] leading-relaxed">
              Are you sure you want to permanently delete all <strong>{selectedOrderIds.length} selected orders</strong>?
              <p className="mt-1 font-bold text-[#b91c1c]">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(false)}
                className="px-4 py-2.5 rounded-xl border border-[#e4ede2] text-xs font-bold text-[#073b4c] hover:bg-[#f0f4f0] transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Yes, Delete All ({selectedOrderIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Retailers Tab (Role-Based Approvals Management) ─── */
function RetailersTab({
  retailers,
  onUpdateApproval,
  onRefresh,
  isRefreshing = false,
}: {
  retailers: RetailerAccount[];
  onUpdateApproval: (retailerId: string, status: "pending" | "approved" | "rejected") => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const [filter, setFilter] = useState<"All" | "pending" | "approved" | "rejected">("All");
  const [search, setSearch] = useState("");

  const pendingCount = useMemo(() => retailers.filter((r) => r.approvalStatus === "pending").length, [retailers]);
  const approvedCount = useMemo(() => retailers.filter((r) => r.approvalStatus === "approved").length, [retailers]);
  const rejectedCount = useMemo(() => retailers.filter((r) => r.approvalStatus === "rejected").length, [retailers]);

  const filteredRetailers = useMemo(() => {
    return retailers.filter((r) => {
      if (filter !== "All" && r.approvalStatus !== filter) return false;
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const matchShop = r.shopName.toLowerCase().includes(q);
        const matchName = r.fullName.toLowerCase().includes(q);
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchPhone = r.phone ? r.phone.includes(q) : false;
        if (!matchShop && !matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [retailers, filter, search]);

  const getStatusBadge = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#d1fae5] text-[#047857] border border-[#a7f3d0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
            Approved & Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#fef3c7] text-[#d97706] border border-[#fde68a] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            Pending Approval
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
            Declined / Suspended
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Retailers */}
        <div
          onClick={() => setFilter("All")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === "All"
              ? "bg-[#073b4c] text-white border-[#073b4c] shadow-md ring-2 ring-[#073b4c]/20"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#073b4c]/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${filter === "All" ? "text-white/70" : "text-[#9aa89b]"}`}>
              Total Retailers
            </span>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${filter === "All" ? "bg-white/20 text-white" : "bg-[#f0f4f0] text-[#073b4c]"}`}>
              {retailers.length} registered
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${filter === "All" ? "text-white" : "text-[#073b4c]"}`}>
            {retailers.length}
          </p>
          <p className={`text-xs mt-1.5 ${filter === "All" ? "text-white/60" : "text-[#6d7a6f]"}`}>
            Platform wholesale partners
          </p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setFilter("pending")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === "pending"
              ? "bg-[#d97706] text-white border-[#d97706] shadow-md ring-2 ring-[#d97706]/30"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#d97706]/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">⏳</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${filter === "pending" ? "text-white/80" : "text-[#d97706]"}`}>
                Pending Approvals
              </span>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${filter === "pending" ? "bg-white/20 text-white" : "bg-[#fef3c7] text-[#d97706]"}`}>
              {pendingCount} action req.
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${filter === "pending" ? "text-white" : "text-[#d97706]"}`}>
            {pendingCount}
          </p>
          <p className={`text-xs mt-1.5 ${filter === "pending" ? "text-white/70" : "text-[#6d7a6f]"}`}>
            {pendingCount > 0 ? "Requires admin review" : "All applications reviewed"}
          </p>
        </div>

        {/* Approved Retailers */}
        <div
          onClick={() => setFilter("approved")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === "approved"
              ? "bg-[#006a39] text-white border-[#006a39] shadow-md ring-2 ring-[#006a39]/30"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#006a39]/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">✅</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${filter === "approved" ? "text-white/80" : "text-[#006a39]"}`}>
                Active Retailers
              </span>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${filter === "approved" ? "bg-white/20 text-white" : "bg-[#d1fae5] text-[#006a39]"}`}>
              {approvedCount} active
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${filter === "approved" ? "text-white" : "text-[#006a39]"}`}>
            {approvedCount}
          </p>
          <p className={`text-xs mt-1.5 ${filter === "approved" ? "text-white/70" : "text-[#6d7a6f]"}`}>
            Full login & wholesale ordering access
          </p>
        </div>

        {/* Declined / Suspended */}
        <div
          onClick={() => setFilter("rejected")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === "rejected"
              ? "bg-[#b91c1c] text-white border-[#b91c1c] shadow-md ring-2 ring-[#b91c1c]/30"
              : "bg-white text-[#073b4c] border-[#e4ede2] hover:border-[#b91c1c]/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base">❌</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${filter === "rejected" ? "text-white/80" : "text-[#b91c1c]"}`}>
                Declined / Suspended
              </span>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${filter === "rejected" ? "bg-white/20 text-white" : "bg-[#fee2e2] text-[#b91c1c]"}`}>
              {rejectedCount}
            </span>
          </div>
          <p className={`font-['Manrope',sans-serif] font-extrabold text-2xl sm:text-3xl ${filter === "rejected" ? "text-white" : "text-[#b91c1c]"}`}>
            {rejectedCount}
          </p>
          <p className={`text-xs mt-1.5 ${filter === "rejected" ? "text-white/70" : "text-[#6d7a6f]"}`}>
            Blocked from logging in
          </p>
        </div>
      </div>

      {/* ── Toolbar: Filter Tabs, Search & Dedicated Reload Button ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e4ede2]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#f0f4f0] p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter("All")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === "All" ? "bg-white text-[#073b4c] shadow-xs" : "text-[#6d7a6f] hover:text-[#073b4c]"
            }`}
          >
            All ({retailers.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === "pending" ? "bg-[#d97706] text-white shadow-xs" : "text-[#6d7a6f] hover:text-[#d97706]"
            }`}
          >
            <span>⏳ Pending</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === "pending" ? "bg-white/25 text-white" : "bg-[#fef3c7] text-[#d97706]"}`}>
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === "approved" ? "bg-[#006a39] text-white shadow-xs" : "text-[#6d7a6f] hover:text-[#006a39]"
            }`}
          >
            <span>✅ Approved</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === "approved" ? "bg-white/25 text-white" : "bg-[#d1fae5] text-[#006a39]"}`}>
              {approvedCount}
            </span>
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === "rejected" ? "bg-[#b91c1c] text-white shadow-xs" : "text-[#6d7a6f] hover:text-[#b91c1c]"
            }`}
          >
            <span>❌ Declined</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === "rejected" ? "bg-white/25 text-white" : "bg-[#fee2e2] text-[#b91c1c]"}`}>
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Right: Search & Dedicated Reload Button */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa89b]">
              <path d="M13 13L10 10M11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shop, retailer name, email, phone…"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#f8fafb] border border-[#e4ede2] rounded-xl focus:outline-none focus:border-[#073b4c]"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
              isRefreshing
                ? "bg-[#e8f5ee] text-[#006a39] border-[#bbf7d0] cursor-not-allowed"
                : "bg-white text-[#073b4c] border-[#e4ede2] hover:bg-[#f0f7ee] hover:border-[#006a39]/40 hover:text-[#006a39]"
            }`}
            title="Reload retailers and live approval statuses"
          >
            <span className={`text-sm ${isRefreshing ? "animate-spin inline-block" : ""}`}>🔄</span>
            <span>{isRefreshing ? "Reloading…" : "Reload"}</span>
          </button>
        </div>
      </div>

      {/* ── Retailers List Table ── */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "850px" }}>
            <thead>
              <tr className="border-b border-[#e4ede2] bg-[#f8fafb]">
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px]">
                  Shop & Business
                </th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px]">
                  Owner / Contact
                </th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px]">
                  Registration Date
                </th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px]">
                  Status
                </th>
                <th className="text-right px-4 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px]">
                  Approval Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRetailers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9aa89b]">
                    <div className="text-3xl mb-2">🏪</div>
                    <p className="text-sm font-semibold text-[#073b4c]">No retailers found</p>
                    <p className="text-xs text-[#9aa89b] mt-0.5">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredRetailers.map((r) => {
                  const regDate = new Date(r.createdAt);
                  const regDateStr = !isNaN(regDate.getTime())
                    ? regDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Recent";

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[#f0f4f0] last:border-0 hover:bg-[#fafcfa] transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center font-bold text-lg shrink-0">
                            🏪
                          </div>
                          <div>
                            <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm leading-tight">
                              {r.shopName}
                            </p>
                            <span className="inline-block text-[10px] bg-[#f0f4f0] text-[#6d7a6f] px-2 py-0.5 rounded font-mono mt-1">
                              ID: {r.id.slice(0, 16)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#073b4c] text-xs sm:text-sm">{r.fullName}</p>
                        <p className="text-[#6d7a6f] text-xs mt-0.5">{r.email}</p>
                        {r.phone && <p className="text-[#9aa89b] text-[11px] mt-0.5">{r.phone}</p>}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#073b4c]">{regDateStr}</p>
                        <p className="text-[10px] text-[#9aa89b]">Role: Retailer</p>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(r.approvalStatus)}
                      </td>

                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {r.approvalStatus === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateApproval(r.id, "approved")}
                                className="px-3.5 py-1.5 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Approve retailer to grant immediate login access"
                              >
                                <span>✅</span>
                                <span>Approve Retailer</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateApproval(r.id, "rejected")}
                                className="px-3 py-1.5 rounded-xl border border-[#fecaca] bg-[#fff5f5] hover:bg-[#fee2e2] text-[#b91c1c] text-xs font-bold transition-all cursor-pointer"
                                title="Decline this retailer registration"
                              >
                                <span>❌ Decline</span>
                              </button>
                            </>
                          )}

                          {r.approvalStatus === "approved" && (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateApproval(r.id, "pending")}
                                className="px-3 py-1.5 rounded-xl border border-[#e4ede2] bg-white hover:bg-[#fef3c7] text-[#d97706] text-xs font-bold transition-all cursor-pointer"
                                title="Set back to pending verification"
                              >
                                <span>⏳ Set Pending</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateApproval(r.id, "rejected")}
                                className="px-3 py-1.5 rounded-xl border border-[#fecaca] bg-white hover:bg-[#fee2e2] text-[#b91c1c] text-xs font-bold transition-all cursor-pointer"
                                title="Suspend retailer access"
                              >
                                <span>Suspend</span>
                              </button>
                            </>
                          )}

                          {r.approvalStatus === "rejected" && (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateApproval(r.id, "approved")}
                                className="px-3.5 py-1.5 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Approve and reinstate retailer access"
                              >
                                <span>✅ Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateApproval(r.id, "pending")}
                                className="px-3 py-1.5 rounded-xl border border-[#e4ede2] bg-white hover:bg-[#f0f4f0] text-[#6d7a6f] text-xs font-bold transition-all cursor-pointer"
                              >
                                <span>Set Pending</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Lab Bookings Tab ─── */
function LabBookingsTab({
  bookings,
  onUpdateStatus,
}: {
  bookings: DbLabBooking[];
  onUpdateStatus?: (bookingId: string, status: DbLabBooking["status"]) => void;
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const FILTERS = ["All", "Scheduled", "Sample Collected", "Processing", "Report Generated", "Completed", "Cancelled"];

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchFilter = filter === "All" || b.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        search.trim() === "" ||
        b.booking_number.toLowerCase().includes(q) ||
        b.patient_name.toLowerCase().includes(q) ||
        b.patient_phone.includes(q) ||
        b.package_name.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [bookings, filter, search]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0"
              style={
                filter === f
                  ? { backgroundColor: "#073b4c", color: "white" }
                  : { backgroundColor: "white", color: "#6d7a6f", border: "1px solid #e4ede2" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa89b]">
            <path d="M13 13L10 10M11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, booking ID, phone…"
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#e4ede2] rounded-xl focus:outline-none focus:border-[#073b4c]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "900px" }}>
            <thead>
              <tr className="border-b border-[#e4ede2] bg-[#f8fafb]">
                {["Booking ID", "Patient", "Package", "Collection Slot", "Address", "Amount", "Payment", "Status", "Update Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-[#f0f4f0] last:border-0 hover:bg-[#fafcfa] transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-[#006a39] font-bold whitespace-nowrap">{b.booking_number}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#073b4c] text-xs">{b.patient_name}</p>
                    <p className="text-[#9aa89b] text-[10px]">{b.patient_age}y, {b.patient_gender} · {b.patient_phone}</p>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="text-xs text-[#073b4c] font-medium truncate">{b.package_name}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-xs font-semibold text-[#073b4c]">{b.collection_date}</p>
                    <p className="text-[#9aa89b] text-[10px]">{b.collection_time_slot}</p>
                  </td>
                  <td className="px-4 py-3.5 max-w-[180px]">
                    <p className="text-xs text-[#6d7a6f] truncate">{b.collection_address?.line1 || "Address"}, {b.collection_address?.city || ""}</p>
                  </td>
                  <td className="px-4 py-3.5 font-['Manrope',sans-serif] font-bold text-[#073b4c] whitespace-nowrap">
                    ₹{Number(b.total_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-[10px] bg-[#f0f4f0] text-[#6d7a6f] px-2 py-0.5 rounded font-medium">{b.payment_method.split(" ")[0]}</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === "Scheduled" ? "bg-[#fef3c7] text-[#b45309]" :
                      b.status === "Sample Collected" ? "bg-[#e0f2fe] text-[#0369a1]" :
                      b.status === "Report Generated" || b.status === "Completed" ? "bg-[#d1fae5] text-[#047857]" :
                      "bg-[#fee2e2] text-[#b91c1c]"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <select
                      value={b.status}
                      onChange={(e) => onUpdateStatus?.(b.id, e.target.value as DbLabBooking["status"])}
                      className="text-xs font-semibold bg-[#f8fafb] border border-[#e4ede2] rounded-lg px-2 py-1 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Sample Collected">Sample Collected</option>
                      <option value="Processing">Processing in Lab</option>
                      <option value="Report Generated">Report Generated</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-16 text-center text-[#9aa89b] text-sm">No lab bookings found.</div>}
      </div>
    </div>
  );
}

/* ─── Revenue Tab ─── */
function RevenueTab() {
  const [now, setNow] = useState(() => new Date());
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());

  useEffect(() => {
    const id = setInterval(() => {
      const current = new Date();
      setNow(current);
      const newKey = current.toDateString();
      if (newKey !== dayKey) setDayKey(newKey);
    }, 1000);
    return () => clearInterval(id);
  }, [dayKey]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const isAM = now.getHours() < 12;
  const ampm = isAM ? "AM" : "PM";

  // Seconds until next midnight
  const secondsLeft = (86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()));
  const hhLeft = Math.floor(secondsLeft / 3600);
  const mmLeft = Math.floor((secondsLeft % 3600) / 60);
  const ssLeft = secondsLeft % 60;
  const countdownStr = `${pad(hhLeft)}h ${pad(mmLeft)}m ${pad(ssLeft)}s`;

  const todayLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Today is Aug 28, 2026 in mock data — use first entry as "today"
  const today = MOCK_REVENUE_HISTORY[0];
  const weekTotal = MOCK_REVENUE_HISTORY.reduce((s, r) => s + r.revenue, 0);
  const weekOrders = MOCK_REVENUE_HISTORY.reduce((s, r) => s + r.orders, 0);
  const avgDaily = Math.round(weekTotal / MOCK_REVENUE_HISTORY.length);
  const maxRev = Math.max(...MOCK_REVENUE_HISTORY.map((r) => r.revenue));

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: live clock + today stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Live clock */}
        <div className="bg-[#073b4c] rounded-2xl p-6 flex flex-col justify-between col-span-1">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Live Clock</p>
            <p className="text-white/70 text-sm mt-1">{todayLabel}</p>
          </div>
          <div className="mt-4">
            <div className="flex items-end gap-2">
              <span className="font-['Manrope',sans-serif] font-extrabold text-white text-4xl leading-none tracking-tight">{timeStr}</span>
              <span className="text-white/60 font-bold text-lg pb-0.5">{ampm}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0f9d58] animate-pulse" />
              <p className="text-white/50 text-[11px]">Resets at 12:00 AM — <span className="text-white/70 font-semibold">{countdownStr} left</span></p>
            </div>
          </div>
        </div>

        {/* Today's revenue */}
        <div className="bg-white rounded-2xl border border-[#e4ede2] p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#9aa89b] text-xs font-semibold uppercase tracking-wider">Today's Revenue</p>
              <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-3xl mt-2">₹{today.revenue.toLocaleString()}</p>
            </div>
            <span className="bg-[#d1fae5] text-[#047857] text-[10px] font-bold px-2 py-1 rounded-full">
              +{Math.round(((today.revenue - MOCK_REVENUE_HISTORY[1].revenue) / MOCK_REVENUE_HISTORY[1].revenue) * 100)}% vs yesterday
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4 border-t border-[#f0f4f0] pt-3">
            <div>
              <p className="text-[#9aa89b] text-[10px]">Orders</p>
              <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg">{today.orders}</p>
            </div>
            <div>
              <p className="text-[#9aa89b] text-[10px]">Avg order value</p>
              <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg">₹{Math.round(today.revenue / today.orders).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="bg-white rounded-2xl border border-[#e4ede2] p-6">
          <p className="text-[#9aa89b] text-xs font-semibold uppercase tracking-wider mb-4">Today's Payment Split</p>
          {[
            { label: "UPI", amount: today.upi, color: "#006a39", pct: Math.round((today.upi / today.revenue) * 100) },
            { label: "Card", amount: today.card, color: "#0369a1", pct: Math.round((today.card / today.revenue) * 100) },
            { label: "COD", amount: today.cod, color: "#c2410c", pct: Math.round((today.cod / today.revenue) * 100) },
          ].map((m) => (
            <div key={m.label} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#073b4c]">{m.label}</span>
                <span className="text-xs font-bold text-[#073b4c]">₹{m.amount.toLocaleString()} <span className="text-[#9aa89b] font-normal">({m.pct}%)</span></span>
              </div>
              <div className="h-2 bg-[#f0f4f0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "7-Day Revenue", value: `₹${weekTotal.toLocaleString()}`, sub: "This week", color: "#073b4c" },
          { label: "7-Day Orders", value: weekOrders, sub: "Transactions", color: "#006a39" },
          { label: "Daily Average", value: `₹${avgDaily.toLocaleString()}`, sub: "Per day", color: "#0369a1" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e4ede2] p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[#9aa89b] text-xs font-semibold">{s.label}</p>
              <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl mt-1">{s.value}</p>
              <p className="text-[#9aa89b] text-[11px] mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 7-day chart / history table */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base">Daily Revenue — Last 7 Days</h3>
          <p className="text-[#9aa89b] text-xs">Resets every day at <span className="font-semibold text-[#073b4c]">12:00 AM</span> per real-time clock</p>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-3 h-36 mb-4">
          {[...MOCK_REVENUE_HISTORY].reverse().map((r, i) => {
            const isToday = i === MOCK_REVENUE_HISTORY.length - 1;
            const heightPct = (r.revenue / maxRev) * 100;
            const dayShort = r.date.split(",")[0].split(" ").slice(0, 2).join(" ");
            return (
              <div key={r.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                <p className="text-[9px] font-bold text-[#073b4c] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ₹{r.revenue.toLocaleString()}
                </p>
                <div className="w-full rounded-t-lg transition-all" style={{
                  height: `${heightPct}%`,
                  backgroundColor: isToday ? "#073b4c" : "#e4ede2",
                  minHeight: "6px",
                }} />
                <p className="text-[10px] font-semibold whitespace-nowrap" style={{ color: isToday ? "#073b4c" : "#9aa89b" }}>{dayShort}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4 border-t border-[#f0f4f0] pt-4">
          <table className="w-full text-sm" style={{ minWidth: "640px" }}>
            <thead>
              <tr className="border-b border-[#f0f4f0]">
                {["Date", "Orders", "Revenue", "UPI", "Card", "COD", "Avg Order"].map((h) => (
                  <th key={h} className="text-left pb-2.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.7px] pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_REVENUE_HISTORY.map((r, i) => (
                <tr key={r.date} className="border-b border-[#f0f4f0] last:border-0 hover:bg-[#fafcfa]"
                  style={i === 0 ? { backgroundColor: "#f0fdf4" } : {}}>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[#073b4c] font-semibold text-[13px]">{r.date}</span>
                      {i === 0 && <span className="text-[9px] font-bold bg-[#073b4c] text-white px-1.5 py-0.5 rounded uppercase">Today</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-6 text-[#073b4c] font-semibold">{r.orders}</td>
                  <td className="py-3 pr-6">
                    <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c]">₹{r.revenue.toLocaleString()}</span>
                  </td>
                  <td className="py-3 pr-6 text-[#006a39] font-medium">₹{r.upi.toLocaleString()}</td>
                  <td className="py-3 pr-6 text-[#0369a1] font-medium">₹{r.card.toLocaleString()}</td>
                  <td className="py-3 pr-6 text-[#c2410c] font-medium">₹{r.cod.toLocaleString()}</td>
                  <td className="py-3 text-[#6d7a6f]">₹{Math.round(r.revenue / r.orders).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings Tab ─── */
function SettingsTab({
  settings,
  setSettings,
  categories,
  addCategory,
  user,
  onLogout,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  categories: string[];
  addCategory: (name: string) => void;
  user?: CurrentUser;
  onLogout?: () => void;
}) {
  const [newCat, setNewCat] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const handleAddCat = () => {
    const trimmed = newCat.trim();
    if (trimmed && !categories.includes(trimmed)) { addCategory(trimmed); }
    setNewCat("");
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("subhone_admin_settings", JSON.stringify(settings));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3500);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {saveStatus === "saved" && (
        <div className="p-4 rounded-xl bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>Settings saved successfully! All store configurations are now active.</span>
          </div>
          <button onClick={() => setSaveStatus("idle")} className="text-[#065f46] hover:opacity-75 text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Admin Profile & Session Option */}
      {user && (
        <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#006a39] flex items-center justify-center text-white font-black text-lg shadow-sm">
                {(user?.name?.[0] || user?.email?.[0] || "A").toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base">
                    {user.name || "SubhOne Admin"}
                  </h3>
                  <span className="bg-[#e8f5ee] text-[#006a39] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#bbf7d0]">
                    Administrator
                  </span>
                </div>
                <p className="text-xs text-[#6d7a6f] mt-0.5 font-mono">{user.email || "admin@subhone.com"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border border-[#fca5a5] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out / Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
        <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base mb-5">Store Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{ label: "Store Name", key: "storeName" }, { label: "Contact Number", key: "phone" }, { label: "Email Address", key: "email" }].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">{f.label}</label>
              <input type="text" value={(settings as Record<string, unknown>)[f.key] as string}
                onChange={(e) => setSettings((p) => ({ ...p, [f.key]: e.target.value }))} className={INPUT_CLS} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Business Address</label>
            <textarea value={settings.address} onChange={(e) => setSettings((p) => ({ ...p, address: e.target.value }))}
              rows={2} className={`${INPUT_CLS} resize-none`} />
          </div>
        </div>
      </div>

      {/* Product Config */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
        <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base mb-5">Product Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{ label: "Low Stock Threshold (units)", key: "lowThreshold" }, { label: "Default Discount (%)", key: "defaultDisc" }].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">{f.label}</label>
              <input type="number" value={(settings as Record<string, unknown>)[f.key] as string}
                onChange={(e) => setSettings((p) => ({ ...p, [f.key]: e.target.value }))} className={INPUT_CLS} />
            </div>
          ))}
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
        <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base mb-4">Category Management</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: (CAT_ACCENT[c] ?? "#374151") + "18", color: CAT_ACCENT[c] ?? "#374151" }}>
              {c}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && handleAddCat()}
            className={`${INPUT_CLS} flex-1`} />
          <button onClick={handleAddCat} className="px-4 py-2.5 rounded-xl bg-[#073b4c] text-white text-sm font-bold hover:opacity-90 shrink-0 cursor-pointer">
            Add
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-[#e4ede2] p-5 sm:p-7">
        <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base mb-5">Notifications</h3>
        <div className="flex flex-col gap-4">
          {[{ label: "Email alerts for low stock", key: "emailAlerts" }, { label: "SMS alerts for new orders", key: "smsAlerts" }, { label: "Auto-reorder when stock is critical", key: "autoReorder" }].map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-[#073b4c] text-sm font-medium">{f.label}</span>
              <div className="w-11 h-6 rounded-full relative transition-colors duration-200 cursor-pointer shrink-0"
                style={{ backgroundColor: (settings as Record<string, unknown>)[f.key] ? "#073b4c" : "#d1d5db" }}
                onClick={() => setSettings((p) => ({ ...p, [f.key]: !(p as Record<string, unknown>)[f.key] }))}>
                <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: (settings as Record<string, unknown>)[f.key] ? "24px" : "4px" }} />
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        className="w-full sm:w-auto self-start bg-[#073b4c] text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
      >
        <span>💾</span>
        <span>Save Changes</span>
      </button>
    </div>
  );
}

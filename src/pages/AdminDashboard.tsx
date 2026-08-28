import React, { useState, useMemo, useRef, useEffect } from "react";
import type { CurrentUser } from "../App";
import {
  fetchProducts,
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  updateProductStock as dbUpdateStock,
} from "../lib/products";
import { fetchAllOrders, updateOrderStatus as dbUpdateOrderStatus, DbOrder } from "../lib/orders";
import { fetchAllLabBookings, updateLabBookingStatus as dbUpdateLabBookingStatus, DbLabBooking } from "../lib/labTests";

interface Props {
  user: CurrentUser;
  onLogout: () => void;
}

type AdminTab = "dashboard" | "products" | "inventory" | "orders" | "lab-tests" | "revenue" | "settings";

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
  "Pain Relief & Balms",
  "Energy, Hydration & Supplements",
  "First Aid & Antiseptics",
  "Antacids, Digestion & Laxatives",
  "Skin Care, Powders & Ointments",
  "Personal Care, Hygiene & Others",
  "Baby Care",
  "Medical Supplies & General",
];

const CAT_HSN: Record<string, string> = {
  "Pain Relief & Balms": "3004",
  "Energy, Hydration & Supplements": "2106",
  "First Aid & Antiseptics": "3808",
  "Antacids, Digestion & Laxatives": "3004",
  "Skin Care, Powders & Ointments": "3304",
  "Personal Care, Hygiene & Others": "3305",
  "Baby Care": "3924",
  "Medical Supplies & General": "9018",
};

const CAT_ACCENT: Record<string, string> = {
  "Pain Relief & Balms": "#c0392b",
  "Energy, Hydration & Supplements": "#d97706",
  "First Aid & Antiseptics": "#047857",
  "Antacids, Digestion & Laxatives": "#1d4ed8",
  "Skin Care, Powders & Ointments": "#7c3aed",
  "Personal Care, Hygiene & Others": "#0e7490",
  "Baby Care": "#0369a1",
  "Medical Supplies & General": "#374151",
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
  { id: "ORD-2847", customer: "Priya Sharma", phone: "98765 43210", items: 3, amount: 763, status: "Delivered", date: "Aug 27, 2026", payment: "UPI" },
  { id: "ORD-2846", customer: "Rahul Kumar", phone: "87654 32109", items: 1, amount: 177, status: "Shipped", date: "Aug 27, 2026", payment: "Card" },
  { id: "ORD-2845", customer: "Anita Patel", phone: "76543 21098", items: 5, amount: 1247, status: "Processing", date: "Aug 27, 2026", payment: "COD" },
  { id: "ORD-2844", customer: "Suresh Gupta", phone: "65432 10987", items: 2, amount: 426, status: "Delivered", date: "Aug 26, 2026", payment: "UPI" },
  { id: "ORD-2843", customer: "Meera Nair", phone: "54321 09876", items: 1, amount: 332, status: "Shipped", date: "Aug 26, 2026", payment: "UPI" },
  { id: "ORD-2842", customer: "Vikram Singh", phone: "43210 98765", items: 4, amount: 892, status: "Cancelled", date: "Aug 26, 2026", payment: "Card" },
  { id: "ORD-2841", customer: "Deepa Krishnan", phone: "32109 87654", items: 2, amount: 519, status: "Delivered", date: "Aug 25, 2026", payment: "UPI" },
  { id: "ORD-2840", customer: "Amit Verma", phone: "21098 76543", items: 6, amount: 1834, status: "Processing", date: "Aug 25, 2026", payment: "Card" },
  { id: "ORD-2839", customer: "Sunita Rao", phone: "10987 65432", items: 1, amount: 105, status: "Delivered", date: "Aug 25, 2026", payment: "COD" },
  { id: "ORD-2838", customer: "Kiran Mehta", phone: "09876 54321", items: 3, amount: 671, status: "Shipped", date: "Aug 24, 2026", payment: "UPI" },
];

const TAB_ITEMS: { id: AdminTab; label: string; icon: React.ReactElement }[] = [
  { id: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1H8V8H1V1ZM10 1H17V8H10V1ZM1 10H8V17H1V10ZM10 10H17V17H10V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
  { id: "products", label: "Products", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L17 5V13L9 17L1 13V5L9 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 9L17 5M9 9L1 5M9 9V17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
  { id: "inventory", label: "Inventory", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 13L5 15L9 13L13 15L17 13V5L13 3L9 5L5 3L1 5V13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 5V13M5 3V15M13 3V15" stroke="currentColor" strokeWidth="1.5" /></svg> },
  { id: "orders", label: "Orders", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 1H14C15.1 1 16 1.9 16 3V17L13 15.5L9 17L5 15.5L2 17V3C2 1.9 2.9 1 4 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M5 6H13M5 9H13M5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
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
    case "Shipped": return { color: "#1d4ed8", bg: "#dbeafe" };
    case "Processing": return { color: "#d97706", bg: "#fef3c7" };
    case "Cancelled": return { color: "#b91c1c", bg: "#fee2e2" };
    default: return { color: "#374151", bg: "#f3f4f6" };
  }
}

type ProductFormState = Omit<Product, "id"> & { id?: number };
const emptyForm = (category = INITIAL_CATEGORIES[0]): ProductFormState => ({
  name: "", category, brand: "", sku: "", hsn: CAT_HSN[category] ?? "", mrp: 0,
  customerPrice: 0, retailerPrice: 0, stock: 0, image: undefined, details: "",
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl my-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#e4ede2]">
          <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center hover:bg-[#e4ede2] transition-colors">
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
                className="text-[10px] font-bold text-[#006a39] hover:underline flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Add Category
              </button>
            </div>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
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

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    storeName: "SubhOne Healthcare", phone: "+91 98765 43210",
    email: "info@subhone.com", address: "Plot 42, MIDC, Andheri East, Mumbai - 400093",
    lowThreshold: "10", defaultDisc: "15", emailAlerts: true, smsAlerts: false, autoReorder: true,
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

    return () => { mounted = false; };
  }, []);

  const [dbLabBookings, setDbLabBookings] = useState<DbLabBooking[]>([]);

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
      return dbOrders.map((o) => ({
        id: o.order_number,
        dbId: o.id,
        customer: o.customer_name,
        phone: o.customer_phone,
        items: o.order_items?.length || 1,
        amount: Number(o.total_amount),
        status: o.status,
        date: new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        payment: o.payment_method,
      }));
    }
    return MOCK_ORDERS.map((o) => ({ ...o, dbId: "" }));
  }, [dbOrders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "All") return liveOrders;
    return liveOrders.filter((o) => o.status === orderFilter);
  }, [liveOrders, orderFilter]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: "Processing" | "Shipped" | "Delivered" | "Cancelled"
  ) => {
    setDbOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, status: newStatus } : o))
    );
    const target = dbOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (target?.id) {
      await dbUpdateOrderStatus(target.id, newStatus);
    }
  };

  const openAdd = () => { setForm(emptyForm(categories[0])); setModal({ open: true, mode: "add" }); };
  const openEdit = (p: Product) => { setForm({ ...p }); setModal({ open: true, mode: "edit" }); };
  const closeModal = () => setModal({ open: false, mode: "add" });

  const addCategory = (name: string) => {
    setCategories((prev) => [...prev, name]);
  };

  const saveProduct = async () => {
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
        is_flash_sale: false,
        is_featured: false,
      });

      if (data) {
        setProducts((prev) => prev.map((p) => p.id === tempId ? { ...p, id: data.numeric_id, dbId: data.id } : p));
      }
    } else {
      const target = products.find((p) => p.id === form.id);
      setProducts((prev) => prev.map((p) => (p.id === form.id ? ({ ...form, dbId: target?.dbId } as Product) : p)));
      closeModal();

      // Persist edit to Supabase
      if (target?.dbId) {
        await dbUpdateProduct(target.dbId, {
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
      }
    }
  };

  const deleteProduct = async (id: number) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    if (target?.dbId) {
      await dbDeleteProduct(target.dbId);
    }
  };

  const applyStockUpdate = async (id: number) => {
    const val = parseInt(stockEdits[id] ?? "");
    if (!isNaN(val) && val >= 0) {
      const target = products.find((p) => p.id === id);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: val } : p));
      if (target?.dbId) {
        await dbUpdateStock(target.dbId, val);
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
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left"
              style={activeTab === t.id ? { backgroundColor: "white", color: SIDEBAR_BG } : { color: "rgba(255,255,255,0.65)" }}>
              <span style={{ color: activeTab === t.id ? SIDEBAR_BG : "rgba(255,255,255,0.5)" }}>{t.icon}</span>
              {t.label}
              {t.id === "inventory" && (lowStockCount + outOfStockCount > 0) && (
                <span className="ml-auto bg-[#ef4444] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {lowStockCount + outOfStockCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#006a39] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(user?.name?.[0] || user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-none truncate">{user.name}</p>
              <p className="text-white/50 text-[11px] mt-0.5 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#ff6b6b] hover:bg-white/10 transition-colors text-sm font-semibold">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3C2.45 14 2 13.55 2 13V3C2 2.45 2.45 2 3 2H6M10 11L14 8M14 8L10 5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Sign Out
          </button>
        </div>
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
            />
          )}
          {activeTab === "lab-tests" && (
            <LabBookingsTab
              bookings={dbLabBookings}
              onUpdateStatus={handleUpdateLabBookingStatus}
            />
          )}
          {activeTab === "revenue" && <RevenueTab />}
          {activeTab === "settings" && <SettingsTab settings={settings} setSettings={setSettings} categories={categories} addCategory={addCategory} />}
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa89b]">
            <path d="M13 13L10 10M11.5 6.5C11.5 9.26 9.26 11.5 6.5 11.5C3.74 11.5 1.5 9.26 1.5 6.5C1.5 3.74 3.74 1.5 6.5 1.5C9.26 1.5 11.5 3.74 11.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, SKU or HSN…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#e4ede2] rounded-xl focus:outline-none focus:border-[#073b4c] transition-colors" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="bg-white border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#073b4c] transition-colors w-full sm:w-auto">
          <option value="All">All Categories ({allProductCount})</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <p className="text-[#9aa89b] text-sm ml-auto">{products.length} result{products.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "1100px" }}>
            <thead>
              <tr className="border-b border-[#e4ede2] bg-[#f8fafb]">
                {["", "SKU", "Product Name", "HSN", "Category", "Brand", "MRP", "Customer ₹", "Retailer ₹", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3.5 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.7px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const st = stockStatus(p.stock);
                const catColor = CAT_ACCENT[p.category] ?? "#374151";
                return (
                  <tr key={p.id} className="border-b border-[#f0f4f0] last:border-0 hover:bg-[#fafcfa] transition-colors">
                    {/* Thumbnail */}
                    <td className="px-3.5 py-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[#e4ede2]" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: catColor + "18", color: catColor }}>
                          {p.name[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-[#9aa89b] font-mono text-xs">{p.sku}</td>
                    <td className="px-3.5 py-3 max-w-[200px]">
                      <p className="font-semibold text-[#073b4c] truncate text-[13px]">{p.name}</p>
                      {p.details && (
                        <span className="inline-block text-[9px] font-bold bg-[#f0fdf4] text-[#047857] border border-[#bbf7d0] px-1.5 py-0.5 rounded-full mt-0.5 leading-none">{p.details}</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-1.5 py-0.5 rounded font-bold">{p.hsn}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ color: catColor, backgroundColor: catColor + "18" }}>
                        {p.category.split(",")[0].split(" & ")[0]}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-[#6d7a6f] text-[13px]">{p.brand}</td>
                    <td className="px-3.5 py-3 text-[#9aa89b] text-[13px]">₹{p.mrp}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#073b4c] text-[13px]">₹{p.customerPrice}</span>
                        {p.mrp > p.customerPrice && (
                          <span className="text-[9px] bg-[#d1fae5] text-[#047857] px-1 py-0.5 rounded font-bold">
                            {Math.round(((p.mrp - p.customerPrice) / p.mrp) * 100)}% off
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#0369a1] text-[13px]">₹{p.retailerPrice}</span>
                        {p.customerPrice > p.retailerPrice && (
                          <span className="text-[9px] bg-[#dbeafe] text-[#1d4ed8] px-1 py-0.5 rounded font-bold">
                            {Math.round(((p.customerPrice - p.retailerPrice) / p.customerPrice) * 100)}% off
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-[#073b4c] text-[13px]">{p.stock}</td>
                    <td className="px-3.5 py-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onEdit(p)} className="w-7 h-7 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center hover:opacity-80 transition-opacity" title="Edit">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 1.5L11.5 4.5M1 12L2 9L9.5 1.5L12.5 4.5L5 12H1V12Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                        </button>
                        <button onClick={() => onDelete(p.id)} className="w-7 h-7 rounded-lg bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center hover:opacity-80 transition-opacity" title="Delete">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 4H11M4.5 4V2.5H8.5V4M5.5 6.5V10M7.5 6.5V10M3 4L3.75 11H9.25L10 4H3Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="py-16 text-center text-[#9aa89b] text-sm">No products match your search.</div>
          )}
        </div>
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
          <button key={s.label} onClick={() => setFilter(s.label)} className="bg-white rounded-2xl border border-[#e4ede2] p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-['Manrope',sans-serif] font-extrabold text-lg sm:text-xl shrink-0" style={{ color: s.color, backgroundColor: s.bg }}>{s.count}</div>
            <div><p className="font-semibold text-[#073b4c] text-sm">{s.label}</p><p className="text-[#9aa89b] text-xs mt-0.5">products</p></div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={filter === f ? { backgroundColor: "#073b4c", color: "white" } : { backgroundColor: "white", color: "#6d7a6f", border: "1px solid #e4ede2" }}>
            {f} ({filterCounts[f]})
          </button>
        ))}
        <p className="text-[#9aa89b] text-sm ml-auto">
          {products.length} result{products.length !== 1 ? "s" : ""}
          {search.trim() && <span> for "<span className="text-[#073b4c] font-semibold">{search}</span>"</span>}
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "800px" }}>
            <thead>
              <tr className="border-b border-[#e4ede2] bg-[#f8fafb]">
                {["Product", "HSN", "Category", "Stock", "Status", "Update Stock"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const st = stockStatus(p.stock);
                const catColor = CAT_ACCENT[p.category] ?? "#374151";
                const pct = Math.min((p.stock / 200) * 100, 100);
                return (
                  <tr key={p.id} className="border-b border-[#f0f4f0] last:border-0 hover:bg-[#fafcfa] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#073b4c]">{p.name}</p>
                      <p className="text-[#9aa89b] text-xs mt-0.5">{p.sku}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-1.5 py-0.5 rounded font-bold">{p.hsn}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: catColor, backgroundColor: catColor + "18" }}>
                        {p.category.split(",")[0].split(" & ")[0]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] w-8 text-right">{p.stock}</span>
                        <div className="w-24 h-2 bg-[#f0f4f0] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" value={stockEdits[p.id] ?? ""}
                          onChange={(e) => setStockEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder={String(p.stock)}
                          className="w-20 bg-[#f8fafb] border border-[#e4ede2] rounded-lg px-2.5 py-1.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#073b4c] transition-colors" />
                        <button onClick={() => onApplyStock(p.id)} disabled={!stockEdits[p.id]}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#073b4c] text-white transition-colors disabled:opacity-40 hover:opacity-90">
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  }[];
  filter: string;
  setFilter: (v: string) => void;
  onUpdateStatus?: (
    orderId: string,
    newStatus: "Processing" | "Shipped" | "Delivered" | "Cancelled"
  ) => void;
}) {
  const FILTERS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0"
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
      <div className="bg-white rounded-2xl border border-[#e4ede2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "760px" }}>
            <thead>
              <tr className="border-b border-[#e4ede2] bg-[#f8fafb]">
                {["Order ID", "Customer", "Phone", "Items", "Amount", "Payment", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#9aa89b] uppercase tracking-[0.8px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = orderStatus(o.status);
                return (
                  <tr key={o.id} className="border-b border-[#f0f4f0] last:border-0 hover:bg-[#fafcfa] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#006a39] font-bold">{o.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#073b4c]">{o.customer}</td>
                    <td className="px-5 py-3.5 text-[#6d7a6f]">{o.phone}</td>
                    <td className="px-5 py-3.5 text-[#073b4c]">{o.items} {o.items === 1 ? "item" : "items"}</td>
                    <td className="px-5 py-3.5 font-['Manrope',sans-serif] font-bold text-[#073b4c]">₹{o.amount.toLocaleString()}</td>
                    <td className="px-5 py-3.5"><span className="text-xs bg-[#f0f4f0] text-[#6d7a6f] px-2 py-0.5 rounded font-medium">{o.payment}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: st.color, backgroundColor: st.bg }}>{o.status}</span></td>
                    <td className="px-5 py-3.5 text-[#9aa89b] text-xs">{o.date}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          onUpdateStatus?.(
                            o.dbId || o.id,
                            e.target.value as "Processing" | "Shipped" | "Delivered" | "Cancelled"
                          )
                        }
                        className="text-xs font-semibold bg-[#f8fafb] border border-[#e4ede2] rounded-lg px-2 py-1 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <div className="py-16 text-center text-[#9aa89b] text-sm">No orders match this filter.</div>}
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
function SettingsTab({ settings, setSettings, categories, addCategory }: {
  settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  categories: string[]; addCategory: (name: string) => void;
}) {
  const [newCat, setNewCat] = useState("");

  const handleAddCat = () => {
    const trimmed = newCat.trim();
    if (trimmed && !categories.includes(trimmed)) { addCategory(trimmed); }
    setNewCat("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
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
          <button onClick={handleAddCat} className="px-4 py-2.5 rounded-xl bg-[#073b4c] text-white text-sm font-bold hover:opacity-90 shrink-0">
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

      <button className="w-full sm:w-auto self-start bg-[#073b4c] text-white font-bold text-sm px-7 py-3 rounded-xl hover:opacity-90 transition-opacity">
        Save Changes
      </button>
    </div>
  );
}

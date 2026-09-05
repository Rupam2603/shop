import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { CurrentUser } from "../App";
import { supabase } from "../lib/supabase";
import BulkProductUploadModal from "../components/BulkProductUploadModal";
import { calculatePricing } from "../lib/pricing";
import { KEY_PRODUCT_CATEGORIES } from "../lib/keyCategories";
import { Upload } from "lucide-react";
import {
  fetchProducts,
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  updateProductStock as dbUpdateStock,
  toggleProductListing as dbToggleListing,
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
  printOrDownloadInvoice,
  downloadInvoiceFile,
  type InvoiceOrderData,
  printOrDownloadDailyReport,
  downloadDailyReportFile,
} from "../lib/invoiceGenerator";
import {
  fetchStoreSettings,
  saveStoreSettingsToDb,
  updateAdminProfileInDb,
  subscribeToStoreSettingsRealtime,
  DEFAULT_STORE_SETTINGS,
} from "../lib/settings";
import { fetchAllUsers, updateUserAccountStatus, ManagedUser, adminChangeUserPassword, adminDeleteUserAccount } from "../lib/users";
import { fetchLoginLogs, LoginLog } from "../lib/loginLogs";
import {
  fetchAllDeliveryPartners,
  adminCreateDeliveryPartner,
  fetchDeliveryAttendance,
  updateDeliveryPartnerWeeklyOff,
  fetchAttendanceReport,
  DeliveryPartnerItem,
  DeliveryAttendanceRecord,
} from "../lib/deliveryPartners";
import { exportAttendanceReportToExcel } from "../lib/attendanceExcelExport";
import { fetchOrdersForPartner } from "../lib/deliveryOrders";
import { fetchAllOnDutyPartnerLocations, DeliveryLocationPing } from "../lib/deliveryLocation";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import {
  fetchCategories,
  fetchSubCategories,
  createCategory as dbCreateCategory,
  createSubCategory as dbCreateSubCategory,
  deleteCategory as dbDeleteCategory,
  deleteSubCategory as dbDeleteSubCategory,
  DbCategory,
  DbSubCategory,
} from "../lib/categories";

interface Props {
  user: CurrentUser;
  onLogout: () => void;
}

type AdminTab = "dashboard" | "products" | "inventory" | "orders" | "users" | "delivery" | "lab-tests" | "revenue" | "settings";

/* ── Modern Glassmorphism Vector Icons ── */
const Icons = {
  Dashboard: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Pill: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  ),
  Box: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  Order: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Store: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2" />
    </svg>
  ),
  Lab: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18h12" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 1 0-4 0" />
      <path d="M9 14h6" />
      <path d="M9 12a3 3 0 0 1 6 0v2H9Z" />
      <path d="M12 2v4" />
      <path d="M9 4h6" />
    </svg>
  ),
  Revenue: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  Settings: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Alert: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Hourglass: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  ),
  Check: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Printer: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  ),
  Download: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Trash: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Edit: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Eye: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Calendar: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Camera: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Image: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  User: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Refresh: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  ),
  Save: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Ban: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  ),
  Truck: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
};

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
  isListed?: boolean;
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

const INITIAL_CATEGORIES: string[] = [
  ...KEY_PRODUCT_CATEGORIES,
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
  "Full Body Health Checkups": "9993",
};

const CAT_ACCENT: Record<string, string> = {
  "Skin Care & Ointments": "#7c3aed",
  "Pain Relief & Muscle Care": "#c0392b",
  "Weight Loss & Metabolism": "#ea580c",
  "Daily Wellness & Immunity": "#d97706",
  "Monsoon Health & Antiseptics": "#0891b2",
  "Baby Care & Infant Nutrition": "#0284c7",
  "Women's Health & Hygiene": "#db2777",
  "Men's Health & Vitality": "#0f766e",
  "Diet & Digestive Health": "#16a34a",
  "Hair Care & Scalp Therapy": "#9333ea",
  "Vaccines & Medical Disposables": "#0f766e",
  "Medical Supplies & Devices": "#374151",
  "Skin Care, Powders & Ointments": "#7c3aed",
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
  { id: 1, name: "Volini Gel 15g", category: "Pain Relief & Muscle Care", brand: "Volini", sku: "VLN-001", hsn: "3004", mrp: 15, customerPrice: 11, retailerPrice: 10, stock: 145, details: "15g gel tube" },
  { id: 2, name: "Volini Spray 249ml", category: "Pain Relief & Muscle Care", brand: "Volini", sku: "VLN-002", hsn: "3004", mrp: 249, customerPrice: 177, retailerPrice: 151, stock: 67, details: "249ml spray can" },
  { id: 3, name: "Amrutanjan Strong Balm 44g", category: "Pain Relief & Muscle Care", brand: "Amrutanjan", sku: "AMR-001", hsn: "3004", mrp: 44, customerPrice: 36, retailerPrice: 32, stock: 92, details: "44g balm jar" },
  { id: 4, name: "Zandu Balm 45ml", category: "Pain Relief & Muscle Care", brand: "Zandu", sku: "ZAN-001", hsn: "3004", mrp: 45, customerPrice: 40, retailerPrice: 35, stock: 8, details: "45ml roll-on bottle" },
  { id: 5, name: "Moov Chain 15g", category: "Pain Relief & Muscle Care", brand: "Moov", sku: "MOV-001", hsn: "3004", mrp: 15, customerPrice: 13, retailerPrice: 11, stock: 231, details: "15g roll-on applicator" },
  { id: 6, name: "Glucon D Orange 415g Jar", category: "Daily Wellness & Immunity", brand: "Glucon D", sku: "GLD-001", hsn: "2106", mrp: 415, customerPrice: 332, retailerPrice: 272, stock: 203, details: "415g storage jar" },
  { id: 7, name: "Glucon D Regular 65g", category: "Daily Wellness & Immunity", brand: "Glucon D", sku: "GLD-002", hsn: "2106", mrp: 65, customerPrice: 50, retailerPrice: 44, stock: 312, details: "65g refill pack" },
  { id: 8, name: "Dabur Honey 125g", category: "Daily Wellness & Immunity", brand: "Dabur", sku: "DBR-001", hsn: "2106", mrp: 125, customerPrice: 105, retailerPrice: 89, stock: 78, details: "125g squeeze bottle" },
  { id: 9, name: "Chyawanprash 860g", category: "Daily Wellness & Immunity", brand: "Dabur", sku: "DBR-002", hsn: "2106", mrp: 860, customerPrice: 671, retailerPrice: 550, stock: 3, details: "860g glass jar" },
  { id: 10, name: "Cipla ORS Powder Box", category: "Daily Wellness & Immunity", brand: "Cipla", sku: "CPL-001", hsn: "2106", mrp: 978, customerPrice: 250, retailerPrice: 205, stock: 34, details: "Box of 21 sachets" },
  { id: 11, name: "Sugar Free Gold 40 Tabs", category: "Weight Loss & Metabolism", brand: "Zydus", sku: "SGF-001", hsn: "2106", mrp: 40, customerPrice: 32, retailerPrice: 28, stock: 156, details: "40 tablets strip" },
  { id: 12, name: "Electrol Powder Sachet", category: "Daily Wellness & Immunity", brand: "Electrol", sku: "ELC-001", hsn: "2106", mrp: 23, customerPrice: 16, retailerPrice: 14, stock: 187, details: "Single 22g sachet" },
  { id: 13, name: "Dettol Antiseptic 250ml", category: "Monsoon Health & Antiseptics", brand: "Dettol", sku: "DTL-001", hsn: "3808", mrp: 155, customerPrice: 131, retailerPrice: 111, stock: 287, details: "250ml bottle" },
  { id: 14, name: "Dettol Antiseptic 550ml", category: "Monsoon Health & Antiseptics", brand: "Dettol", sku: "DTL-002", hsn: "3808", mrp: 259, customerPrice: 223, retailerPrice: 183, stock: 145, details: "550ml bottle" },
  { id: 15, name: "Dettol Antiseptic 60ml", category: "Monsoon Health & Antiseptics", brand: "Dettol", sku: "DTL-003", hsn: "3808", mrp: 30, customerPrice: 27, retailerPrice: 24, stock: 312, details: "60ml pocket bottle" },
  { id: 16, name: "Hansaplast Regular Band-Aid", category: "Monsoon Health & Antiseptics", brand: "Hansaplast", sku: "HNS-001", hsn: "3808", mrp: 240, customerPrice: 165, retailerPrice: 140, stock: 62, details: "Box of 20 strips" },
  { id: 17, name: "Hansaplast Washproof Band-Aid", category: "Monsoon Health & Antiseptics", brand: "Hansaplast", sku: "HNS-002", hsn: "3808", mrp: 300, customerPrice: 195, retailerPrice: 166, stock: 9, details: "Box of 20 waterproof strips" },
  { id: 18, name: "Eno Lemon 30 Pcs Pack", category: "Diet & Digestive Health", brand: "Eno", sku: "ENO-001", hsn: "3004", mrp: 230, customerPrice: 230, retailerPrice: 189, stock: 89, details: "Pack of 30 sachets" },
  { id: 19, name: "Eno Lemon Sachet 5g", category: "Diet & Digestive Health", brand: "Eno", sku: "ENO-002", hsn: "3004", mrp: 9, customerPrice: 8, retailerPrice: 7, stock: 543, details: "5g single sachet" },
  { id: 20, name: "Zandu Nityam Tablets", category: "Diet & Digestive Health", brand: "Zandu", sku: "ZAN-002", hsn: "3004", mrp: 99, customerPrice: 61, retailerPrice: 52, stock: 0, details: "Strip of 10 tablets" },
  { id: 21, name: "Softovac SF 229g", category: "Diet & Digestive Health", brand: "Softovac", sku: "SFT-001", hsn: "3004", mrp: 229, customerPrice: 150, retailerPrice: 128, stock: 23, details: "229g powder jar" },
  { id: 22, name: "Baidya Isabgol 360g", category: "Diet & Digestive Health", brand: "Baidya", sku: "BDY-001", hsn: "3004", mrp: 360, customerPrice: 305, retailerPrice: 250, stock: 7, details: "360g powder jar" },
  { id: 23, name: "Kayam Churna 115g", category: "Diet & Digestive Health", brand: "Kayam", sku: "KYM-001", hsn: "3004", mrp: 115, customerPrice: 93, retailerPrice: 79, stock: 44, details: "115g powder" },
  { id: 24, name: "Nycil Cool Powder 130g", category: "Skin Care & Ointments", brand: "Nycil", sku: "NYC-001", hsn: "3304", mrp: 130, customerPrice: 104, retailerPrice: 88, stock: 198, details: "130g dusting powder" },
  { id: 25, name: "Candid Dusting Powder 174g", category: "Skin Care & Ointments", brand: "Candid", sku: "CND-001", hsn: "3304", mrp: 174, customerPrice: 122, retailerPrice: 104, stock: 5, details: "174g powder tin" },
  { id: 26, name: "Boroline Antiseptic Cream 45g", category: "Skin Care & Ointments", brand: "Boroline", sku: "BRL-001", hsn: "3304", mrp: 45, customerPrice: 39, retailerPrice: 34, stock: 267, details: "45g cream tube" },
  { id: 27, name: "Ring Guard Cream 96g", category: "Skin Care & Ointments", brand: "Ring Guard", sku: "RNG-001", hsn: "3304", mrp: 96, customerPrice: 78, retailerPrice: 66, stock: 41, details: "96g cream tube" },
  { id: 28, name: "Love Nature Hair Oil 299ml", category: "Hair Care & Scalp Therapy", brand: "Love Nature", sku: "LVN-001", hsn: "3305", mrp: 299, customerPrice: 165, retailerPrice: 140, stock: 73, details: "299ml bottle" },
  { id: 29, name: "Jac Body Oil 275ml", category: "Women's Health & Hygiene", brand: "Jac", sku: "JAC-001", hsn: "3305", mrp: 275, customerPrice: 193, retailerPrice: 164, stock: 56, details: "275ml bottle" },
  { id: 30, name: "Dettol Hand Sanitizer 30ml", category: "Monsoon Health & Antiseptics", brand: "Dettol", sku: "DTL-004", hsn: "3305", mrp: 30, customerPrice: 26, retailerPrice: 23, stock: 334, details: "30ml pocket bottle" },
  { id: 31, name: "Vicks Cough Drops 130 Pcs", category: "Monsoon Health & Antiseptics", brand: "Vicks", sku: "VCK-001", hsn: "3305", mrp: 100, customerPrice: 100, retailerPrice: 85, stock: 88, details: "Pack of 130 drops" },
  { id: 32, name: "Morisons Baby Nipple", category: "Baby Care & Infant Nutrition", brand: "Morisons", sku: "MRS-001", hsn: "3924", mrp: 30, customerPrice: 21, retailerPrice: 18, stock: 17, details: "Single silicone nipple" },
  { id: 33, name: "Morisons Feeding Bottle", category: "Baby Care & Infant Nutrition", brand: "Morisons", sku: "MRS-002", hsn: "3924", mrp: 72, customerPrice: 72, retailerPrice: 61, stock: 29, details: "250ml capacity bottle" },
  { id: 34, name: "Surgical Face Mask 75pc", category: "Medical Supplies & Devices", brand: "Generic", sku: "SRG-001", hsn: "9018", mrp: 75, customerPrice: 75, retailerPrice: 64, stock: 412, details: "Box of 75 masks, 3-ply" },
  { id: 35, name: "Surgical Face Mask 100pc", category: "Medical Supplies & Devices", brand: "Generic", sku: "SRG-002", hsn: "9018", mrp: 100, customerPrice: 100, retailerPrice: 85, stock: 287, details: "Box of 100 masks, 3-ply" },
  { id: 36, name: "Glandiner Oil 145ml", category: "Medical Supplies & Devices", brand: "Glandiner", sku: "GLD-003", hsn: "9018", mrp: 145, customerPrice: 120, retailerPrice: 102, stock: 64, details: "145ml massage oil bottle" },
];


const TAB_ITEMS: { id: AdminTab; label: string; icon: React.ReactElement }[] = [
  { id: "dashboard", label: "Dashboard", icon: <Icons.Dashboard className="w-4 h-4" /> },
  { id: "products", label: "Products", icon: <Icons.Pill className="w-4 h-4" /> },
  { id: "inventory", label: "Inventory", icon: <Icons.Box className="w-4 h-4" /> },
  { id: "orders", label: "Orders", icon: <Icons.Order className="w-4 h-4" /> },
  { id: "delivery", label: "Delivery", icon: <Icons.Truck className="w-4 h-4" /> },
  { id: "users", label: "User Accounts", icon: <Icons.User className="w-4 h-4" /> },
  { id: "lab-tests", label: "Lab Bookings", icon: <Icons.Lab className="w-4 h-4" /> },
  { id: "revenue", label: "Revenue", icon: <Icons.Revenue className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Icons.Settings className="w-4 h-4" /> },
];

function stockStatus(s: number): { label: string; color: string; bg: string; border: string } {
  if (s === 0) return { label: "Out of Stock", color: "#b91c1c", bg: "rgba(254, 226, 226, 0.8)", border: "#fecaca" };
  if (s <= 10) return { label: "Low Stock", color: "#c2410c", bg: "rgba(255, 237, 213, 0.8)", border: "#fed7aa" };
  return { label: "In Stock", color: "#047857", bg: "rgba(209, 250, 229, 0.8)", border: "#a7f3d0" };
}

function orderStatus(s: string): { color: string; bg: string; border: string } {
  switch (s) {
    case "Delivered": return { color: "#047857", bg: "rgba(209, 250, 229, 0.8)", border: "#a7f3d0" };
    case "Out for Delivery": return { color: "#0284c7", bg: "rgba(224, 242, 254, 0.8)", border: "#bae6fd" };
    case "Shipped": return { color: "#1d4ed8", bg: "rgba(219, 234, 254, 0.8)", border: "#bfdbfe" };
    case "Dispatched":
    case "Dispatch": return { color: "#7c3aed", bg: "rgba(237, 233, 254, 0.8)", border: "#ddd6fe" };
    case "Processing": return { color: "#d97706", bg: "rgba(254, 243, 199, 0.8)", border: "#fde68a" };
    case "Cancelled": return { color: "#b91c1c", bg: "rgba(226, 232, 240, 0.8)", border: "#fecaca" };
    default: return { color: "#374151", bg: "rgba(243, 244, 246, 0.8)", border: "#e5e7eb" };
  }
}

function safeDiscountPercent(base: number, price: number): number {
  if (!base || base <= 0 || !price || price < 0) return 0;
  const discount = base - price;
  if (discount <= 0) return 0;
  const pct = (discount / base) * 100;
  return Math.round(pct);
}

type ProductFormState = Omit<Product, "id"> & { id?: number; category_id?: string; sub_category_id?: string; sub_category_name?: string; };
const emptyForm = (category = INITIAL_CATEGORIES[0]): ProductFormState => ({
  name: "", category, brand: "", sku: "", hsn: CAT_HSN[category] ?? "", mrp: 0,
  customerPrice: 0, retailerPrice: 0, stock: 0, image: undefined, details: "",
  badges: DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
  isListed: true,
});

const INPUT_CLS = "w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/* ─── Product Modal (Glassmorphic Studio) ─── */
function ProductModal({
  open, mode, form, setForm, categories,
  dbCategories, dbSubCategories,
  onAddCategory, onDeleteCategory, onAddSubCategory, onDeleteSubCategory,
  onSave, onClose, isSaving, saveError,
}: {
  open: boolean; mode: "add" | "edit";
  form: ProductFormState; setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: string[]; 
  dbCategories: DbCategory[]; dbSubCategories: DbSubCategory[];
  onAddCategory: (name: string) => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
  onAddSubCategory: (name: string, categoryId: string) => Promise<boolean>;
  onDeleteSubCategory: (id: string) => Promise<boolean>;
  onSave: () => void; onClose: () => void;
  isSaving?: boolean; saveError?: string;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showAddSubCat, setShowAddSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState("");

  useEffect(() => {
    if (open) { 
      setShowAddCat(false); setNewCatName(""); 
      setShowAddSubCat(false); setNewSubCatName("");
    }
  }, [open]);

  useEffect(() => {
    const defaultHsns = Object.values(CAT_HSN);
    if (!form.hsn || defaultHsns.includes(form.hsn)) {
      setForm((p) => ({ ...p, hsn: CAT_HSN[form.category] ?? "" }));
    }
  }, [form.category, setForm]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submitNewCat = async () => {
    const trimmed = newCatName.trim();
    if (trimmed && !dbCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const success = await onAddCategory(trimmed);
      if (success) {
        // Will be updated via props, but we can't reliably select it immediately without the new ID.
        // For now just close.
        setShowAddCat(false);
        setNewCatName("");
      }
    } else {
      setShowAddCat(false);
      setNewCatName("");
    }
  };

  const submitNewSubCat = async () => {
    const trimmed = newSubCatName.trim();
    if (trimmed && form.category_id && !dbSubCategories.some(sc => sc.name.toLowerCase() === trimmed.toLowerCase() && sc.category_id === form.category_id)) {
      const success = await onAddSubCategory(trimmed, form.category_id);
      if (success) {
        setShowAddSubCat(false);
        setNewSubCatName("");
      }
    } else {
      setShowAddSubCat(false);
      setNewSubCatName("");
    }
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
    <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-3xl sm:rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90dvh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#e4ede2] bg-gradient-to-r from-white/90 via-emerald-50/30 to-white/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shadow-sm">
              <Icons.Pill className="w-5 h-5 text-[#006a39]" />
            </div>
            <div>
              <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">
                {mode === "add" ? "Add New Pharmaceutical Product" : "Edit Product Catalog Entry"}
              </h2>
              <p className="text-xs text-[#6d7a6f]">Real-time synchronization across Supabase Cloud</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f0f5f1] flex items-center justify-center text-[#073b4c] hover:bg-[#e2ede4] transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="#073b4c" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-7 flex flex-col gap-5 overflow-y-auto max-h-[72vh]">
          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span>✕</span>
              <span>{saveError}</span>
            </div>
          )}
          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-2">Product Image Showcase</label>
            <div
              className="relative rounded-2xl border-2 border-dashed border-[#cfe0cf] overflow-hidden cursor-pointer hover:border-[#006a39] transition-all group bg-emerald-50/20"
              style={{ minHeight: "130px" }}
              onClick={() => galleryRef.current?.click()}
            >
              {form.image ? (
                <div className="relative flex items-center justify-center p-3">
                  <img src={form.image} alt="Product" className="max-h-40 object-contain rounded-xl" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, image: undefined })); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white text-red-600 cursor-pointer"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-[#8aa090] group-hover:text-[#006a39] transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs text-[#006a39]">
                    <Icons.Camera className="w-5 h-5 text-[#006a39]" />
                  </div>
                  <p className="text-xs font-bold">Click or drag image to upload</p>
                  <p className="text-[10px] text-[#9aa89b]">Supports JPG, PNG, WebP format</p>
                </div>
              )}
            </div>
            <div className="flex gap-2.5 mt-2.5">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#dce7db] bg-white/80 hover:bg-white text-xs font-bold text-[#073b4c] transition-all cursor-pointer shadow-xs"
              >
                <Icons.Camera className="w-4 h-4 text-[#006a39]" />
                <span>Take Live Photo</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#dce7db] bg-white/80 hover:bg-white text-xs font-bold text-[#073b4c] transition-all cursor-pointer shadow-xs"
              >
                <Icons.Image className="w-4 h-4 text-[#0369a1]" />
                <span>Upload from Gallery</span>
              </button>
            </div>
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageFile} />
          </div>

          {/* Product Name */}
          <Field label="Product Name *">
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Volini Pain Relief Spray 249ml" className={INPUT_CLS} required />
          </Field>

          {/* Product Details */}
          <Field label="Pack Size / Dosage Details">
            <input type="text" value={form.details ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
              placeholder="e.g. 249ml spray bottle, Strip of 10 tablets, 50g tube"
              className={INPUT_CLS} />
          </Field>

          {/* Category Section */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px]">Category *</label>
                <button type="button" onClick={() => setShowAddCat(!showAddCat)}
                  className="text-[11px] font-bold text-[#006a39] hover:underline flex items-center gap-1 cursor-pointer">
                  <span>+</span>
                  <span>Add Category</span>
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={form.category_id || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const cat = dbCategories.find(c => c.id === selectedId);
                    setForm((p) => ({
                      ...p,
                      category_id: selectedId,
                      category: cat?.name || "",
                      hsn: cat?.hsn_code || p.hsn || "3004",
                      sub_category_id: "",
                      sub_category_name: ""
                    }));
                  }}
                  className={`${INPUT_CLS} flex-1`}>
                  <option value="">Select Category</option>
                  {dbCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {form.category_id && (
                  <button type="button" onClick={() => {
                    if(confirm("Are you sure you want to delete this category?")) onDeleteCategory(form.category_id!);
                  }} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
              {showAddCat && (
                <div className="flex gap-2 mt-2.5 animate-in fade-in duration-150">
                  <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Enter new category name"
                    onKeyDown={(e) => e.key === "Enter" && submitNewCat()}
                    className={`${INPUT_CLS} flex-1`} />
                  <button type="button" onClick={submitNewCat}
                    className="px-4 py-2 rounded-xl bg-[#006a39] text-white text-xs font-bold hover:opacity-90 shrink-0 cursor-pointer shadow-xs">
                    Add
                  </button>
                  <button type="button" onClick={() => { setShowAddCat(false); setNewCatName(""); }}
                    className="px-3 py-2 rounded-xl border border-[#dce7db] text-xs font-semibold text-[#073b4c] hover:bg-white shrink-0 cursor-pointer">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Category Section */}
            {form.category_id && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px]">Sub-Category</label>
                  <button type="button" onClick={() => setShowAddSubCat(!showAddSubCat)}
                    className="text-[11px] font-bold text-[#006a39] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>+</span>
                    <span>Add Sub-Category</span>
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={form.sub_category_id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const scat = dbSubCategories.find(s => s.id === selectedId);
                      setForm((p) => ({
                        ...p,
                        sub_category_id: selectedId,
                        sub_category_name: scat?.name || ""
                      }));
                    }}
                    className={`${INPUT_CLS} flex-1`}>
                    <option value="">No Sub-Category</option>
                    {dbSubCategories
                      .filter(sc => sc.category_id === form.category_id)
                      .map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                  {form.sub_category_id && (
                    <button type="button" onClick={() => {
                      if(confirm("Are you sure you want to delete this sub-category?")) onDeleteSubCategory(form.sub_category_id!);
                    }} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
                {showAddSubCat && (
                  <div className="flex gap-2 mt-2.5 animate-in fade-in duration-150">
                    <input type="text" value={newSubCatName} onChange={(e) => setNewSubCatName(e.target.value)}
                      placeholder="Enter new sub-category name"
                      onKeyDown={(e) => e.key === "Enter" && submitNewSubCat()}
                      className={`${INPUT_CLS} flex-1`} />
                    <button type="button" onClick={submitNewSubCat}
                      className="px-4 py-2 rounded-xl bg-[#006a39] text-white text-xs font-bold hover:opacity-90 shrink-0 cursor-pointer shadow-xs">
                      Add
                    </button>
                    <button type="button" onClick={() => { setShowAddSubCat(false); setNewSubCatName(""); }}
                      className="px-3 py-2 rounded-xl border border-[#dce7db] text-xs font-semibold text-[#073b4c] hover:bg-white shrink-0 cursor-pointer">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Brand + SKU */}
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Brand / Manufacturer">
              <input type="text" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. Sun Pharma, Cipla" className={INPUT_CLS} />
            </Field>
            <Field label="SKU Identifier">
              <input type="text" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="e.g. VLN-001" className={INPUT_CLS} />
            </Field>
          </div>

          {/* HSN Code */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px]">HSN Code (GST)</label>
              <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full uppercase">GST Tax Compliant</span>
            </div>
            <input type="text" value={form.hsn}
              onChange={(e) => setForm((p) => ({ ...p, hsn: e.target.value }))}
              placeholder="e.g. 3004, 2106, 9018"
              className={INPUT_CLS} maxLength={8} />
          </div>

          {/* MRP / Retailer Price */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="MRP (₹)">
              <input type="number" min="0" value={form.mrp || ""}
                onChange={(e) => setForm((p) => ({ ...p, mrp: Number(e.target.value) }))}
                placeholder="0" className={INPUT_CLS} />
            </Field>
            <Field label="Retailer Price (₹)">
              <input type="number" min="0" value={form.retailerPrice || ""}
                onChange={(e) => setForm((p) => ({ ...p, retailerPrice: Number(e.target.value) }))}
                placeholder="0" className={`${INPUT_CLS} !border-blue-300 focus:!border-blue-600`} />
            </Field>
          </div>

          {/* Pricing Preview Glass Cards */}
          {(form.mrp > 0 && form.retailerPrice > 0) && (() => {
            const pricing = calculatePricing({
              mrp: form.mrp || 0,
              customerPrice: form.mrp || 0,
              retailerPrice: form.retailerPrice || 0,
            });
            return (
              <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                <div className="bg-emerald-50/80 backdrop-blur-md rounded-2xl p-3.5 text-center border border-emerald-200 flex flex-col justify-center">
                  <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide">Retailer Wholesale View</p>
                  <p className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-xl sm:text-2xl mt-0.5">₹{form.retailerPrice}</p>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {pricing.retailerOfferPercent !== null && (
                      <p className="text-[10px] font-bold text-emerald-800">
                        {pricing.retailerOfferPercent}% off MRP
                      </p>
                    )}
                    {pricing.retailerMarginPercent !== null && (
                      <p className="text-[9px] font-semibold text-[#006a39]/85">
                        +{pricing.retailerMarginPercent}% extra retailer margin
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Stock */}
          <Field label="Inventory Stock (Available Units)">
            <input type="number" min="0" value={form.stock || ""}
              onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
              placeholder="0" className={INPUT_CLS} />
          </Field>

          {/* Storefront Listing Visibility Switch */}
          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${form.isListed !== false ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${form.isListed !== false ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
                {form.isListed !== false ? "✓" : "!"}
              </div>
              <div>
                <p className="font-bold text-xs text-[#073b4c]">
                  {form.isListed !== false ? "Listed on Storefront (Active)" : "Draft / Unlisted (Hidden)"}
                </p>
                <p className="text-[10px] text-[#657969]">
                  {form.isListed !== false
                    ? "Visible to both customers and retailers for online browsing and ordering."
                    : "Hidden from customers and retailers. Only visible in Admin Dashboard."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isListed: p.isListed === false ? true : false }))}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${form.isListed !== false ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-amber-600 text-white hover:bg-amber-700"}`}
            >
              {form.isListed !== false ? "● Published" : "○ Draft"}
            </button>
          </div>

          {/* Badges & Tags */}
          <div className="bg-[#f5f9f6] rounded-2xl p-4 border border-[#dce8dc] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block">
                  Product Badges & Tags
                </label>
                <p className="text-[10px] text-[#6d7a6f]">Toggle badges or click text to rename tags</p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomBadge}
                className="text-[10px] font-bold text-[#006a39] bg-white hover:bg-emerald-100 px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-[#bbf7d0] shadow-xs"
              >
                <span>+ Add Tag</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {currentBadges.map((badge, idx) => (
                <div
                  key={badge.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    badge.checked
                      ? "bg-white border-[#006a39] shadow-xs ring-1 ring-[#006a39]/20"
                      : "bg-white/60 border-[#e4ede2] opacity-75 hover:opacity-100"
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
                    placeholder="Tag Name"
                    className="flex-1 bg-transparent text-xs font-semibold text-[#073b4c] focus:outline-none focus:bg-white px-1.5 py-0.5 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBadge(idx)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[#9aa89b] hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 pb-7 pt-3 border-t border-[#e4ede2] bg-white/70">
          <button onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-2xl border border-[#dce7db] text-[#073b4c] text-xs sm:text-sm font-bold hover:bg-white transition-all cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onSave} disabled={isSaving} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white text-xs sm:text-sm font-bold hover:opacity-95 transition-all shadow-lg shadow-emerald-950/15 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{isSaving ? "Saving to Cloud DB…" : mode === "add" ? "Create Product Entry" : "Save Product Updates"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard Component ─── */
export default function AdminDashboard({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [dbSubCategories, setDbSubCategories] = useState<DbSubCategory[]>([]);

  // Admin profile state
  const [adminAvatar, setAdminAvatar] = useState<string>(user?.profileImage || "");
  const [adminName, setAdminName] = useState<string>(user?.name || "SubhOne Administrator");
  const [adminPhone, setAdminPhone] = useState<string>(user?.phone || "+91 98765 43210");

  // Product management state
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit" }>({ open: false, mode: "add" });
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const refetchProducts = useCallback(() => {
    fetchProducts({ includeUnlisted: true }).then((data) => {
      const dbProds = data || [];
      setProducts(
        dbProds.map((p) => ({
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
          isListed: p.is_listed !== false,
          badges: Array.isArray(p.badges) && p.badges.length > 0 ? p.badges : DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
        }))
      );
      setCategories((prev) => {
        const productCats = dbProds.map((p) => p.category_name).filter(Boolean);
        return Array.from(new Set([...INITIAL_CATEGORIES, ...prev, ...productCats]));
      });
    });
  }, []);

  // Inventory state
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});
  const [invFilter, setInvFilter] = useState("All");
  const [invSearch, setInvSearch] = useState("");

  // Settings state (initialized with default and hydrated from Supabase)
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("subhone_admin_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load saved settings:", e);
    }
    return DEFAULT_STORE_SETTINGS;
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

  const [orderFilter, setOrderFilter] = useState("All");
  const [dbOrders, setDbOrders] = useState<DbOrder[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Fetch categories and sub-categories
    fetchCategories().then(cats => {
      if (mounted) setDbCategories(cats || []);
    });
    fetchSubCategories().then(subCats => {
      if (mounted) setDbSubCategories(subCats || []);
    });

    // 1. Fetch store settings permanently from Supabase database
    fetchStoreSettings().then((loadedSettings) => {
      if (mounted && loadedSettings) {
        setSettings(loadedSettings);
      }
    });

    // 2. Fetch admin profile details and avatar from Supabase
    const loadAdminProfile = async () => {
      let query = supabase.from("profiles").select("*");
      if (user?.id && user.id.length > 20 && !user.id.includes("00000000")) {
        query = query.eq("id", user.id);
      } else {
        query = query.eq("role", "admin").limit(1);
      }
      const { data } = await query.maybeSingle();
      if (mounted && data) {
        if (data.avatar_url) setAdminAvatar(data.avatar_url);
        if (data.full_name) setAdminName(data.full_name);
        if (data.phone) setAdminPhone(data.phone);
      }
    };
    loadAdminProfile();

    refetchProducts();

    fetchAllOrders().then((data) => {
      if (mounted) setDbOrders(data);
    });

    // Neon Data API has no realtime channel. Poll the authoritative orders table
    // so orders placed in another browser appear automatically in the admin panel.
    const orderPoll = window.setInterval(() => {
      if (!mounted || document.hidden) return;
      fetchAllOrders().then((data) => {
        if (mounted) setDbOrders(data);
      }).catch((err) => console.error("Order polling failed:", err));
    }, 5000);

    fetchAllLabBookings().then((data) => {
      if (mounted && data) setDbLabBookings(data);
    });

    fetchAllUsers().then((data) => {
      if (mounted && data) setManagedUsers(data);
    });

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
                  sku: payload.new.sku || p.sku,
                  hsn: payload.new.hsn || p.hsn,
                  mrp: Number(payload.new.mrp),
                  customerPrice: Number(payload.new.customer_price),
                  retailerPrice: Number(payload.new.retailer_price),
                  stock: payload.new.stock,
                  image: payload.new.image_url,
                  details: payload.new.details || "",
                  badges: Array.isArray(payload.new.badges) && payload.new.badges.length > 0 ? payload.new.badges : p.badges,
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
            badges: Array.isArray(newP.badges) && newP.badges.length > 0 ? newP.badges : DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
          },
          ...prev.filter((p) => p.dbId !== newP.id && p.id !== newP.numeric_id),
        ]);
      } else if (payload.eventType === "DELETE" && payload.old) {
        setProducts((prev) => prev.filter((p) => p.dbId !== payload.old.id));
      }
    });

    const unsubscribeSettings = subscribeToStoreSettingsRealtime((freshSettings) => {
      if (mounted && freshSettings) setSettings(freshSettings);
    });

    return () => {
      mounted = false;
      window.clearInterval(orderPoll);
      unsubscribeProducts();
      unsubscribeSettings();
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
            orderItems: (o.order_items || []).map((oi: any) => ({
              name: oi.product_name || "Unknown Product",
              quantity: Number(oi.quantity || 0),
              price: Number(oi.unit_price || 0),
              totalPrice: Number(oi.total_price || (Number(oi.unit_price || 0) * Number(oi.quantity || 0))),
              mrp: oi.mrp == null ? Number(oi.unit_price || 0) : Number(oi.mrp),
              batch: oi.batch_no || undefined,
              expiry: oi.expiry_date || undefined,
              sku: oi.sku || undefined,
            })),
            paymentStatus: o.payment_status,
          };
        });
    }
    return [];
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
      if (freshOrders) setDbOrders(freshOrders);
      const allDeleted = getDeletedOrderIds();
      setDeletedOrderIds([...allDeleted]);
    } catch (err) {
      console.error("Error refreshing orders:", err);
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 400);
    }
  };


  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      const fresh = await fetchAllUsers();
      if (fresh) setManagedUsers(fresh);
    } catch (e) {
      console.error("Error refreshing users:", e);
    } finally {
      setTimeout(() => setIsRefreshingUsers(false), 400);
    }
  };

  const handleUpdateUserStatus = async (
    userId: string,
    newStatus: "active" | "blocked" | "pending" | "rejected"
  ) => {
    // 1. Call API first (do NOT update UI optimistically)
    const res = await updateUserAccountStatus(userId, newStatus, user?.id || "admin");
    
    // 2. If it failed, show error and stop
    if (!res.success) {
      alert("Error updating user status: " + (res.error || "Please try again."));
      // We don't need to refresh users because we never changed the UI
      return;
    }

    // 3. If success, update UI to reflect the new truth
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

  };

  const handleChangeUserPassword = async (userId: string, newPass: string) => {
    const res = await adminChangeUserPassword(userId, newPass);
    if (!res.success) {
      throw new Error(res.error || "Password change failed.");
    }
  };

  const handleDeleteUserAccount = async (userId: string) => {
    setManagedUsers((prev) => prev.filter((u) => u.id !== userId));
    const res = await adminDeleteUserAccount(userId);
    if (!res.success) {
      alert("Error deleting user: " + (res.error || "Please try again."));
      handleRefreshUsers();
    }
  };

  const pendingRetailersCount = useMemo(
    () => managedUsers.filter((u) => u.role === "retailer" && (u.status === "pending")).length,
    [managedUsers]
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

  const addCategory = async (name: string) => {
    const { data, error } = await dbCreateCategory(name);
    if (data) {
      setDbCategories((prev) => [...prev, data]);
      setCategories((prev) => [...prev, data.name]);
      return true;
    } else {
      alert("Error adding category: " + error);
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    const { success, error } = await dbDeleteCategory(id);
    if (success) {
      setDbCategories((prev) => prev.filter(c => c.id !== id));
      return true;
    } else {
      alert("Error deleting category: " + error);
      return false;
    }
  };

  const addSubCategory = async (name: string, categoryId: string) => {
    const { data, error } = await dbCreateSubCategory(name, categoryId);
    if (data) {
      setDbSubCategories((prev) => [...prev, data]);
      return true;
    } else {
      alert("Error adding sub-category: " + error);
      return false;
    }
  };

  const deleteSubCategory = async (id: string) => {
    const { success, error } = await dbDeleteSubCategory(id);
    if (success) {
      setDbSubCategories((prev) => prev.filter(sc => sc.id !== id));
      return true;
    } else {
      alert("Error deleting sub-category: " + error);
      return false;
    }
  };

  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveError, setProductSaveError] = useState("");

  const saveProduct = async () => {
    setProductSaveError("");
    if (!form.name.trim()) {
      setProductSaveError("Product name is required.");
      return;
    }
    if (!form.category.trim()) {
      setProductSaveError("Category is required.");
      return;
    }


    setIsSavingProduct(true);
    const isFeatured = form.badges?.some((b) => b.id === "featured" && b.checked) ?? false;
    const isFlashSale = form.badges?.some((b) => b.id === "flash-deal" && b.checked) ?? false;

    try {
      if (modal.mode === "add") {
        const { data, error } = await dbCreateProduct({
          name: form.name.trim(),
          subtitle: form.details?.trim() || null,
          category_id: form.category_id || null,
          category_name: form.category,
          sub_category_id: form.sub_category_id || null,
          sub_category_name: form.sub_category_name || null,
          brand: form.brand.trim() || "Generic",
          sku: form.sku.trim() || null,
          hsn: form.hsn.trim() || "3004",
          mrp: Number(form.mrp),
          customer_price: Number(form.mrp),
          retailer_price: Number(form.retailerPrice) || Math.round(Number(form.mrp) * 0.85),
          discount_percent: 0,
          retailer_discount_percent: 0,
          stock: Number(form.stock) || 0,
          image_url: form.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
          details: form.details?.trim() || null,
          is_flash_sale: isFlashSale,
          is_featured: isFeatured,
          is_listed: form.isListed !== false,
          badges: form.badges || [],
        });

        if (error || !data) {
          setProductSaveError(error || "Failed to create product in database.");
          return; // don't close modal on failure
        }
      } else {
        const target = products.find((p) => p.id === form.id);
        let dbId = target?.dbId;
        if (!dbId) {
          const { data: found } = await supabase
            .from("products")
            .select("id")
            .or(`numeric_id.eq.${form.id},name.eq.${form.name}`)
            .maybeSingle();
          if (found) dbId = found.id;
        }

        if (!dbId) {
          setProductSaveError("Could not locate product record in database.");
          return;
        }

        const { data, error } = await dbUpdateProduct(dbId, {
          name: form.name.trim(),
          category_id: form.category_id || null,
          category_name: form.category,
          sub_category_id: form.sub_category_id || null,
          sub_category_name: form.sub_category_name || null,
          brand: form.brand.trim() || "Generic",
          sku: form.sku.trim() || undefined,
          hsn: form.hsn.trim() || "3004",
          mrp: Number(form.mrp),
          customer_price: Number(form.mrp),
          retailer_price: Number(form.retailerPrice) || Math.round(Number(form.mrp) * 0.85),
          discount_percent: 0,
          retailer_discount_percent: 0,
          stock: Number(form.stock) || 0,
          image_url: form.image,
          details: form.details?.trim() || null,
          is_flash_sale: isFlashSale,
          is_featured: isFeatured,
          is_listed: form.isListed !== false,
          badges: form.badges || [],
        });

        if (error || !data) {
          setProductSaveError(error || "Failed to update product in database.");
          return; // don't close modal on failure
        }
      }

      // Refresh product list immediately from DB
      const freshProducts = await fetchProducts({ includeUnlisted: true });
      if (freshProducts) {
        setProducts(freshProducts.map((p) => ({
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
          isListed: p.is_listed !== false,
          badges: Array.isArray(p.badges) && p.badges.length > 0 ? p.badges : DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
        })));
      }
      
      closeModal(); // ONLY close modal on confirmed success
    } catch (err: any) {
      console.error("Save product error:", err);
      setProductSaveError(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleProductListing = async (p: Product) => {
    const newListed = p.isListed === false ? true : false;
    setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, isListed: newListed } : item)));
    let targetDbId = p.dbId;
    if (!targetDbId) {
      const { data: found } = await supabase.from("products").select("id").eq("numeric_id", p.id).maybeSingle();
      if (found) targetDbId = found.id;
    }
    if (targetDbId) {
      const { error } = await dbToggleListing(targetDbId, newListed);
      if (error) {
        alert("Failed to update listing status: " + error);
        const fresh = await fetchProducts({ includeUnlisted: true });
        if (fresh) {
          setProducts(fresh.map((prod) => ({
            id: prod.numeric_id,
            dbId: prod.id,
            name: prod.name,
            category: prod.category_name,
            brand: prod.brand,
            sku: prod.sku || `SKU-${prod.numeric_id}`,
            hsn: prod.hsn || "3004",
            mrp: Number(prod.mrp),
            customerPrice: Number(prod.customer_price),
            retailerPrice: Number(prod.retailer_price),
            stock: prod.stock,
            image: prod.image_url,
            details: prod.details || "",
            isListed: prod.is_listed !== false,
            badges: Array.isArray(prod.badges) && prod.badges.length > 0 ? prod.badges : DEFAULT_PRODUCT_BADGES.map((b) => ({ ...b })),
          })));
        }
      }
    }
  };

  const deleteProduct = async (id: number) => {
    const target = products.find((p) => p.id === id);
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
      const { error } = await dbDeleteProduct(dbId);
      if (error) {
        alert("Failed to delete product: " + error);
        return;
      }
    }

    setProducts((prev) => prev.filter((p) => p.id !== id && (dbId ? p.dbId !== dbId : true)));
    setDeleteId(null);
  };

  const applyStockUpdate = async (id: number) => {
    const val = parseInt(stockEdits[id] ?? "");
    if (!isNaN(val) && val >= 0) {
      const target = products.find((p) => p.id === id);
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
        const { error } = await dbUpdateStock(dbId, val);
        if (error) {
          alert("Failed to update stock in database: " + error);
          return;
        }
      }

      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: val } : p));
      setStockEdits((prev: Record<number, string>) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden flex bg-[#051e27] text-[#171d18]" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* ── AMBIENT GLASS BACKDROP ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 30% -10%, rgba(0, 106, 57, 0.35), rgba(5, 30, 39, 0.95) 70%), linear-gradient(180deg, #04171f 0%, #06232d 50%, #031219 100%)",
        }}
      />
      <div className="fixed top-10 left-64 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-float-slow z-0" />
      <div className="fixed bottom-10 right-20 w-[420px] h-[420px] rounded-full bg-teal-500/10 blur-3xl pointer-events-none animate-float-reverse z-0" />
      <div className="fixed top-1/2 right-1/3 w-80 h-80 rounded-full bg-cyan-400/8 blur-2xl pointer-events-none animate-pulse-soft z-0" />

      {/* Subtle geometric dot grid */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* ── LEFT GLASS SIDEBAR ── */}
      <aside
        className={`w-[260px] shrink-0 flex flex-col fixed inset-y-0 left-0 z-50 md:static transition-transform duration-300 glass-admin-sidebar ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg shadow-emerald-950/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 6.5V12C3 17.5 6.8 22.2 12 23.5C17.2 22.2 21 17.5 21 12V6.5L12 2Z" fill="#10b981" />
                <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-['Manrope',sans-serif] font-extrabold text-white text-xl tracking-tight">SubhOne</p>
                <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-1.5 py-0.2 rounded-full tracking-wider uppercase">
                  Admin
                </span>
              </div>
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mt-0.5">Healthcare OS</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-4 flex flex-col gap-1.5 overflow-y-auto">
          {TAB_ITEMS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold font-['Manrope',sans-serif] transition-all w-full text-left cursor-pointer ${
                  active
                    ? "bg-gradient-to-r from-[#006a39] to-[#008749] text-white shadow-lg shadow-emerald-950/30 border border-emerald-400/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className={`transition-transform group-hover:scale-110 ${active ? "text-emerald-200" : "text-white/50"}`}>
                  {t.icon}
                </span>
                <span className="flex-1">{t.label}</span>

                {t.id === "inventory" && (lowStockCount + outOfStockCount > 0) && (
                  <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 min-w-[20px] text-center shadow-xs">
                    {lowStockCount + outOfStockCount}
                  </span>
                )}
                {t.id === "users" && pendingRetailersCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 min-w-[20px] text-center shadow-xs animate-pulse">
                    {pendingRetailersCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Database Heartbeat Beacon & User Profile in Sidebar */}
          <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/75 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Cloud Sync Active</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {adminAvatar ? (
                  <img
                    src={adminAvatar}
                    alt="Admin Avatar"
                    className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-xs border border-white/20">
                    {(adminName?.[0] || user?.email?.[0] || "A").toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold leading-none truncate">{adminName || "SubhOne Admin"}</p>
                  <p className="text-white/50 text-[10px] mt-0.5 truncate font-mono">{user?.email || "admin@subhone.com"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* ── MAIN CONTENT CANVAS ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 relative z-10">
        
        {/* Sticky Glass Topbar */}
        <header className="safe-top glass-admin-header sticky top-0 z-30 px-4 sm:px-8 h-18 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl bg-white/80 border border-[#d5dcd3] text-[#073b4c] hover:bg-white cursor-pointer active:scale-95"
              aria-label="Open navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg sm:text-2xl capitalize">
                  {activeTab === "lab-tests" ? "Lab Bookings" : activeTab}
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100/80 text-[#006a39] border border-emerald-200">
                  Live Management
                </span>
              </div>
              <p className="text-[#657969] text-xs hidden sm:block">SubhOne Central Command › {activeTab.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === "products" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white/95 hover:bg-emerald-50 text-[#006a39] border border-emerald-300/90 text-xs sm:text-sm font-extrabold px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all shadow-xs hover:scale-102 active:scale-95 cursor-pointer"
                  title="Upload products in bulk using Excel template"
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006a39]" />
                  <span>Upload Excel</span>
                </button>

                <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-[#006a39] to-[#008749] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl hover:opacity-95 transition-all shadow-md shadow-emerald-950/15 cursor-pointer active:scale-95">
                  <span>+</span>
                  <span>Add Product</span>
                </button>
              </>
            )}

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#dce7db] shadow-xs">
              {adminAvatar ? (
                <img
                  src={adminAvatar}
                  alt="Admin Profile"
                  className="w-7 h-7 rounded-xl object-cover shadow-xs border border-emerald-600/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#006a39] to-[#008749] text-white flex items-center justify-center text-xs font-black">
                  {(adminName?.[0] || "A").toUpperCase()}
                </div>
              )}
              <div className="text-left leading-tight hidden md:block">
                <p className="text-xs font-extrabold text-[#073b4c] truncate max-w-[120px]">{adminName}</p>
                <p className="text-[10px] text-emerald-700 font-bold">Admin</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 border border-[#dce7db] text-xs font-semibold text-[#073b4c]">
              <Icons.Calendar className="w-3.5 h-3.5 text-[#006a39]" />
              <span>{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {activeTab === "dashboard" && (
            <DashboardTab
              products={products}
              lowStockCount={lowStockCount}
              outOfStockCount={outOfStockCount}
              pendingRetailersCount={pendingRetailersCount}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "products" && (
            <ProductsTab
              products={filteredProducts}
              allProductCount={products.length}
              categories={categories}
              search={search} setSearch={setSearch}
              catFilter={catFilter} setCatFilter={setCatFilter}
              onEdit={openEdit} onDelete={(id) => setDeleteId(id)}
              onToggleListing={handleToggleProductListing}
              onOpenBulkUpload={() => setShowBulkUpload(true)}
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

          {activeTab === "delivery" && (
            <DeliveryPartnersTab />
          )}

          {activeTab === "users" && (
            <UsersTab
              users={managedUsers}
              currentUser={user}
              onUpdateStatus={handleUpdateUserStatus}
              onChangePassword={handleChangeUserPassword}
              onDeleteUser={handleDeleteUserAccount}
              onRefresh={handleRefreshUsers}
              isRefreshing={isRefreshingUsers}
            />
          )}
          {activeTab === "lab-tests" && (
            <LabBookingsTab
              bookings={dbLabBookings}
              onUpdateStatus={handleUpdateLabBookingStatus}
            />
          )}
          {activeTab === "revenue" && <RevenueTab liveOrders={liveOrders} />}
          {activeTab === "settings" && (
            <SettingsTab
              settings={settings}
              setSettings={setSettings}
              categories={categories}
              addCategory={addCategory}
              user={user}
              adminAvatar={adminAvatar}
              setAdminAvatar={setAdminAvatar}
              adminName={adminName}
              setAdminName={setAdminName}
              adminPhone={adminPhone}
              setAdminPhone={setAdminPhone}
              onLogout={onLogout}
            />
          )}
        </main>
      </div>

      {/* Product Modal */}
      <ProductModal
        open={modal.open} mode={modal.mode}
        form={form} setForm={setForm}
        categories={categories} 
        dbCategories={dbCategories} dbSubCategories={dbSubCategories}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onAddSubCategory={addSubCategory}
        onDeleteSubCategory={deleteSubCategory}
        onSave={saveProduct} onClose={closeModal}
        isSaving={isSavingProduct} saveError={productSaveError}
      />

      {/* Bulk Excel Product Upload Modal */}
      {showBulkUpload && (
        <BulkProductUploadModal
          supabase={supabase}
          onClose={() => setShowBulkUpload(false)}
          onImported={() => {
            setShowBulkUpload(false);
            refetchProducts();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Icons.Trash className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg mb-1">Delete Product Entry</h3>
            <p className="text-[#657969] text-xs mb-6 leading-relaxed">Are you sure you want to delete this pharmaceutical product from database and inventory? This action is permanent.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-2xl border border-[#dce7db] text-[#657969] font-bold text-xs hover:bg-white cursor-pointer">Cancel</button>
              <button onClick={() => deleteProduct(deleteId)} className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-rose-950/20">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TAB: DASHBOARD OVERVIEW ─── */
function DashboardTab({
  products,
  lowStockCount,
  outOfStockCount,
  pendingRetailersCount = 0,
  onNavigate,
}: {
  products: Product[];
  lowStockCount: number;
  outOfStockCount: number;
  pendingRetailersCount?: number;
  onNavigate: (t: AdminTab) => void;
}) {
  const stats = [
    { label: "Active Products", value: products.length, unit: "Certified SKUs", color: "#006a39", bg: "rgba(0, 106, 57, 0.08)", icon: <Icons.Pill className="w-5 h-5 text-[#006a39]" /> },
    { label: "Inventory Alerts", value: lowStockCount + outOfStockCount, unit: "low / out of stock", color: "#c2410c", bg: "rgba(194, 65, 12, 0.08)", icon: <Icons.Alert className="w-5 h-5 text-[#c2410c]" /> },
    { label: "Wholesale Approvals", value: pendingRetailersCount, unit: pendingRetailersCount > 0 ? "applications pending" : "all partners verified", color: "#d97706", bg: "rgba(217, 119, 6, 0.08)", icon: <Icons.Store className="w-5 h-5 text-[#d97706]" /> },
    { label: "Today's Orders", value: 23, unit: "real-time orders", color: "#0369a1", bg: "rgba(3, 105, 161, 0.08)", icon: <Icons.Order className="w-5 h-5 text-[#0369a1]" /> },
  ];

  const recentActivity = [
    { text: "Stock updated: Volini Spray 249ml (+50 units)", time: "10 min ago", dot: "#006a39" },
    { text: "New order: ORD-2847 — Priya Sharma, ₹763", time: "24 min ago", dot: "#0369a1" },
    { text: "Low stock alert: Chyawanprash 860g (3 units)", time: "1 hr ago", dot: "#c2410c" },
    { text: "Product added: Glucon D Regular Jar 219g", time: "2 hrs ago", dot: "#006a39" },
    { text: "Order delivered: ORD-2841 — Deepa Krishnan", time: "3 hrs ago", dot: "#047857" },
    { text: "Low stock alert: Candid Powder 174g (5 units)", time: "4 hrs ago", dot: "#c2410c" },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-7">
      {/* Pending Retailers Action Card */}
      {pendingRetailersCount > 0 && (
        <div className="bg-amber-50/90 backdrop-blur-xl border border-amber-200/90 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/5 animate-in fade-in duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
              <Icons.Hourglass className="w-6 h-6 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-['Manrope',sans-serif] font-extrabold text-amber-900 text-base sm:text-lg">
                  {pendingRetailersCount} Retailer {pendingRetailersCount === 1 ? "Application" : "Applications"} Awaiting Approval
                </h4>
                <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Registered retail pharmacy partners are in the verification queue. Approve to activate wholesale pricing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("users")}
            className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 self-end sm:self-center"
          >
            <span>Review Applications</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {stats.map((s) => (
          <div key={s.label} className="glass-admin-card glass-admin-card-hover rounded-3xl p-4 sm:p-6 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">{s.label}</span>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-xs" style={{ backgroundColor: s.bg }}>
                {s.icon}
              </div>
            </div>
            <div>
              <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-3xl sm:text-4xl leading-none tracking-tight">{s.value}</p>
              <p className="text-xs text-[#657969] font-medium mt-1.5">{s.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Revenue Highlights Banner */}
      <div className="rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg, #073b4c 0%, #0a5568 50%, #006a39 100%)" }}
      >
        <div className="relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-2">
            <Icons.Revenue className="w-3.5 h-3.5 text-emerald-300" />
            <span>Live Performance</span>
          </div>
          <p className="text-white/70 text-xs sm:text-sm font-semibold uppercase tracking-wider">Today&apos;s Gross Volume</p>
          <div className="flex items-baseline gap-3 mt-1">
            <p className="font-['Manrope',sans-serif] font-extrabold text-white text-3xl sm:text-5xl tracking-tight">₹14,283</p>
            <span className="text-emerald-300 font-bold text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
              +12.4% vs yesterday
            </span>
          </div>
          <p className="text-white/60 text-xs mt-1">Calculated across UPI, Card, and COD payments across 8 cities</p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button onClick={() => onNavigate("inventory")} className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl transition-all cursor-pointer">
            Manage Inventory
          </button>
          <button onClick={() => onNavigate("orders")} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-950/30 cursor-pointer active:scale-95">
            View Live Orders →
          </button>
        </div>
      </div>

      {/* Activity & Stock Alert Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-admin-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base sm:text-lg">Real-Time Activity Feed</h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex flex-col gap-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-white/60 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-xs" style={{ backgroundColor: a.dot }} />
                  <div>
                    <p className="text-[#073b4c] text-xs sm:text-sm font-semibold leading-snug">{a.text}</p>
                    <p className="text-[#728575] text-[11px] mt-0.5 font-medium">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-admin-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base sm:text-lg">Low Stock Replenishment</h3>
                <p className="text-xs text-[#657969]">Items at or below critical threshold</p>
              </div>
              <button onClick={() => onNavigate("inventory")} className="text-xs font-bold text-[#006a39] hover:underline cursor-pointer">
                View All Inventory →
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {products.filter((p) => p.stock <= 10).slice(0, 5).map((p) => {
                const st = stockStatus(p.stock);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/70 border border-[#e2ece0] hover:bg-white transition-all">
                    <div>
                      <p className="text-[#073b4c] text-xs sm:text-sm font-bold truncate max-w-[200px]">{p.name}</p>
                      <p className="text-[#728575] text-[11px] font-mono">HSN: {p.hsn} · SKU: {p.sku}</p>
                    </div>
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs" style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}>
                      {p.stock === 0 ? "Out of Stock" : `${p.stock} units left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TAB: PRODUCTS CATALOG ─── */
function ProductsTab({ products, allProductCount, categories, search, setSearch, catFilter, setCatFilter, onEdit, onDelete, onToggleListing, onOpenBulkUpload }: {
  products: Product[]; allProductCount: number; categories: string[];
  search: string; setSearch: (v: string) => void; catFilter: string; setCatFilter: (v: string) => void;
  onEdit: (p: Product) => void; onDelete: (id: number) => void;
  onToggleListing?: (p: Product) => void;
  onOpenBulkUpload?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"All" | "listed" | "unlisted">("All");

  const displayedProducts = useMemo(() => {
    if (statusFilter === "listed") return products.filter((p) => p.isListed !== false);
    if (statusFilter === "unlisted") return products.filter((p) => p.isListed === false);
    return products;
  }, [products, statusFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Bar */}
      <div className="glass-admin-card rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092]">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pharmaceutical products by name, brand, SKU or HSN…"
            className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm bg-white/80 border border-[#dce7db] rounded-2xl focus:outline-none focus:border-[#006a39] font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white/80 border border-[#dce7db] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#073b4c] focus:outline-none focus:border-[#006a39] transition-all cursor-pointer"
          >
            <option value="All">All Visibility</option>
            <option value="listed">● Listed on Storefront</option>
            <option value="unlisted">○ Draft / Unlisted</option>
          </select>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-white/80 border border-[#dce7db] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-[#073b4c] focus:outline-none focus:border-[#006a39] transition-all cursor-pointer"
          >
            <option value="All">All Categories ({allProductCount})</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs font-bold text-[#657969] px-3 py-1 rounded-xl bg-white/70 border border-[#dce7db]">
            {displayedProducts.length} Items
          </span>

          {onOpenBulkUpload && (
            <button
              type="button"
              onClick={onOpenBulkUpload}
              className="flex items-center gap-1.5 bg-white/90 hover:bg-emerald-50 text-[#006a39] border border-emerald-300/80 text-xs font-bold px-3.5 py-2.5 rounded-2xl transition-all shadow-xs hover:scale-102 cursor-pointer ml-auto sm:ml-0"
              title="Bulk import products via Excel spreadsheet"
            >
              <Upload className="w-3.5 h-3.5 text-[#006a39]" />
              <span>Import Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Product List */}
      <div className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-[#e4ede2]">
          {displayedProducts.map((p) => {
            const st = stockStatus(p.stock);
            const catColor = CAT_ACCENT[p.category] ?? "#006a39";

            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 hover:bg-white/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-2xl border border-[#dce7db] overflow-hidden shrink-0 bg-white flex items-center justify-center p-1.5 shadow-2xs">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full max-w-full object-contain" />
                    ) : (
                      <div className="w-full h-full rounded-xl flex items-center justify-center font-black text-base" style={{ backgroundColor: catColor + "18", color: catColor }}>
                        {p.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base truncate">{p.name}</p>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border ${p.isListed !== false ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                        {p.isListed !== false ? "● Listed on Store" : "○ Draft (Hidden)"}
                      </span>
                      <span className="font-mono text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                        HSN: {p.hsn}
                      </span>
                      <span className="font-mono text-[10px] text-[#728575] font-semibold">
                        {p.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                        style={{ color: catColor, backgroundColor: catColor + "18" }}
                      >
                        {p.category.split(",")[0].split(" & ")[0]}
                      </span>
                      <span className="text-xs text-[#596b5e] font-semibold">{p.brand}</span>
                      {p.details && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {p.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Pricing & Margins */}
                <div className="flex items-center gap-5 text-left md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#e4ede2] flex-wrap justify-between md:justify-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-[#728575] uppercase">MRP</span>
                    <span className="text-xs text-[#8a9d8d] line-through font-semibold">₹{p.mrp}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-[#006a39] uppercase">Customer</span>
                    <span className="text-sm sm:text-base font-extrabold text-[#073b4c]">₹{p.customerPrice}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-[#0369a1] uppercase">Retailer B2B</span>
                    <span className="text-sm sm:text-base font-extrabold text-[#0369a1]">₹{p.retailerPrice}</span>
                  </div>

                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-xs font-black text-[#073b4c]">{p.stock} units</span>
                    <span
                      className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-1 border"
                      style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => onToggleListing?.(p)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer shadow-2xs ${p.isListed !== false ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"}`}
                    title={p.isListed !== false ? "Click to unlist (hide from storefront)" : "Click to publish (show on storefront)"}
                  >
                    {p.isListed !== false ? <Icons.Eye className="w-4 h-4 text-emerald-700" /> : <Icons.Ban className="w-4 h-4 text-amber-700" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="p-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer border border-sky-200 shadow-2xs"
                    title="Edit Product"
                  >
                    <Icons.Edit className="w-4 h-4 text-sky-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    className="p-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200 shadow-2xs"
                    title="Delete Product"
                  >
                    <Icons.Trash className="w-4 h-4 text-rose-700" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {displayedProducts.length === 0 && (
          <div className="py-16 text-center text-[#728575] text-sm flex flex-col items-center gap-2">
            <Icons.Pill className="w-10 h-10 text-[#728575] stroke-1" />
            <p className="font-bold text-[#073b4c]">No products found</p>
            <p className="text-xs">Try adjusting your visibility filter, category filter or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TAB: INVENTORY & STOCK MANAGEMENT ─── */
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
      {/* Search Input */}
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092]">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory by product name, SKU, brand or category…"
          className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-white/80 border border-[#dce7db] rounded-2xl focus:outline-none focus:border-[#006a39] font-medium"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        {[
          { label: "In Stock", count: inStockCount, color: "#047857", bg: "rgba(209, 250, 229, 0.8)", border: "#a7f3d0", icon: <Icons.Check className="w-6 h-6 text-[#047857]" /> },
          { label: "Low Stock Alert", count: lowStockCount, color: "#c2410c", bg: "rgba(255, 237, 213, 0.8)", border: "#fed7aa", icon: <Icons.Alert className="w-6 h-6 text-[#c2410c]" /> },
          { label: "Out of Stock", count: outOfStockCount, color: "#b91c1c", bg: "rgba(254, 226, 226, 0.8)", border: "#fecaca", icon: <Icons.Ban className="w-6 h-6 text-[#b91c1c]" /> },
        ].map((s) => (
          <button key={s.label} onClick={() => setFilter(s.label.includes("Low") ? "Low Stock" : s.label)} className="glass-admin-card glass-admin-card-hover rounded-3xl p-5 flex items-center gap-4 text-left cursor-pointer">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-['Manrope',sans-serif] font-black text-xl shrink-0 border" style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}>
              {s.icon}
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">{s.label}</p>
              <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl mt-0.5">{s.count} Items</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === f
                ? "bg-gradient-to-r from-[#006a39] to-[#008749] text-white shadow-md shadow-emerald-950/20"
                : "bg-white/80 text-[#596b5e] border border-[#dce7db] hover:bg-white"
            }`}
          >
            {f} ({filterCounts[f] ?? 0})
          </button>
        ))}
      </div>

      {/* Inventory Table List */}
      <div className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-[#e4ede2]">
          {products.map((p) => {
            const st = stockStatus(p.stock);
            const catColor = CAT_ACCENT[p.category] ?? "#374151";
            const pct = Math.min((p.stock / 200) * 100, 100);

            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 hover:bg-white/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base truncate">{p.name}</p>
                    <span className="font-mono text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                      HSN: {p.hsn}
                    </span>
                    <span className="font-mono text-[10px] text-[#728575] font-semibold">{p.sku}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full" style={{ color: catColor, backgroundColor: catColor + "18" }}>
                      {p.category.split(",")[0].split(" & ")[0]}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-['Manrope',sans-serif] font-black text-sm text-[#073b4c] w-12 text-right">{p.stock} units</span>
                    <div className="w-24 sm:w-32 h-2.5 bg-[#e4ede2] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap border" style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}>
                    {st.label}
                  </span>
                </div>

                {/* Quick Stock Controls */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={stockEdits[p.id] ?? ""}
                      onChange={(e) => setStockEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") onApplyStock(p.id); }}
                      placeholder={String(p.stock)}
                      className="w-20 bg-white border border-[#dce7db] rounded-xl px-2.5 py-1.5 text-xs font-black text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                    <button
                      type="button"
                      onClick={() => onApplyStock(p.id)}
                      disabled={!stockEdits[p.id]}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#006a39] text-white transition-all disabled:opacity-30 hover:opacity-95 cursor-pointer shadow-xs"
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
                      className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockEdits((prev) => ({ ...prev, [p.id]: String(p.stock + 50) }));
                        setTimeout(() => onApplyStock(p.id), 50);
                      }}
                      className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockEdits((prev) => ({ ...prev, [p.id]: "0" }));
                        setTimeout(() => onApplyStock(p.id), 50);
                      }}
                      className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
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

/* ─── TAB: ORDERS & FULFILLMENT ─── */
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
    rawDate?: string;
    payment: string;
    role?: "retailer" | "customer";
    shopName?: string;
    orderItems?: InvoiceOrderData["orderItems"];
    paymentStatus?: string;
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
  const [reportDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [deletedIdsInTab, setDeletedIdsInTab] = useState<string[]>([]);

  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<{
    id: string;
    dbId?: string;
    customer: string;
    amount: number;
  } | null>(null);

  const handleConfirmSingleDelete = () => {
    if (!confirmDeleteOrder) return;
    const targetId = confirmDeleteOrder.dbId || confirmDeleteOrder.id;
    const targetOrderNumber = confirmDeleteOrder.id;

    setDeletedIdsInTab((prev) => Array.from(new Set([...prev, targetId, targetOrderNumber])));
    setSelectedOrderIds((prev) => prev.filter((id) => id !== targetOrderNumber && id !== targetId));
    setConfirmDeleteOrder(null);

    onDeleteOrder?.(targetId);
    if (targetOrderNumber && targetOrderNumber !== targetId) {
      onDeleteOrder?.(targetOrderNumber);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<{
    id: string;
    dbId?: string;
    customer: string;
    phone: string;
    items: number;
    amount: number;
    status: string;
    date: string;
    payment: string;
    role?: "retailer" | "customer";
    shopName?: string;
    paymentStatus?: string;
    orderItems?: InvoiceOrderData["orderItems"];
  } | null>(null);

  const STATUS_FILTERS = ["All", "Processing", "Dispatched", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

  const displayedOrders = useMemo(() => {
    return orders
      .filter((o) => !deletedIdsInTab.includes(o.id) && !deletedIdsInTab.includes(o.dbId))
      .filter((o) => {
        if (roleSegment === "all") return true;
        if (roleSegment === "retailer") return o.role === "retailer";
        if (roleSegment === "customer") return o.role !== "retailer";
        return true;
      })
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          (o.shopName && o.shopName.toLowerCase().includes(q))
        );
      });
  }, [orders, deletedIdsInTab, roleSegment, searchQuery]);

  const groupedOrdersByDate = useMemo(() => {
    const groups: {
      date: string;
      rawDate?: string;
      items: typeof displayedOrders;
      totalAmount: number;
      pendingCount: number;
      deliveredCount: number;
    }[] = [];

    const map = new Map<string, typeof displayedOrders>();

    for (const o of displayedOrders) {
      const d = o.date || "Unknown Date";
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(o);
    }

    for (const [date, items] of map.entries()) {
      const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);
      const pendingCount = items.filter((i) => i.status === "Processing" || i.status === "Dispatched" || i.status === "Shipped" || i.status === "Out for Delivery").length;
      const deliveredCount = items.filter((i) => i.status === "Delivered").length;
      const rawDate = items.find((i) => i.rawDate)?.rawDate;

      groups.push({
        date,
        rawDate,
        items,
        totalAmount,
        pendingCount,
        deliveredCount,
      });
    }

    return groups;
  }, [displayedOrders]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectDay = (dayOrders: typeof displayedOrders) => {
    const dayIds = dayOrders.map((o) => o.id);
    const isAllDaySelected = dayIds.every((id) => selectedOrderIds.includes(id));

    if (isAllDaySelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !dayIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...dayIds])));
    }
  };

  const handlePrintInvoice = (order: typeof orders[0]) => {
    printOrDownloadInvoice(order, settings);
  };

  const handleDownloadInvoice = (order: typeof orders[0]) => {
    setDownloadingId(order.id);
    try {
      downloadInvoiceFile(order, settings);
    } finally {
      setTimeout(() => setDownloadingId(null), 700);
    }
  };

  const handlePrintDailyPdf = (customDate?: string) => {
    const dateToUse = customDate || reportDate;
    const filtered = orders.filter((o) => o.date === dateToUse || o.rawDate === dateToUse);
    printOrDownloadDailyReport(dateToUse, filtered.length > 0 ? filtered : orders, settings);
  };

  const retailerOrders = orders.filter((o) => o.role === "retailer");
  const customerOrders = orders.filter((o) => o.role !== "retailer");

  const retailerRevenue = retailerOrders.reduce((s, o) => s + o.amount, 0);
  const customerRevenue = customerOrders.reduce((s, o) => s + o.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div
          onClick={() => setRoleSegment("all")}
          className={`glass-admin-card glass-admin-card-hover rounded-3xl p-5 sm:p-6 cursor-pointer border-2 transition-all ${
            roleSegment === "all" ? "!border-[#006a39] shadow-lg shadow-emerald-950/10" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">Total Orders</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {orders.length} total
            </span>
          </div>
          <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-3xl sm:text-4xl">
            ₹{(retailerRevenue + customerRevenue).toLocaleString()}
          </p>
          <p className="text-xs text-[#657969] mt-1">All processed & active platform fulfillments</p>
        </div>

        <div
          onClick={() => setRoleSegment("retailer")}
          className={`glass-admin-card glass-admin-card-hover rounded-3xl p-5 sm:p-6 cursor-pointer border-2 transition-all ${
            roleSegment === "retailer" ? "!border-sky-500 shadow-lg shadow-sky-950/10" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800">Retailer Wholesale</span>
            <span className="bg-sky-100 text-sky-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {retailerOrders.length} orders
            </span>
          </div>
          <p className="font-['Manrope',sans-serif] font-extrabold text-[#0369a1] text-3xl sm:text-4xl">
            ₹{retailerRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-[#657969] mt-1">B2B wholesale inventory invoices</p>
        </div>

        <div
          onClick={() => setRoleSegment("customer")}
          className={`glass-admin-card glass-admin-card-hover rounded-3xl p-5 sm:p-6 cursor-pointer border-2 transition-all ${
            roleSegment === "customer" ? "!border-emerald-600 shadow-lg shadow-emerald-950/10" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">Customer Retail</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {customerOrders.length} orders
            </span>
          </div>
          <p className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-3xl sm:text-4xl">
            ₹{customerRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-[#657969] mt-1">Direct consumer prescriptions & wellness</p>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="glass-admin-card rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-1.5 bg-[#f0f5f1] p-1.5 rounded-2xl">
          <button
            onClick={() => setRoleSegment("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              roleSegment === "all" ? "bg-white text-[#073b4c] shadow-xs" : "text-[#657969] hover:text-[#073b4c]"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setRoleSegment("retailer")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleSegment === "retailer" ? "bg-sky-600 text-white shadow-xs" : "text-[#657969] hover:text-sky-700"
            }`}
          >
            <Icons.Store className="w-3.5 h-3.5" />
            <span>Wholesale ({retailerOrders.length})</span>
          </button>
          <button
            onClick={() => setRoleSegment("customer")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleSegment === "customer" ? "bg-[#006a39] text-white shadow-xs" : "text-[#657969] hover:text-emerald-800"
            }`}
          >
            <Icons.User className="w-3.5 h-3.5" />
            <span>Customer ({customerOrders.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID, patient, pharmacy or phone…"
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-white/80 border border-[#dce7db] rounded-2xl focus:outline-none focus:border-[#006a39]"
            />
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-2xl bg-white border border-[#dce7db] text-xs font-bold text-[#073b4c] hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Icons.Refresh className={`w-3.5 h-3.5 text-[#006a39] ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing…" : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === f
                ? "bg-gradient-to-r from-[#006a39] to-[#008749] text-white shadow-md shadow-emerald-950/20"
                : "bg-white/80 text-[#596b5e] border border-[#dce7db] hover:bg-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grouped Day-Wise Orders */}
      <div className="flex flex-col gap-6">
        {groupedOrdersByDate.length === 0 ? (
          <div className="glass-admin-card rounded-3xl py-16 text-center text-[#728575] text-sm flex flex-col items-center gap-2 shadow-xs">
            <Icons.Order className="w-10 h-10 text-[#728575] stroke-1" />
            <p className="font-bold text-[#073b4c]">No matching orders found</p>
            <p className="text-xs">Adjust your search query or status filter.</p>
          </div>
        ) : (
          groupedOrdersByDate.map((group) => {
            const isDayAllSelected = group.items.length > 0 && group.items.every((item) => selectedOrderIds.includes(item.id));

            return (
              <div key={group.date} className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-emerald-50/90 via-white/80 to-emerald-50/90 border-b border-[#dce8dc] px-5 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isDayAllSelected}
                      onChange={() => handleToggleSelectDay(group.items)}
                      className="w-4 h-4 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39]"
                    />
                    <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-2xs">
                      <Icons.Calendar className="w-4 h-4 text-emerald-800" />
                    </div>
                    <div>
                      <h4 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base">{group.date}</h4>
                      <p className="text-[11px] text-[#657969]">{group.items.length} {group.items.length === 1 ? "Order" : "Orders"} placed</p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="bg-white border border-emerald-200 text-emerald-800 font-extrabold px-3 py-1 rounded-xl shadow-2xs">
                      Total: ₹{group.totalAmount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePrintDailyPdf(group.date)}
                      className="bg-[#006a39] hover:bg-[#008749] text-white font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Icons.Printer className="w-3.5 h-3.5 text-white" />
                      <span>Daily PDF Report</span>
                    </button>
                  </div>
                </div>

                {/* Day Orders List */}
                <div className="divide-y divide-[#e4ede2]">
                  {group.items.map((o) => {
                    const st = orderStatus(o.status);
                    const isRetailer = o.role === "retailer";
                    const isSelected = selectedOrderIds.includes(o.id);

                    return (
                      <div
                        key={o.id}
                        className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isSelected ? "bg-emerald-50/50" : "hover:bg-white/80"
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(o.id)}
                            className="w-4 h-4 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39] mt-2.5"
                          />
                          <div className="w-10 h-10 rounded-2xl bg-white border border-[#dce7db] flex items-center justify-center font-bold text-base shadow-xs shrink-0 mt-0.5 text-[#073b4c]">
                            {isRetailer ? <Icons.Store className="w-4 h-4 text-sky-700" /> : <Icons.User className="w-4 h-4 text-[#006a39]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-[#006a39]">#{o.id}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${isRetailer ? "bg-sky-50 text-sky-800 border-sky-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                                {isRetailer ? "Retailer Wholesale" : "Customer Direct"}
                              </span>
                              <span className="text-[10px] text-[#728575] font-medium">{o.date}</span>
                            </div>

                            <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm sm:text-base mt-0.5 truncate">
                              {o.customer}
                              {isRetailer && o.shopName && (
                                <span className="text-sky-700 font-semibold text-xs ml-2">· {o.shopName}</span>
                              )}
                            </p>

                            <p className="text-xs text-[#657969] mt-0.5 font-mono">
                              📞 {o.phone} · {o.items} {o.items === 1 ? "item" : "items"} · {o.payment}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Status Selector */}
                        <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#e4ede2]">
                          <div className="text-left md:text-right">
                            <p className="font-['Manrope',sans-serif] font-extrabold text-sm sm:text-lg text-[#073b4c]">
                              ₹{o.amount.toLocaleString()}
                            </p>
                            <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border mt-1" style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}>
                              {o.status}
                            </span>
                          </div>

                          <select
                            value={o.status}
                            onChange={(e) => onUpdateStatus?.(o.dbId || o.id, e.target.value as any)}
                            className="text-xs font-extrabold bg-white border border-[#dce7db] rounded-2xl px-3 py-2 text-[#073b4c] focus:outline-none focus:border-[#006a39] cursor-pointer shadow-xs"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(o)}
                            className="flex items-center gap-1.5 bg-[#006a39] hover:bg-[#008749] text-white text-xs font-bold px-3 py-2 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <Icons.Printer className="w-3.5 h-3.5 text-white" />
                            <span>Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(o)}
                            className="flex items-center gap-1 bg-white border border-[#dce7db] hover:bg-emerald-50 text-xs font-bold text-[#006a39] p-2 rounded-2xl transition-all cursor-pointer"
                            title="Save invoice file"
                          >
                            <Icons.Download className="w-3.5 h-3.5 text-[#006a39]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(o)}
                            className="flex items-center gap-1 bg-white border border-[#dce7db] hover:bg-slate-50 text-xs font-bold text-[#475569] px-3 py-2 rounded-2xl transition-all cursor-pointer"
                          >
                            <Icons.Eye className="w-3.5 h-3.5 text-[#475569]" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteOrder({ id: o.id, dbId: o.dbId, customer: o.customer, amount: o.amount })}
                            className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold p-2 rounded-2xl transition-all cursor-pointer"
                            title="Delete order"
                          >
                            <Icons.Trash className="w-3.5 h-3.5 text-rose-700" />
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

      {/* Invoice Details Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-[#07242e]/70 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-[#073b4c] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Icons.Order className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-extrabold text-base sm:text-lg">Order Details & Invoice Inspection</h3>
                  <p className="text-xs text-white/70 font-mono">Invoice Ref: #{previewInvoice.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printOrDownloadInvoice(previewInvoice, settings)}
                  className="bg-[#00a86b] hover:bg-[#00925c] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-white rounded-2xl border border-[#dce7db]">
                  <p className="text-[10px] font-extrabold text-[#728575] uppercase tracking-wider">Customer / Recipient</p>
                  <p className="font-bold text-[#073b4c] text-sm mt-1">{previewInvoice.customer}</p>
                  <p className="text-xs text-[#596b5e] mt-0.5">Phone: {previewInvoice.phone}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#dce7db]">
                  <p className="text-[10px] font-extrabold text-[#728575] uppercase tracking-wider">Payment & Status</p>
                  <p className="font-bold text-[#073b4c] text-sm mt-1">₹{previewInvoice.amount.toLocaleString()} ({previewInvoice.payment})</p>
                  <p className="text-xs text-emerald-800 font-bold mt-0.5">{previewInvoice.status} · {previewInvoice.paymentStatus || "Paid"}</p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="bg-white rounded-2xl border border-[#dce7db] p-4 overflow-hidden">
                <p className="text-[10px] font-extrabold text-[#728575] uppercase tracking-wider mb-2.5">
                  Ordered Products Breakdown ({previewInvoice.orderItems?.length || previewInvoice.items} items)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#e4ede2] text-[10px] uppercase font-extrabold text-[#596b5e]">
                        <th className="py-2 px-1 text-center w-8">#</th>
                        <th className="py-2 px-2">Item</th>
                        <th className="py-2 px-2 text-center">Batch / Exp</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">MRP</th>
                        <th className="py-2 px-2 text-right">Rate</th>
                        <th className="py-2 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f0]">
                      {previewInvoice.orderItems && previewInvoice.orderItems.length > 0 ? (
                        previewInvoice.orderItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-1 text-center font-bold text-[#657969]">{idx + 1}</td>
                            <td className="py-2 px-2 font-bold text-[#073b4c]">
                              {it.name}
                              {it.sku && <span className="block text-[10px] font-normal text-[#657969]">SKU: {it.sku}</span>}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[10px] text-[#657969]">
                              {it.batch || "—"} / {it.expiry || "—"}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-[#073b4c]">{it.quantity}</td>
                            <td className="py-2 px-2 text-right text-[#657969]">
                              {it.mrp ? `₹${Number(it.mrp).toLocaleString()}` : "—"}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-[#006a39]">₹{Number(it.price).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right font-extrabold text-[#073b4c]">
                              ₹{(Number(it.totalPrice) || (Number(it.price) * Number(it.quantity))).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-[#9aa89b]">
                            Standard order bundle ({previewInvoice.items} items)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Order Confirmation Modal */}
      {confirmDeleteOrder && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Icons.Trash className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg mb-1">Delete Order #{confirmDeleteOrder.id}</h3>
            <p className="text-[#657969] text-xs mb-6 leading-relaxed">Are you sure you want to delete this order ({confirmDeleteOrder.customer}, ₹{confirmDeleteOrder.amount.toLocaleString()})? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteOrder(null)} className="flex-1 py-2.5 rounded-2xl border border-[#dce7db] text-[#657969] font-bold text-xs hover:bg-white cursor-pointer">Cancel</button>
              <button onClick={handleConfirmSingleDelete} className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-rose-950/20">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ─── TAB: ALL USERS MANAGEMENT ─── */
function UsersTab({
  users,
  currentUser,
  onUpdateStatus,
  onChangePassword,
  onDeleteUser,
  onRefresh,
  isRefreshing,
}: {
  users: ManagedUser[];
  currentUser?: CurrentUser;
  onUpdateStatus: (userId: string, status: "active" | "blocked" | "pending" | "rejected") => Promise<void>;
  onChangePassword: (userId: string, newPass: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "retailer" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "blocked" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [usersSubTab, setUsersSubTab] = useState<"users" | "login-logs">("users");

  // Modals state
  const [passwordModalUser, setPasswordModalUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [statusModal, setStatusModal] = useState<{ user: ManagedUser; targetStatus: "active" | "blocked" | "pending" | "rejected" } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState<ManagedUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [detailsModalUser, setDetailsModalUser] = useState<ManagedUser | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = ""?.toLowerCase().includes(q);
        const matchShop = u.businessName?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchShop) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const customers = users.filter((u) => u.role === "customer").length;
    const retailers = users.filter((u) => u.role === "retailer").length;
    const blocked = users.filter((u) => u.status === "blocked").length;
    const pending = users.filter((u) => u.status === "pending").length;
    return { total, customers, retailers, blocked, pending };
  }, [users]);

  const handleExecutePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await onChangePassword(passwordModalUser.id, newPassword);
      setPasswordSuccess(`Password updated successfully for ${passwordModalUser.fullName}!`);
      setTimeout(() => {
        setPasswordModalUser(null);
        setNewPassword("");
        setPasswordSuccess("");
      }, 1200);
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExecuteStatusChange = async () => {
    if (!statusModal) return;
    setStatusLoading(true);
    try {
      await onUpdateStatus(statusModal.user.id, statusModal.targetStatus as any);
      setStatusModal(null);
    } catch (err: any) {
      alert("Failed to update status: " + err?.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExecuteDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleteLoading(true);
    try {
      await onDeleteUser(deleteModalUser.id);
      setDeleteModalUser(null);
    } catch (err: any) {
      alert("Failed to delete user: " + err?.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="glass-admin-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006a39]">
              Live Supabase Authentication & Profile Management
            </span>
          </div>
          <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl sm:text-2xl">
            User Accounts & Security Directory
          </h2>
          <p className="text-xs text-[#657969] mt-0.5">
            Full admin control over registered customers, wholesale retailers, and security credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 rounded-2xl bg-white/80 border border-[#dce7db] hover:bg-white text-[#073b4c] text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start md:self-auto active:scale-95"
        >
          <Icons.Refresh className={`w-4 h-4 text-[#006a39] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Syncing DB…" : "Refresh Directory"}</span>
        </button>
      </div>

      {/* Sub-Tab Switcher: Users | Login Logs */}
      <div className="flex items-center gap-2 bg-[#f0f5f2] rounded-2xl p-1 border border-[#d6e4d8] self-start">
        <button
          onClick={() => setUsersSubTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            usersSubTab === "users" ? "bg-white text-[#073b4c] shadow-xs" : "text-[#657969] hover:text-[#073b4c]"
          }`}
        >
          User Directory
        </button>
        <button
          onClick={() => setUsersSubTab("login-logs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            usersSubTab === "login-logs" ? "bg-[#073b4c] text-white shadow-xs" : "text-[#657969] hover:text-[#073b4c]"
          }`}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Login Logs
        </button>
      </div>


      {usersSubTab === "users" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div onClick={() => { setRoleFilter("all"); setStatusFilter("all"); }} className="glass-admin-card glass-admin-card-hover rounded-3xl p-4 cursor-pointer border-2 transition-all">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#657969]">Total Registered</span>
          <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl sm:text-3xl mt-1">{stats.total}</p>
          <p className="text-[11px] text-[#728575] mt-0.5">All accounts</p>
        </div>

        <div onClick={() => { setRoleFilter("retailer"); setStatusFilter("all"); }} className="glass-admin-card glass-admin-card-hover rounded-3xl p-4 cursor-pointer border-2 transition-all">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Retailers & Pharmacies</span>
          <p className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-2xl sm:text-3xl mt-1">{stats.retailers}</p>
          <p className="text-[11px] text-[#728575] mt-0.5">Wholesale B2B partners</p>
        </div>

        <div onClick={() => { setStatusFilter("pending"); setRoleFilter("all"); }} className="glass-admin-card glass-admin-card-hover rounded-3xl p-4 cursor-pointer border-2 transition-all">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Pending Review</span>
          <p className="font-['Manrope',sans-serif] font-extrabold text-[#b45309] text-2xl sm:text-3xl mt-1">{stats.pending}</p>
          <p className="text-[11px] text-[#728575] mt-0.5">Awaiting verification</p>
        </div>

        <div onClick={() => { setStatusFilter("blocked"); setRoleFilter("all"); }} className="glass-admin-card glass-admin-card-hover rounded-3xl p-4 cursor-pointer border-2 transition-all">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Blocked / Suspended</span>
          <p className="font-['Manrope',sans-serif] font-extrabold text-rose-600 text-2xl sm:text-3xl mt-1">{stats.blocked}</p>
          <p className="text-[11px] text-[#728575] mt-0.5">Access revoked</p>
        </div>
      </div>
      )}

      {/* Filter & Search Bar */}

      <div className="glass-admin-card rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#f0f5f2] rounded-2xl p-1 border border-[#d6e4d8]">
            {(["all", "retailer", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  roleFilter === r
                    ? "bg-white text-[#073b4c] shadow-xs"
                    : "text-[#657969] hover:text-[#073b4c]"
                }`}
              >
                {r === "all" ? "All Roles" : r === "retailer" ? "Retailers" : "Admins"}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#f0f5f2] rounded-2xl p-1 border border-[#d6e4d8]">
            {(["all", "active", "pending", "blocked"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-white text-[#073b4c] shadow-xs"
                    : "text-[#657969] hover:text-[#073b4c]"
                }`}
              >
                {s === "all" ? "All Statuses" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, shop, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/80 border border-[#dce7db] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-[#728575] hover:text-[#073b4c] font-bold shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users Table / Directory Cards */}
      <div className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-[#e4ede2]">
          {filteredUsers.map((u) => {
            const isSelf =
              u.email.toLowerCase() === "subhonehealthgroup@gmail.com" ||
              u.email.toLowerCase() === "admin@subhone.com" ||
              (currentUser?.id && u.id === currentUser.id) ||
              (currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase());
            return (
              <div key={u.id} className="p-4 sm:p-5 hover:bg-white/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* User Identity Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : u.role === "retailer"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {(u.fullName?.[0] || u.email[0] || "U").toUpperCase()}
                    </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base truncate">
                        {u.fullName}
                      </p>
                      {/* Role Pill */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : u.role === "retailer"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : "bg-sky-100 text-sky-900 border border-sky-200"
                        }`}
                      >
                        {u.role}
                      </span>

                      {/* Status Pill */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : u.status === "pending"
                            ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                            : u.status === "blocked"
                            ? "bg-rose-100 text-rose-900 border border-rose-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#596b5e] font-mono mt-1 truncate">
                      ✉️ {u.email}
                      
                    </p>
                    {u.businessName && (
                      <p className="text-xs text-[#006a39] font-semibold mt-0.5">
                        🏬 {u.businessName}
                      </p>
                    )}
                    <p className="text-[11px] text-[#8aa08e] mt-1">
                      Joined: {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      
                    </p>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* View Details Button */}
                  <button
                    type="button"
                    onClick={() => setDetailsModalUser(u)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#dce7db] hover:bg-[#f0f5f2] text-[#073b4c] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Icons.Eye className="w-3.5 h-3.5 text-[#006a39]" />
                    <span>Details</span>
                  </button>

                  {/* Change Password */}
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalUser(u);
                      setNewPassword("");
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#dce7db] hover:bg-[#f0f5f2] text-[#073b4c] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔑</span>
                    <span>Set Password</span>
                  </button>

                  {/* Approve button (if pending) */}
                  {u.status === "pending" && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setStatusModal({ user: u, targetStatus: "active" })}
                      className="px-3 py-1.5 rounded-xl bg-[#006a39] hover:bg-[#008749] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <Icons.Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {/* Reject button (if pending) */}
                  {u.status === "pending" && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setStatusModal({ user: u, targetStatus: "rejected" })}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  )}

                  {/* Block / Unblock buttons */}
                  {u.status !== "blocked" && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setStatusModal({ user: u, targetStatus: "blocked" })}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Icons.Ban className="w-3.5 h-3.5 text-amber-700" />
                      <span>Block</span>
                    </button>
                  )}

                  {u.status === "blocked" && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setStatusModal({ user: u, targetStatus: "active" })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <Icons.Check className="w-3.5 h-3.5" />
                      <span>Unblock User</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => setDeleteModalUser(u)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200 text-xs font-bold cursor-pointer"
                      title="Permanently Delete User"
                    >
                      <Icons.Trash className="w-4 h-4 text-rose-700" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-16 text-center text-[#728575] text-sm flex flex-col items-center gap-2">
            <Icons.User className="w-10 h-10 text-[#728575] stroke-1" />
            <p className="font-bold text-[#073b4c]">No users matched your criteria</p>
            <p className="text-xs">Adjust your search query, role filter, or approval status filter.</p>
          </div>
        )}
      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-xs">
                  🔑
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">Change User Password</h3>
                  <p className="text-xs text-[#657969]">{passwordModalUser.fullName} ({passwordModalUser.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-[#657969] hover:text-[#073b4c] text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePasswordChange} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-[#073b4c] uppercase tracking-wider mb-1.5">
                  New Secure Password
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Enter new 6+ char password…"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39] shadow-xs"
                />
                <p className="text-[11px] text-[#728575] mt-1">
                  The user can immediately log in with this newly assigned password.
                </p>
              </div>

              {passwordError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  {passwordSuccess}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="flex-1 py-2.5 rounded-2xl border border-[#dce7db] text-[#657969] font-bold text-xs hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-bold text-xs shadow-md shadow-emerald-950/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STATUS CONFIRMATION MODAL (Block / Unblock / Reject) ── */}
      {statusModal && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl animate-in zoom-in-95">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs ${
              statusModal.targetStatus === "blocked"
                ? "bg-amber-100 text-amber-800"
                : statusModal.targetStatus === "active"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}>
              {statusModal.targetStatus === "blocked" ? "⚠️" : statusModal.targetStatus === "active" ? "✓" : "✕"}
            </div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg mb-1 capitalize">
              {statusModal.targetStatus} User Account
            </h3>
            <p className="text-[#657969] text-xs mb-6 leading-relaxed">
              Are you sure you want to change the status of <strong>{statusModal.user.fullName}</strong> ({statusModal.user.email}) to <strong className="uppercase">{statusModal.targetStatus}</strong>?
              {statusModal.targetStatus === "blocked" && " This will immediately terminate and deny their portal access."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-[#dce7db] text-[#657969] font-bold text-xs hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusLoading}
                onClick={handleExecuteStatusChange}
                className={`flex-1 py-2.5 rounded-2xl text-white font-bold text-xs transition-colors cursor-pointer shadow-md ${
                  statusModal.targetStatus === "blocked"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : statusModal.targetStatus === "active"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {statusLoading ? "Updating…" : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE USER CONFIRMATION MODAL ── */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              <Icons.Trash className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg mb-1">
              Delete User Account
            </h3>
            <p className="text-[#657969] text-xs mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteModalUser.fullName}</strong> ({deleteModalUser.email})? This action cannot be undone and will erase their login credentials and profile records.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 py-2.5 rounded-2xl border border-[#dce7db] text-[#657969] font-bold text-xs hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleExecuteDeleteUser}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-rose-950/20 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS MODAL ── */}
      {detailsModalUser && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e4ede2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Icons.User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base">User Account Details</h3>
                  <p className="text-[11px] text-[#657969]">ID: {detailsModalUser.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalUser(null)}
                className="text-[#657969] hover:text-[#073b4c] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-[#073b4c]">
              <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                <span className="text-[#657969]">Full Name:</span>
                <span className="font-bold">{detailsModalUser.fullName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                <span className="text-[#657969]">Email:</span>
                <span className="font-mono font-bold text-emerald-800">{detailsModalUser.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                <span className="text-[#657969]">Phone:</span>
                <span className="font-mono">Not provided</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                <span className="text-[#657969]">User Role:</span>
                <span className="font-extrabold uppercase text-[#006a39]">{detailsModalUser.role}</span>
              </div>
              {detailsModalUser.businessName && (
                <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                  <span className="text-[#657969]">Business / Shop Name:</span>
                  <span className="font-bold">{detailsModalUser.businessName}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                <span className="text-[#657969]">Account Status:</span>
                <span className="font-extrabold uppercase">{detailsModalUser.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#edf3ee]">
                <span className="text-[#657969]">Created At:</span>
                <span>{new Date(detailsModalUser.createdAt).toLocaleString("en-IN")}</span>
              </div>
              
            </div>

            <button
              type="button"
              onClick={() => setDetailsModalUser(null)}
              className="w-full mt-5 py-2.5 rounded-2xl bg-[#006a39] text-white text-xs font-bold hover:bg-[#008749] transition-all cursor-pointer shadow-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
      {/* Login Logs Sub-Tab */}
      {usersSubTab === "login-logs" && <LoginLogsPanel />}
    </div>
  );
}

/* ─── Login Logs Panel (Admin Viewer) ─── */
function LoginLogsPanel() {
  const [logs, setLogs] = React.useState<LoginLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 50;

  const loadLogs = React.useCallback(async (pg: number = 0) => {
    setLoading(true);
    try {
      const result = await fetchLoginLogs({
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: PAGE_SIZE,
        offset: pg * PAGE_SIZE,
      });
      setLogs(result.logs);
      setTotal(result.total);
      setPage(pg);
    } catch (e) {
      console.error("Error loading login logs:", e);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, fromDate, toDate]);

  React.useEffect(() => { loadLogs(0); }, [loadLogs]);

  const statusColor = (s: string) => {
    if (s === "success") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s === "blocked_attempt") return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="glass-admin-card rounded-3xl p-4 sm:p-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center bg-[#f0f5f2] rounded-2xl p-1 border border-[#d6e4d8]">
          {(["all", "customer", "retailer", "admin"] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                roleFilter === r ? "bg-white text-[#073b4c] shadow-xs" : "text-[#657969] hover:text-[#073b4c]"
              }`}>{r === "all" ? "All Roles" : r}</button>
          ))}
        </div>
        <div className="flex items-center bg-[#f0f5f2] rounded-2xl p-1 border border-[#d6e4d8]">
          {(["all", "success", "failed", "blocked_attempt"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === s ? "bg-white text-[#073b4c] shadow-xs" : "text-[#657969] hover:text-[#073b4c]"
              }`}>{s === "all" ? "All" : s === "blocked_attempt" ? "Blocked" : s}</button>
          ))}
        </div>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="border border-[#dce7db] rounded-2xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#006a39]" placeholder="From" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="border border-[#dce7db] rounded-2xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#006a39]" placeholder="To" />
        <button onClick={() => loadLogs(0)} disabled={loading}
          className="px-4 py-2 rounded-2xl bg-[#006a39] text-white text-xs font-bold hover:bg-[#008749] transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {loading ? "Loading…" : "Apply Filters"}
        </button>
        <span className="text-xs text-[#728575] ml-auto">{total.toLocaleString()} total records</span>
      </div>

      {/* Log Table */}
      <div className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-[#728575] text-sm">Loading login logs…</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-[#728575] text-sm">
            <p className="font-bold text-[#073b4c]">No login logs found</p>
            <p className="text-xs mt-1">Adjust your filters or wait for login events.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50/90 to-white border-b border-[#dce8dc]">
                  <th className="text-left px-4 py-3 font-extrabold text-[#073b4c] uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 font-extrabold text-[#073b4c] uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 font-extrabold text-[#073b4c] uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-extrabold text-[#073b4c] uppercase tracking-wider">Result</th>
                  <th className="text-left px-4 py-3 font-extrabold text-[#073b4c] uppercase tracking-wider hidden md:table-cell">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4ede2]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/80 transition-colors">
                    <td className="px-4 py-3 text-[#657969] font-mono whitespace-nowrap">
                      {new Date(log.loggedInAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#073b4c] max-w-[200px] truncate">{log.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize bg-slate-100 text-slate-700 border border-slate-200">
                        {log.role || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusColor(log.status)}`}>
                        {log.status === "blocked_attempt" ? "Blocked" : log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#728575] font-mono hidden md:table-cell">{log.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => loadLogs(page - 1)} disabled={page === 0 || loading}
            className="px-4 py-2 rounded-2xl bg-white border border-[#dce7db] text-xs font-bold text-[#073b4c] hover:bg-emerald-50 transition-all disabled:opacity-40 cursor-pointer">
            ← Previous
          </button>
          <span className="text-xs text-[#657969] font-bold">Page {page + 1} of {totalPages}</span>
          <button onClick={() => loadLogs(page + 1)} disabled={page >= totalPages - 1 || loading}
            className="px-4 py-2 rounded-2xl bg-white border border-[#dce7db] text-xs font-bold text-[#073b4c] hover:bg-emerald-50 transition-all disabled:opacity-40 cursor-pointer">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function DeliveryPartnersTab() {
  const [partners, setPartners] = useState<DeliveryPartnerItem[]>([]);
  const [attendance, setAttendance] = useState<DeliveryAttendanceRecord[]>([]);
  const [locations, setLocations] = useState<DeliveryLocationPing[]>([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<"partners" | "attendance" | "reports" | "map">("partners");

  // Attendance Reports Sub-Tab State
  const [reportRangeType, setReportRangeType] = useState<"weekly" | "monthly">("weekly");
  const [reportWeekDate, setReportWeekDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportPartnerId, setReportPartnerId] = useState<string>("all");
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Weekly Off Day Update State inside Inspect Modal
  const [updatingWeeklyOff, setUpdatingWeeklyOff] = useState(false);

  // Add Partner Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartner, setNewPartner] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Inspect Partner Detail Modal
  const [inspectPartner, setInspectPartner] = useState<DeliveryPartnerItem | null>(null);
  const [partnerOrders, setPartnerOrders] = useState<DbOrder[]>([]);
  const [loadingPartnerOrders, setLoadingPartnerOrders] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [allPartners, attRecords, locs] = await Promise.all([
        fetchAllDeliveryPartners(),
        fetchDeliveryAttendance(),
        fetchAllOnDutyPartnerLocations(),
      ]);
      setPartners(allPartners);
      setAttendance(attRecords);
      setLocations(locs);
    } catch (err) {
      console.error("Error loading delivery partner tab data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetchAllOnDutyPartnerLocations().then((locs) => setLocations(locs)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInspect = async (p: DeliveryPartnerItem) => {
    setInspectPartner(p);
    setLoadingPartnerOrders(true);
    try {
      const orders = await fetchOrdersForPartner(p.id);
      setPartnerOrders(orders);
    } finally {
      setLoadingPartnerOrders(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.email.trim() || !newPartner.fullName.trim()) {
      setCreateError("Name and Email are required.");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const res = await adminCreateDeliveryPartner({
        email: newPartner.email,
        fullName: newPartner.fullName,
        password: newPartner.password || "Delivery@2026",
        phone: newPartner.phone,
      });

      if (res.success) {
        setShowAddModal(false);
        setNewPartner({ fullName: "", email: "", password: "", phone: "" });
        await loadData();
      } else {
        setCreateError(res.error || "Failed to create delivery partner.");
      }
    } catch (err: any) {
      setCreateError(err?.message || "An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const onDutyCount = partners.filter((p) => p.isOnDuty).length;
  const activeDeliveriesTotal = partners.reduce((acc, p) => acc + (p.activeOrdersCount || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI STATS OVERVIEW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-admin-card rounded-3xl p-5 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">Total Partners</p>
          <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c] mt-1">
            {partners.length}
          </p>
        </div>

        <div className="glass-admin-card rounded-3xl p-5 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">On Duty Now</p>
          <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#006a39] mt-1 flex items-center gap-2">
            <span>{onDutyCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </p>
        </div>

        <div className="glass-admin-card rounded-3xl p-5 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800">Active Shipments</p>
          <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-sky-700 mt-1">
            {activeDeliveriesTotal}
          </p>
        </div>

        <div className="glass-admin-card rounded-3xl p-5 shadow-xs">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">GPS Beacons</p>
          <p className="font-['Manrope',sans-serif] font-black text-2xl sm:text-3xl text-[#073b4c] mt-1">
            {locations.length} Live
          </p>
        </div>
      </div>

      {/* ── SUB-TABS & ACTION BUTTON ── */}
      <div className="glass-admin-card rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "partners", label: `Partners (${partners.length})` },
            { id: "map", label: `Live Fleet Map (${locations.length})` },
            { id: "attendance", label: "Attendance Logs" },
            { id: "reports", label: "📊 Attendance Reports" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold font-['Manrope',sans-serif] transition-all cursor-pointer whitespace-nowrap ${
                subTab === t.id
                  ? "bg-[#006a39] text-white shadow-md shadow-emerald-950/20"
                  : "bg-white text-[#073b4c] border border-[#dce7db] hover:bg-emerald-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white border border-[#dce7db] hover:bg-emerald-50 text-xs font-bold text-[#073b4c] cursor-pointer"
            title="Refresh Data"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
          </button>

          <button
            onClick={() => {
              setCreateError("");
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-950/15 cursor-pointer active:scale-95"
          >
            <span>+</span>
            <span>Add Delivery Partner</span>
          </button>
        </div>
      </div>

      {/* ── SUB-TAB 1: PARTNERS LIST ── */}
      {subTab === "partners" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div
              key={p.id}
              className="glass-admin-card rounded-3xl p-5 border border-[#dce7db] shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                      p.isOnDuty
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    <span>{p.isOnDuty ? "On Duty" : "Off Duty"}</span>
                  </span>

                  <span className="text-[11px] text-[#728575] font-semibold">
                    {p.profileCompleted ? "Profile Complete ✓" : "Incomplete Profile ⚠️"}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-600 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#006a39] to-[#008749] text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                      {(p.name?.[0] || "D").toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-['Manrope',sans-serif] font-extrabold text-base text-[#073b4c] truncate">
                      {p.name}
                    </h4>
                    <p className="text-xs text-[#657969] font-mono truncate">{p.email}</p>
                    <p className="text-xs text-[#006a39] font-bold mt-0.5">{p.phone || "No phone yet"}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0f4f0] grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#f8fafb] rounded-xl p-2 text-center">
                    <span className="text-[#657969] block">Active Orders</span>
                    <span className="font-black text-[#006a39] text-sm">{p.activeOrdersCount || 0}</span>
                  </div>
                  <div className="bg-[#f8fafb] rounded-xl p-2 text-center">
                    <span className="text-[#657969] block">Delivered</span>
                    <span className="font-black text-[#073b4c] text-sm">{p.completedOrdersCount || 0}</span>
                  </div>
                </div>

                {p.vehicleType && (
                  <p className="text-xs text-[#657969] mt-2.5 flex items-center gap-1">
                    <span>🛵</span>
                    <span>{p.vehicleType}</span>
                    {p.vehicleNumber && <span className="font-mono font-bold text-[#073b4c]">({p.vehicleNumber})</span>}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleInspect(p)}
                className="w-full py-2.5 rounded-2xl bg-white border border-[#dce7db] hover:bg-[#f0f5f2] text-[#073b4c] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>View Full Details & Orders</span>
                <span>→</span>
              </button>
            </div>
          ))}

          {partners.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#728575] glass-admin-card rounded-3xl flex flex-col items-center gap-2">
              <span className="text-3xl">🛵</span>
              <p className="font-bold text-[#073b4c]">No delivery partners registered yet</p>
              <p className="text-xs">Click "+ Add Delivery Partner" above to create an employee account.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: LIVE FLEET MAP ── */}
      {subTab === "map" && (
        <div className="flex flex-col gap-4">
          <div className="glass-admin-card rounded-3xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-['Manrope',sans-serif] font-black text-lg text-[#073b4c]">
                City-Wide Live Fleet GPS Tracking
              </h3>
              <p className="text-xs text-[#657969]">
                Showing real-time location pins for all on-duty delivery partners across Kolkata & surrounding areas.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{locations.length} Online Drivers</span>
            </span>
          </div>

          <LiveDeliveryMap mode="admin-all" allLocations={locations} height="520px" />
        </div>
      )}

      {/* ── SUB-TAB 3: ATTENDANCE LOGS ── */}
      {subTab === "attendance" && (
        <div className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#e4ede2] flex items-center justify-between">
            <h3 className="font-['Manrope',sans-serif] font-black text-base text-[#073b4c]">
              Daily Attendance & Shift Records
            </h3>
            <span className="text-xs text-[#728575]">Auto-logged upon on-duty toggles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafb] border-b border-[#e4ede2] text-[#073b4c] font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Partner Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f0]">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#f8fafb] transition-colors">
                    <td className="p-4 font-bold text-[#073b4c]">{rec.userName}</td>
                    <td className="p-4 font-mono text-[#657969]">{rec.userEmail}</td>
                    <td className="p-4 font-semibold">{rec.workDate}</td>
                    <td className="p-4 text-emerald-800 font-mono">
                      {rec.checkInAt ? new Date(rec.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="p-4 text-[#657969] font-mono">
                      {rec.checkOutAt ? new Date(rec.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Active / Open"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          rec.status === "present"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attendance.length === 0 && (
            <div className="p-12 text-center text-[#728575] text-xs font-semibold">
              No attendance records recorded yet.
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 4: ATTENDANCE REPORTS (EXCEL EXPORT) ── */}
      {subTab === "reports" && (() => {
        // Calculate weekly start & end dates
        let weekStartDate = "";
        let weekEndDate = "";
        let weekLabelText = "";
        try {
          const parts = reportWeekDate.split("-").map(Number);
          const curr = new Date(parts[0], parts[1] - 1, parts[2]);
          const day = curr.getDay(); // 0 is Sun, 1 is Mon...
          const diffToMon = curr.getDate() - day + (day === 0 ? -6 : 1);
          const monDate = new Date(parts[0], parts[1] - 1, diffToMon);
          const sunDate = new Date(parts[0], parts[1] - 1, diffToMon + 6);
          
          const fmt = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dayNum = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dayNum}`;
          };
          weekStartDate = fmt(monDate);
          weekEndDate = fmt(sunDate);

          const monLabel = monDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
          const sunLabel = sunDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
          weekLabelText = `${monLabel} – ${sunLabel}`;
        } catch {
          weekStartDate = reportWeekDate;
          weekEndDate = reportWeekDate;
          weekLabelText = reportWeekDate;
        }

        // Calculate monthly start & end dates
        let monthStartDate = "";
        let monthEndDate = "";
        let monthLabelText = "";
        try {
          const [yr, mo] = reportMonth.split("-").map(Number);
          monthStartDate = `${yr}-${String(mo).padStart(2, "0")}-01`;
          const lastDay = new Date(yr, mo, 0).getDate();
          monthEndDate = `${yr}-${String(mo).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
          const mDate = new Date(yr, mo - 1, 1);
          monthLabelText = mDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        } catch {
          monthStartDate = `${reportMonth}-01`;
          monthEndDate = `${reportMonth}-28`;
          monthLabelText = reportMonth;
        }

        const activeStartDate = reportRangeType === "weekly" ? weekStartDate : monthStartDate;
        const activeEndDate = reportRangeType === "weekly" ? weekEndDate : monthEndDate;
        const activeRangeLabel = reportRangeType === "weekly" ? weekLabelText : monthLabelText;

        const handleDownloadExcel = async () => {
          setDownloadingReport(true);
          setReportMsg(null);
          try {
            const rows = await fetchAttendanceReport({
              startDate: activeStartDate,
              endDate: activeEndDate,
              partnerId: reportPartnerId === "all" ? undefined : reportPartnerId,
            });

            if (rows.length === 0) {
              setReportMsg({ type: "error", text: "No attendance records found for this period." });
              return;
            }

            exportAttendanceReportToExcel(rows, {
              rangeLabel: activeRangeLabel,
              rangeType: reportRangeType,
            });

            setReportMsg({
              type: "success",
              text: `Attendance report generated & downloaded successfully (${rows.length} records).`,
            });
          } catch (err: any) {
            console.error("Report download failed:", err);
            setReportMsg({ type: "error", text: err?.message || "Could not generate the report. Please try again." });
          } finally {
            setDownloadingReport(false);
          }
        };

        const selectedPartnerName = reportPartnerId === "all" 
          ? "All Delivery Partners" 
          : partners.find((p) => p.id === reportPartnerId)?.name || "Selected Partner";

        return (
          <div className="flex flex-col gap-6">
            {/* Header & Explainer Card */}
            <div className="glass-admin-card rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">📥</span>
                    <h3 className="font-['Manrope',sans-serif] font-black text-lg text-[#073b4c]">
                      Attendance Report Export
                    </h3>
                  </div>
                  <p className="text-xs text-[#657969] mt-1 max-w-2xl">
                    Download detailed shift attendance as an Excel (<code className="font-mono text-[#006a39]">.xlsx</code>) spreadsheet.
                    Rows include all calendar days per partner with check-in, check-out, and auto-excused <span className="font-bold text-emerald-800">Week Off</span> detection.
                  </p>
                </div>

                <div className="inline-flex rounded-2xl bg-[#eef4ef] p-1 border border-[#dce7db] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setReportRangeType("weekly");
                      setReportMsg(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reportRangeType === "weekly"
                        ? "bg-[#006a39] text-white shadow-xs"
                        : "text-[#073b4c] hover:text-[#006a39]"
                    }`}
                  >
                    📅 Weekly Report
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportRangeType("monthly");
                      setReportMsg(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reportRangeType === "monthly"
                        ? "bg-[#006a39] text-white shadow-xs"
                        : "text-[#073b4c] hover:text-[#006a39]"
                    }`}
                  >
                    🗓️ Monthly Report
                  </button>
                </div>
              </div>

              {/* Form Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 pt-6 border-t border-[#e4ede2]">
                {/* 1. Date/Range Selector */}
                <div>
                  <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1.5">
                    {reportRangeType === "weekly" ? "Select Week (Pick Any Day)" : "Select Month & Year"}
                  </label>
                  {reportRangeType === "weekly" ? (
                    <input
                      type="date"
                      value={reportWeekDate}
                      onChange={(e) => {
                        setReportWeekDate(e.target.value);
                        setReportMsg(null);
                      }}
                      className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                  ) : (
                    <input
                      type="month"
                      value={reportMonth}
                      onChange={(e) => {
                        setReportMonth(e.target.value);
                        setReportMsg(null);
                      }}
                      className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                    />
                  )}
                  <p className="text-[11px] text-[#657969] mt-1">
                    Resolved Range: <span className="font-bold text-[#073b4c]">{activeRangeLabel}</span>
                  </p>
                </div>

                {/* 2. Partner Filter */}
                <div>
                  <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1.5">
                    Target Delivery Partner
                  </label>
                  <select
                    value={reportPartnerId}
                    onChange={(e) => {
                      setReportPartnerId(e.target.value);
                      setReportMsg(null);
                    }}
                    className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  >
                    <option value="all">👥 All Delivery Partners ({partners.length})</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.phone ? `(${p.phone})` : ""} {p.weeklyOffDay ? `[Off: ${p.weeklyOffDay}]` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#657969] mt-1">
                    Selected Scope: <span className="font-bold text-[#073b4c]">{selectedPartnerName}</span>
                  </p>
                </div>

                {/* 3. Download Action */}
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={downloadingReport}
                    className="w-full py-2.5 px-5 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-bold text-sm shadow-md shadow-emerald-950/20 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloadingReport ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Compiling Sheet...</span>
                      </>
                    ) : (
                      <>
                        <span>📊</span>
                        <span>Download Excel (.xlsx)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#657969] mt-1">
                    Contains 8 columns: Sl. No., Name, Mobile, Date, In/Out, Status, Week Off
                  </p>
                </div>
              </div>

              {/* Status/Error Messages */}
              {reportMsg && (
                <div
                  className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                    reportMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  <span>{reportMsg.type === "success" ? "✅" : "⚠️"}</span>
                  <span>{reportMsg.text}</span>
                </div>
              )}
            </div>

            {/* Excel Columns & Rules Specification Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-admin-card rounded-3xl p-5 shadow-xs border border-[#e4ede2]">
                <h4 className="font-['Manrope',sans-serif] font-black text-xs text-[#073b4c] uppercase tracking-wider flex items-center gap-2 mb-3">
                  <span>📑</span>
                  <span>Excel Sheet Format & Columns</span>
                </h4>
                <div className="space-y-1.5 text-xs text-[#657969]">
                  <p><b className="text-[#073b4c]">1. Sl. No.:</b> 1, 2, 3... sequence per export row.</p>
                  <p><b className="text-[#073b4c]">2. Name:</b> Delivery partner's registered full name.</p>
                  <p><b className="text-[#073b4c]">3. Mobile Number:</b> Partner mobile number or "—".</p>
                  <p><b className="text-[#073b4c]">4. Date:</b> Calendar day in YYYY-MM-DD format.</p>
                  <p><b className="text-[#073b4c]">5. Check In:</b> Formatted local check-in time (e.g. 09:15 AM) or "—".</p>
                  <p><b className="text-[#073b4c]">6. Check Out:</b> Formatted local check-out time or "—".</p>
                  <p><b className="text-[#073b4c]">7. Status:</b> <span className="text-emerald-700 font-bold">Present</span>, <span className="text-rose-700 font-bold">Absent</span>, or <span className="text-sky-700 font-bold">Week Off</span>.</p>
                  <p><b className="text-[#073b4c]">8. Week Off:</b> Assigned weekly off day (e.g. "Sunday") or "Not Set".</p>
                </div>
              </div>

              <div className="glass-admin-card rounded-3xl p-5 shadow-xs border border-[#e4ede2]">
                <h4 className="font-['Manrope',sans-serif] font-black text-xs text-[#073b4c] uppercase tracking-wider flex items-center gap-2 mb-3">
                  <span>💡</span>
                  <span>HR & Attendance Rules</span>
                </h4>
                <div className="space-y-2 text-xs text-[#657969]">
                  <p>
                    <b className="text-[#073b4c]">Calendar Integrity:</b> Every single calendar day in the selected week or month is guaranteed to appear for every partner, even if no shift was worked.
                  </p>
                  <p>
                    <b className="text-[#073b4c]">Weekly Off Exemption:</b> Missing shifts on a partner's assigned weekly off day are automatically marked <span className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded-md">Week Off</span> instead of Absent.
                  </p>
                  <p>
                    <b className="text-[#073b4c]">Assigning Off Days:</b> You can set each rider's weekly off day anytime by clicking <em>"View Full Details & Orders"</em> on their card in the Partners tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 1: ADD DELIVERY PARTNER ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-xs">
                  🛵
                </div>
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-black text-[#073b4c] text-lg">
                    Create Delivery Partner
                  </h3>
                  <p className="text-xs text-[#657969]">Assign login credentials for mobile rider app</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#657969] hover:text-[#073b4c] text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="flex flex-col gap-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Ghosh"
                  value={newPartner.fullName}
                  onChange={(e) => setNewPartner((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                  Email (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.delivery@subhone.com"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                  Initial Password (default: Delivery@2026)
                </label>
                <input
                  type="text"
                  placeholder="Delivery@2026"
                  value={newPartner.password}
                  onChange={(e) => setNewPartner((p) => ({ ...p, password: e.target.value }))}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#073b4c] uppercase tracking-wider mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-white border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-[#dce7db] text-[#073b4c] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-2xl bg-[#006a39] hover:bg-[#008749] text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INSPECT PARTNER PROFILE & DELIVERIES ── */}
      {inspectPartner && (
        <div className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#073b4c] to-[#006a39] text-white p-5 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {inspectPartner.avatarUrl ? (
                  <img
                    src={inspectPartner.avatarUrl}
                    alt={inspectPartner.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-black text-2xl flex items-center justify-center border border-white/30">
                    {(inspectPartner.name?.[0] || "D").toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-['Manrope',sans-serif] font-black text-lg sm:text-xl">
                    {inspectPartner.name}
                  </h3>
                  <p className="text-xs text-white/80 font-mono">{inspectPartner.email}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectPartner(null)}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs">
              {/* Partner Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#f8fafb] rounded-2xl p-4 border border-[#e4ede2]">
                <div>
                  <span className="text-[#657969] block">Phone</span>
                  <span className="font-bold text-[#073b4c]">{inspectPartner.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-[#657969] block">Duty Status</span>
                  <span className="font-bold text-emerald-700">{inspectPartner.isOnDuty ? "On Duty" : "Off Duty"}</span>
                </div>
                <div>
                  <span className="text-[#657969] block">Today's Attendance</span>
                  <span className="font-bold uppercase text-[#073b4c]">{inspectPartner.todayAttendanceStatus || "—"}</span>
                </div>
                <div>
                  <span className="text-[#657969] block">Vehicle</span>
                  <span className="font-bold text-[#073b4c]">{inspectPartner.vehicleType || "—"}</span>
                </div>
                <div>
                  <span className="text-[#657969] block">Vehicle Number</span>
                  <span className="font-bold font-mono text-[#073b4c]">{inspectPartner.vehicleNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[#657969] block">Joined</span>
                  <span className="font-bold text-[#073b4c]">
                    {new Date(inspectPartner.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Weekly Off Day Setting */}
              <div className="bg-[#f8fafb] rounded-2xl p-4 border border-[#e4ede2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-[#073b4c] block">Assigned Weekly Off Day</span>
                  <p className="text-[11px] text-[#657969] mt-0.5">Excuses partner from Absent marking on this day in attendance reports.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={inspectPartner.weeklyOffDay || "None"}
                    onChange={async (e) => {
                      const val = e.target.value === "None" ? null : e.target.value;
                      setUpdatingWeeklyOff(true);
                      try {
                        const res = await updateDeliveryPartnerWeeklyOff(inspectPartner.id, val);
                        if (res.success) {
                          setInspectPartner((prev) => prev ? { ...prev, weeklyOffDay: val } : prev);
                          setPartners((prev) => prev.map((p) => p.id === inspectPartner.id ? { ...p, weeklyOffDay: val } : p));
                        }
                      } finally {
                        setUpdatingWeeklyOff(false);
                      }
                    }}
                    disabled={updatingWeeklyOff}
                    className="bg-white border border-[#dce7db] rounded-xl px-3 py-1.5 text-xs font-bold text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  >
                    <option value="None">None (Works 7 Days)</option>
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {updatingWeeklyOff && <span className="text-[10px] text-emerald-700 font-bold animate-pulse">Saving…</span>}
                </div>
              </div>

              {inspectPartner.address && (
                <div>
                  <span className="text-[#657969] block mb-1 font-bold">Base Address</span>
                  <p className="text-xs text-[#073b4c] bg-[#f8fafb] p-3 rounded-xl border border-[#e4ede2]">
                    {inspectPartner.address}
                  </p>
                </div>
              )}

              {/* Partner Orders */}
              <div>
                <h4 className="font-['Manrope',sans-serif] font-black text-sm text-[#073b4c] mb-2">
                  Assigned Deliveries ({partnerOrders.length})
                </h4>

                {loadingPartnerOrders ? (
                  <div className="py-6 text-center text-[#728575]">Loading partner orders…</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {partnerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e4ede2] shadow-2xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#006a39]">{ord.order_number}</span>
                          <span className="text-[#657969] ml-2">({ord.customer_name})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">₹{ord.total_amount}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {ord.delivery_status || ord.status}
                          </span>
                        </div>
                      </div>
                    ))}

                    {partnerOrders.length === 0 && (
                      <div className="py-6 text-center text-[#728575]">No deliveries recorded yet.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabBookingsTab({
  bookings,
  onUpdateStatus,
}: {
  bookings: DbLabBooking[];
  onUpdateStatus: (id: string, status: DbLabBooking["status"]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-admin-card rounded-3xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base sm:text-lg">Diagnostic Lab Test Bookings</h3>
          <p className="text-xs text-[#657969]">Home sample collection & digital health reports</p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
          {bookings.length} Total Bookings
        </span>
      </div>

      <div className="glass-admin-card rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-[#e4ede2]">
          {bookings.map((b) => (
            <div key={b.id} className="p-4 sm:p-5 hover:bg-white/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                  <Icons.Lab className="w-6 h-6 text-purple-800" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-sm sm:text-base truncate">{b.package_name}</p>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      ₹{b.total_amount}
                    </span>
                  </div>
                  <p className="text-xs text-[#596b5e] font-semibold mt-1">Patient: {b.patient_name} ({b.patient_age} yrs, {b.patient_gender}) · 📞 {b.patient_phone}</p>
                  <p className="text-xs text-[#728575] mt-0.5">📅 {b.collection_date} at {b.collection_time_slot} · 📍 {b.collection_address.line1}, {b.collection_address.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={b.status}
                  onChange={(e) => onUpdateStatus(b.id, e.target.value as any)}
                  className="text-xs font-bold bg-white border border-[#dce7db] rounded-2xl px-3 py-2 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                >
                  <option value="booked">Booked</option>
                  <option value="sample_collected">Sample Collected</option>
                  <option value="in_lab">In Lab Testing</option>
                  <option value="report_generated">Report Generated</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="py-16 text-center text-[#728575] text-sm flex flex-col items-center gap-2">
            <Icons.Lab className="w-10 h-10 text-[#728575] stroke-1" />
            <p className="font-bold text-[#073b4c]">No lab test bookings found</p>
            <p className="text-xs">Incoming patient diagnostics will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TAB: REVENUE & FINANCIAL ANALYTICS ─── */
function RevenueTab({ liveOrders }: { liveOrders: any[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const revenueHistory = useMemo(() => {
    const history = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const rawDateStr = d.toISOString().split("T")[0];
      
      const dayOrders = liveOrders.filter(o => o.rawDate === rawDateStr && o.status !== "Cancelled");
      const orders = dayOrders.length;
      const revenue = dayOrders.reduce((acc, o) => acc + o.amount, 0);
      const upi = dayOrders.filter(o => o.payment === "UPI").reduce((acc, o) => acc + o.amount, 0);
      const card = dayOrders.filter(o => o.payment === "Card").reduce((acc, o) => acc + o.amount, 0);
      const cod = dayOrders.filter(o => o.payment === "COD").reduce((acc, o) => acc + o.amount, 0);
      
      history.push({
        date: dateStr,
        rawDate: rawDateStr,
        orders,
        revenue,
        upi,
        card,
        cod
      });
    }
    return history;
  }, [liveOrders]);

  const today = revenueHistory[0] || { revenue: 0, orders: 0, upi: 0, card: 0, cod: 0 };
  const yesterday = revenueHistory[1] || { revenue: 0, orders: 0 };
  const weekTotal = revenueHistory.reduce((s, r) => s + r.revenue, 0);
  const weekOrders = revenueHistory.reduce((s, r) => s + r.orders, 0);
  const avgDaily = Math.round(weekTotal / Math.max(1, revenueHistory.length));
  
  const growthRate = yesterday.revenue > 0 ? Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100) : 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl p-6 flex flex-col justify-between text-white shadow-xl"
          style={{ background: "linear-gradient(135deg, #073b4c 0%, #006a39 100%)" }}
        >
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Live System Clock</p>
            <p className="font-['Manrope',sans-serif] font-extrabold text-3xl mt-2">{now.toLocaleTimeString()}</p>
          </div>
          <p className="text-xs text-emerald-300 mt-4">Automated ledger resets at 12:00 AM IST</p>
        </div>

        <div className="glass-admin-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">Today&apos;s Gross GMV</p>
            <p className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-3xl mt-1">₹{today.revenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-emerald-700 font-bold mt-3">{growthRate > 0 ? '+' : ''}{growthRate}% vs yesterday</p>
        </div>

        <div className="glass-admin-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#657969]">7-Day Revenue Velocity</p>
            <p className="font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-3xl mt-1">₹{weekTotal.toLocaleString()}</p>
          </div>
          <p className="text-xs text-[#657969] mt-3">{weekOrders} total transactions · Avg ₹{avgDaily}/day</p>
        </div>
      </div>

      {/* Daily History Table */}
      <div className="glass-admin-card rounded-3xl p-6 sm:p-7">
        <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base sm:text-lg mb-5">7-Day Revenue Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e4ede2] text-[10px] font-extrabold text-[#728575] uppercase tracking-wider">
                <th className="pb-3 text-left">Date</th>
                <th className="pb-3 text-left">Orders</th>
                <th className="pb-3 text-left">Gross Revenue</th>
                <th className="pb-3 text-left">UPI</th>
                <th className="pb-3 text-left">Card</th>
                <th className="pb-3 text-left">COD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4ede2]">
              {revenueHistory.map((r, i) => (
                <tr key={r.date} className="hover:bg-white/80 transition-colors">
                  <td className="py-3 font-bold text-[#073b4c]">{r.date} {i === 0 && " (Today)"}</td>
                  <td className="py-3 text-[#596b5e] font-semibold">{r.orders}</td>
                  <td className="py-3 font-extrabold text-[#006a39]">₹{r.revenue.toLocaleString()}</td>
                  <td className="py-3 font-mono text-emerald-800">₹{r.upi.toLocaleString()}</td>
                  <td className="py-3 font-mono text-sky-800">₹{r.card.toLocaleString()}</td>
                  <td className="py-3 font-mono text-amber-800">₹{r.cod.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── TAB: SETTINGS & SYSTEM CONFIG ─── */
function SettingsTab({
  settings,
  setSettings,
  categories,
  addCategory,
  user,
  adminAvatar,
  setAdminAvatar,
  adminName,
  setAdminName,
  adminPhone,
  setAdminPhone,
  onLogout,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  categories: string[];
  addCategory: (name: string) => void;
  user?: CurrentUser;
  adminAvatar: string;
  setAdminAvatar: React.Dispatch<React.SetStateAction<string>>;
  adminName: string;
  setAdminName: React.Dispatch<React.SetStateAction<string>>;
  adminPhone: string;
  setAdminPhone: React.Dispatch<React.SetStateAction<string>>;
  onLogout?: () => void;
}) {
  const [newCat, setNewCat] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [pharmacySaveStatus, setPharmacySaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pharmacyMsg, setPharmacyMsg] = useState("");
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const avatarCameraRef = useRef<HTMLInputElement>(null);

  const handleSavePharmacyDetails = async () => {
    setPharmacySaveStatus("saving");
    setPharmacyMsg("");
    try {
      const res = await saveStoreSettingsToDb(settings);
      if (!res.success) {
        throw new Error(res.error || "Failed to save pharmacy details to database.");
      }
      setPharmacySaveStatus("saved");
      setPharmacyMsg(`Stored "${settings.storeName}" to Supabase database successfully!`);
      setTimeout(() => setPharmacySaveStatus("idle"), 4000);
    } catch (err: any) {
      console.error("Pharmacy details save failed:", err);
      setPharmacySaveStatus("error");
      setPharmacyMsg(err?.message || "Failed to save to database. Please check your network.");
      setTimeout(() => setPharmacySaveStatus("idle"), 5000);
    }
  };

  const handleAddCat = () => {
    const trimmed = newCat.trim();
    if (trimmed && !categories.includes(trimmed)) addCategory(trimmed);
    setNewCat("");
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setAdminAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveSettings = async () => {
    setSaveStatus("saving");
    setStatusMsg("");
    try {
      // 1. Save store settings to Supabase DB
      const storeRes = await saveStoreSettingsToDb(settings);
      if (!storeRes.success) {
        throw new Error(storeRes.error || "Failed to save store settings to database.");
      }

      // 2. Save admin profile & avatar permanently to Supabase DB
      const profRes = await updateAdminProfileInDb(
        user?.id || "",
        user?.email || "admin@subhone.com",
        {
          fullName: adminName,
          phone: adminPhone,
          avatarUrl: adminAvatar,
        }
      );
      if (!profRes.success) {
        console.warn("Profile update warning:", profRes.error);
      }

      setSaveStatus("saved");
      setStatusMsg("Configuration & Admin profile saved to Supabase Database forever!");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } catch (e: any) {
      console.error("Failed to save settings:", e);
      setSaveStatus("error");
      setStatusMsg(e?.message || "Failed to save settings to database. Please check your connection.");
      setTimeout(() => setSaveStatus("idle"), 6000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {saveStatus === "saved" && (
        <div className="p-4 rounded-3xl bg-emerald-500/15 backdrop-blur-xl border border-emerald-400/40 text-emerald-950 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg shadow-emerald-900/10 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Icons.Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-[#006a39]">Database Synchronization Success!</p>
              <p className="text-xs text-emerald-800/90 font-medium">{statusMsg}</p>
            </div>
          </div>
          <button onClick={() => setSaveStatus("idle")} className="font-bold text-emerald-900 px-2 cursor-pointer">✕</button>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="p-4 rounded-3xl bg-rose-500/15 backdrop-blur-xl border border-rose-400/40 text-rose-950 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg shadow-rose-900/10 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Icons.Alert className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-rose-800">Database Save Issue</p>
              <p className="text-xs text-rose-700/90 font-medium">{statusMsg}</p>
            </div>
          </div>
          <button onClick={() => setSaveStatus("idle")} className="font-bold text-rose-900 px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── 1. Admin Profile Picture & Account Card ── */}
      <div className="glass-admin-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-[#e4ede2]/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-[#006a39] flex items-center justify-center shadow-xs">
              <Icons.User className="w-5 h-5 text-[#006a39]" />
            </div>
            <div>
              <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg">
                Administrator Profile & Identity
              </h2>
              <p className="text-xs text-[#657969]">
                Manage master administrator avatar and personal credentials
              </p>
            </div>
          </div>
          <span className="bg-emerald-100 text-[#006a39] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
            Master Superadmin
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-7">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-3 border-white/80 shadow-xl bg-gradient-to-br from-[#006a39] to-[#008749] flex items-center justify-center relative">
                {adminAvatar ? (
                  <img
                    src={adminAvatar}
                    alt="Admin Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-4xl sm:text-5xl font-['Manrope',sans-serif]">
                    {(adminName?.[0] || user?.email?.[0] || "A").toUpperCase()}
                  </span>
                )}
                {/* Overlay on hover */}
                <div
                  onClick={() => avatarFileRef.current?.click()}
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <Icons.Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[11px] font-extrabold uppercase">Change</span>
                </div>
              </div>

              {adminAvatar && (
                <button
                  type="button"
                  onClick={() => setAdminAvatar("")}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  title="Remove Profile Picture"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Avatar Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[11px] font-extrabold text-[#006a39] border border-emerald-300/80 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Image className="w-3.5 h-3.5 text-[#006a39]" />
                <span>Upload Photo</span>
              </button>
              <button
                type="button"
                onClick={() => avatarCameraRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[11px] font-extrabold text-[#0369a1] border border-sky-300/80 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Camera className="w-3.5 h-3.5 text-[#0369a1]" />
                <span>Take Photo</span>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <input
              ref={avatarCameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <p className="text-[10px] text-[#718574] text-center">
              PNG, JPG or WebP · Max 5MB
            </p>
          </div>

          {/* Personal Info Fields */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                Admin Full Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Administrator Name"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                Admin Direct Phone
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={INPUT_CLS}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                Authentication Login Email
              </label>
              <input
                type="email"
                value={user?.email || "admin@subhone.com"}
                disabled
                className={`${INPUT_CLS} !bg-gray-100/70 !text-[#526355] cursor-not-allowed`}
              />
              <p className="text-[10px] text-[#728575] mt-1">
                Root login credentials managed securely by Supabase Authentication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Pharmacy & Store Identity ── */}
      <div className="glass-admin-card rounded-3xl p-6 sm:p-8">
        {pharmacySaveStatus === "saved" && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <Icons.Check className="w-4 h-4 text-[#006a39]" />
              <span>{pharmacyMsg || "Pharmacy Identity saved to Supabase Database successfully!"}</span>
            </div>
            <button onClick={() => setPharmacySaveStatus("idle")} className="text-emerald-900 font-bold px-1.5 cursor-pointer">✕</button>
          </div>
        )}

        {pharmacySaveStatus === "error" && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-950 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <Icons.Alert className="w-4 h-4 text-rose-700" />
              <span>{pharmacyMsg || "Failed to save pharmacy identity to database."}</span>
            </div>
            <button onClick={() => setPharmacySaveStatus("idle")} className="text-rose-900 font-bold px-1.5 cursor-pointer">✕</button>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mb-5 border-b border-[#e4ede2]/80 pb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-100/80 text-teal-800 flex items-center justify-center shadow-xs">
              <Icons.Store className="w-4 h-4 text-[#006a39]" />
            </div>
            <div>
              <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base">
                Pharmacy & Store Identity
              </h3>
              <p className="text-xs text-[#657969]">
                Official public details stored in Supabase & displayed on invoices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSavePharmacyDetails}
            disabled={pharmacySaveStatus === "saving"}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white text-xs font-extrabold hover:opacity-95 transition-all shadow-md shadow-emerald-950/15 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {pharmacySaveStatus === "saving" ? (
              <>
                <Icons.Refresh className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Icons.Save className="w-3.5 h-3.5 text-white" />
                <span>Save Pharmacy Details</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
              Trade / Pharmacy Name
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings((p) => ({ ...p, storeName: e.target.value }))}
              placeholder="e.g. SubhOne Health Group"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
              Customer Support Helpline
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. +91 98765 43210"
              className={INPUT_CLS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
              Support & Notification Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. support@subhone.com"
              className={INPUT_CLS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
              Official Pharmacy Headquarters Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings((p) => ({ ...p, address: e.target.value }))}
              placeholder="e.g. Serampore, Hooghly, West Bengal, 712203"
              className={INPUT_CLS}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Product & Inventory Configurations ── */}
      <div className="glass-admin-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5 border-b border-[#e4ede2]/80 pb-4">
          <div className="w-9 h-9 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center shadow-xs">
            <Icons.Box className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base">
              Catalog & Inventory Thresholds
            </h3>
            <p className="text-xs text-[#657969]">
              Control inventory warning limits and global pricing discounts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
              Low Stock Warning Threshold (Units)
            </label>
            <input
              type="number"
              min="1"
              value={settings.lowThreshold}
              onChange={(e) => setSettings((p) => ({ ...p, lowThreshold: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
              Default Retailer Wholesale Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              value={settings.defaultDisc}
              onChange={(e) => setSettings((p) => ({ ...p, defaultDisc: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
        </div>
      </div>

      {/* ── 4. Automated Notification Preferences ── */}
      <div className="glass-admin-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5 border-b border-[#e4ede2]/80 pb-4">
          <div className="w-9 h-9 rounded-2xl bg-sky-100/80 text-sky-800 flex items-center justify-center shadow-xs">
            <Icons.Alert className="w-4 h-4 text-sky-800" />
          </div>
          <div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base">
              Automated Alerts & Operations
            </h3>
            <p className="text-xs text-[#657969]">
              Configure system alerts and automatic replenishment triggers
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-[#e4ede2] hover:bg-white transition-all cursor-pointer">
            <div>
              <p className="text-xs font-extrabold text-[#073b4c]">Email Alerts for Low Stock</p>
              <p className="text-[11px] text-[#657969]">Send automated email when inventory reaches critical threshold</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => setSettings((p) => ({ ...p, emailAlerts: e.target.checked }))}
              className="w-5 h-5 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-[#e4ede2] hover:bg-white transition-all cursor-pointer">
            <div>
              <p className="text-xs font-extrabold text-[#073b4c]">SMS Alerts for New High-Value Orders</p>
              <p className="text-[11px] text-[#657969]">Receive instant SMS notifications on wholesale bulk transactions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.smsAlerts}
              onChange={(e) => setSettings((p) => ({ ...p, smsAlerts: e.target.checked }))}
              className="w-5 h-5 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-[#e4ede2] hover:bg-white transition-all cursor-pointer">
            <div>
              <p className="text-xs font-extrabold text-[#073b4c]">Automatic Re-Order Recommendations</p>
              <p className="text-[11px] text-[#657969]">Auto-draft supplier purchase orders for out-of-stock items</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoReorder}
              onChange={(e) => setSettings((p) => ({ ...p, autoReorder: e.target.checked }))}
              className="w-5 h-5 rounded text-[#006a39] focus:ring-[#006a39] cursor-pointer accent-[#006a39]"
            />
          </label>
        </div>
      </div>

      {/* ── 5. Category Taxonomy Management ── */}
      <div className="glass-admin-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4 border-b border-[#e4ede2]/80 pb-4">
          <div>
            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-base">
              Catalog Category Taxonomy
            </h3>
            <p className="text-xs text-[#657969]">{categories.length} active medicine & health categories</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Enter new catalog category name"
            onKeyDown={(e) => e.key === "Enter" && handleAddCat()}
            className={`${INPUT_CLS} flex-1`}
          />
          <button
            type="button"
            onClick={handleAddCat}
            className="px-5 py-2.5 rounded-2xl bg-[#006a39] text-white text-xs font-extrabold hover:opacity-90 shadow-md shadow-emerald-950/15 cursor-pointer shrink-0"
          >
            Add Category
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#dce7db] text-xs font-bold text-[#073b4c] shadow-2xs"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* ── 6. Save Permanent Changes Button ── */}
      <div className="sticky bottom-4 z-20 p-4 rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 shadow-2xl flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-extrabold text-[#073b4c]">Ready to apply changes?</p>
          <p className="text-[11px] text-[#657969]">Settings and profile are saved directly to Supabase cloud database.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saveStatus === "saving"}
            className="bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-bold text-sm px-8 py-3.5 rounded-2xl hover:opacity-95 transition-all cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-95 flex items-center gap-2.5 disabled:opacity-50"
          >
            {saveStatus === "saving" ? (
              <>
                <Icons.Refresh className="w-4 h-4 text-white animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Icons.Save className="w-4 h-4 text-white" />
                <span>Save All Changes Forever</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

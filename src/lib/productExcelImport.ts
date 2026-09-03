/**
 * productExcelImport.ts
 * -----------------------------------------------------------------------
 * Parses the "Pharmaceutical Product Master Sheet" (.xlsx) into rows ready
 * to insert into the products table, recomputing discounts in the app
 * rather than trusting whatever formula values happen to be cached in the
 * uploaded file.
 * -----------------------------------------------------------------------
 */

import * as XLSX from 'xlsx';
import { calculatePricing, getPricingWarnings } from './pricing';

// Exact header text from the master sheet template.
const HEADER_MAP = {
  productImage: 'Product Image',
  productName: 'Product Name*',
  packSize: 'Pack Size / Dosage Details',
  category: 'Category*',
  brand: 'Brand / Manufacturer',
  sku: 'SKU Identifier',
  hsnCode: 'HSN Code (GST)',
  mrp: 'MRP (₹)',
  customerPrice: 'Customer Price (₹)',
  retailerPrice: 'Retailer Price (₹)',
  inventoryStock: 'Inventory Stock (Available Units)',
  listed: 'Listed on Storefront (Active)',
  featured: 'Featured Product',
  prescriptionRequired: 'Prescription Required (Rx)',
  coldChain: 'Cold-Chain Storage (2°C–8°C)',
  bestSeller: 'Best Seller',
  genuineGuaranteed: '100% Genuine Guaranteed',
  fastDelivery: '30-Min Fast Delivery',
  flashSale: 'Flash Sale Deal',
  wholesaleBulkPack: 'Wholesale Bulk Pack',
} as const;

export interface ParsedProductRow {
  rowNumber: number; // 1-based row number in the sheet, for error messages
  productImage: string;
  productName: string;
  packSize: string;
  category: string;
  brand: string;
  sku: string;
  hsnCode: string;
  mrp: number;
  customerPrice: number;
  retailerPrice: number;
  customerOfferPercent: number | null;
  retailerOfferPercent: number | null;
  retailerMarginPercent: number | null;
  inventoryStock: number;
  listed: boolean;
  badges: {
    featured: boolean;
    prescriptionRequired: boolean;
    coldChain: boolean;
    bestSeller: boolean;
    genuineGuaranteed: boolean;
    fastDelivery: boolean;
    flashSale: boolean;
    wholesaleBulkPack: boolean;
  };
  warnings: string[];
  errors: string[];
  isValid: boolean;
}

export interface ImportResult {
  rows: ParsedProductRow[];
  validCount: number;
  invalidCount: number;
}

function toYesNo(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const s = String(val ?? '').trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'published' || s === 'active';
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  const cleaned = String(val ?? '').replace(/[₹,\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Finds the header row automatically instead of assuming row 4, so the
 * parser keeps working if someone inserts/removes a title row.
 */
function findHeaderRowIndex(sheetRows: unknown[][]): number {
  const requiredHeaders = [HEADER_MAP.productName, HEADER_MAP.mrp];
  for (let i = 0; i < sheetRows.length; i++) {
    const row = sheetRows[i].map((c) => String(c ?? '').trim());
    if (requiredHeaders.every((h) => row.includes(h))) {
      return i;
    }
  }
  // Fallback: search for header with loose matching if exact match fails
  for (let i = 0; i < sheetRows.length; i++) {
    const rowStr = sheetRows[i].map((c) => String(c ?? '').toLowerCase()).join(' ');
    if (rowStr.includes('product name') && rowStr.includes('mrp')) {
      return i;
    }
  }
  throw new Error(
    'Could not find the header row. Make sure you are using the Product Master Sheet template without renaming the column headers.'
  );
}

export function parseProductExcel(fileBuffer: ArrayBuffer): ImportResult {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // raw array-of-arrays so we can locate the header row ourselves
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  });

  const headerRowIndex = findHeaderRowIndex(rawRows);
  const headers = rawRows[headerRowIndex].map((h) => String(h ?? '').trim());
  const dataRows = rawRows.slice(headerRowIndex + 1);

  // Loose header lookup helper: exact match or startsWith / contains
  const colIndex = (label: string) => {
    const exact = headers.indexOf(label);
    if (exact >= 0) return exact;
    const cleanLabel = label.replace(/[*()₹]/g, '').trim().toLowerCase();
    return headers.findIndex((h) => h.replace(/[*()₹]/g, '').trim().toLowerCase().includes(cleanLabel));
  };

  const idx = Object.fromEntries(
    Object.entries(HEADER_MAP).map(([key, label]) => [key, colIndex(label)])
  ) as Record<keyof typeof HEADER_MAP, number>;

  const rows: ParsedProductRow[] = [];

  dataRows.forEach((raw, i) => {
    const rowNumber = headerRowIndex + i + 2; // +2: 1-based, plus the header row itself
    const get = (key: keyof typeof HEADER_MAP) =>
      idx[key] >= 0 ? raw[idx[key]] : '';

    // Skip fully blank rows (common at the end of a template)
    const isBlank = raw.every((c) => String(c ?? '').trim() === '');
    if (isBlank) return;

    const productName = String(get('productName') ?? '').trim();
    const category = String(get('category') ?? '').trim();
    const mrp = toNumber(get('mrp'));
    const customerPrice = toNumber(get('customerPrice'));
    const retailerPrice = toNumber(get('retailerPrice'));
    const inventoryStock = toNumber(get('inventoryStock')) || 0;

    const errors: string[] = [];
    if (!productName) errors.push('Product Name is required');
    if (!category) errors.push('Category is required');
    if (Number.isNaN(mrp)) errors.push('MRP is missing or not a number');
    if (Number.isNaN(customerPrice)) errors.push('Customer Price is missing or not a number');
    if (Number.isNaN(retailerPrice)) errors.push('Retailer Price is missing or not a number');

    const pricingInput = {
      mrp: Number.isNaN(mrp) ? 0 : mrp,
      customerPrice: Number.isNaN(customerPrice) ? 0 : customerPrice,
      retailerPrice: Number.isNaN(retailerPrice) ? 0 : retailerPrice,
    };

    const { customerOfferPercent, retailerOfferPercent, retailerMarginPercent } =
      calculatePricing(pricingInput);

    const warnings = errors.length === 0 ? getPricingWarnings(pricingInput) : [];

    rows.push({
      rowNumber,
      productImage: String(get('productImage') ?? '').trim(),
      productName,
      packSize: String(get('packSize') ?? '').trim(),
      category,
      brand: String(get('brand') ?? '').trim(),
      sku: String(get('sku') ?? '').trim(),
      hsnCode: String(get('hsnCode') ?? '').trim(),
      mrp: pricingInput.mrp,
      customerPrice: pricingInput.customerPrice,
      retailerPrice: pricingInput.retailerPrice,
      customerOfferPercent,
      retailerOfferPercent,
      retailerMarginPercent,
      inventoryStock,
      listed: toYesNo(get('listed')),
      badges: {
        featured: toYesNo(get('featured')),
        prescriptionRequired: toYesNo(get('prescriptionRequired')),
        coldChain: toYesNo(get('coldChain')),
        bestSeller: toYesNo(get('bestSeller')),
        genuineGuaranteed: toYesNo(get('genuineGuaranteed')),
        fastDelivery: toYesNo(get('fastDelivery')),
        flashSale: toYesNo(get('flashSale')),
        wholesaleBulkPack: toYesNo(get('wholesaleBulkPack')),
      },
      warnings,
      errors,
      isValid: errors.length === 0,
    });
  });

  return {
    rows,
    validCount: rows.filter((r) => r.isValid).length,
    invalidCount: rows.filter((r) => !r.isValid).length,
  };
}

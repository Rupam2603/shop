import * as XLSX from "xlsx";
import type { DbOrder } from "./orders";

/**
 * Format a date-string into "05-Sep-2026 14:32" (Indian locale, 24h-friendly).
 */
function formatDeliveryDate(iso: string | undefined | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-IN", { month: "short" });
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

/**
 * Format a currency value as a plain number string with ₹ prefix.
 * Used for totals-row labels.
 */
function fmtCurrency(n: number): string {
  return `₹${n.toFixed(2)}`;
}

/**
 * Generate and immediately download the Delivery Partner Monthly Delivery Record
 * as an Excel (.xlsx) file.
 *
 * Layout (per confirmed spec):
 * ──────────────────────────────────────────────────────────────────────────
 *  Sl. No. | Order No | Prod Sl. No. | Product Name | Customer | Store |
 *  MRP | Purchase Price | Retailer Price | Date & Time of Delivery
 * ──────────────────────────────────────────────────────────────────────────
 * • Sl. No. and Order Number → first product row of each order only (blank on others)
 * • Customer Name, Store Name, Date & Time → repeated on EVERY product row
 * • Product Sl. No. → "1.1", "1.2", resets per new order ("2.1"...)
 *
 * Totals row (single row directly after last data row):
 *   Purchase Price col  → "Total Purchase Price = ₹630.00"
 *   Retailer Price col  → "Total Retailer Price = ₹840.00"
 *   Date/Time col       → "Total Profit = ₹210.00"
 *
 * Profit = Total Retailer Price − Total Purchase Price
 */
export function exportDeliveryRecordToExcel(
  orders: DbOrder[],
  opts: { partnerName: string; monthLabel: string }
): void {
  // ── 1. Build row data ────────────────────────────────────────────────────
  const dataRows: Record<string, string | number>[] = [];

  let totalPurchase = 0;
  let totalRetailer = 0;

  orders.forEach((order, orderIdx) => {
    const slNo = orderIdx + 1;
    const items = order.order_items || [];

    // Best-effort delivery timestamp:
    // order.delivered_at (if column exists) → updated_at → created_at
    const deliveryDateStr =
      (order as any).delivered_at || order.updated_at || order.created_at || "";
    const deliveryDateFormatted = formatDeliveryDate(deliveryDateStr);

    if (items.length === 0) {
      // Edge case: order has no line items recorded
      dataRows.push({
        "Sl. No.": slNo,
        "Order Number": order.order_number,
        "Product Sl. No.": `${slNo}.1`,
        "Product Name": "—",
        "Customer Name": order.customer_name || "—",
        "Store Name": order.shop_name || "—",
        "MRP": 0,
        "Purchase Price": 0,
        "Retailer Price": 0,
        "Date & Time of Delivery": deliveryDateFormatted,
      });
      return;
    }

    items.forEach((item, itemIdx) => {
      const pSlNo = `${slNo}.${itemIdx + 1}`;

      const qty = Number(item.quantity) || 1;
      const mrp = Number(item.mrp) || 0;
      const purchaseUnit = Number(item.purchase_price_at_order) || 0;
      const retailerUnit = Number(item.unit_price) || 0;

      // Accumulate totals using qty-weighted values
      totalPurchase += purchaseUnit * qty;
      totalRetailer += retailerUnit * qty;

      dataRows.push({
        // Sl. No. and Order Number: only on the first product row per order
        "Sl. No.": itemIdx === 0 ? slNo : "",
        "Order Number": itemIdx === 0 ? (order.order_number || "") : "",

        // Product sub-number: every row
        "Product Sl. No.": pSlNo,
        "Product Name": item.product_name || "—",

        // These three repeat on EVERY product row (confirmed spec)
        "Customer Name": order.customer_name || "—",
        "Store Name": order.shop_name || "—",

        // Per-unit values (snapshot at order time)
        "MRP": mrp,
        "Purchase Price": purchaseUnit,
        "Retailer Price": retailerUnit,

        // Delivery date repeats on every product row (confirmed spec)
        "Date & Time of Delivery": deliveryDateFormatted,
      });
    });
  });

  // ── 2. Reconciliation log (client-side) ──────────────────────────────────
  console.info(
    `[DELIVERY EXPORT] Partner: ${opts.partnerName} | Month: ${opts.monthLabel} | ` +
    `Orders: ${orders.length} | Line rows: ${dataRows.length}`
  );

  // ── 3. Totals row ────────────────────────────────────────────────────────
  const profit = totalRetailer - totalPurchase;

  const totalsRow: Record<string, string | number> = {
    "Sl. No.": "",
    "Order Number": "",
    "Product Sl. No.": "",
    "Product Name": "",
    "Customer Name": "",
    "Store Name": "",
    "MRP": "",
    // Text labels in the value columns (per confirmed spec)
    "Purchase Price": `Total Purchase Price = ${fmtCurrency(totalPurchase)}`,
    "Retailer Price": `Total Retailer Price = ${fmtCurrency(totalRetailer)}`,
    "Date & Time of Delivery": `Total Profit = ${fmtCurrency(profit)}`,
  };

  const allRows = [...dataRows, totalsRow];

  // ── 4. Build worksheet ───────────────────────────────────────────────────
  const worksheet = XLSX.utils.json_to_sheet(allRows, {
    header: [
      "Sl. No.",
      "Order Number",
      "Product Sl. No.",
      "Product Name",
      "Customer Name",
      "Store Name",
      "MRP",
      "Purchase Price",
      "Retailer Price",
      "Date & Time of Delivery",
    ],
  });

  // Column widths
  worksheet["!cols"] = [
    { wch: 8  },  // Sl. No.
    { wch: 14 },  // Order Number
    { wch: 14 },  // Product Sl. No.
    { wch: 36 },  // Product Name
    { wch: 22 },  // Customer Name
    { wch: 22 },  // Store Name
    { wch: 10 },  // MRP
    { wch: 30 },  // Purchase Price
    { wch: 30 },  // Retailer Price
    { wch: 24 },  // Date & Time of Delivery
  ];

  // Bold the header row (row 1 = index 0)
  const headerKeys = [
    "Sl. No.", "Order Number", "Product Sl. No.", "Product Name",
    "Customer Name", "Store Name", "MRP", "Purchase Price",
    "Retailer Price", "Date & Time of Delivery",
  ];
  const colLetters = ["A","B","C","D","E","F","G","H","I","J"];
  headerKeys.forEach((_, ci) => {
    const cellRef = `${colLetters[ci]}1`;
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "006A39" } },
        alignment: { horizontal: "center" },
      };
    }
  });

  // Bold the totals row
  const totalsRowIdx = allRows.length + 1; // +1 for 1-based + header row
  colLetters.forEach((col) => {
    const cellRef = `${col}${totalsRowIdx}`;
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = { font: { bold: true } };
    }
  });

  // ── 5. Write file ────────────────────────────────────────────────────────
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Record");

  const filenameSafePartner = opts.partnerName.replace(/[^\w-]+/g, "_");
  const filename = `Delivery_Record_${filenameSafePartner}_${opts.monthLabel}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

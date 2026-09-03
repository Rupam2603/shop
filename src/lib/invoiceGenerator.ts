export interface InvoiceOrderItem {
  name: string;
  quantity: number;
  price: number;
  totalPrice?: number;
  mrp?: number;
  batch?: string;
  expiry?: string;
  sku?: string;
}

export interface InvoiceOrderData {
  id: string;
  dbId?: string;
  customer: string;
  phone: string;
  role?: "retailer" | "customer";
  shopName?: string;
  address?: string;
  items: number;
  amount: number;
  status: string;
  date: string;
  payment: string;
  paymentStatus?: string;
  orderItems?: InvoiceOrderItem[];
}

export interface StoreSettings {
  storeName?: string;
  phone?: string;
  email?: string;
  address?: string;
  lowThreshold?: string;
  defaultDisc?: string;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  autoReorder?: boolean;
}

/**
 * Convert numbers into words (Indian currency format)
 */
export function numberToWords(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n] + " ";
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") + " ";
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  }

  const result = inWords(rounded).trim();
  return result ? `${result} Rupees Only` : "Zero Rupees Only";
}

function formatToDateString(val: string): string {
  if (!val) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Generate Invoice Bill HTML matching SubhOne specification
 */
export function generateInvoiceHtml(order: InvoiceOrderData, settings?: Partial<StoreSettings>): string {
  const storeName = settings?.storeName || "SubhOne Health Group";
  const storePhone = settings?.phone || "+91 98765 43210";
  const storeEmail = settings?.email || "support@subhone.com";
  const storeAddress = settings?.address || "14/B Central Avenue, Kolkata, West Bengal 700012";
  const gstin = "19AABCS8821Q1Z8";
  const drugLicence = "DL-WB-KOL-2024-98421";

  const billNo = order.id.startsWith("ORD-") ? `INV-${order.id.replace("ORD-", "")}` : `INV-${order.id}`;
  const dateFormatted = formatToDateString(order.date);
  const custId = order.dbId ? `CUST-${order.dbId.slice(0, 6).toUpperCase()}` : `CUST-${order.id.replace(/\D/g, "") || "1001"}`;

  const isRetailer = order.role === "retailer";
  const customerDisplay = order.shopName
    ? `${order.customer} (${order.shopName} - Wholesale Retailer)`
    : isRetailer
    ? `${order.customer} (Wholesale Retailer)`
    : `${order.customer} (Customer)`;

  // Generate item rows
  // Never invent products, quantities, batches, prices or dates. The invoice
  // must be a faithful rendering of the order snapshot stored in the database.
  const rawItems = order.orderItems && order.orderItems.length > 0 ? order.orderItems : [];

  let subtotal = 0;
  let totalMrp = 0;

  const itemRowsHtml = rawItems.map((it, idx) => {
    const itemQty = it.quantity || 1;
    const itemRate = Number.isFinite(Number(it.price)) ? Number(it.price) : 0;
    const itemMrp = Number.isFinite(Number(it.mrp)) && Number(it.mrp) > 0 ? Number(it.mrp) : null;
    const itemAmt = Number.isFinite(Number(it.totalPrice)) && Number(it.totalPrice) >= 0
      ? Number(it.totalPrice)
      : itemRate * itemQty;
    const batch = it.batch || "—";
    const expiry = it.expiry || "—";

    subtotal += itemAmt;
    totalMrp += (itemMrp || itemRate) * itemQty;

    return `
      <tr>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333;">${idx + 1}</td>
        <td style="padding: 7px 8px; border: 1px solid #333; font-weight: 600;">
          ${it.name}
          ${it.sku ? `<div style="font-size: 10px; color: #555; font-weight: normal; margin-top: 2px;">SKU: ${it.sku}</div>` : ""}
        </td>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333; font-family: monospace;">${batch}</td>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333;">${expiry}</td>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333; font-weight: 600;">${itemQty}</td>
        <td style="text-align:right; padding: 7px 8px; border: 1px solid #333;">${itemMrp == null ? "—" : `₹${itemMrp.toLocaleString()}`}</td>
        <td style="text-align:right; padding: 7px 8px; border: 1px solid #333; font-weight: 600;">₹${itemRate.toLocaleString()}</td>
        <td style="text-align:right; padding: 7px 8px; border: 1px solid #333; font-weight: 700;">₹${itemAmt.toLocaleString()}</td>
      </tr>
    `;
  }).join("");

  const grandTotal = Number(order.amount || 0);
  // Current order schema stores the final total, not separate tax/discount fields.
  // Derive only the delivery component when it is explicitly represented by the
  // difference between item totals and the stored final total.
  const deliveryCharge = Math.max(0, Math.round((grandTotal - subtotal) * 100) / 100);

  const paymentMode = (order.payment || "UPI").toUpperCase();
  const isCash = paymentMode.includes("CASH");
  const isUPI = paymentMode.includes("UPI");
  const isCard = paymentMode.includes("CARD");
  const isCOD = paymentMode.includes("COD");

  const amountInWords = numberToWords(grandTotal);

  return `
    <div class="invoice-box" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; max-width: 780px; margin: 0 auto; border: 2px solid #222; padding: 18px 22px; background: #fff; font-size: 12px; line-height: 1.35;">
      <div style="text-align: center; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 2px 0; color: #073b4c;">
        SubhOne INVOICE BILL
      </div>
      <div style="text-align: center; font-size: 16px; font-weight: 700; color: #006a39; margin: 0 0 4px 0;">
        ${storeName}
      </div>
      <div style="text-align: center; font-size: 10.5px; color: #444; margin-bottom: 12px; border-bottom: 1.5px solid #222; padding-bottom: 8px;">
        ${storeAddress} | Phone: ${storePhone} | Email: ${storeEmail}<br/>
        GSTIN: ${gstin} | Drug Licence No.: ${drugLicence}
      </div>

      <div style="text-align: center; font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 10px 0 12px 0; text-decoration: underline;">
        INVOICE / BILL
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="border: 1px solid #333; padding: 6px 10px; font-size: 11px; background-color: #f2f5f3; font-weight: 700; text-align: center;">Bill No.</th>
            <th style="border: 1px solid #333; padding: 6px 10px; font-size: 11px; background-color: #f2f5f3; font-weight: 700; text-align: center;">Date</th>
            <th style="border: 1px solid #333; padding: 6px 10px; font-size: 11px; background-color: #f2f5f3; font-weight: 700; text-align: center;">Customer ID</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #333; padding: 6px 10px; font-size: 11px; text-align: center; font-weight: bold; color: #006a39;">${billNo}</td>
            <td style="border: 1px solid #333; padding: 6px 10px; font-size: 11px; text-align: center; font-weight: 600;">${dateFormatted}</td>
            <td style="border: 1px solid #333; padding: 6px 10px; font-size: 11px; text-align: center; font-weight: 600;">${custId}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-bottom: 12px; padding: 8px 10px; background: #fbfdfb; border: 1px solid #ddd; border-radius: 4px;">
        <div style="margin-bottom: 4px; font-size: 11.5px;"><strong>Customer:</strong> ${customerDisplay}</div>
        <div style="margin-bottom: 4px; font-size: 11.5px;"><strong>Mobile:</strong> ${order.phone || "+91 98765 00000"}</div>
        <div style="font-size: 11.5px;"><strong>Address:</strong> ${order.address || "Customer Delivery Address"}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">S.No.</th>
            <th style="text-align: left; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">Medicine / Product</th>
            <th style="width: 75px; text-align: center; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">Batch</th>
            <th style="width: 60px; text-align: center; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">Expiry</th>
            <th style="width: 45px; text-align: center; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">Qty</th>
            <th style="width: 65px; text-align: right; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">MRP</th>
            <th style="width: 65px; text-align: right; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">Rate</th>
            <th style="width: 80px; text-align: right; background-color: #f2f5f3; border: 1px solid #333; padding: 7px 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml || `<tr><td colspan="8" style="padding: 12px; border: 1px solid #333; text-align: center; color: #777;">Item snapshot unavailable for this legacy order.</td></tr>`}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; gap: 20px;">
        <div style="flex: 1; font-size: 11px;">
          <div style="margin-top: 4px; margin-bottom: 6px;">
            <strong>Payment Mode:</strong><br/>
            <span style="display: inline-block; margin-right: 12px; font-weight: 600;">${isCash ? "☑" : "☐"} Cash</span>
            <span style="display: inline-block; margin-right: 12px; font-weight: 600;">${isUPI ? "☑" : "☐"} UPI</span>
            <span style="display: inline-block; margin-right: 12px; font-weight: 600;">${isCard ? "☑" : "☐"} Card</span>
            <span style="display: inline-block; margin-right: 12px; font-weight: 600;">${isCOD ? "☑" : "☐"} COD</span>
          </div>
          <div>
            <strong>Payment Status:</strong>
            <span style="display: inline-block; margin-left: 6px; font-weight: 600;">${order.paymentStatus || "Unknown"}</span>
          </div>
        </div>

        <table style="width: 240px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 6px; font-size: 11px;">Subtotal:</td>
            <td style="padding: 3px 6px; font-size: 11px; text-align: right; font-weight: 600;">₹${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; font-size: 11px;">Tax / Discount:</td>
            <td style="padding: 3px 6px; font-size: 11px; text-align: right;">Included in stored item prices</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; font-size: 11px;">Delivery Charges:</td>
            <td style="padding: 3px 6px; font-size: 11px; text-align: right; font-weight: 600;">${deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}</td>
          </tr>
          <tr style="border-top: 2px solid #222; border-bottom: 2px solid #222; font-size: 13px; font-weight: 800; color: #073b4c;">
            <td style="padding: 6px 6px;">GRAND TOTAL:</td>
            <td style="padding: 6px 6px; text-align: right;">₹${grandTotal.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px dashed #666; border-bottom: 1px dashed #666; padding: 6px 4px; font-size: 11px; margin-bottom: 20px; background: #fafafa;">
        <strong>Amount in Words:</strong> ${amountInWords}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; padding-top: 8px;">
        <div style="text-align: center; width: 180px; border-top: 1px solid #333; padding-top: 4px; font-size: 10.5px; font-weight: 600;">
          Customer Signature
        </div>
        <div style="text-align: center; width: 180px; border-top: 1px solid #333; padding-top: 4px; font-size: 10.5px; font-weight: 600;">
          Authorized Signatory<br/>
          <span style="font-size: 9px; color: #555; font-weight: normal;">SubhOne Health Group</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 9.5px; color: #666; margin-top: 16px; border-top: 1px solid #eee; padding-top: 6px;">
        Thank you for your purchase. Please retain this bill for future reference.
      </div>
    </div>
  `;
}

/**
 * Generate standalone printable document HTML wrapper
 */
function wrapInPrintableDocument(title: string, contentHtml: string, isLandscape: boolean = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
      margin: 10mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      background: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .print-container {
      background: #fff;
      padding: 20px;
      margin: 0 auto;
      max-width: ${isLandscape ? "1050px" : "800px"};
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    .action-bar {
      max-width: ${isLandscape ? "1050px" : "800px"};
      margin: 0 auto 12px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      font-weight: 700;
      font-size: 13px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #006a39;
      color: #fff;
    }
    @media print {
      body {
        padding: 0;
        background: #fff;
      }
      .action-bar {
        display: none !important;
      }
      .print-container {
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="print-container">
    ${contentHtml}
  </div>
</body>
</html>`;
}

/**
 * Robust hidden iframe printing: works 100% reliably in all browsers without pop-up blockers
 */
function printHtmlInIframe(htmlContent: string) {
  const existingIframe = document.getElementById("subhone-print-iframe");
  if (existingIframe) {
    document.body.removeChild(existingIframe);
  }

  const iframe = document.createElement("iframe");
  iframe.id = "subhone-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 250);
    };
  }
}

/**
 * Direct file download (saves .html printable file that opens and prints instantly)
 */
function downloadHtmlBlob(filename: string, fullHtml: string) {
  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 1-Click Print & Save as PDF for Single Invoice
 */
export function printOrDownloadInvoice(order: InvoiceOrderData, settings?: Partial<StoreSettings>) {
  const content = generateInvoiceHtml(order, settings);
  const fullHtml = wrapInPrintableDocument(`Invoice - ${order.id}`, content, false);
  printHtmlInIframe(fullHtml);
}

/**
 * 1-Click Direct File Download for Single Invoice
 */
export function downloadInvoiceFile(order: InvoiceOrderData, settings?: Partial<StoreSettings>) {
  const billNo = order.id.startsWith("ORD-") ? `INV-${order.id.replace("ORD-", "")}` : `INV-${order.id}`;
  const content = generateInvoiceHtml(order, settings);
  const fullHtml = wrapInPrintableDocument(`Invoice - ${billNo}`, content, false);
  downloadHtmlBlob(`SubhOne-Invoice-${billNo}.html`, fullHtml);
}

/**
 * Generate Daily Orders Summary Report HTML
 */
export function generateDailyReportHtml(
  dateStr: string,
  orders: InvoiceOrderData[],
  settings?: Partial<StoreSettings>
): string {
  const storeName = settings?.storeName || "SubhOne Health Group";
  const storePhone = settings?.phone || "+91 98765 43210";
  const storeAddress = settings?.address || "14/B Central Avenue, Kolkata, West Bengal 700012";

  const retailerOrders = orders.filter((o) => o.role === "retailer");
  const customerOrders = orders.filter((o) => o.role !== "retailer");

  const totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((a, b) => a + b.amount, 0);
  const retailerRevenue = retailerOrders.filter((o) => o.status !== "Cancelled").reduce((a, b) => a + b.amount, 0);
  const customerRevenue = customerOrders.filter((o) => o.status !== "Cancelled").reduce((a, b) => a + b.amount, 0);

  const renderTableRows = (list: InvoiceOrderData[]) => {
    if (list.length === 0) {
      return `<tr><td colspan="8" style="text-align: center; padding: 12px; color: #888;">No orders recorded for this section on this day.</td></tr>`;
    }
    return list.map((o, idx) => `
      <tr>
        <td style="padding: 6px 5px; text-align: center; border: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: #006a39;">${o.id}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: 600;">${o.customer}${o.shopName ? `<br/><small style="color:#0369a1;">🏪 ${o.shopName}</small>` : ""}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${o.phone}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${o.items}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${o.amount.toLocaleString()}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${o.payment}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${o.status}</td>
      </tr>
    `).join("");
  };

  return `
    <div class="report-box" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #222; max-width: 1050px; margin: 0 auto; background: #fff; font-size: 11px; padding: 10px;">
      <div style="border-bottom: 2px solid #073b4c; padding-bottom: 10px; margin-bottom: 14px;">
        <h1 style="font-size: 18px; font-weight: 800; color: #073b4c; margin: 0; text-transform: uppercase;">
          ${storeName} — Daily Orders Management Report
        </h1>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px;">
          <div>${storeAddress} | Ph: ${storePhone}</div>
          <div style="font-weight: 700; font-size: 13px; color: #006a39;">Report Date: ${dateStr}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; background: #fafafa;">
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #666;">Total Orders Today</div>
          <div style="font-size: 16px; font-weight: 800; color: #073b4c; margin-top: 2px;">${orders.length} Orders</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; background: #fafafa;">
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #666;">Total Gross Revenue</div>
          <div style="font-size: 16px; font-weight: 800; color: #073b4c; margin-top: 2px;">₹${totalRevenue.toLocaleString()}</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; background: #fafafa; border-left: 3px solid #0369a1;">
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #666;">🏪 Retailer Orders (${retailerOrders.length})</div>
          <div style="font-size: 16px; font-weight: 800; color: #0369a1; margin-top: 2px;">₹${retailerRevenue.toLocaleString()}</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; background: #fafafa; border-left: 3px solid #006a39;">
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #666;">👤 Customer Orders (${customerOrders.length})</div>
          <div style="font-size: 16px; font-weight: 800; color: #006a39; margin-top: 2px;">₹${customerRevenue.toLocaleString()}</div>
        </div>
      </div>

      <!-- Retailer Orders Section -->
      <div style="font-size: 13px; font-weight: 800; color: #073b4c; margin: 14px 0 6px 0; display: flex; justify-content: space-between;">
        <span>🏪 Retailer Wholesale Orders (${retailerOrders.length})</span>
        <span>Subtotal: ₹${retailerRevenue.toLocaleString()}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">#</th>
            <th style="background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left;">Order ID</th>
            <th style="background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left;">Retailer / Pharmacy</th>
            <th style="background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left;">Phone</th>
            <th style="text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Items</th>
            <th style="text-align: right; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Amount</th>
            <th style="text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Payment</th>
            <th style="text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(retailerOrders)}
        </tbody>
      </table>

      <!-- Customer Orders Section -->
      <div style="font-size: 13px; font-weight: 800; color: #073b4c; margin: 14px 0 6px 0; display: flex; justify-content: space-between;">
        <span>👤 Customer Retail Orders (${customerOrders.length})</span>
        <span>Subtotal: ₹${customerRevenue.toLocaleString()}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">#</th>
            <th style="background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left;">Order ID</th>
            <th style="background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left;">Customer Name</th>
            <th style="background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left;">Phone</th>
            <th style="text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Items</th>
            <th style="text-align: right; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Amount</th>
            <th style="text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Payment</th>
            <th style="text-align: center; background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(customerOrders)}
        </tbody>
      </table>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 8px;">
        <span>Generated by SubhOne Admin Control System</span>
        <span>Official Store Records — Confirmed</span>
      </div>
    </div>
  `;
}

/**
 * 1-Click Print & Save as PDF for Daily Orders Report
 */
export function printOrDownloadDailyReport(
  dateStr: string,
  orders: InvoiceOrderData[],
  settings?: Partial<StoreSettings>
) {
  const content = generateDailyReportHtml(dateStr, orders, settings);
  const fullHtml = wrapInPrintableDocument(`Daily Orders Report - ${dateStr}`, content, true);
  printHtmlInIframe(fullHtml);
}

/**
 * 1-Click Direct File Download for Daily Orders Report
 */
export function downloadDailyReportFile(
  dateStr: string,
  orders: InvoiceOrderData[],
  settings?: Partial<StoreSettings>
) {
  const cleanDate = dateStr.replace(/[^a-zA-Z0-9]/g, "-");
  const content = generateDailyReportHtml(dateStr, orders, settings);
  const fullHtml = wrapInPrintableDocument(`Daily Orders Report - ${dateStr}`, content, true);
  downloadHtmlBlob(`SubhOne-Daily-Orders-${cleanDate}.html`, fullHtml);
}

// @ts-ignore
import html2pdf from "html2pdf.js";

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
  orderItems?: {
    name: string;
    quantity: number;
    price: number;
    mrp?: number;
    batch?: string;
    expiry?: string;
  }[];
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

  return ("Rupees " + inWords(rounded).trim() + " Only").replace(/\s+/g, " ");
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatToDateString(dStr?: string): string {
  const dateObj = dStr ? new Date(dStr) : new Date();
  if (isNaN(dateObj.getTime())) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
  const rawItems = order.orderItems && order.orderItems.length > 0
    ? order.orderItems
    : [
        {
          name: isRetailer ? "Volini Spray 249ml (Wholesale Pack)" : "Volini Spray 249ml",
          quantity: Math.max(1, order.items || 1),
          price: Math.round(order.amount / Math.max(1, order.items || 1)),
          mrp: Math.round((order.amount / Math.max(1, order.items || 1)) * 1.15),
          batch: "SBH-8842",
          expiry: "07/28",
        },
      ];

  let subtotal = 0;
  let totalMrp = 0;

  const itemRowsHtml = rawItems.map((it, idx) => {
    const itemQty = it.quantity || 1;
    const itemRate = it.price || 100;
    const itemMrp = it.mrp || Math.round(itemRate * 1.15);
    const itemAmt = itemRate * itemQty;
    const batch = it.batch || `SBH-${8840 + idx}`;
    const expiry = it.expiry || "12/28";

    subtotal += itemAmt;
    totalMrp += itemMrp * itemQty;

    return `
      <tr>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333;">${idx + 1}</td>
        <td style="padding: 7px 8px; border: 1px solid #333; font-weight: 600;">${it.name}</td>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333; font-family: monospace;">${batch}</td>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333;">${expiry}</td>
        <td style="text-align:center; padding: 7px 6px; border: 1px solid #333; font-weight: 600;">${itemQty}</td>
        <td style="text-align:right; padding: 7px 8px; border: 1px solid #333;">₹${itemMrp.toLocaleString()}</td>
        <td style="text-align:right; padding: 7px 8px; border: 1px solid #333; font-weight: 600;">₹${itemRate.toLocaleString()}</td>
        <td style="text-align:right; padding: 7px 8px; border: 1px solid #333; font-weight: 700;">₹${itemAmt.toLocaleString()}</td>
      </tr>
    `;
  }).join("");

  const discount = Math.max(0, totalMrp - subtotal);
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST on medicines
  const grandTotal = order.amount || subtotal;
  const deliveryCharge = isRetailer || grandTotal >= 150 ? 0 : 40;

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
        <div style="font-size: 11.5px;"><strong>Address:</strong> ${order.address || "Standard Store Delivery Address"}</div>
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
          ${itemRowsHtml}
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
            <span style="display: inline-block; margin-left: 6px; font-weight: 600;">☑ Paid</span>
            <span style="display: inline-block; margin-left: 12px; font-weight: 600;">☐ Pending</span>
          </div>
        </div>

        <table style="width: 240px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 6px; font-size: 11px;">Subtotal:</td>
            <td style="padding: 3px 6px; font-size: 11px; text-align: right; font-weight: 600;">₹${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; font-size: 11px;">Discount:</td>
            <td style="padding: 3px 6px; font-size: 11px; text-align: right; color: #006a39; font-weight: 600;">-₹${discount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; font-size: 11px;">GST (Incl.):</td>
            <td style="padding: 3px 6px; font-size: 11px; text-align: right;">₹${gstAmount.toLocaleString()}</td>
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
 * Directly download an invoice as a PDF file
 */
export async function downloadInvoicePdf(order: InvoiceOrderData, settings?: Partial<StoreSettings>) {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "780px";
  container.innerHTML = generateInvoiceHtml(order, settings);
  document.body.appendChild(container);

  const billNo = order.id.startsWith("ORD-") ? `INV-${order.id.replace("ORD-", "")}` : `INV-${order.id}`;

  const opt = {
    margin: [6, 6, 6, 6],
    filename: `SubhOne-Invoice-${billNo}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    // @ts-ignore
    await html2pdf().set(opt).from(container.firstElementChild || container).save();
  } catch (err) {
    console.error("PDF generation failed, falling back to print dialog:", err);
    printOrDownloadInvoice(order, settings);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Open print dialog for single invoice
 */
export function printOrDownloadInvoice(order: InvoiceOrderData, settings?: Partial<StoreSettings>) {
  const invoiceHtml = generateInvoiceHtml(order, settings);
  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { margin: 0; padding: 10px; background: #fff; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; max-width: 780px; margin: 10px auto;">
          <button onclick="window.print()" style="background: #006a39; color: white; border: none; padding: 8px 18px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>
        ${invoiceHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }
}

/**
 * Generate Daily Orders Summary PDF Report for both Retailers and Customers
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
 * Directly download Daily Orders Report as a PDF file
 */
export async function downloadDailyReportPdf(
  dateStr: string,
  orders: InvoiceOrderData[],
  settings?: Partial<StoreSettings>
) {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "1050px";
  container.innerHTML = generateDailyReportHtml(dateStr, orders, settings);
  document.body.appendChild(container);

  const cleanDate = dateStr.replace(/[^a-zA-Z0-9]/g, "-");

  const opt = {
    margin: [6, 6, 6, 6],
    filename: `SubhOne-Daily-Orders-${cleanDate}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
  };

  try {
    // @ts-ignore
    await html2pdf().set(opt).from(container.firstElementChild || container).save();
  } catch (err) {
    console.error("Daily report PDF generation failed, falling back to print dialog:", err);
    printOrDownloadDailyReport(dateStr, orders, settings);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Open print dialog for Daily Orders Report
 */
export function printOrDownloadDailyReport(
  dateStr: string,
  orders: InvoiceOrderData[],
  settings?: Partial<StoreSettings>
) {
  const reportHtml = generateDailyReportHtml(dateStr, orders, settings);
  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Orders Report - ${dateStr}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          body { margin: 0; padding: 10px; background: #fff; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; max-width: 1050px; margin: 8px auto;">
          <button onclick="window.print()" style="background: #073b4c; color: white; border: none; padding: 8px 18px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            🖨️ Print / Save Daily Report as PDF
          </button>
        </div>
        ${reportHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }
}

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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${billNo}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111;
          margin: 0;
          padding: 10px;
          background: #fff;
          font-size: 12px;
          line-height: 1.35;
        }
        .invoice-box {
          max-width: 780px;
          margin: 0 auto;
          border: 2px solid #222;
          padding: 18px 22px;
          background: #fff;
        }
        .header-title {
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 0 0 2px 0;
          color: #073b4c;
        }
        .company-name {
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          color: #006a39;
          margin: 0 0 4px 0;
        }
        .company-details {
          text-align: center;
          font-size: 10.5px;
          color: #444;
          margin-bottom: 12px;
          border-bottom: 1.5px solid #222;
          padding-bottom: 8px;
        }
        .invoice-badge {
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 1px;
          margin: 10px 0 12px 0;
          text-decoration: underline;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .meta-table th, .meta-table td {
          border: 1px solid #333;
          padding: 6px 10px;
          font-size: 11px;
        }
        .meta-table th {
          background-color: #f2f5f3;
          font-weight: 700;
          text-align: center;
        }
        .meta-table td {
          text-align: center;
          font-weight: 600;
        }
        .customer-section {
          margin-bottom: 12px;
          padding: 8px 10px;
          background: #fbfdfb;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .customer-row {
          margin-bottom: 4px;
          font-size: 11.5px;
        }
        .customer-row strong {
          display: inline-block;
          width: 80px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .items-table th {
          background-color: #f2f5f3;
          border: 1px solid #333;
          padding: 7px 6px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .totals-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 20px;
        }
        .payment-info {
          flex: 1;
          font-size: 11px;
        }
        .checkbox-group {
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .checkbox-item {
          display: inline-block;
          margin-right: 12px;
          font-weight: 600;
        }
        .totals-table {
          width: 240px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 4px 6px;
          font-size: 11.5px;
        }
        .totals-table tr.grand-total td {
          border-top: 2px solid #222;
          border-bottom: 2px solid #222;
          font-size: 13px;
          font-weight: 800;
          color: #073b4c;
          padding: 6px 6px;
        }
        .words-section {
          border-top: 1px dashed #666;
          border-bottom: 1px dashed #666;
          padding: 6px 4px;
          font-size: 11px;
          margin-bottom: 24px;
          background: #fafafa;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 28px;
          padding-top: 10px;
        }
        .sig-box {
          text-align: center;
          width: 200px;
          border-top: 1px solid #333;
          padding-top: 5px;
          font-size: 11px;
          font-weight: 600;
        }
        .footer-note {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-top: 18px;
          border-top: 1px solid #eee;
          padding-top: 6px;
        }
        @media print {
          body {
            padding: 0;
            background: transparent;
          }
          .invoice-box {
            border: 2px solid #000;
            padding: 15px;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: right; max-width: 780px; margin: 10px auto;">
        <button onclick="window.print()" style="background: #006a39; color: white; border: none; padding: 8px 18px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="invoice-box">
        <div class="header-title">SubhOne INVOICE BILL</div>
        <div class="company-name">${storeName}</div>
        <div class="company-details">
          ${storeAddress} | Phone: ${storePhone} | Email: ${storeEmail}<br/>
          GSTIN: ${gstin} | Drug Licence No.: ${drugLicence}
        </div>

        <div class="invoice-badge">INVOICE / BILL</div>

        <table class="meta-table">
          <thead>
            <tr>
              <th>Bill No.</th>
              <th>Date</th>
              <th>Customer ID</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="color: #006a39; font-weight: bold;">${billNo}</td>
              <td>${dateFormatted}</td>
              <td>${custId}</td>
            </tr>
          </tbody>
        </table>

        <div class="customer-section">
          <div class="customer-row"><strong>Customer:</strong> ${customerDisplay}</div>
          <div class="customer-row"><strong>Mobile:</strong> ${order.phone || "+91 98765 00000"}</div>
          <div class="customer-row"><strong>Address:</strong> ${order.address || "Standard Store Delivery Address"}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">S.No.</th>
              <th style="text-align: left;">Medicine / Product</th>
              <th style="width: 75px; text-align: center;">Batch</th>
              <th style="width: 60px; text-align: center;">Expiry</th>
              <th style="width: 45px; text-align: center;">Qty</th>
              <th style="width: 65px; text-align: right;">MRP</th>
              <th style="width: 65px; text-align: right;">Rate</th>
              <th style="width: 80px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="payment-info">
            <div class="checkbox-group">
              <strong>Payment Mode:</strong><br/>
              <span class="checkbox-item">${isCash ? "☑" : "☐"} Cash</span>
              <span class="checkbox-item">${isUPI ? "☑" : "☐"} UPI</span>
              <span class="checkbox-item">${isCard ? "☑" : "☐"} Card</span>
              <span class="checkbox-item">${isCOD ? "☑" : "☐"} COD</span>
            </div>
            <div class="checkbox-group">
              <strong>Payment Status:</strong>
              <span class="checkbox-item" style="margin-left: 6px;">☑ Paid</span>
              <span class="checkbox-item">☐ Pending</span>
            </div>
          </div>

          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">₹${subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td style="text-align: right; color: #006a39; font-weight: 600;">-₹${discount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>GST (Incl.):</td>
              <td style="text-align: right;">₹${gstAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Delivery Charges:</td>
              <td style="text-align: right; font-weight: 600;">${deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}</td>
            </tr>
            <tr class="grand-total">
              <td>GRAND TOTAL:</td>
              <td style="text-align: right;">₹${grandTotal.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div class="words-section">
          <strong>Amount in Words:</strong> ${amountInWords}
        </div>

        <div class="signature-section">
          <div class="sig-box">
            Customer Signature
          </div>
          <div class="sig-box">
            Authorized Signatory<br/>
            <span style="font-size: 9.5px; color: #555; font-weight: normal;">SubhOne Health Group</span>
          </div>
        </div>

        <div class="footer-note">
          Thank you for your purchase. Please retain this bill for future reference.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Open print / PDF download window for a single invoice
 */
export function printOrDownloadInvoice(order: InvoiceOrderData, settings?: Partial<StoreSettings>) {
  const invoiceHtml = generateInvoiceHtml(order, settings);
  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Daily Orders Report - ${dateStr}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #222; margin: 0; padding: 12px; font-size: 11px; }
        .report-box { max-width: 1050px; margin: 0 auto; background: #fff; }
        .report-header { border-bottom: 2px solid #073b4c; padding-bottom: 10px; margin-bottom: 14px; }
        .title { font-size: 18px; font-weight: 800; color: #073b4c; margin: 0; text-transform: uppercase; }
        .sub-header { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .stat-card { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; background: #fafafa; }
        .stat-card .label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #666; }
        .stat-card .val { font-size: 16px; font-weight: 800; color: #073b4c; margin-top: 2px; }
        .section-heading { font-size: 13px; font-weight: 800; color: #073b4c; margin: 14px 0 6px 0; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        th { background: #f0f4f0; border: 1px solid #ccc; padding: 6px; font-size: 10px; font-weight: 700; text-align: left; }
        @media print { .no-print { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: right; max-width: 1050px; margin: 8px auto;">
        <button onclick="window.print()" style="background: #073b4c; color: white; border: none; padding: 8px 18px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer;">
          🖨️ Print / Save Daily Report as PDF
        </button>
      </div>

      <div class="report-box">
        <div class="report-header">
          <h1 class="title">${storeName} — Daily Orders Management Report</h1>
          <div class="sub-header">
            <div>${storeAddress} | Ph: ${storePhone}</div>
            <div style="font-weight: 700; font-size: 13px; color: #006a39;">Date: ${dateStr}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Total Orders Today</div>
            <div class="val">${orders.length} Orders</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Gross Revenue</div>
            <div class="val">₹${totalRevenue.toLocaleString()}</div>
          </div>
          <div class="stat-card" style="border-left: 3px solid #0369a1;">
            <div class="label">🏪 Retailer Orders (${retailerOrders.length})</div>
            <div class="val" style="color: #0369a1;">₹${retailerRevenue.toLocaleString()}</div>
          </div>
          <div class="stat-card" style="border-left: 3px solid #006a39;">
            <div class="label">👤 Customer Orders (${customerOrders.length})</div>
            <div class="val" style="color: #006a39;">₹${customerRevenue.toLocaleString()}</div>
          </div>
        </div>

        <!-- Retailer Orders Section -->
        <div class="section-heading">
          <span>🏪 Retailer Wholesale Orders (${retailerOrders.length})</span>
          <span>Subtotal: ₹${retailerRevenue.toLocaleString()}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Order ID</th>
              <th>Retailer / Pharmacy</th>
              <th>Phone</th>
              <th style="text-align: center;">Items</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Payment</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRows(retailerOrders)}
          </tbody>
        </table>

        <!-- Customer Orders Section -->
        <div class="section-heading">
          <span>👤 Customer Retail Orders (${customerOrders.length})</span>
          <span>Subtotal: ₹${customerRevenue.toLocaleString()}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th style="text-align: center;">Items</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Payment</th>
              <th style="text-align: center;">Status</th>
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
    </body>
    </html>
  `;
}

/**
 * Open print / PDF download window for Daily Orders Report
 */
export function printOrDownloadDailyReport(dateStr: string, orders: InvoiceOrderData[], settings?: Partial<StoreSettings>) {
  const reportHtml = generateDailyReportHtml(dateStr, orders, settings);
  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
  }
}

import XLSX from "xlsx-js-style";
import type { DbOrder } from "./orders";

export function exportDeliveryRecordToExcel(
  orders: DbOrder[],
  opts: { partnerName: string; monthLabel: string }
): void {
  const sheetRows: any[] = [];

  let totalPurchaseMonthly = 0;
  let totalSellMonthly = 0;

  orders.forEach((order, orderIdx) => {
    const slNo = orderIdx + 1;
    const items = order.order_items || [];

    // Fallback date to updated_at which represents when it was marked delivered
    const deliveryDateStr = order.updated_at || order.created_at || "";
    let deliveryDateFormatted = "";
    if (deliveryDateStr) {
      try {
        deliveryDateFormatted = new Date(deliveryDateStr).toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });
      } catch (e) {
        deliveryDateFormatted = deliveryDateStr;
      }
    }

    if (items.length === 0) {
      // Edge case: order has no items, just show the order details
      sheetRows.push({
        "Sl. No.": slNo,
        "Order Number": order.order_number,
        "Product Sl. No.": `${slNo}.1`,
        "Product Name": "—",
        "Customer Name": order.customer_name || "—",
        "Store Name": order.shop_name || "—",
        "Qty": 0,
        "MRP of Product": 0,
        "Purchase Price of the Products": 0,
        "Retailers Price": 0,
        "Date and Time of Delivery": deliveryDateFormatted,
      });
      return;
    }

    items.forEach((item, itemIdx) => {
      const pSlNo = `${slNo}.${itemIdx + 1}`;

      const qty = item.quantity || 1;
      const mrp = item.mrp || 0;
      const purchasePrice = item.purchase_price_at_order || 0;
      const sellPrice = item.unit_price || 0;

      const rowTotalPurchase = purchasePrice * qty;
      const rowTotalSell = sellPrice * qty;

      totalPurchaseMonthly += rowTotalPurchase;
      totalSellMonthly += rowTotalSell;

      sheetRows.push({
        "Sl. No.": itemIdx === 0 ? slNo : "",
        "Order Number": itemIdx === 0 ? order.order_number : "",
        "Product Sl. No.": pSlNo,
        "Product Name": item.product_name,
        "Customer Name": itemIdx === 0 ? (order.customer_name || "—") : "",
        "Store Name": itemIdx === 0 ? (order.shop_name || "—") : "",
        "Qty": qty,
        "MRP of Product": mrp,
        "Purchase Price of the Products": rowTotalPurchase,
        "Retailers Price": rowTotalSell,
        "Date and Time of Delivery": itemIdx === 0 ? deliveryDateFormatted : "",
      });
    });
  });

  // Empty row before summary
  sheetRows.push({});

  // Summary rows: headings placed in the cell immediately preceding each calculated total amount
  const profit = totalSellMonthly - totalPurchaseMonthly;

  // Row 1: Total Purchase Price heading in Column H ("MRP of Product"), amount in Column I ("Purchase Price of the Products")
  sheetRows.push({
    "MRP of Product": "Total Purchase Price",
    "Purchase Price of the Products": totalPurchaseMonthly,
  });

  // Row 2: Total Sell Price heading in Column H (merged to I), amount in Column J ("Retailers Price")
  sheetRows.push({
    "MRP of Product": "Total Sell Price",
    "Retailers Price": totalSellMonthly,
  });

  // Row 3: Total Profit heading in Column H (merged to I), amount in Column J ("Retailers Price")
  sheetRows.push({
    "MRP of Product": "Total Profit",
    "Retailers Price": profit,
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);

  // Set readable column widths
  worksheet["!cols"] = [
    { wch: 8 },  // Sl. No.
    { wch: 16 }, // Order Number
    { wch: 14 }, // Product Sl. No.
    { wch: 35 }, // Product Name
    { wch: 22 }, // Customer Name
    { wch: 22 }, // Store Name
    { wch: 8 },  // Qty
    { wch: 22 }, // MRP of Product
    { wch: 28 }, // Purchase Price of the Products
    { wch: 18 }, // Retailers Price
    { wch: 22 }, // Date and Time of Delivery
  ];

  // 1-based row indices for summary
  const totalRows = sheetRows.length + 1; // last row
  const rowProfit = totalRows;
  const rowSell = totalRows - 1;
  const rowPurchase = totalRows - 2;

  // Merge Column H & Column I for Row Sell and Row Profit so the label sits right against Column J
  worksheet["!merges"] = [
    { s: { r: rowSell - 1, c: 7 }, e: { r: rowSell - 1, c: 8 } },
    { s: { r: rowProfit - 1, c: 7 }, e: { r: rowProfit - 1, c: 8 } },
  ];

  // Bold table header row: ensure crisp bold text across all spreadsheet software
  const colLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
  colLetters.forEach((col) => {
    const cellRef = `${col}1`;
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true, name: "Calibri", sz: 11, color: { rgb: "000000" } },
        fill: { patternType: "solid", fgColor: { rgb: "E2E8F0" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  });

  // Bold summary headings & amounts in bold with right alignment
  const boldStyle = { font: { bold: true }, alignment: { horizontal: "right" } };

  // Total Purchase Price: H (heading) and I (amount)
  if (worksheet[`H${rowPurchase}`]) worksheet[`H${rowPurchase}`].s = boldStyle;
  if (worksheet[`I${rowPurchase}`]) worksheet[`I${rowPurchase}`].s = boldStyle;

  // Total Sell Price: H (heading spanning across H & I) and J (amount)
  if (worksheet[`H${rowSell}`]) worksheet[`H${rowSell}`].s = boldStyle;
  if (worksheet[`J${rowSell}`]) worksheet[`J${rowSell}`].s = boldStyle;

  // Total Profit: H (heading spanning across H & I) and J (amount)
  if (worksheet[`H${rowProfit}`]) worksheet[`H${rowProfit}`].s = boldStyle;
  if (worksheet[`J${rowProfit}`]) worksheet[`J${rowProfit}`].s = boldStyle;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Record");

  const filenameSafePartner = opts.partnerName.replace(/[^\w-]+/g, "_");
  const filename = `Monthly_Delivery_Record_${filenameSafePartner}_${opts.monthLabel}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

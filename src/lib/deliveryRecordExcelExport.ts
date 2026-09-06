import * as XLSX from "xlsx";
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
        "MRP": 0,
        "Purchase Price": 0,
        "Retailer's Price": 0,
        "Total Purchase": 0,
        "Total Sell": 0,
        "Date & Time of Delivery": deliveryDateFormatted,
      });
      return;
    }

    items.forEach((item, itemIdx) => {
      const pSlNo = `${slNo}.${itemIdx + 1}`;
      
      const qty = item.quantity || 1;
      const mrp = item.mrp || 0;
      const purchasePrice = item.purchase_price_at_order || 0; // if it was not recorded, it will be 0
      const sellPrice = item.unit_price || 0;
      
      const rowTotalPurchase = purchasePrice * qty;
      const rowTotalSell = sellPrice * qty;
      
      totalPurchaseMonthly += rowTotalPurchase;
      totalSellMonthly += rowTotalSell;

      sheetRows.push({
        "Sl. No.": itemIdx === 0 ? slNo : "", // show only on first row of order for clarity
        "Order Number": itemIdx === 0 ? order.order_number : "",
        "Product Sl. No.": pSlNo,
        "Product Name": item.product_name,
        "Customer Name": itemIdx === 0 ? (order.customer_name || "—") : "",
        "Store Name": itemIdx === 0 ? (order.shop_name || "—") : "",
        "Qty": qty,
        "MRP": mrp,
        "Purchase Price": purchasePrice,
        "Retailer's Price": sellPrice,
        "Total Purchase": rowTotalPurchase,
        "Total Sell": rowTotalSell,
        "Date & Time of Delivery": itemIdx === 0 ? deliveryDateFormatted : "",
      });
    });
  });

  // Empty row before summary
  sheetRows.push({});

  // Summary rows
  const profit = totalSellMonthly - totalPurchaseMonthly;
  
  sheetRows.push({
    "Product Name": "MONTHLY TOTALS",
    "Total Purchase": totalPurchaseMonthly,
    "Total Sell": totalSellMonthly,
  });
  
  sheetRows.push({
    "Product Name": "PROFIT",
    "Total Sell": profit,
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
    { wch: 10 }, // MRP
    { wch: 14 }, // Purchase Price
    { wch: 14 }, // Retailer's Price
    { wch: 15 }, // Total Purchase
    { wch: 15 }, // Total Sell
    { wch: 22 }, // Date & Time of Delivery
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Record");

  const filenameSafePartner = opts.partnerName.replace(/[^\w-]+/g, "_");
  const filename = `Monthly_Delivery_Record_${filenameSafePartner}_${opts.monthLabel}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
}

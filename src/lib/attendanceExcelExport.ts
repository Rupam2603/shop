import * as XLSX from "xlsx";
import type { AttendanceReportRow } from "./deliveryPartners";

/**
 * Exports delivery partner attendance report to an .xlsx Excel spreadsheet.
 * Columns: Sl. No., Name, Mobile Number, Date, Check In, Check Out, Status, Week Off
 */
export function exportAttendanceReportToExcel(
  rows: AttendanceReportRow[],
  opts: { rangeLabel: string; rangeType: "weekly" | "monthly" }
): void {
  const sheetRows = rows.map((r, i) => ({
    "Sl. No.": i + 1,
    "Name": r.name,
    "Mobile Number": r.mobile || "—",
    "Date": r.date,
    "Check In": r.checkInTime ?? "—",
    "Check Out": r.checkOutTime ?? "—",
    "Status": r.status,
    "Week Off": r.weeklyOffDay ?? "Not Set",
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);

  // Set readable column widths
  worksheet["!cols"] = [
    { wch: 8 },  // Sl. No.
    { wch: 22 }, // Name
    { wch: 16 }, // Mobile Number
    { wch: 14 }, // Date
    { wch: 12 }, // Check In
    { wch: 12 }, // Check Out
    { wch: 14 }, // Status
    { wch: 14 }, // Week Off
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

  const filenameSafeRange = opts.rangeLabel.replace(/[^\w-]+/g, "_");
  const filename = `Delivery_Attendance_${opts.rangeType === "weekly" ? "Weekly" : "Monthly"}_${filenameSafeRange}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
}

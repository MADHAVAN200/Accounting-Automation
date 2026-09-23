import * as XLSX from "xlsx";

export interface ParsedTransactionRow {
  date: string;
  description: string;
  amount: number | string;
  currency?: string;
}

export const SAMPLE_TEST_TRANSACTIONS: ParsedTransactionRow[] = [
  {
    date: "2026-09-02",
    description: "AWS CLOUD WEB SERVICES MUMBAI",
    amount: 45200,
    currency: "INR",
  },
  {
    date: "2026-09-02",
    description: "RAZORPAY ENTERPRISE SETTLEMENT INV-9901",
    amount: 285000,
    currency: "INR",
  },
  {
    date: "2026-09-03",
    description: "GOOGLE WORKSPACE AND CLOUD APPS",
    amount: 14200,
    currency: "INR",
  },
  {
    date: "2026-09-03",
    description: "UBER FOR BUSINESS INDIA COMMUTE",
    amount: 1850,
    currency: "INR",
  },
  {
    date: "2026-09-04",
    description: "GITHUB ENTERPRISE SUITE RENEWAL",
    amount: 32400,
    currency: "INR",
  },
  {
    date: "2026-09-04",
    description: "STRIPE PAYMENTS INFLOW ACME CORP",
    amount: 540000,
    currency: "INR",
  },
  {
    date: "2026-09-05",
    description: "WEWORK INDIA MANAGEMENT RENT",
    amount: 145000,
    currency: "INR",
  },
  {
    date: "2026-09-05",
    description: "NOTION LABS TEAM WORKSPACE",
    amount: 6800,
    currency: "INR",
  },
  {
    date: "2026-09-06",
    description: "AIR INDIA TRAVEL BOM-BLR RETURN",
    amount: 12800,
    currency: "INR",
  },
  {
    date: "2026-09-06",
    description: "ZOHO BOOKS & PAYROLL PROCESSING",
    amount: 8900,
    currency: "INR",
  },
  {
    date: "2026-09-07",
    description: "INDIGO AIRLINES FLIGHT DEL-BOM",
    amount: 9400,
    currency: "INR",
  },
  {
    date: "2026-09-07",
    description: "SWIGGY CORPORATE MEALS BENGALURU",
    amount: 3450,
    currency: "INR",
  },
  {
    date: "2026-09-08",
    description: "AIRTEL BUSINESS LEASED LINE FIBER",
    amount: 11200,
    currency: "INR",
  },
  {
    date: "2026-09-08",
    description: "SLACK ENTERPRISE GRID WORKSPACE",
    amount: 24600,
    currency: "INR",
  },
  {
    date: "2026-09-09",
    description: "FRESHWORKS SUPPORT DESK SOFTWARE",
    amount: 18200,
    currency: "INR",
  },
];

/**
 * Generates and downloads a real .xlsx Excel file with sample test transactions
 * and instructions for testing the end-to-end Python backend.
 */
export function downloadSampleExcelStatement(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Bank Transactions
  const wsData = [
    ["Date", "Description", "Amount", "Currency", "Type", "Notes"],
    ["2026-09-02", "AWS CLOUD WEB SERVICES MUMBAI", 45200, "INR", "DEBIT", "Compute cluster hosting"],
    ["2026-09-02", "RAZORPAY ENTERPRISE SETTLEMENT INV-9901", 285000, "INR", "CREDIT", "Customer ARR subscription payment"],
    ["2026-09-03", "GOOGLE WORKSPACE AND CLOUD APPS", 14200, "INR", "DEBIT", "GSuite email & collaboration"],
    ["2026-09-03", "UBER FOR BUSINESS INDIA COMMUTE", 1850, "INR", "DEBIT", "Client sales meeting commute"],
    ["2026-09-04", "GITHUB ENTERPRISE SUITE RENEWAL", 32400, "INR", "DEBIT", "Org developer seats"],
    ["2026-09-04", "STRIPE PAYMENTS INFLOW ACME CORP", 540000, "INR", "CREDIT", "Enterprise upfront renewal"],
    ["2026-09-05", "WEWORK INDIA MANAGEMENT RENT", 145000, "INR", "DEBIT", "Office workstation lease"],
    ["2026-09-05", "NOTION LABS TEAM WORKSPACE", 6800, "INR", "DEBIT", "Documentation wiki workspace"],
    ["2026-09-06", "AIR INDIA TRAVEL BOM-BLR RETURN", 12800, "INR", "DEBIT", "Executive travel"],
    ["2026-09-06", "ZOHO BOOKS & PAYROLL PROCESSING", 8900, "INR", "DEBIT", "Payroll platform fee"],
    ["2026-09-07", "INDIGO AIRLINES FLIGHT DEL-BOM", 9400, "INR", "DEBIT", "Onsite technical audit"],
    ["2026-09-07", "SWIGGY CORPORATE MEALS BENGALURU", 3450, "INR", "DEBIT", "Team sprint dinner"],
    ["2026-09-08", "AIRTEL BUSINESS LEASED LINE FIBER", 11200, "INR", "DEBIT", "Office broadband"],
    ["2026-09-08", "SLACK ENTERPRISE GRID WORKSPACE", 24600, "INR", "DEBIT", "Internal communications"],
    ["2026-09-09", "FRESHWORKS SUPPORT DESK SOFTWARE", 18200, "INR", "DEBIT", "Customer support portal"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = [
    { wch: 14 }, // Date
    { wch: 42 }, // Description
    { wch: 14 }, // Amount
    { wch: 10 }, // Currency
    { wch: 12 }, // Type
    { wch: 35 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Bank_Transactions");

  // Sheet 2: Testing Guide
  const guideData = [
    ["LedgerAI Testing Guide - Real-Time Python & SQLite Execution"],
    [""],
    ["Step 1: Upload this file into 'Import Bank Statement' modal via drag & drop or file picker."],
    ["Step 2: Watch Python auto-categorize each line item and map it to General Ledger Chart of Accounts."],
    ["Step 3: Review flagged anomalies or low-confidence predictions in the 'Transactions' page."],
    ["Step 4: Click 'Approve' to generate double-entry journal entries that automatically balance debits and credits."],
    ["Step 5: Navigate to 'Reconciliation Workspace' to match inflows and outflows with outstanding vendor invoices."],
    ["Step 6: In 'General Ledger', inspect the live trial balance and audit trail recorded in SQLite."],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "How_To_Test");

  XLSX.writeFile(wb, "LedgerAI_Bank_Statement_Test.xlsx");
}

/**
 * Parses an uploaded .xlsx, .xls, or .csv file into standardized transaction rows.
 */
export async function parseUploadedFile(file: File): Promise<ParsedTransactionRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "xlsx" || extension === "xls") {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      throw new Error("The selected Excel sheet appears to be empty.");
    }

    return normalizeRows(rawRows);
  } else {
    // Treat as CSV / Text
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("CSV file must contain a header row and at least 1 record.");
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
    const rawRows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Basic CSV column splitter handling quotes
      const cols: string[] = [];
      let inQuote = false;
      let currentVal = "";
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === "," && !inQuote) {
          cols.push(currentVal.trim().replace(/^["']|["']$/g, ""));
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim().replace(/^["']|["']$/g, ""));

      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || "";
      });
      rawRows.push(rowObj);
    }

    return normalizeRows(rawRows);
  }
}

function normalizeRows(rawRows: Record<string, any>[]): ParsedTransactionRow[] {
  const results: ParsedTransactionRow[] = [];

  for (const row of rawRows) {
    // Look up date column
    const dateKey = Object.keys(row).find((k) =>
      /^(date|trans.*date|value.*date|tx.*date)/i.test(k.trim())
    );
    // Look up description column
    const descKey = Object.keys(row).find((k) =>
      /^(desc.*|memo|narration|particulars|payee|vendor|details)/i.test(k.trim())
    );
    // Look up amount column or debit/credit
    const amtKey = Object.keys(row).find((k) =>
      /^(amount|amt|net.*amount|transaction.*amount)/i.test(k.trim())
    );
    const debitKey = Object.keys(row).find((k) => /^(debit|withdrawal|dr)/i.test(k.trim()));
    const creditKey = Object.keys(row).find((k) => /^(credit|deposit|cr)/i.test(k.trim()));
    const currKey = Object.keys(row).find((k) => /^(currency|curr|ccy)/i.test(k.trim()));

    let rawDate = dateKey ? String(row[dateKey]).trim() : "";
    // If Excel numeric serial date, convert
    if (/^\d{5}$/.test(rawDate)) {
      const dateNum = parseInt(rawDate, 10);
      const parsed = new Date((dateNum - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(parsed.getTime())) {
        rawDate = parsed.toISOString().split("T")[0];
      }
    } else if (!rawDate) {
      rawDate = new Date().toISOString().split("T")[0];
    }

    const desc = descKey ? String(row[descKey]).trim() : "Bank Statement Transaction";

    let amount = 0;
    if (amtKey && row[amtKey] !== "") {
      amount = Math.abs(parseFloat(String(row[amtKey]).replace(/[^0-9.-]/g, "")) || 0);
    } else if (debitKey && row[debitKey] !== "" && parseFloat(row[debitKey]) > 0) {
      amount = Math.abs(parseFloat(String(row[debitKey]).replace(/[^0-9.-]/g, "")) || 0);
    } else if (creditKey && row[creditKey] !== "" && parseFloat(row[creditKey]) > 0) {
      amount = Math.abs(parseFloat(String(row[creditKey]).replace(/[^0-9.-]/g, "")) || 0);
    }

    const currency = currKey && row[currKey] ? String(row[currKey]).trim().toUpperCase() : "INR";

    if (desc && amount > 0) {
      results.push({
        date: rawDate,
        description: desc,
        amount,
        currency,
      });
    }
  }

  return results;
}

/**
 * Generic export function for tables to .xlsx
 */
export function exportDataToExcel(data: any[], fileName: string, sheetName: string = "Data"): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

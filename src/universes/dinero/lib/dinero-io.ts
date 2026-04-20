import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';

// Bundle the PDF.js worker locally instead of fetching from an external CDN.
// This prevents supply-chain-attack exposure from third-party scripts.
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ─── Security constants ───────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'text/plain', // some CSV files report as text/plain
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set(['csv', 'xlsx', 'xls', 'json', 'pdf']);

/**
 * Validates the file before processing it.
 * @throws Error if the file fails any validation check.
 */
function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`,
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File type ".${ext}" is not supported. Allowed: CSV, XLSX, JSON, PDF.`);
  }

  // Check MIME type in addition to extension to prevent trivial bypass.
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    // Some valid files report an unusual MIME — only warn, don't hard-block.
    console.warn(`[parseFile] Unexpected MIME type "${file.type}" for extension ".${ext}".`);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportRecords = (records: any[], format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
  const data = records.map(r => ({
    Date: new Date(r.date).toLocaleDateString(),
    Type: r.type,
    Amount: r.amount,
    Category: r.category || 'General',
    Description: r.description || '—',
  }));

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'transactions.json');
  } else if (format === 'csv') {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'transactions.csv');
  } else if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Type', 'Amount', 'Category', 'Description']],
      body: data.map(r => [r.Date, r.Type, `$${r.Amount}`, r.Category, r.Description]),
      theme: 'grid',
      headStyles: { fillColor: [5, 223, 114] },
    });
    doc.save('transactions.pdf');
  }
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Import ───────────────────────────────────────────────────────────────────

export const parseFile = async (file: File): Promise<any[]> => {
  // Validate before processing anything.
  validateFile(file);

  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file. Please check the file format.');
    }
    const rows = Array.isArray(data) ? data : [data];
    return standardizeImport(rows);
  }

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => resolve(standardizeImport(results.data as any[])),
        error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws) as any[];
    return standardizeImport(data);
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((str: any) => str.str).join(' ');
      fullText += pageText + '\n';
    }
    // Naive regex — bank PDF formats vary widely. Results may be incomplete.
    const matches =
      fullText.match(/(\d{1,2}\/\d{1,2}\/[\d]{2,4}).*?\$?([\d,]+\.[\d]{2})/g) ?? [];
    const extracted = matches.map(m => {
      const parts = m.split(' ');
      return { Date: parts[0], Amount: parts[parts.length - 1] };
    });
    return standardizeImport(extracted);
  }

  throw new Error('Unsupported file format.');
};

const toNumber = (raw: unknown): number => {
  if (raw === null || raw === undefined || raw === '') return NaN;
  // Strip currency symbols, thousand separators, whitespace — keep digits, dot, minus.
  return parseFloat(String(raw).replace(/[^0-9.\-]+/g, ''));
};

/**
 * Infers transaction type from an explicit column if present, otherwise falls
 * back to the amount's sign. Handles Spanish + English variants and common
 * bank-CSV dual-column layouts (Debit / Credit).
 */
const inferType = (row: any, amountVal: number): 'income' | 'expense' => {
  const explicit = String(
    row['Type'] ?? row['type'] ?? row['Tipo'] ?? row['tipo'] ?? '',
  ).trim().toLowerCase();
  if (explicit) {
    if (['income', 'ingreso', 'credit', 'crédito', 'credito', 'deposit', 'abono'].includes(explicit)) return 'income';
    if (['expense', 'gasto', 'debit', 'débito', 'debito', 'withdrawal', 'cargo', 'egreso'].includes(explicit)) return 'expense';
  }
  // Dual-column bank layout: positive value in one of Debit/Credit wins.
  const debit = toNumber(row['Debit'] ?? row['debit'] ?? row['Débito'] ?? row['Debito']);
  const credit = toNumber(row['Credit'] ?? row['credit'] ?? row['Crédito'] ?? row['Credito']);
  if (Number.isFinite(debit) && debit > 0) return 'expense';
  if (Number.isFinite(credit) && credit > 0) return 'income';
  // Fallback: sign of amount.
  return amountVal < 0 ? 'expense' : 'income';
};

const standardizeImport = (data: any[]): any[] =>
  data
    .map(row => {
      // Amount can come from a single column, or be split across Debit/Credit.
      const debit = toNumber(row['Debit'] ?? row['debit'] ?? row['Débito'] ?? row['Debito']);
      const credit = toNumber(row['Credit'] ?? row['credit'] ?? row['Crédito'] ?? row['Credito']);
      const single = toNumber(row['Amount'] ?? row['amount'] ?? row['Monto'] ?? row['monto']);

      let amountVal: number;
      if (Number.isFinite(debit) && debit > 0) amountVal = -Math.abs(debit);
      else if (Number.isFinite(credit) && credit > 0) amountVal = Math.abs(credit);
      else if (Number.isFinite(single)) amountVal = single;
      else return null;

      const type = inferType(row, amountVal);
      const amount = Math.abs(amountVal);

      let isoDate = new Date().toISOString();
      const rawDate =
        row['Transaction Date'] ??
        row['Date'] ??
        row['Fecha'] ??
        row['date'] ??
        row['Effective Date'];
      if (rawDate) {
        try {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
        } catch { /* use default */ }
      }

      const description =
        row['Description'] ?? row['description'] ?? row['Details'] ?? row['Detalle'] ??
        row['Descripción'] ?? row['Descripcion'] ?? 'Imported Transaction';

      // Respect an explicit category column if the file already carries one
      // (e.g. round-tripped exports). Otherwise caller will classify later.
      const explicitCategory =
        row['Category'] ?? row['category'] ?? row['Categoría'] ?? row['Categoria'];
      const category = explicitCategory && String(explicitCategory).trim()
        ? String(explicitCategory).trim()
        : 'General';

      return { amount, type, date: isoDate, description, category };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

// ─── Rule-based categorization ────────────────────────────────────────────────

/**
 * Categorizes transactions using keyword rules.
 * This is rule-based matching — not AI. Labels are intentionally honest.
 */
export const autoCategorize = (rawTransactions: any[], _userCategories: any[] = []) =>
  rawTransactions.map(t => {
    const desc = (t.description ?? '').toUpperCase();
    let category = 'General';

    if (
      desc.includes('COUNTDOWN') || desc.includes('PAKN') ||
      desc.includes('NEW WORLD') || desc.includes('SUPERMARKET') ||
      desc.includes('WOOLWORTHS') || desc.includes('ALDI')
    ) category = 'Groceries & Supermarket';
    else if (
      desc.includes('NETFLIX') || desc.includes('SPOTIFY') ||
      desc.includes('DISNEY') || desc.includes('PRIME')
    ) category = 'Entertainment & Subscriptions';
    else if (
      desc.includes('SHELL') || desc.includes('Z ENERGY') ||
      desc.includes('AT HOP') || desc.includes('BP ')
    ) category = 'Transportation';
    else if (
      desc.includes('RESTAURANT') || desc.includes('CAFE') ||
      desc.includes('UBER EATS') || desc.includes('MCDONALDS') ||
      desc.includes('KFC') || desc.includes('FOODPANDA')
    ) category = 'Dining out';
    else if (
      desc.includes('GYM') || desc.includes('FITNESS') ||
      desc.includes('PHARMACY') || desc.includes('CHEMIST')
    ) category = 'Health & Fitness';
    else if (
      desc.includes('POWER') || desc.includes('WATER') ||
      desc.includes('SPARK') || desc.includes('VODAFONE') ||
      desc.includes('ONE NZ') || desc.includes('RENT') || desc.includes('MORTGAGE')
    ) category = 'Housing & Utilities';

    return { ...t, suggestedCategory: category };
  });

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';

// Assign worker for PDF parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// EXPORT Logic
export const exportRecords = (records: any[], format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
  const data = records.map(r => ({
    Date: new Date(r.date).toLocaleDateString(),
    Type: r.type,
    Amount: r.amount,
    Category: r.category || 'General',
    Description: r.description || 'EMPTY'
  }));

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'transactions.json');
  } 
  else if (format === 'csv') {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'transactions.csv');
  } 
  else if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  } 
  else if (format === 'pdf') {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Type', 'Amount', 'Category', 'Description']],
      body: data.map(r => [r.Date, r.Type, `$${r.Amount}`, r.Category, r.Description]),
      theme: 'grid',
      headStyles: { fillColor: [5, 223, 114] } // Aether Green
    });
    doc.save('transactions.pdf');
  }
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// IMPORT Logic
export const parseFile = async (file: File): Promise<any[]> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (ext === 'json') {
     const text = await file.text();
     const data = JSON.parse(text);
     return standardizeImport(Array.isArray(data) ? data : [data]);
  }
  else if (ext === 'csv') {
     return new Promise((resolve) => {
        Papa.parse(file, {
           header: true,
           skipEmptyLines: true,
           complete: (results) => resolve(standardizeImport(results.data))
        });
     });
  }
  else if (ext === 'xlsx' || ext === 'xls') {
     const buffer = await file.arrayBuffer();
     const wb = XLSX.read(buffer, { type: 'array' });
     const wsname = wb.SheetNames[0];
     const ws = wb.Sheets[wsname];
     const data = XLSX.utils.sheet_to_json(ws);
     return standardizeImport(data);
  }
  else if (ext === 'pdf') {
     // Basic PDF Text Extraction using PDFjs
     const arrayBuffer = await file.arrayBuffer();
     const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
     let fullText = '';
     for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((str: any) => str.str).join(' ');
        fullText += pageText + '\n';
     }
     
     // Very naive regex parsing (e.g. looking for MM/DD/YYYY $AMOUNT)
     // Fallback to simple line matching that users will likely need to adjust per bank
     // Since PDF data formats vary massively, we wrap it in a pseudo-row
     const matches = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}).*?\$?(\d+[,.]\d{2})/g) || [];
     const extracted = matches.map(m => {
        const parts = m.split(' ');
        return { Date: parts[0], Amount: parts[parts.length-1] };
     });
     return standardizeImport(extracted);
  }
  
  throw new Error("Unsupported file format.");
};

const standardizeImport = (data: any[]): any[] => {
   return data.map(row => {
      // Find amount column flexibly
      const rawAmount = row['Amount'] || row['amount'] || row['Monto'] || row['monto'] || '0';
      const amountVal = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g,""));
      if (isNaN(amountVal)) return null;

      const type = amountVal < 0 ? 'expense' : 'income';
      const amount = Math.abs(amountVal);
      
      let isoDate = new Date().toISOString();
      const rawDate = row['Transaction Date'] || row['Date'] || row['Fecha'] || row['date'] || row['Effective Date'];
      if (rawDate) {
         try { isoDate = new Date(rawDate).toISOString(); } catch(e) {}
      }

      const description = row['Description'] || row['description'] || row['Details'] || row['Detalle'] || 'Imported Transaction';

      return {
         amount,
         type,
         date: isoDate,
         description: description,
         category: 'General'
      };
   }).filter(x => x !== null);
};

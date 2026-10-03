/**
 * exportData.ts
 * Export utilities for Quranic statistical datasets, surah fingerprints, and Mushaf comparisons.
 * Supports CSV export (Excel-compatible UTF-8 BOM) and high-resolution Printable PDF documents.
 */

import { SurahData, LetterStatsData } from '../types';
import { ARABIC_LETTERS, ARABIC_LETTER_NAMES } from './arabic';

/**
 * Triggers a browser file download of a given text content with UTF-8 BOM for Arabic Excel compatibility.
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the complete 114 Surahs Letter Distribution Matrix to CSV.
 */
export function exportLetterMatrixToCSV(surahs: SurahData[], letterStats: LetterStatsData): void {
  const letters = ARABIC_LETTERS;
  
  // Headers
  const headers = [
    'رقم السورة',
    'اسم السورة',
    'النزول',
    'عدد الآيات',
    'عدد الكلمات',
    'إجمالي الحروف',
    ...letters.map(l => `${l} (${ARABIC_LETTER_NAMES[l] || l})`)
  ];

  const rows = surahs.map(surah => {
    const sLetters = surah.letters?.plainCounts || {};
    const letterCounts = letters.map(l => sLetters[l] || 0);
    return [
      surah.number,
      `"${surah.name}"`,
      surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
      surah.totalAyahs,
      surah.totalWords,
      surah.totalChars,
      ...letterCounts
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  downloadFile('Quran_Letters_Matrix_114_Surahs.csv', csvContent);
}

/**
 * Exports single Surah complete statistical breakdown to CSV.
 */
export function exportSurahSummaryToCSV(surah: SurahData, letterCounts: Record<string, number>): void {
  const letters = ARABIC_LETTERS;
  const headers = ['الحرف', 'اسم الحرف', 'التكرار', 'النسبة المئوية (%)'];
  
  const totalLetters = surah.totalChars || surah.letters?.totalLettersPlain || 1;
  const rows = letters.map(l => {
    const count = letterCounts[l] || 0;
    const pct = ((count / totalLetters) * 100).toFixed(3);
    return [l, ARABIC_LETTER_NAMES[l] || l, count, `${pct}%`].join(',');
  });

  const summaryMeta = [
    `"تقرير سورة: ${surah.name}"`,
    `"الرقم في المصحف: ${surah.number}"`,
    `"مكان النزول: ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}"`,
    `"عدد الآيات: ${surah.totalAyahs}"`,
    `"عدد الكلمات: ${surah.totalWords}"`,
    `"إجمالي الحروف: ${surah.totalChars}"`,
    '',
    headers.join(',')
  ].join('\r\n');

  const csvContent = [summaryMeta, ...rows].join('\r\n');
  downloadFile(`Surah_${surah.number}_${surah.name.replace(/\s+/g, '_')}_Letters.csv`, csvContent);
}

export interface DiffExportRow {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  diffType: string;
  kufiText: string;
  madaniText: string;
  details: string;
}

/**
 * Exports Mushaf Divergence table (Hafs vs Warsh) to CSV.
 */
export function exportMushafDiffsToCSV(diffs: DiffExportRow[], filename: string = 'Mushaf_Divergence_Differences.csv'): void {
  const headers = [
    'رقم السورة',
    'اسم السورة',
    'رقم الآية',
    'نوع الخلاف',
    'نص مصحف الكوفة (حفص)',
    'نص مصحف المدينة (ورش)',
    'تفاصيل وملاحظات'
  ];

  const rows = diffs.map(d => [
    d.surahNumber,
    `"${d.surahName}"`,
    d.ayahNumber,
    `"${d.diffType}"`,
    `"${d.kufiText.replace(/"/g, '""')}"`,
    `"${d.madaniText.replace(/"/g, '""')}"`,
    `"${d.details.replace(/"/g, '""')}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  downloadFile(filename, csvContent);
}

/**
 * Generates and triggers a formatted printable document view (Print to PDF).
 */
export function printFormattedReport(title: string, subtitle: string, htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير أو حفظه كـ PDF.');
    return;
  }

  const documentHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Amiri', 'Amiri Quran', sans-serif;
            margin: 0;
            padding: 20px;
            color: #10211F;
            background: #ffffff;
            direction: rtl;
          }
          .report-header {
            border-bottom: 2px solid #1A5C5C;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .report-header h1 {
            margin: 0;
            font-size: 20px;
            color: #1A5C5C;
          }
          .report-header p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #53605E;
          }
          .print-meta {
            font-size: 11px;
            color: #6F7F7B;
            text-align: left;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #C7CEC9;
            padding: 8px 10px;
            text-align: right;
          }
          th {
            background-color: #F1ECE0;
            color: #10211F;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #F8F6EF;
          }
          .font-quran {
            font-family: 'Amiri Quran', 'Amiri', serif;
            font-size: 15px;
            line-height: 1.8;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #E2DDCF;
            font-size: 10px;
            color: #97A8A3;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <h1>بصمة السور - تقرير إحصائي تحليلي</h1>
            <p>${title} | ${subtitle}</p>
          </div>
          <div class="print-meta">
            <div>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</div>
            <div>المنصة: بصمة السور (Surah Fingerprint)</div>
          </div>
        </div>
        
        <main>
          ${htmlContent}
        </main>

        <div class="footer">
          تم استخراج هذا التقرير آلياً عبر منصة بصمة السور التحليلية للقرآن الكريم.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
}

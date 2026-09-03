// src/lib/export.ts
// ============================================================
// AIMS — REAL export helpers (CSV + print-to-PDF).
// CSV downloads a genuine .csv of the visible rows. PDF opens the
// browser print dialog on a clean table layout, so the user can
// "Save as PDF" — no placeholder toasts, no fake downloads.
// ============================================================

import { downloadFile, toCSV } from '@/lib/storage';

/** Download a real .txt record sheet describing any record (doc, contract, attachment…) */
export function exportRecordSheet(filename: string, heading: string, fields: [string, string][]): void {
  const lines = [
    `ARDHI — ${heading}`,
    '===========================',
    ...fields.map(([k, v]) => `${k}: ${v}`),
    '',
    'ARDHI · Research. Advocacy. Innovation.',
  ];
  const safe = filename.replace(/[\\/:*?"<>|]/g, '-');
  downloadFile(`${safe}.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
}

/** Download rows as a real .csv file */
export function exportCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]): void {
  const csv = toCSV(rows, columns);
  const name = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadFile(name, csv, 'text/csv;charset=utf-8');
}

/** Open the browser print dialog with a formatted table (user saves as PDF) */
export function exportTableAsPdf(
  title: string,
  head: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const esc = (s: string | number | null | undefined) =>
    String(s ?? '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const thead = head.map((h) => `<th>${esc(h)}</th>`).join('');
  const tbody = rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body { font-family: Inter, 'Segoe UI', Arial, sans-serif; color: #0b1c30; margin: 32px; }
  h1 { font-size: 18px; color: #053664; margin-bottom: 4px; }
  p.meta { font-size: 11px; color: #43474f; margin-top: 0; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #053664; color: #fff; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
  td { padding: 6px 10px; border-bottom: 1px solid #d3e4fe; }
  tr:nth-child(even) td { background: #f1f6f1; }
  .foot { margin-top: 18px; font-size: 10px; color: #43474f; }
</style></head>
<body>
  <h1>ARDHI — ${esc(title)}</h1>
  <p class="meta">Generated ${new Date().toLocaleString('en-GB')} · AIMS Internal Management System</p>
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody || '<tr><td colspan="' + head.length + '">No records</td></tr>'}</tbody></table>
  <p class="foot">ARDHI · Research. Advocacy. Innovation.</p>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body></html>`;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  try {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  } catch { /* print may be blocked; iframe removal still cleans up */ }
  setTimeout(() => frame.remove(), 60_000);
}

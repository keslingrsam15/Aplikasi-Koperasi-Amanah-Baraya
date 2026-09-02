import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import JsBarcode from 'jsbarcode';
import { Transaction, CoopConfig, Product } from '../types';
import { formatRupiah, formatDateTimeIndo } from './formatters';

export type ReceiptPaperSize = '58mm' | '80mm' | 'A4';

/**
 * Generate and download PDF from HTML Element using html2canvas + jsPDF
 * Perfectly matches the 100% on-screen application look with crisp DPI,
 * proportional auto-height paper roll sizing, and clean borderless thermal presentation.
 */
export const downloadReceiptPdfFromElement = async (
  elementId: string,
  transaction: Transaction,
  paperSize: ReceiptPaperSize = '58mm',
  coopConfig?: CoopConfig
): Promise<{ success: boolean; error?: string }> => {
  let targetElement = document.getElementById(elementId);
  let tempContainer: HTMLElement | null = null;

  // Fallback cooperative configuration if not provided
  const activeConfig: CoopConfig = coopConfig || {
    name: 'KOPERASI AMANAH BARAYA',
    subtitle: 'Unit Pertokoan & Kasir Terpadu',
    hospitalName: 'RSUD AL-MULK KOTA SUKABUMI',
    address: 'Jl. Pelabuhan II KM. 6, Lembursitu, Kota Sukabumi',
    city: 'Kota Sukabumi, Jawa Barat 43168',
    phone: '(0266) 6243088 / 0812-3456-7890',
    receiptFooter: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.\nTerima kasih atas kunjungan Anda.',
    paperWidth: paperSize === '80mm' ? '80mm' : '58mm',
    taxPercent: 0,
  };

  try {
    // If element is not in DOM, create an identical offscreen DOM template
    if (!targetElement) {
      tempContainer = createReceiptDomElement(transaction, activeConfig, paperSize);
      document.body.appendChild(tempContainer);
      targetElement = tempContainer;
    }

    // We will get the element width to calculate the correct proportions
    const elWidth = targetElement.scrollWidth || targetElement.offsetWidth || (paperSize === '80mm' ? 420 : paperSize === 'A4' ? 480 : 340);
    const elHeight = targetElement.scrollHeight || targetElement.offsetHeight || 800;

    // Use htmlToImage which natively supports modern CSS (including oklch)
    const imgData = await htmlToImage.toPng(targetElement, {
      pixelRatio: 3,
      width: elWidth,
      height: elHeight,
      backgroundColor: '#ffffff',
      style: {
        boxShadow: 'none',
        border: 'none',
        borderRadius: '0px',
        margin: '0',
      }
    });

    if (paperSize === '58mm' || paperSize === '80mm') {
      const pdfWidthMm = paperSize === '80mm' ? 80 : 58;
      // Proportional height matching the exact receipt content length
      const pdfHeightMm = Math.ceil((elHeight * pdfWidthMm) / elWidth);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidthMm, Math.max(30, pdfHeightMm)],
      });

      // Place image seamlessly from top-left (0, 0)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
      pdf.save(`Struk_${transaction.invoiceNumber}_${paperSize}.pdf`);
    } else {
      // Standard A4 Slip Format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const a4Width = 210;
      const targetWidth = 115;
      const targetHeight = (elHeight * targetWidth) / elWidth;
      const xPos = (a4Width - targetWidth) / 2;

      pdf.addImage(imgData, 'PNG', xPos, 15, targetWidth, targetHeight, undefined, 'FAST');
      pdf.save(`Struk_A4_${transaction.invoiceNumber}.pdf`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('PDF export error, falling back to vector generator:', err);
    return generateVectorReceiptPdf(transaction, activeConfig, paperSize);
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
};

/**
 * Creates an exact on-the-fly HTML element that replicates the ReceiptModal on-screen view 100%
 */
function createReceiptDomElement(
  transaction: Transaction,
  coopConfig: CoopConfig,
  paperSize: ReceiptPaperSize
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'pdf-temp-receipt';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = paperSize === '80mm' ? '380px' : paperSize === 'A4' ? '460px' : '290px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.6';
  container.style.padding = paperSize === '80mm' ? '18px 20px' : paperSize === 'A4' ? '24px 28px' : '14px 14px';

  const customerDisplay = transaction.customerName || (
    transaction.customerType === 'anggota' ? 'Anggota Koperasi' :
    transaction.customerType === 'karyawan_rsud' ? 'Karyawan RSUD' :
    transaction.customerType === 'pasien' ? 'Pasien / Keluarga' : 'Pelanggan Umum'
  );

  const itemsHtml = transaction.items.map((item) => `
    <div style="margin-bottom: 8px;">
      <div style="font-weight: 700; color: #0f172a;">${item.product.name}</div>
      <div style="display: flex; justify-content: space-between; color: #475569; font-size: 11px; padding-left: 8px;">
        <span>
          ${item.quantity} ${item.product.unit} x ${formatRupiah(item.product.sellPrice)}
          ${item.discountNominal > 0 ? `<span style="color: #dc2626; font-weight: 600; margin-left: 4px;">(disc -${formatRupiah(item.discountNominal)})</span>` : ''}
        </span>
        <span style="font-weight: 700; color: #0f172a;">${formatRupiah(item.subtotal)}</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="text-align: center; padding-bottom: 12px; border-bottom: 1px dashed #94a3b8;">
      <h2 style="font-weight: 900; font-size: 13px; text-transform: uppercase; margin: 0; line-height: 1.3;">
        ${coopConfig.name}
      </h2>
      <p style="font-weight: 800; font-size: 12px; color: #134e4a; text-transform: uppercase; margin: 2px 0 0 0;">
        ${coopConfig.hospitalName}
      </p>
      <p style="font-size: 10px; color: #475569; line-height: 1.3; margin: 4px 0 0 0;">
        ${coopConfig.address}
      </p>
      <p style="font-size: 10px; color: #475569; margin: 2px 0 0 0;">
        Telp: ${coopConfig.phone}
      </p>
    </div>

    <div style="padding: 10px 0; border-bottom: 1px dashed #94a3b8; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="color: #475569;">No. Nota:</span>
        <span style="font-weight: 700; color: #0f172a;">${transaction.invoiceNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="color: #475569;">Waktu:</span>
        <span>${formatDateTimeIndo(transaction.date)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="color: #475569;">Kasir:</span>
        <span style="font-weight: 600; color: #1e293b;">${transaction.cashierName}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #475569;">Pelanggan:</span>
        <span style="font-weight: 600; color: #1e293b;">${customerDisplay}</span>
      </div>
    </div>

    <div style="padding: 10px 0; border-bottom: 1px dashed #94a3b8;">
      ${itemsHtml}
    </div>

    <div style="padding: 10px 0; border-bottom: 1px dashed #94a3b8; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span style="color: #475569;">Total Item (${transaction.totalItems} pcs):</span>
        <span style="font-weight: 600;">${formatRupiah(transaction.subtotal)}</span>
      </div>
      ${transaction.discountTotal > 0 ? `
      <div style="display: flex; justify-content: space-between; color: #dc2626; font-weight: 600; margin-bottom: 3px;">
        <span>Potongan Diskon:</span>
        <span>-${formatRupiah(transaction.discountTotal)}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; color: #0f172a; padding-top: 6px; border-top: 1px solid #cbd5e1;">
        <span>TOTAL AKHIR:</span>
        <span>${formatRupiah(transaction.grandTotal)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #334155; padding-top: 4px;">
        <span>Metode Pembayaran:</span>
        <span style="font-weight: 700; text-transform: uppercase; color: #0f172a;">${transaction.paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #334155; margin-top: 2px;">
        <span>Tunai / Diterima:</span>
        <span style="font-weight: 500;">${formatRupiah(transaction.paymentAmount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #115e59; font-weight: 800; font-size: 12px; margin-top: 2px;">
        <span>Kembalian:</span>
        <span>${formatRupiah(transaction.changeAmount)}</span>
      </div>
    </div>

    <div style="padding-top: 12px; text-align: center;">
      <div style="display: flex; justify-content: center; margin-bottom: 6px;">
        <svg id="temp-receipt-barcode-svg"></svg>
      </div>
      <p style="font-size: 10px; color: #475569; white-space: pre-line; line-height: 1.3; margin: 0;">
        ${coopConfig.receiptFooter}
      </p>
      <p style="font-size: 9px; color: #94a3b8; padding-top: 4px; margin: 0;">
        Koperasi Amanah Baraya &bull; RSUD Al-Mulk Sukabumi
      </p>
    </div>
  `;

  // Render barcode svg into the created element
  setTimeout(() => {
    try {
      const svg = container.querySelector('#temp-receipt-barcode-svg');
      if (svg && transaction.invoiceNumber) {
        JsBarcode(svg, transaction.invoiceNumber, {
          format: 'CODE128',
          width: 1.2,
          height: 30,
          displayValue: true,
          fontSize: 10,
          font: 'monospace',
          fontOptions: 'bold',
          margin: 2,
          background: 'transparent',
          lineColor: '#111827',
        });
      }
    } catch (e) {
      console.warn('Barcode render in temp DOM error:', e);
    }
  }, 0);

  return container;
}

/**
 * Pure Vector jsPDF Generator (Sharp & lightweight fallback without DOM dependency)
 */
export const generateVectorReceiptPdf = (
  transaction: Transaction,
  coopConfig: CoopConfig,
  paperSize: ReceiptPaperSize = '58mm'
): { success: boolean; error?: string } => {
  try {
    const is80mm = paperSize === '80mm';
    const isA4 = paperSize === 'A4';

    const widthMm = isA4 ? 210 : is80mm ? 80 : 58;
    // Calculate approximate needed height
    const baseHeight = 110;
    const itemRowsHeight = transaction.items.length * 8.5;
    const calculatedHeightMm = isA4 ? 297 : baseHeight + itemRowsHeight;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isA4 ? 'a4' : [widthMm, Math.max(80, calculatedHeightMm)],
    });

    const centerX = widthMm / 2;
    const marginX = isA4 ? 30 : 4;
    const contentWidth = widthMm - marginX * 2;
    let y = isA4 ? 25 : 8;

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(isA4 ? 13 : is80mm ? 10.5 : 9);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(coopConfig.name, centerX, y, { align: 'center' });
    y += isA4 ? 6 : 4;

    pdf.setFontSize(isA4 ? 11 : is80mm ? 9 : 8);
    pdf.setTextColor(19, 78, 74); // teal-900
    pdf.text(coopConfig.hospitalName, centerX, y, { align: 'center' });
    pdf.setTextColor(71, 85, 105); // slate-600
    y += isA4 ? 5 : 3.5;

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(isA4 ? 8.5 : 6.8);
    pdf.text(coopConfig.address, centerX, y, { align: 'center' });
    y += isA4 ? 4 : 3;
    pdf.text(`Telp: ${coopConfig.phone}`, centerX, y, { align: 'center' });
    y += isA4 ? 5 : 3.5;

    // Divider Line (dashed)
    pdf.setDrawColor(148, 163, 184); // slate-400
    pdf.setLineDashPattern([1.5, 1.5], 0);
    pdf.line(marginX, y, widthMm - marginX, y);
    y += isA4 ? 5 : 3.5;

    // Metadata Info
    pdf.setFontSize(isA4 ? 8.5 : 7.2);
    pdf.setTextColor(71, 85, 105);
    pdf.text('No. Nota :', marginX, y);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('courier', 'bold');
    pdf.text(transaction.invoiceNumber, widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.2;

    pdf.setFont('courier', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Waktu    :', marginX, y);
    pdf.setTextColor(15, 23, 42);
    pdf.text(formatDateTimeIndo(transaction.date), widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.2;

    pdf.setTextColor(71, 85, 105);
    pdf.text('Kasir    :', marginX, y);
    pdf.setTextColor(15, 23, 42);
    pdf.text(transaction.cashierName, widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.2;

    const custName = transaction.customerName || (
      transaction.customerType === 'anggota' ? 'Anggota Koperasi' :
      transaction.customerType === 'karyawan_rsud' ? 'Karyawan RSUD' :
      transaction.customerType === 'pasien' ? 'Pasien / Keluarga' : 'Pelanggan Umum'
    );
    pdf.setTextColor(71, 85, 105);
    pdf.text('Pelanggan:', marginX, y);
    pdf.setTextColor(15, 23, 42);
    pdf.text(custName, widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 5 : 3.5;

    // Divider Line
    pdf.line(marginX, y, widthMm - marginX, y);
    y += isA4 ? 5 : 3.5;

    // Item List
    transaction.items.forEach((item) => {
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(isA4 ? 8.5 : 7.2);
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.product.name, marginX, y);
      y += isA4 ? 3.8 : 2.8;

      pdf.setFont('courier', 'normal');
      pdf.setTextColor(71, 85, 105);
      const qtyText = `  ${item.quantity} ${item.product.unit} x ${formatRupiah(item.product.sellPrice)}`;
      const subtotalText = formatRupiah(item.subtotal);
      pdf.text(qtyText, marginX, y);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('courier', 'bold');
      pdf.text(subtotalText, widthMm - marginX, y, { align: 'right' });
      y += isA4 ? 4.2 : 3.2;

      if (item.discountNominal > 0) {
        pdf.setTextColor(220, 38, 38);
        pdf.setFont('courier', 'normal');
        pdf.text(`    (Diskon -${formatRupiah(item.discountNominal)})`, marginX, y);
        y += isA4 ? 3.8 : 2.8;
      }
    });

    // Divider Line
    pdf.setDrawColor(148, 163, 184);
    pdf.line(marginX, y, widthMm - marginX, y);
    y += isA4 ? 5 : 3.5;

    // Totals
    pdf.setFont('courier', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Total Item (${transaction.totalItems} pcs):`, marginX, y);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('courier', 'bold');
    pdf.text(formatRupiah(transaction.subtotal), widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.2;

    if (transaction.discountTotal > 0) {
      pdf.setTextColor(220, 38, 38);
      pdf.setFont('courier', 'bold');
      pdf.text('Potongan Diskon:', marginX, y);
      pdf.text(`-${formatRupiah(transaction.discountTotal)}`, widthMm - marginX, y, { align: 'right' });
      y += isA4 ? 4.5 : 3.2;
    }

    // Grand Total
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineDashPattern([], 0);
    pdf.line(marginX, y, widthMm - marginX, y);
    y += 2.5;

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(isA4 ? 10.5 : is80mm ? 9.5 : 8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('TOTAL AKHIR:', marginX, y);
    pdf.text(formatRupiah(transaction.grandTotal), widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 5 : 3.8;

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(isA4 ? 8.5 : 7.2);
    pdf.setTextColor(51, 65, 85);
    pdf.text('Metode Pembayaran:', marginX, y);
    pdf.setFont('courier', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(transaction.paymentMethod.toUpperCase(), widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.2;

    pdf.setFont('courier', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text('Tunai / Diterima:', marginX, y);
    pdf.text(formatRupiah(transaction.paymentAmount), widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.2;

    pdf.setFont('courier', 'bold');
    pdf.setTextColor(17, 94, 89); // teal-800
    pdf.text('Kembalian:', marginX, y);
    pdf.text(formatRupiah(transaction.changeAmount), widthMm - marginX, y, { align: 'right' });
    y += isA4 ? 6 : 4;

    // Divider Line (dashed)
    pdf.setDrawColor(148, 163, 184);
    pdf.setLineDashPattern([1.5, 1.5], 0);
    pdf.line(marginX, y, widthMm - marginX, y);
    y += isA4 ? 5 : 3.5;

    // Invoice Barcode Text representation
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(isA4 ? 9 : 7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`* ${transaction.invoiceNumber} *`, centerX, y, { align: 'center' });
    y += isA4 ? 5 : 3.5;

    // Footer
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(isA4 ? 8 : 6.5);
    pdf.setTextColor(71, 85, 105);
    const footerLines = pdf.splitTextToSize(coopConfig.receiptFooter, contentWidth);
    pdf.text(footerLines, centerX, y, { align: 'center' });
    y += (footerLines.length * 3) + 2;

    pdf.setFontSize(isA4 ? 7.5 : 5.8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Koperasi Amanah Baraya • RSUD Al-Mulk Sukabumi', centerX, y, { align: 'center' });

    pdf.save(`Struk_${transaction.invoiceNumber}.pdf`);
    return { success: true };
  } catch (err: any) {
    console.error('Vector PDF generation error:', err);
    return { success: false, error: err?.message || 'Gagal membuat file PDF struk.' };
  }
};

/**
 * Generate and download PDF for Sales Report (A4 Format)
 */
export const downloadSalesReportPdf = (
  title: string,
  periodText: string,
  summary: {
    totalRevenue: number;
    totalCOGS: number;
    totalGrossProfit: number;
    totalTransactions: number;
    totalItemsSold: number;
  },
  topProducts: Array<{ name: string; qty: number; revenue: number }>,
  transactions: Transaction[],
  coopConfig?: CoopConfig
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // Header Kop
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text((coopConfig?.name || 'KOPERASI AMANAH BARAYA').toUpperCase(), margin, y);
  y += 5;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(coopConfig?.hospitalName || 'RSUD AL-MULK KOTA SUKABUMI', margin, y);
  y += 8;

  // Divider Line
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Report Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(16, 185, 129); // emerald-500
  pdf.text(title.toUpperCase(), margin, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Periode: ${periodText} | Dicetak pada: ${formatDateTimeIndo(new Date().toISOString())}`, margin, y);
  y += 10;

  // Summary Metrics Box
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, 'D');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);

  pdf.text('TOTAL OMZET PENJUALAN', margin + 5, y + 6);
  pdf.text('TOTAL LABA KOTOR', margin + 65, y + 6);
  pdf.text('JUMLAH TRANSAKSI', margin + 125, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text(formatRupiah(summary.totalRevenue), margin + 5, y + 14);

  pdf.setTextColor(16, 185, 129);
  pdf.text(formatRupiah(summary.totalGrossProfit), margin + 65, y + 14);

  pdf.setTextColor(15, 23, 42);
  pdf.text(`${summary.totalTransactions} Trx (${summary.totalItemsSold} item)`, margin + 125, y + 14);

  y += 32;

  // Top Selling Products Section
  if (topProducts.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('PRODUK TERLARIS (TOP SELLING)', margin, y);
    y += 5;

    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    topProducts.slice(0, 5).forEach((p, idx) => {
      pdf.text(`${idx + 1}. ${p.name} - ${p.qty} terjual (${formatRupiah(p.revenue)})`, margin + 3, y);
      y += 4.5;
    });
    y += 4;
  }

  // Transactions Table Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('RINCIAN TRANSAKSI PENJUALAN KASIR', margin, y);
  y += 5;

  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  pdf.text('No. Faktur', margin + 2, y + 4.5);
  pdf.text('Waktu', margin + 35, y + 4.5);
  pdf.text('Pelanggan / Anggota', margin + 70, y + 4.5);
  pdf.text('Metode', margin + 115, y + 4.5);
  pdf.text('Total (Rp)', pageWidth - margin - 2, y + 4.5, { align: 'right' });
  y += 7;

  // Transactions Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);

  transactions.slice(0, 25).forEach((t) => {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(t.invoiceNumber, margin + 2, y + 4);
    pdf.text(formatDateTimeIndo(t.date).slice(0, 16), margin + 35, y + 4);
    pdf.text(t.customerName || t.customerType.toUpperCase(), margin + 70, y + 4);
    pdf.text(t.paymentMethod.toUpperCase(), margin + 115, y + 4);
    pdf.text(formatRupiah(t.grandTotal), pageWidth - margin - 2, y + 4, { align: 'right' });
    y += 5.5;
  });

  pdf.save(`Laporan_Penjualan_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generate and download PDF for SHU Report (A4 Format)
 */
export const downloadShuReportPdf = (
  periodYear: number | string,
  shuSummary: {
    labaToko: number;
    pendapatanJasaPinjaman: number;
    biayaOperasional: number;
    totalShuBersih: number;
    jasaModalAlloc: number;
    jasaUsahaAlloc: number;
    danaCadanganAlloc: number;
    danaPengurusAlloc: number;
  },
  memberShuList: Array<{
    memberNumber: string;
    name: string;
    unitKerja: string;
    totalSimpanan: number;
    shuModal: number;
    totalBelanja: number;
    shuUsaha: number;
    totalShu: number;
  }>,
  coopConfig?: CoopConfig
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // Header Kop
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text((coopConfig?.name || 'KOPERASI AMANAH BARAYA').toUpperCase(), margin, y);
  y += 5;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(coopConfig?.hospitalName || 'RSUD AL-MULK KOTA SUKABUMI', margin, y);
  y += 8;

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(16, 185, 129);
  pdf.text(`LAPORAN SISA HASIL USAHA (SHU) TAHUN ${periodYear}`, margin, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Dicetak pada: ${formatDateTimeIndo(new Date().toISOString())}`, margin, y);
  y += 10;

  // Summary Table
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, pageWidth - 2 * margin, 38, 3, 3, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, pageWidth - 2 * margin, 38, 3, 3, 'D');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);

  pdf.text('Laba Kotor Pertokoan/Kasir:', margin + 5, y + 6);
  pdf.text(formatRupiah(shuSummary.labaToko), margin + 85, y + 6);

  pdf.text('Pendapatan Jasa Pinjaman Anggota:', margin + 5, y + 12);
  pdf.text(formatRupiah(shuSummary.pendapatanJasaPinjaman), margin + 85, y + 12);

  pdf.text('Beban Operasional Koperasi:', margin + 5, y + 18);
  pdf.text(`- ${formatRupiah(shuSummary.biayaOperasional)}`, margin + 85, y + 18);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TOTAL SHU BERSIH:', margin + 5, y + 26);
  pdf.setTextColor(16, 185, 129);
  pdf.text(formatRupiah(shuSummary.totalShuBersih), margin + 85, y + 26);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Alokasi: Jasa Modal (40%): ${formatRupiah(shuSummary.jasaModalAlloc)} | Jasa Usaha (30%): ${formatRupiah(
      shuSummary.jasaUsahaAlloc
    )} | Cadangan (20%): ${formatRupiah(shuSummary.danaCadanganAlloc)}`,
    margin + 5,
    y + 33
  );

  y += 45;

  // Member SHU Allocation Table Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('PEMBAGIAN SHU ANGGOTA KOPERASI', margin, y);
  y += 5;

  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text('No. & Anggota', margin + 2, y + 4.5);
  pdf.text('Unit Kerja', margin + 55, y + 4.5);
  pdf.text('Simpanan (Rp)', margin + 95, y + 4.5);
  pdf.text('Belanja (Rp)', margin + 130, y + 4.5);
  pdf.text('Total SHU (Rp)', pageWidth - margin - 2, y + 4.5, { align: 'right' });
  y += 7;

  // Member rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(30, 41, 59);

  memberShuList.forEach((m, idx) => {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(`${idx + 1}. ${m.name} (${m.memberNumber})`, margin + 2, y + 4);
    pdf.text(m.unitKerja, margin + 55, y + 4);
    pdf.text(formatRupiah(m.totalSimpanan), margin + 95, y + 4);
    pdf.text(formatRupiah(m.totalBelanja), margin + 130, y + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(16, 185, 129);
    pdf.text(formatRupiah(m.totalShu), pageWidth - margin - 2, y + 4, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    y += 5.2;
  });

  pdf.save(`Laporan_SHU_Koperasi_${periodYear}.pdf`);
};

/**
 * Generate and download PDF for Stock Report (A4 Format)
 */
export const downloadStockReportPdf = (
  products: Product[],
  coopConfig?: CoopConfig
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // Header Kop
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text((coopConfig?.name || 'KOPERASI AMANAH BARAYA').toUpperCase(), margin, y);
  y += 5;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(coopConfig?.hospitalName || 'RSUD AL-MULK KOTA SUKABUMI', margin, y);
  y += 8;

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(16, 185, 129);
  pdf.text('LAPORAN PERSEDIAAN & VALUASI STOK BARANG', margin, y);
  y += 5;

  const totalBuyVal = products.reduce((sum, p) => sum + p.buyPrice * p.stock, 0);
  const totalSellVal = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Total: ${products.length} SKU Barang | Valuasi HPP Aset: ${formatRupiah(totalBuyVal)} | Estimasi Nilai Jual: ${formatRupiah(
      totalSellVal
    )}`,
    margin,
    y
  );
  y += 10;

  // Table Header
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('Kode & Nama Barang', margin + 2, y + 4.5);
  pdf.text('Kategori', margin + 65, y + 4.5);
  pdf.text('Stok', margin + 105, y + 4.5);
  pdf.text('HPP (Rp)', margin + 125, y + 4.5);
  pdf.text('Harga Jual (Rp)', margin + 150, y + 4.5);
  pdf.text('Nilai Aset (Rp)', pageWidth - margin - 2, y + 4.5, { align: 'right' });
  y += 7;

  // Product Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(30, 41, 59);

  products.forEach((p, idx) => {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
    const assetVal = p.buyPrice * p.stock;
    pdf.text(`${p.code} - ${p.name}`, margin + 2, y + 4);
    pdf.text(p.category, margin + 65, y + 4);
    pdf.text(`${p.stock} ${p.unit}`, margin + 105, y + 4);
    pdf.text(formatRupiah(p.buyPrice), margin + 125, y + 4);
    pdf.text(formatRupiah(p.sellPrice), margin + 150, y + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatRupiah(assetVal), pageWidth - margin - 2, y + 4, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    y += 5.2;
  });

  pdf.save(`Laporan_Stok_Barang_${new Date().toISOString().slice(0, 10)}.pdf`);
};


import React, { useRef, useState, useEffect } from 'react';
import { Transaction, CoopConfig } from '../../types';
import { formatRupiah, formatDateTimeIndo } from '../../utils/formatters';
import { BarcodeRenderer } from '../Barcode/BarcodeRenderer';
import {
  Printer,
  Download,
  Share2,
  X,
  RefreshCw,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Loader2,
  Copy,
} from 'lucide-react';
import { downloadReceiptPdfFromElement, ReceiptPaperSize } from '../../utils/pdfGenerator';
import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  isBluetoothSupported,
  getActiveBluetoothPrinter,
  generateEscPosReceipt,
  generateEscPosTest,
  printViaBluetooth,
  printViaBrowserNative,
  getRawBtPrintUrl,
} from '../../utils/escPosPrinter';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  coopConfig: CoopConfig;
  onNewTransaction?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  coopConfig,
  onNewTransaction,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  // Print & PDF states
  const [selectedPaperSize, setSelectedPaperSize] = useState<ReceiptPaperSize>('58mm');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Bluetooth Printer states
  const [bluetoothState, setBluetoothState] = useState(() => getActiveBluetoothPrinter());
  const [isConnectingBt, setIsConnectingBt] = useState<boolean>(false);

  // Auto print flag
  const hasAutoPrintedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setBluetoothState(getActiveBluetoothPrinter());
      // Set initial paper size from config
      if (coopConfig.paperWidth === '80mm') {
        setSelectedPaperSize('80mm');
      }

      // Auto print if configured and not yet triggered for this transaction
      if (
        coopConfig.printerConfig?.autoPrintOnPayment &&
        transaction &&
        !hasAutoPrintedRef.current
      ) {
        hasAutoPrintedRef.current = true;
        // Delay slightly for render
        const timer = setTimeout(() => {
          handleDirectPrint(false);
        }, 400);
        return () => clearTimeout(timer);
      }
    } else {
      hasAutoPrintedRef.current = false;
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  /**
   * Direct Print Handler:
   * Uses Bluetooth ESC/POS if connected, or browser thermal print engine
   */
  const handleDirectPrint = async (manualTrigger: boolean = true) => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      if (bluetoothState.connected) {
        // Direct Bluetooth ESC/POS print
        const escPosData = generateEscPosReceipt(
          transaction,
          coopConfig,
          selectedPaperSize === '80mm' ? '80mm' : '58mm'
        );
        const result = await printViaBluetooth(escPosData, printCopies);
        if (result.success) {
          showToast(`Struk berhasil dikirim ke printer Bluetooth (${printCopies}x)!`, 'success');
        } else {
          showToast(`Gagal cetak Bluetooth: ${result.error}. Beralih ke print browser...`, 'error');
          printViaBrowserNative('printable-thermal-receipt');
        }
      } else {
        // High-precision Browser Thermal Print
        printViaBrowserNative('printable-thermal-receipt');
        if (manualTrigger) {
          showToast('Kotak dialog cetak printer telah dibuka.', 'info');
        }
      }
    } catch (err: any) {
      console.error('Print error:', err);
      showToast('Terjadi kesalahan saat memproses cetak.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * PDF Download Handler
   */
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    showToast('Sedang membuat file PDF struk resolusi tinggi...', 'info');

    try {
      const result = await downloadReceiptPdfFromElement(
        'printable-thermal-receipt',
        transaction,
        selectedPaperSize,
        coopConfig
      );

      if (result.success) {
        showToast(`Struk PDF (${selectedPaperSize}) berhasil didownload!`, 'success');
      } else {
        showToast(`Gagal download PDF: ${result.error}`, 'error');
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      showToast('Gagal memproses pembuatan PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Pair / Connect Bluetooth Thermal Printer
   */
  const handleConnectBluetooth = async () => {
    setIsConnectingBt(true);
    try {
      const result = await connectBluetoothPrinter();
      setBluetoothState(getActiveBluetoothPrinter());
      if (result.success) {
        showToast(`Printer Bluetooth "${result.name}" berhasil terhubung!`, 'success');
      } else {
        showToast(result.error || 'Gagal menyambungkan Bluetooth.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal koneksi Bluetooth.', 'error');
    } finally {
      setIsConnectingBt(false);
    }
  };

  /**
   * Disconnect Bluetooth Printer
   */
  const handleDisconnectBluetooth = () => {
    disconnectBluetoothPrinter();
    setBluetoothState(getActiveBluetoothPrinter());
    showToast('Printer Bluetooth diputuskan.', 'info');
  };

  /**
   * Test Print Bluetooth Thermal Printer
   */
  const handleTestPrintBluetooth = async () => {
    if (!bluetoothState.connected) {
      showToast('Sambungkan printer Bluetooth terlebih dahulu.', 'error');
      return;
    }
    const testData = generateEscPosTest(coopConfig, selectedPaperSize === '80mm' ? '80mm' : '58mm');
    const result = await printViaBluetooth(testData, 1);
    if (result.success) {
      showToast('Cetak uji coba ESC/POS berhasil!', 'success');
    } else {
      showToast(result.error || 'Gagal cetak uji coba.', 'error');
    }
  };

  /**
   * Android RawBT Print trigger
   */
  const handleRawBtPrint = () => {
    const escPosData = generateEscPosReceipt(
      transaction,
      coopConfig,
      selectedPaperSize === '80mm' ? '80mm' : '58mm'
    );
    const rawBtUrl = getRawBtPrintUrl(escPosData);
    window.location.href = rawBtUrl;
    showToast('Membuka aplikasi RawBT Driver...', 'info');
  };

  /**
   * Copy Plain Text Receipt for WhatsApp / Telegram
   */
  const handleCopyTextReceipt = () => {
    const textLines = [
      `*${coopConfig.name}*`,
      `*${coopConfig.hospitalName}*`,
      coopConfig.address,
      `Telp: ${coopConfig.phone}`,
      '----------------------------------------',
      `No. Struk : ${transaction.invoiceNumber}`,
      `Tanggal   : ${formatDateTimeIndo(transaction.date)}`,
      `Kasir     : ${transaction.cashierName}`,
      `Pelanggan : ${transaction.customerName || (
        transaction.customerType === 'anggota' ? 'Anggota Koperasi' :
        transaction.customerType === 'karyawan_rsud' ? 'Karyawan RSUD' :
        transaction.customerType === 'pasien' ? 'Pasien / Keluarga' : 'Pelanggan Umum'
      )}`,
      '----------------------------------------',
      ...transaction.items.map((item) => {
        const itemLine = `${item.product.name}\n  ${item.quantity} ${item.product.unit} x ${formatRupiah(item.product.sellPrice)}${item.discountNominal > 0 ? ` (Disc -${formatRupiah(item.discountNominal)})` : ''} = ${formatRupiah(item.subtotal)}`;
        return itemLine;
      }),
      '----------------------------------------',
      `Subtotal   : ${formatRupiah(transaction.subtotal)}`,
      transaction.discountTotal > 0 ? `Diskon     : -${formatRupiah(transaction.discountTotal)}` : null,
      `*TOTAL     : ${formatRupiah(transaction.grandTotal)}*`,
      `Metode     : ${transaction.paymentMethod.toUpperCase()}`,
      `Bayar      : ${formatRupiah(transaction.paymentAmount)}`,
      `Kembalian  : ${formatRupiah(transaction.changeAmount)}`,
      '----------------------------------------',
      coopConfig.receiptFooter,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textLines).then(() => {
      showToast('Teks struk berhasil disalin (siap kirim WhatsApp)!', 'success');
    });
  };

  const receiptWidthClass =
    selectedPaperSize === '80mm' ? 'max-w-[420px]' : selectedPaperSize === 'A4' ? 'max-w-[480px]' : 'max-w-[340px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm print:p-0 print:bg-white animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Top Header Toolbar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-900 text-white flex items-center justify-between print:hidden border-b border-teal-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-teal-500/20 rounded-lg border border-teal-400/30 text-teal-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base leading-none">Struk Pembayaran</span>
                {bluetoothState.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <Bluetooth className="w-3 h-3" />
                    {bluetoothState.name || 'BT Printer'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    <Printer className="w-3 h-3 text-slate-400" />
                    Thermal / Browser
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-200/80 mt-0.5">
                No. Nota: <span className="font-mono font-bold text-white">{transaction.invoiceNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              id="btn-toggle-printer-settings"
              onClick={() => setShowPrinterSettings(!showPrinterSettings)}
              className={`p-2 rounded-xl transition text-xs font-semibold flex items-center gap-1 ${
                showPrinterSettings
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-teal-200 hover:text-white hover:bg-white/10'
              }`}
              title="Pengaturan Printer & Ukuran Kertas"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Expandable Printer & Paper Options Bar */}
        {showPrinterSettings && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-xs space-y-3 print:hidden animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Paper Format Selector */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Format Kertas:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-700">
                  {(['58mm', '80mm', 'A4'] as ReceiptPaperSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedPaperSize(size)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                        selectedPaperSize === size
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {size === '58mm' ? '58mm (Mini Roll)' : size === '80mm' ? '80mm (Lebar)' : 'Slip A4'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Copies */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Rangkap:</span>
                <select
                  value={printCopies}
                  onChange={(e) => setPrintCopies(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none"
                >
                  <option value={1}>1x (Kasir)</option>
                  <option value={2}>2x (Kasir + Arsip)</option>
                  <option value={3}>3x</option>
                </select>
              </div>
            </div>

            {/* Bluetooth Direct Connection Controls */}
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Bluetooth className={`w-4 h-4 ${bluetoothState.connected ? 'text-emerald-500' : 'text-blue-500'}`} />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Koneksi Bluetooth Direct:</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                    {bluetoothState.connected
                      ? `Terhubung: ${bluetoothState.name}`
                      : isBluetoothSupported()
                      ? 'Dukungan Web Bluetooth aktif'
                      : 'Gunakan Chrome di Android/PC'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {bluetoothState.connected ? (
                  <>
                    <button
                      onClick={handleTestPrintBluetooth}
                      className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 rounded-lg font-bold hover:bg-teal-100 transition text-[11px]"
                    >
                      Tes Cetak
                    </button>
                    <button
                      onClick={handleDisconnectBluetooth}
                      className="px-2.5 py-1 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-lg font-semibold hover:bg-red-100 transition text-[11px]"
                    >
                      Putuskan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectBluetooth}
                    disabled={isConnectingBt}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition text-[11px] shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {isConnectingBt ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bluetooth className="w-3.5 h-3.5" />
                    )}
                    <span>Sambungkan Printer BT</span>
                  </button>
                )}

                {/* RawBT Mobile Android option */}
                <button
                  onClick={handleRawBtPrint}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg font-medium transition text-[11px] flex items-center gap-1"
                  title="Kirim ke Android RawBT Print Driver"
                >
                  <Smartphone className="w-3 h-3 text-slate-500" />
                  <span>RawBT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center space-x-2 print:hidden ${
              toastMessage.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-b border-emerald-300'
                : toastMessage.type === 'error'
                ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 border-b border-red-300'
                : 'bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200 border-b border-teal-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Printable Thermal Receipt Box Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/70 dark:bg-slate-950 flex justify-center print:bg-white print:p-0">
          <div
            ref={receiptRef}
            id="printable-thermal-receipt"
            className={`w-full ${receiptWidthClass} bg-white text-slate-900 p-5 sm:p-6 rounded-xl shadow-lg border border-slate-300/80 print:shadow-none print:border-none font-mono text-[12px] leading-relaxed select-text shrink-0 h-fit transition-all duration-200`}
          >
            {/* Kop Koperasi RSUD Al-Mulk */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              {coopConfig.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={coopConfig.logoUrl}
                    alt="Logo"
                    className="max-h-12 max-w-[120px] object-contain"
                  />
                </div>
              )}
              <h2 className="font-black text-[13px] tracking-tight uppercase leading-snug">
                {coopConfig.name}
              </h2>
              <p className="font-extrabold text-[12px] text-teal-900 uppercase mt-0.5">
                {coopConfig.hospitalName}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight mt-1">
                {coopConfig.address}
              </p>
              <p className="text-[10px] text-slate-600">
                Telp: {coopConfig.phone}
              </p>
            </div>

            {/* Metadata Info */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Nota:</span>
                <span className="font-bold text-slate-950">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Waktu:</span>
                <span>{formatDateTimeIndo(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kasir:</span>
                <span className="font-semibold text-slate-800">{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pelanggan:</span>
                <span className="font-semibold text-slate-800">
                  {transaction.customerName || (
                    transaction.customerType === 'anggota' ? 'Anggota Koperasi' :
                    transaction.customerType === 'karyawan_rsud' ? 'Karyawan RSUD' :
                    transaction.customerType === 'pasien' ? 'Pasien / Keluarga' : 'Pelanggan Umum'
                  )}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {item.product.name}
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px] pl-2">
                    <span>
                      {item.quantity} {item.product.unit} x {formatRupiah(item.product.sellPrice)}
                      {item.discountNominal > 0 && (
                        <span className="text-red-600 text-[10px] ml-1 font-semibold">
                          (disc -{formatRupiah(item.discountNominal)})
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-slate-950">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Item ({transaction.totalItems} pcs):</span>
                <span className="font-semibold">{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discountTotal > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Potongan Diskon:</span>
                  <span>-{formatRupiah(transaction.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-[13px] text-slate-950 pt-1.5 border-t border-slate-300">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(transaction.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>Metode Pembayaran:</span>
                <span className="font-bold uppercase text-slate-900">{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Tunai / Diterima:</span>
                <span className="font-medium">{formatRupiah(transaction.paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-teal-800 font-extrabold text-[12px]">
                <span>Kembalian:</span>
                <span>{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                <BarcodeRenderer
                  value={transaction.invoiceNumber}
                  height={30}
                  width={1.2}
                  fontSize={10}
                  margin={2}
                />
              </div>
              <p className="text-[10px] text-slate-600 whitespace-pre-line leading-tight">
                {coopConfig.receiptFooter}
              </p>
              <p className="text-[9px] text-slate-400 pt-1">
                Koperasi Amanah Baraya &bull; RSUD Al-Mulk Sukabumi
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar (Hidden on print) */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2.5 print:hidden">
          {/* Primary Print & PDF Download Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Direct Thermal Print Button */}
            <button
              id="btn-print-receipt-direct"
              onClick={() => handleDirectPrint(true)}
              disabled={isPrinting}
              className="col-span-1 sm:col-span-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Cetak Struk</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="btn-download-receipt-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="col-span-1 sm:col-span-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh PDF</span>
            </button>

            {/* Copy Text for WhatsApp */}
            <button
              id="btn-copy-receipt"
              onClick={handleCopyTextReceipt}
              className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Salin Teks</span>
            </button>
          </div>

          {/* New Transaction Button */}
          {onNewTransaction && (
            <button
              id="btn-new-transaction"
              onClick={() => {
                onClose();
                onNewTransaction();
              }}
              className="w-full py-2.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-bold rounded-xl border border-teal-200 dark:border-teal-800/60 transition flex items-center justify-center space-x-2 text-xs shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Selesai & Lanjut Transaksi Kasir Baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

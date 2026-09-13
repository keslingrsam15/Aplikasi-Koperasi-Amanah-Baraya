import React, { useState } from 'react';
import { Transaction, CoopConfig } from '../../types';
import { formatRupiah, formatDateTimeIndo } from '../../utils/formatters';
import {
  X,
  Printer,
  Receipt,
  Clock,
  User,
  CreditCard,
  Package,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { BarcodeRenderer } from '../Barcode/BarcodeRenderer';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  coopConfig: CoopConfig;
  onOpenReceiptModal: (trx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  coopConfig,
  onOpenReceiptModal,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'receipt'>('receipt');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !transaction) return null;

  const handleCopySummary = () => {
    const lines = [
      `*** NOTA TRANSAKSI KOPERASI ***`,
      `${coopConfig.name}`,
      `No. Struk: ${transaction.invoiceNumber}`,
      `Tanggal: ${formatDateTimeIndo(transaction.date)}`,
      `Kasir: ${transaction.cashierName}`,
      `Pelanggan: ${transaction.customerName || transaction.customerType.toUpperCase()}`,
      `--------------------------------`,
      ...transaction.items.map(
        (i) => `${i.product.name} x${i.quantity} = ${formatRupiah(i.subtotal)}`
      ),
      `--------------------------------`,
      `Total: ${formatRupiah(transaction.grandTotal)}`,
      `Metode: ${transaction.paymentMethod.toUpperCase()}`,
      `Tunai: ${formatRupiah(transaction.paymentAmount)}`,
      `Kembali: ${formatRupiah(transaction.changeAmount)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Riwayat Transaksi & Struk
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lunas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {transaction.invoiceNumber} &bull; {formatDateTimeIndo(transaction.date)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenReceiptModal(transaction)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Buka Cetak Struk Asli"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Struk Asli</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('receipt')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'receipt'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Tampilan Struk Pembelian Asli</span>
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'detail'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Detail Riwayat & Item Transaksi</span>
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 mb-2 px-2 py-1 rounded-md hover:bg-slate-200/60 transition"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: EXACT RECEIPT VIEW (TAMPILAN STRUK PEMBELIAN ASLI) */}
          {activeTab === 'receipt' && (
            <div className="flex flex-col items-center">
              {/* Thermal Paper Look-alike Container */}
              <div className="w-full max-w-sm bg-white p-5 rounded-2xl border-2 border-dashed border-slate-300 shadow-lg text-slate-800 font-mono text-xs space-y-3">
                {/* Header Koperasi */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                  <h4 className="font-extrabold text-sm tracking-tight text-slate-900">
                    {coopConfig.name}
                  </h4>
                  <p className="text-[10px] text-slate-500">{coopConfig.subtitle}</p>
                  <p className="text-[10px] text-slate-500">{coopConfig.hospitalName}</p>
                  <p className="text-[10px] text-slate-500">{coopConfig.address}</p>
                  <p className="text-[10px] text-slate-500">Telp: {coopConfig.phone}</p>
                </div>

                {/* Info Transaksi */}
                <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Struk:</span>
                    <span className="font-bold text-slate-900">{transaction.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu:</span>
                    <span>{formatDateTimeIndo(transaction.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kasir:</span>
                    <span>{transaction.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan:</span>
                    <span className="font-semibold">
                      {transaction.customerName ||
                        (transaction.customerType === 'member' ? 'Anggota Koperasi' : 'Pelanggan Umum')}
                      {transaction.memberNumber ? ` (${transaction.memberNumber})` : ''}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 pb-3 border-b border-dashed border-slate-300">
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>
                          {item.quantity} x {formatRupiah(item.price)}
                          {item.discount && item.discount > 0 ? ` (disc ${formatRupiah(item.discount)})` : ''}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Totals */}
                <div className="space-y-1.5 text-[11px] pb-3 border-b border-dashed border-slate-300">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(transaction.subtotal)}</span>
                  </div>

                  {transaction.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Total Diskon:</span>
                      <span>-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}

                  {transaction.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>PPN:</span>
                      <span>{formatRupiah(transaction.tax)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(transaction.grandTotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Metode Bayar:</span>
                    <span className="font-bold uppercase text-slate-800">
                      {transaction.paymentMethod === 'cash'
                        ? 'Tunai'
                        : transaction.paymentMethod === 'qris'
                        ? 'QRIS'
                        : transaction.paymentMethod === 'transfer'
                        ? 'Transfer Bank'
                        : 'Potong Gaji'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Bayar (Tunai/Non-Tunai):</span>
                    <span>{formatRupiah(transaction.paymentAmount)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Kembali:</span>
                    <span>{formatRupiah(transaction.changeAmount)}</span>
                  </div>
                </div>

                {/* Footer Notes & Barcode */}
                <div className="text-center space-y-2 pt-1 text-[10px] text-slate-500">
                  <p className="whitespace-pre-line leading-relaxed">
                    {coopConfig.receiptFooter || 'Terima kasih atas kunjungan Anda.'}
                  </p>

                  <div className="pt-2 flex flex-col items-center justify-center">
                    <BarcodeRenderer
                      value={transaction.invoiceNumber}
                      height={28}
                      displayValue={false}
                      className="max-w-[180px]"
                    />
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {transaction.invoiceNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED AUDIT / ITEM BREAKDOWN */}
          {activeTab === 'detail' && (
            <div className="space-y-4 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Kasir Pelaksana</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>{transaction.cashierName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">ID: {transaction.cashierId || '-'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pelanggan</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 truncate">
                    {transaction.customerName || (transaction.customerType === 'member' ? 'Anggota RSUD' : 'Umum')}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Tipe: {transaction.customerType.toUpperCase()}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimasi Laba Kotor</span>
                  <div className="font-bold text-emerald-600 text-sm font-mono mt-0.5">
                    +{formatRupiah(transaction.totalProfit || 0)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    HPP: {formatRupiah(transaction.totalCost || 0)}
                  </span>
                </div>
              </div>

              {/* Table of items */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100/80 px-3.5 py-2 font-bold text-slate-700 text-xs border-b border-slate-200 flex items-center justify-between">
                  <span>Daftar Barang Dibeli ({transaction.totalItems} unit)</span>
                  <span className="font-mono text-teal-700 font-bold">{formatRupiah(transaction.grandTotal)}</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                      <th className="py-2 px-3 text-right">Est. Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transaction.items.map((item, i) => {
                      const itemCost = (item.product.costPrice || 0) * item.quantity;
                      const itemProfit = item.subtotal - itemCost;
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.product.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.product.code}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            {item.quantity} {item.product.unit || 'pcs'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatRupiah(item.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600">
                            +{formatRupiah(itemProfit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {transaction.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold text-[11px] block">Catatan Transaksi:</span>
                  <p className="text-xs mt-0.5">{transaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Dokumen sah transaksi kasir terintegrasi.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenReceiptModal(transaction);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Layar Cetak / Struk Penuh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

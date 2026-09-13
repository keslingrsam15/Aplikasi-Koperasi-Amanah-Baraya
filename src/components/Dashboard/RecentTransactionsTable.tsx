import React, { useState, useMemo } from 'react';
import { Transaction, CoopConfig } from '../../types';
import { formatRupiah, formatDateTimeIndo } from '../../utils/formatters';
import {
  Receipt,
  Printer,
  Eye,
  Search,
  ChevronRight,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  UserCheck,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { TransactionDetailModal } from './TransactionDetailModal';

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  coopConfig: CoopConfig;
  onNavigateToReports: () => void;
  onViewReceipt: (transaction: Transaction) => void;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  transactions,
  coopConfig,
  onNavigateToReports,
  onViewReceipt,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedTrxDetail, setSelectedTrxDetail] = useState<Transaction | null>(null);
  const [maxRows, setMaxRows] = useState<number>(6);

  // Filter & sort transactions (newest first)
  const sortedFilteredTransactions = useMemo(() => {
    let list = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.invoiceNumber.toLowerCase().includes(q) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          t.cashierName.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q)
      );
    }

    return list;
  }, [transactions, search]);

  const displayList = sortedFilteredTransactions.slice(0, maxRows);

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3 h-3" />
            <span>Tunai</span>
          </span>
        );
      case 'qris':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <QrCode className="w-3 h-3" />
            <span>QRIS</span>
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Building className="w-3 h-3" />
            <span>Transfer</span>
          </span>
        );
      case 'payroll_deduction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <CreditCard className="w-3 h-3" />
            <span>Potong Gaji</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            <span>{method.toUpperCase()}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-white/80 shadow-[8px_8px_20px_rgba(203,213,225,0.5),-8px_-8px_20px_rgba(255,255,255,0.95)] border-b-4 border-b-cyan-500 space-y-4">
      {/* Header with Title and Link to full reports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-200 shadow-xs">
              <Receipt className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight">
              Transaksi Nota Terbaru
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 font-mono">
              {transactions.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik nomor struk atau tombol untuk melihat rincian nota belanja asli
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no. struk / nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 w-44 sm:w-52"
            />
          </div>

          <button
            onClick={onNavigateToReports}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 whitespace-nowrap pl-1"
          >
            <span>Rekap Semua</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">No. Struk</th>
              <th className="py-3 px-3">Waktu Transaksi</th>
              <th className="py-3 px-3">Pelanggan</th>
              <th className="py-3 px-3">Metode</th>
              <th className="py-3 px-3 text-right">Total Belanja</th>
              <th className="py-3 px-3.5 text-center">Aksi / Struk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold">
                    {search ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada riwayat transaksi penjualan.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Transaksi dari menu Kasir akan otomatis muncul secara seketika di tabel ini.
                  </p>
                </td>
              </tr>
            ) : (
              displayList.map((trx) => (
                <tr
                  key={trx.id}
                  onClick={() => setSelectedTrxDetail(trx)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* No Struk */}
                  <td className="py-3 px-3.5 font-mono font-bold text-teal-700">
                    <span className="group-hover:underline flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{trx.invoiceNumber}</span>
                    </span>
                  </td>

                  {/* Waktu */}
                  <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {formatDateTimeIndo(trx.date)}
                  </td>

                  {/* Pelanggan */}
                  <td className="py-3 px-3 font-medium">
                    <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                      {trx.customerType === 'member' ? (
                        <span className="p-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold shrink-0">
                          Anggota
                        </span>
                      ) : (
                        <span className="p-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold shrink-0">
                          Umum
                        </span>
                      )}
                      <span className="truncate text-slate-800 font-semibold">
                        {trx.customerName || (trx.customerType === 'member' ? 'Anggota Koperasi' : 'Pelanggan')}
                      </span>
                    </div>
                  </td>

                  {/* Metode Pembayaran */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getPaymentMethodBadge(trx.paymentMethod)}
                  </td>

                  {/* Total Belanja */}
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 text-xs">
                    {formatRupiah(trx.grandTotal)}
                  </td>

                  {/* Aksi: Struk Pop Up */}
                  <td
                    className="py-3 px-3.5 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      {/* Tombol Lihat Struk (Persis seperti struk pembelian asli) */}
                      <button
                        id={`btn-struk-${trx.id}`}
                        onClick={() => onViewReceipt(trx)}
                        className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white rounded-xl text-[11px] font-bold border border-teal-200 hover:border-teal-600 transition flex items-center gap-1 shadow-xs"
                        title="Buka Struk Pembelian (Thermal Slip / Cetak)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Lihat Struk</span>
                      </button>

                      {/* Tombol Riwayat Detail Transaksi */}
                      <button
                        id={`btn-detail-${trx.id}`}
                        onClick={() => setSelectedTrxDetail(trx)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="Lihat Riwayat & Rincian Lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls: Show More / Show Less */}
      {sortedFilteredTransactions.length > 6 && (
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-500">
            Menampilkan {displayList.length} dari {sortedFilteredTransactions.length} transaksi
          </span>

          <div className="flex items-center gap-2">
            {maxRows < sortedFilteredTransactions.length ? (
              <button
                onClick={() => setMaxRows((prev) => Math.min(prev + 10, sortedFilteredTransactions.length))}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
              >
                Muat Lebih Banyak (+10)
              </button>
            ) : (
              <button
                onClick={() => setMaxRows(6)}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition"
              >
                Tampilkan Lebih Sedikit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pop Up Detail Riwayat Transaksi & Struk */}
      <TransactionDetailModal
        isOpen={!!selectedTrxDetail}
        onClose={() => setSelectedTrxDetail(null)}
        transaction={selectedTrxDetail}
        coopConfig={coopConfig}
        onOpenReceiptModal={(trx) => {
          onViewReceipt(trx);
        }}
      />
    </div>
  );
};

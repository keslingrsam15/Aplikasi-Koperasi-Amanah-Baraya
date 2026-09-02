import React, { useState } from 'react';
import { Member, SavingsRecord, LoanRecord, Transaction } from '../../types';
import { formatRupiah, formatDateTimeIndo, formatDateIndo, exportToCSV } from '../../utils/formatters';
import {
  X,
  User,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  PiggyBank,
  Wallet,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  savingsRecords: SavingsRecord[];
  loanRecords: LoanRecord[];
  transactions: Transaction[];
  onOpenNewSavings?: (member: Member, type: 'setor' | 'tarik') => void;
  onOpenNewLoan?: (member: Member) => void;
  onOpenPayInstallment?: (loan: LoanRecord) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  savingsRecords,
  loanRecords,
  transactions,
  onOpenNewSavings,
  onOpenNewLoan,
  onOpenPayInstallment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'savings' | 'loans' | 'transactions'>('savings');

  if (!isOpen || !member) return null;

  // Filter member-specific records
  const memberSavings = savingsRecords
    .filter((s) => s.memberId === member.id || s.memberNumber === member.memberNumber)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const memberLoans = loanRecords
    .filter((l) => l.memberId === member.id || l.memberNumber === member.memberNumber)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const memberTransactions = transactions
    .filter(
      (t) =>
        t.memberId === member.id ||
        t.memberNumber === member.memberNumber ||
        (t.customerName && t.customerName.toLowerCase() === member.name.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics
  const totalSimpanan = member.simpananPokok + member.simpananWajib + member.simpananSukarela;
  const activeLoans = memberLoans.filter((l) => l.status === 'active');
  const totalSisaPinjaman = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalBelanjaToko = memberTransactions.reduce((sum, t) => sum + t.grandTotal, 0);

  // Export Member Statement CSV
  const handleExportStatementCSV = () => {
    const headers = ['Kategori', 'No. Bukti / Faktur', 'Tanggal', 'Jenis / Deskripsi', 'Nominal (Rp)', 'Keterangan'];
    const rows: (string | number)[][] = [];

    // Savings rows
    memberSavings.forEach((s) => {
      rows.push([
        'Simpanan',
        s.receiptNumber || s.id,
        formatDateTimeIndo(s.date),
        `${s.transactionType.toUpperCase()} - Simpanan ${s.type}`,
        s.amount,
        s.notes || '-',
      ]);
    });

    // Loan rows
    memberLoans.forEach((l) => {
      rows.push([
        'Pinjaman',
        l.loanNumber,
        formatDateIndo(l.startDate),
        `Pinjaman Pokok (${l.tenorMonths} Bln - Status: ${l.status})`,
        l.amount,
        `Sisa: ${formatRupiah(l.remainingAmount)} | ${l.purpose}`,
      ]);
    });

    // POS Transactions rows
    memberTransactions.forEach((t) => {
      rows.push([
        'Belanja POS',
        t.invoiceNumber,
        formatDateTimeIndo(t.date),
        `Belanja Toko (${t.paymentMethod.toUpperCase()})`,
        t.grandTotal,
        `${t.totalItems} item barang`,
      ]);
    });

    exportToCSV(`Buku_Anggota_${member.memberNumber}_${member.name.replace(/\s+/g, '_')}.csv`, [
      ['BUKU REKENING ANGGOTA KOPERASI AMANAH BARAYA - RSUD AL-MULK'],
      ['Nomor Anggota', member.memberNumber],
      ['Nama Anggota', member.name],
      ['Unit Kerja', member.unitKerja],
      ['Total Simpanan Saat Ini', totalSimpanan],
      ['Sisa Piutang Pinjaman', totalSisaPinjaman],
      ['Total Belanja Toko', totalBelanjaToko],
      [],
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Profil Anggota */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-200 hover:text-white hover:bg-emerald-700/60 rounded-xl transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white shrink-0 shadow-inner">
                {member.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">{member.name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      member.status === 'active'
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    {member.status === 'active' ? 'Anggota Aktif' : 'Non-Aktif'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-emerald-200/90 font-medium">
                  <span className="font-mono bg-emerald-950/50 px-2 py-0.5 rounded-md font-bold text-white">
                    {member.memberNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                    {member.unitKerja}
                  </span>
                  {member.nikOrNip && (
                    <span>NIP: {member.nikOrNip}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    Gabung: {formatDateIndo(member.joinDate)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportStatementCSV}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition self-stretch sm:self-auto justify-center"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Buku Anggota</span>
            </button>
          </div>

          {/* Metric Bar Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-700/60">
            <div className="bg-emerald-950/40 border border-emerald-700/40 p-3 rounded-2xl">
              <div className="text-[11px] text-emerald-200/80 font-medium flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-emerald-300" />
                <span>Total Saldo Simpanan</span>
              </div>
              <div className="text-base sm:text-lg font-black text-white mt-1">
                {formatRupiah(totalSimpanan)}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5 flex items-center gap-2">
                <span>P: {formatRupiah(member.simpananPokok)}</span>
                <span>•</span>
                <span>W: {formatRupiah(member.simpananWajib)}</span>
                <span>•</span>
                <span>S: {formatRupiah(member.simpananSukarela)}</span>
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-700/40 p-3 rounded-2xl">
              <div className="text-[11px] text-emerald-200/80 font-medium flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>Sisa Piutang Pinjaman</span>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-200 mt-1">
                {formatRupiah(totalSisaPinjaman)}
              </div>
              <div className="text-[10px] text-emerald-200/80 mt-0.5">
                {activeLoans.length > 0
                  ? `${activeLoans.length} Pinjaman Berjalan`
                  : 'Tidak ada pinjaman aktif'}
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-700/40 p-3 rounded-2xl">
              <div className="text-[11px] text-emerald-200/80 font-medium flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-cyan-300" />
                <span>Total Belanja Toko / POS</span>
              </div>
              <div className="text-base sm:text-lg font-black text-cyan-100 mt-1">
                {formatRupiah(totalBelanjaToko)}
              </div>
              <div className="text-[10px] text-emerald-200/80 mt-0.5">
                {memberTransactions.length} kali transaksi belanja kasir
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('savings')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeSubTab === 'savings'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>Riwayat Simpanan ({memberSavings.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('loans')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeSubTab === 'loans'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Riwayat Pinjaman ({memberLoans.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeSubTab === 'transactions'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Belanja Kasir / POS ({memberTransactions.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white space-y-4">
          {/* 1. Riwayat Simpanan */}
          {activeSubTab === 'savings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Histori Mutasi Simpanan</h4>
                  <p className="text-xs text-slate-500">
                    Catatan setoran & penarikan simpanan pokok, wajib, dan sukarela
                  </p>
                </div>

                {onOpenNewSavings && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenNewSavings(member, 'setor')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1"
                    >
                      <span>+ Setor Simpanan</span>
                    </button>
                    <button
                      onClick={() => onOpenNewSavings(member, 'tarik')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1"
                    >
                      <span>- Tarik Sukarela</span>
                    </button>
                  </div>
                )}
              </div>

              {memberSavings.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <PiggyBank className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Belum ada catatan mutasi simpanan</p>
                  <p className="text-[11px] text-slate-400">
                    Gunakan tombol setor di atas untuk mencatat setoran simpanan anggota.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3">Tanggal & Waktu</th>
                        <th className="p-3">Jenis Mutasi</th>
                        <th className="p-3">Jenis Simpanan</th>
                        <th className="p-3 text-right">Nominal</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3">Petugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberSavings.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-medium text-slate-700">
                            {formatDateTimeIndo(s.date)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                s.transactionType === 'setor'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {s.transactionType === 'setor' ? 'Setoran (+)' : 'Penarikan (-)'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800 uppercase">
                            Simpanan {s.type}
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              s.transactionType === 'setor' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {s.transactionType === 'setor' ? '+' : '-'} {formatRupiah(s.amount)}
                          </td>
                          <td className="p-3 text-slate-600">{s.notes || '-'}</td>
                          <td className="p-3 text-slate-500">{s.operator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. Riwayat Pinjaman */}
          {activeSubTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Daftar Pengajuan & Pinjaman Anggota</h4>
                  <p className="text-xs text-slate-500">
                    Riwayat pinjaman, plafon dana, tenor, sisa angsuran dan status pelunasan
                  </p>
                </div>

                {onOpenNewLoan && (
                  <button
                    onClick={() => onOpenNewLoan(member)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1"
                  >
                    <span>+ Ajukan Pinjaman</span>
                  </button>
                )}
              </div>

              {memberLoans.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Belum ada pengajuan pinjaman</p>
                  <p className="text-[11px] text-slate-400">
                    Anggota ini belum memiliki riwayat pengajuan pinjaman di koperasi.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberLoans.map((loan) => {
                    const percentPaid =
                      loan.totalRepayment > 0
                        ? Math.min(100, Math.round((loan.totalPaid / loan.totalRepayment) * 100))
                        : 0;

                    return (
                      <div
                        key={loan.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg text-xs">
                              {loan.loanNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                loan.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : loan.status === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : loan.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {loan.status === 'paid'
                                ? 'Lunas'
                                : loan.status === 'active'
                                ? 'Pinjaman Berjalan'
                                : loan.status === 'pending'
                                ? 'Menunggu Persetujuan'
                                : 'Ditolak'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Tujuan: {loan.purpose}
                            </span>
                          </div>

                          {loan.status === 'active' && onOpenPayInstallment && (
                            <button
                              onClick={() => onOpenPayInstallment(loan)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
                            >
                              Bayar Angsuran
                            </button>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Plafon Pokok:</span>
                            <span className="font-bold text-slate-800">{formatRupiah(loan.amount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Tenor & Jasa:</span>
                            <span className="font-bold text-slate-800">
                              {loan.tenorMonths} Bulan ({loan.interestRate}%/bln)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Angsuran / Bln:</span>
                            <span className="font-bold text-slate-800">
                              {formatRupiah(loan.monthlyInstallment)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Sisa Piutang:</span>
                            <span className="font-bold text-rose-600">
                              {formatRupiah(loan.remainingAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Visual Pelunasan */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Progres Pelunasan</span>
                            <span className="text-emerald-700">
                              {percentPaid}% ({formatRupiah(loan.totalPaid)} / {formatRupiah(loan.totalRepayment)})
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                percentPaid >= 100
                                  ? 'bg-emerald-600'
                                  : percentPaid >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Riwayat Belanja Kasir / POS */}
          {activeSubTab === 'transactions' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Riwayat Belanja di Toko Koperasi</h4>
                <p className="text-xs text-slate-500">
                  Semua transaksi kasir anggota (tunai, qris, transfer, maupun potong gaji)
                </p>
              </div>

              {memberTransactions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Belum ada riwayat transaksi belanja</p>
                  <p className="text-[11px] text-slate-400">
                    Transaksi yang dilakukan anggota di kasir POS akan otomatis tercatat di sini.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3">No. Faktur</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Metode Bayar</th>
                        <th className="p-3">Item Barang</th>
                        <th className="p-3 text-right">Total Belanja</th>
                        <th className="p-3">Kasir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {trx.invoiceNumber}
                          </td>
                          <td className="p-3 text-slate-600">{formatDateTimeIndo(trx.date)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                trx.paymentMethod === 'potong_gaji'
                                  ? 'bg-purple-100 text-purple-800'
                                  : trx.paymentMethod === 'qris'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {trx.paymentMethod === 'potong_gaji' ? 'Potong Gaji' : trx.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {trx.items.map((it) => `${it.product.name} (${it.quantity}x)`).join(', ')}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatRupiah(trx.grandTotal)}
                          </td>
                          <td className="p-3 text-slate-500">{trx.cashierName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Member, LoanRecord, LoanStatus } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { calculateLoanInstallmentProgress } from '../../utils/loanCalculator';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  PlusCircle,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Calculator,
  X,
  Save,
  Check,
  Building2,
} from 'lucide-react';

interface LoanManagementProps {
  members: Member[];
  loans: LoanRecord[];
  onAddLoan: (loan: LoanRecord) => void;
  onUpdateLoan: (loan: LoanRecord) => void;
  currentUser: { name: string };
  initialSelectedMember?: Member | null;
  initialLoanToPay?: LoanRecord | null;
  onClearInitialAction?: () => void;
}

export const LoanManagement: React.FC<LoanManagementProps> = ({
  members,
  loans,
  onAddLoan,
  onUpdateLoan,
  currentUser,
  initialSelectedMember,
  initialLoanToPay,
  onClearInitialAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoanStatus>('ALL');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(!!initialLoanToPay);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanRecord | null>(
    initialLoanToPay || null
  );

  // New Loan Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialSelectedMember?.id || (members[0]?.id ?? '')
  );
  const [amount, setAmount] = useState<number>(5000000);
  const [tenorMonths, setTenorMonths] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(1.0); // 1% per month
  const [purpose, setPurpose] = useState<string>('Keperluan Pribadi / Pengobatan / Renovasi');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Pay Installment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>('');

  // Handle passed props
  React.useEffect(() => {
    if (initialSelectedMember) {
      setSelectedMemberId(initialSelectedMember.id);
      setIsApplyModalOpen(true);
    }
  }, [initialSelectedMember]);

  React.useEffect(() => {
    if (initialLoanToPay) {
      setSelectedLoanForPayment(initialLoanToPay);
      setPayAmount(initialLoanToPay.monthlyInstallment);
      setIsPayModalOpen(true);
    }
  }, [initialLoanToPay]);

  // Calculations for new loan simulation
  const monthlyPrincipal = tenorMonths > 0 ? Math.round(amount / tenorMonths) : 0;
  const monthlyInterest = Math.round(amount * (interestRate / 100));
  const monthlyInstallment = monthlyPrincipal + monthlyInterest;
  const totalRepayment = monthlyInstallment * tenorMonths;

  // Aggregate Metrics
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalDisbursed = loans.reduce((sum, l) => sum + (l.status !== 'rejected' ? l.amount : 0), 0);
  const totalRemainingReceivable = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalPaidLoans = loans.filter((l) => l.status === 'paid').length;

  // Filtered Loans
  const filteredLoans = loans
    .filter((l) => {
      const matchSearch =
        l.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.unitKerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.purpose.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenApplyModal = (member?: Member) => {
    if (member) {
      setSelectedMemberId(member.id);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
    setAmount(5000000);
    setTenorMonths(12);
    setInterestRate(1.0);
    setPurpose('Keperluan Mendesak / Renovasi / Biaya Pendidikan');
    setStartDate(new Date().toISOString().slice(0, 10));
    setIsApplyModalOpen(true);
  };

  const handleCloseApplyModal = () => {
    setIsApplyModalOpen(false);
    if (onClearInitialAction) onClearInitialAction();
  };

  const handleOpenPayModal = (loan: LoanRecord) => {
    const progress = calculateLoanInstallmentProgress(loan);
    setSelectedLoanForPayment(loan);
    setPayAmount(Math.min(loan.monthlyInstallment, loan.remainingAmount));
    setPayNotes(
      `Angsuran ke-${progress.nextInstallmentNumber} dari ${progress.tenorMonths} bulan (${loan.loanNumber})`
    );
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setSelectedLoanForPayment(null);
    if (onClearInitialAction) onClearInitialAction();
  };

  // Submit New Loan Application
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === selectedMemberId);
    if (!mem || amount <= 0 || tenorMonths <= 0) return;

    // Calculate End Date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + tenorMonths);

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const loanSeq = String(loans.length + 1).padStart(3, '0');
    const loanNumber = `PINJ-${yearMonth}-${loanSeq}`;

    const newLoan: LoanRecord = {
      id: `LOAN-${Date.now()}`,
      loanNumber,
      memberId: mem.id,
      memberNumber: mem.memberNumber,
      memberName: mem.name,
      unitKerja: mem.unitKerja,
      amount,
      interestRate,
      tenorMonths,
      monthlyInstallment,
      totalRepayment,
      totalPaid: 0,
      remainingAmount: totalRepayment,
      startDate,
      endDate: end.toISOString().slice(0, 10),
      purpose,
      status: 'active', // Auto approved for streamlined coop workflow
      approvedBy: currentUser.name || 'Pengurus Koperasi',
      approvedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onAddLoan(newLoan);
    handleCloseApplyModal();
  };

  // Process Installment Payment
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment || payAmount <= 0) return;

    const newTotalPaid = selectedLoanForPayment.totalPaid + payAmount;
    const newRemaining = Math.max(0, selectedLoanForPayment.totalRepayment - newTotalPaid);
    const isNowPaid = newRemaining === 0;

    const updatedLoan: LoanRecord = {
      ...selectedLoanForPayment,
      totalPaid: newTotalPaid,
      remainingAmount: newRemaining,
      status: isNowPaid ? 'paid' : 'active',
    };

    onUpdateLoan(updatedLoan);

    if (isNowPaid) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }

    handleClosePayModal();
  };

  // Change loan status (approve/reject)
  const handleChangeStatus = (loan: LoanRecord, newStatus: LoanStatus) => {
    const updated = {
      ...loan,
      status: newStatus,
      approvedBy: currentUser.name,
      approvedDate: new Date().toISOString(),
    };
    onUpdateLoan(updated);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Plafon Disalurkan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(totalDisbursed)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi seluruh pinjaman</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Sisa Piutang Berjalan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {formatRupiah(totalRemainingReceivable)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari {activeLoans.length} pinjaman yang masih aktif
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pinjaman Lunas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{totalPaidLoans}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pinjaman telah selesai lunas 100%</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Peminjam Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeLoans.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Anggota dalam masa angsuran</div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor pinjaman, nama anggota, unit kerja..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none"
          >
            <option value="ALL">Semua Status Pinjaman</option>
            <option value="active">Pinjaman Berjalan</option>
            <option value="paid">Lunas</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenApplyModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pengajuan Pinjaman Baru</span>
          </button>
        </div>
      </div>

      {/* Loans List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Daftar Pinjaman & Angsuran Anggota
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Total {filteredLoans.length} pinjaman terdata &bull; Pantau progres cicilan dan sisa bulan tenor anggota
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium tabular-nums">
            <span>{activeLoans.length} Pinjaman Berjalan</span>
            <span aria-hidden="true">&bull;</span>
            <span>{totalPaidLoans} Pinjaman Lunas</span>
          </div>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CreditCard className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">Belum Ada Data Pinjaman</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Klik tombol Pengajuan Pinjaman Baru di atas untuk mencatat pinjaman anggota koperasi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center">No</th>
                  <th className="py-3.5 px-3">No. Pinjaman & Anggota</th>
                  <th className="py-3.5 px-3">Unit Kerja</th>
                  <th className="py-3.5 px-3 text-right">Plafon & Tenor</th>
                  <th className="py-3.5 px-3 text-right">Angsuran/Bln</th>
                  <th className="py-3.5 px-3.5 w-[245px]">Progres Pelunasan & Sisa</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan, index) => {
                  const progress = calculateLoanInstallmentProgress(loan);

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/70 transition-colors duration-150 group"
                    >
                      <td className="py-4 px-3 text-center font-bold text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-4 px-3 max-w-[210px]">
                        <div className="font-mono font-bold text-emerald-700 text-xs tracking-tight">
                          {loan.loanNumber}
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">
                          {loan.memberName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          <span className="font-mono">{loan.memberNumber}</span> &bull; Tujuan: {loan.purpose}
                        </div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{loan.unitKerja}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right tabular-nums whitespace-nowrap">
                        <div className="font-black text-slate-900 text-xs">
                          {formatRupiah(loan.amount)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {loan.tenorMonths} Bulan ({loan.interestRate}%/bln)
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right tabular-nums whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatRupiah(loan.monthlyInstallment)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">per bulan</div>
                      </td>
                      <td className="py-4 px-3.5">
                        <div className="space-y-1.5">
                          {/* Row 1: Percentage + Paid Months vs Remaining Rupiah */}
                          <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-emerald-700">
                                {progress.percentPaid}%
                              </span>
                              <span className="text-slate-300" aria-hidden="true">
                                &bull;
                              </span>
                              <span className="font-semibold text-slate-600 text-[10px]">
                                {progress.paidMonths}/{progress.tenorMonths} bln
                              </span>
                            </div>
                            <span
                              className={`font-bold ${
                                progress.isFullyPaid ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              Sisa: {formatRupiah(loan.remainingAmount)}
                            </span>
                          </div>

                          {/* Row 2: Progress Bar Visual */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200/70">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress.isFullyPaid
                                  ? 'bg-emerald-600'
                                  : progress.percentPaid >= 50
                                  ? 'bg-teal-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${progress.percentPaid}%` }}
                            />
                          </div>

                          {/* Row 3: Remaining Months Keterangan & Total Terbayar */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            {progress.isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Angsuran Lunas</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 whitespace-nowrap">
                                <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{progress.remainingMonthsLabel}</span>
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 text-right tabular-nums whitespace-nowrap">
                              {formatRupiah(loan.totalPaid)} / {formatRupiah(loan.totalRepayment)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                            loan.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : loan.status === 'active'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                              : loan.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                          }`}
                        >
                          {loan.status === 'paid'
                            ? 'Lunas'
                            : loan.status === 'active'
                            ? 'Berjalan'
                            : loan.status === 'pending'
                            ? 'Menunggu'
                            : 'Ditolak'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center whitespace-nowrap">
                        {loan.status === 'active' ? (
                          <button
                            onClick={() => handleOpenPayModal(loan)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] shadow-2xs transition active:scale-95 whitespace-nowrap"
                          >
                            Bayar Angsuran
                          </button>
                        ) : loan.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleChangeStatus(loan, 'active')}
                              className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition"
                              title="Setujui Pinjaman"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleChangeStatus(loan, 'rejected')}
                              className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition"
                              title="Tolak Pinjaman"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selesai</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Pengajuan Pinjaman Baru */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Form Pengajuan Pinjaman Koperasi</h3>
                  <p className="text-xs text-slate-500">
                    Koperasi Amanah Baraya &bull; RSUD Al-Mulk Kota Sukabumi
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseApplyModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
              {/* Pilih Anggota */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Anggota Peminjam: <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNumber} - {m.name} ({m.unitKerja})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plafon Pinjaman */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Plafon Pinjaman Pokok (Rp): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    min="500000"
                    step="500000"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Quick Plafon Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[1000000, 2000000, 3000000, 5000000, 10000000, 15000000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                  >
                    {formatRupiah(quick)}
                  </button>
                ))}
              </div>

              {/* Tenor & Bunga Jasa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jangka Waktu (Tenor): <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tenorMonths}
                    onChange={(e) => setTenorMonths(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={10}>10 Bulan</option>
                    <option value={12}>12 Bulan (1 Tahun)</option>
                    <option value={18}>18 Bulan</option>
                    <option value={24}>24 Bulan (2 Tahun)</option>
                    <option value={36}>36 Bulan (3 Tahun)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jasa / Bunga Koperasi (%/Bulan):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Simulasi Angsuran Bulanan</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Pokok / Bulan:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(monthlyPrincipal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Jasa / Bulan:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(monthlyInterest)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Angsuran / Bln:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {formatRupiah(monthlyInstallment)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Pengembalian:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(totalRepayment)}</span>
                  </div>
                </div>
              </div>

              {/* Tanggal Mulai & Keperluan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Mulai Pinjaman:
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tujuan / Keperluan:
                  </label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Contoh: Biaya Pendidikan / Renovasi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseApplyModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Setujui & Terbitkan Pinjaman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bayar Angsuran */}
      {isPayModalOpen && selectedLoanForPayment && (() => {
        const currentProgress = calculateLoanInstallmentProgress(selectedLoanForPayment);
        const simulatedTotalPaid = selectedLoanForPayment.totalPaid + payAmount;
        const simulatedRemaining = Math.max(0, selectedLoanForPayment.totalRepayment - simulatedTotalPaid);
        const afterPaymentProgress = calculateLoanInstallmentProgress({
          ...selectedLoanForPayment,
          totalPaid: simulatedTotalPaid,
          remainingAmount: simulatedRemaining,
          status: simulatedRemaining === 0 ? 'paid' : 'active',
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Pembayaran Angsuran Pinjaman</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedLoanForPayment.loanNumber} &bull; {selectedLoanForPayment.memberName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClosePayModal}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-3.5 text-xs">
                {/* Summary of current loan */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 tabular-nums">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Angsuran Rutin:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(selectedLoanForPayment.monthlyInstallment)} / bulan
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Progres Tenor Saat Ini:</span>
                    <span className="font-bold text-amber-700">
                      {currentProgress.paidMonths}/{currentProgress.tenorMonths} Bulan ({currentProgress.remainingMonthsLabel})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Terbayar:</span>
                    <span className="font-bold text-emerald-700">
                      {formatRupiah(selectedLoanForPayment.totalPaid)} /{' '}
                      {formatRupiah(selectedLoanForPayment.totalRepayment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Sisa Piutang:</span>
                    <span className="font-black text-rose-600 text-sm">
                      {formatRupiah(selectedLoanForPayment.remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Live Preview After Payment */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 tabular-nums">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-semibold">
                      Setelah pembayaran ini:
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-800">
                    {afterPaymentProgress.isFullyPaid
                      ? `Angsuran Lunas (${afterPaymentProgress.tenorMonths}/${afterPaymentProgress.tenorMonths} bln)`
                      : `${afterPaymentProgress.remainingMonthsLabel} (${afterPaymentProgress.paidMonths}/${afterPaymentProgress.tenorMonths} bln)`}
                  </span>
                </div>

                {/* Nominal Pembayaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nominal Pembayaran Angsuran (Rp): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      max={selectedLoanForPayment.remainingAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-sm tabular-nums"
                    />
                  </div>
                </div>

                {/* Quick Bayar Button */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const amt = Math.min(
                        selectedLoanForPayment.monthlyInstallment,
                        selectedLoanForPayment.remainingAmount
                      );
                      setPayAmount(amt);
                      setPayNotes(
                        `Angsuran ke-${currentProgress.nextInstallmentNumber} dari ${currentProgress.tenorMonths} bulan (${selectedLoanForPayment.loanNumber})`
                      );
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] tabular-nums transition"
                  >
                    Bayar 1 Bulan ({formatRupiah(selectedLoanForPayment.monthlyInstallment)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount(selectedLoanForPayment.remainingAmount);
                      setPayNotes(
                        `Pelunasan Sisa ${currentProgress.remainingMonths} Bulan (${selectedLoanForPayment.loanNumber})`
                      );
                    }}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-[11px] tabular-nums transition"
                  >
                    Lunasi Sekaligus ({formatRupiah(selectedLoanForPayment.remainingAmount)})
                  </button>
                </div>

                {/* Catatan / Keterangan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Pembayaran:
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Contoh: Angsuran ke-3 tunai / potong payroll"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClosePayModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

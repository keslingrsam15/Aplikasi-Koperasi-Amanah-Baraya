import React, { useState } from 'react';
import { Member, SavingsRecord, SavingsType, SavingsTransactionType } from '../../types';
import { formatRupiah, formatDateTimeIndo, formatDateIndo, exportToCSV } from '../../utils/formatters';
import {
  PiggyBank,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface SavingsManagementProps {
  members: Member[];
  savingsRecords: SavingsRecord[];
  onAddSavingsTransaction: (record: Omit<SavingsRecord, 'id'>) => void;
  currentUser: { name: string };
  initialSelectedMember?: Member | null;
  initialAction?: 'setor' | 'tarik' | null;
  onClearInitialAction?: () => void;
}

export const SavingsManagement: React.FC<SavingsManagementProps> = ({
  members,
  savingsRecords,
  onAddSavingsTransaction,
  currentUser,
  initialSelectedMember,
  initialAction,
  onClearInitialAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | SavingsType>('ALL');
  const [trxTypeFilter, setTrxTypeFilter] = useState<'ALL' | SavingsTransactionType>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(!!initialAction);
  const [modalTrxType, setModalTrxType] = useState<SavingsTransactionType>(initialAction || 'setor');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialSelectedMember?.id || '');
  const [savingsType, setSavingsType] = useState<SavingsType>('wajib');
  const [amount, setAmount] = useState<number>(50000);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('');

  // Auto select initial member if passed
  React.useEffect(() => {
    if (initialAction) {
      setModalTrxType(initialAction);
      setIsModalOpen(true);
      if (initialSelectedMember) {
        setSelectedMemberId(initialSelectedMember.id);
        if (initialAction === 'tarik') {
          setSavingsType('sukarela');
        }
      }
    }
  }, [initialAction, initialSelectedMember]);

  // Aggregate Metrics
  const totalPokok = members.reduce((sum, m) => sum + m.simpananPokok, 0);
  const totalWajib = members.reduce((sum, m) => sum + m.simpananWajib, 0);
  const totalSukarela = members.reduce((sum, m) => sum + m.simpananSukarela, 0);
  const totalAll = totalPokok + totalWajib + totalSukarela;

  // Filtered Records
  const filteredRecords = savingsRecords
    .filter((s) => {
      const matchSearch =
        s.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.receiptNumber && s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || s.type === typeFilter;
      const matchTrxType = trxTypeFilter === 'ALL' || s.transactionType === trxTypeFilter;

      return matchSearch && matchType && matchTrxType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Selected member object for current form
  const currentMember = members.find((m) => m.id === selectedMemberId);

  const handleOpenModal = (trxType: SavingsTransactionType, member?: Member) => {
    setModalTrxType(trxType);
    if (member) {
      setSelectedMemberId(member.id);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
    setSavingsType(trxType === 'tarik' ? 'sukarela' : 'wajib');
    setAmount(trxType === 'tarik' ? 100000 : 50000);
    setDate(new Date().toISOString().slice(0, 16));
    setNotes('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClearInitialAction) onClearInitialAction();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember || amount <= 0) return;

    // Validation for withdrawal
    if (modalTrxType === 'tarik') {
      let maxAvailable = 0;
      if (savingsType === 'sukarela') maxAvailable = currentMember.simpananSukarela;
      else if (savingsType === 'wajib') maxAvailable = currentMember.simpananWajib;
      else if (savingsType === 'pokok') maxAvailable = currentMember.simpananPokok;

      if (amount > maxAvailable) {
        alert(
          `Penarikan gagal! Saldo Simpanan ${savingsType.toUpperCase()} ${currentMember.name} hanya ${formatRupiah(
            maxAvailable
          )}.`
        );
        return;
      }
    }

    const receiptNo = `SMP-${Date.now().toString().slice(-6)}`;

    onAddSavingsTransaction({
      memberId: currentMember.id,
      memberNumber: currentMember.memberNumber,
      memberName: currentMember.name,
      type: savingsType,
      transactionType: modalTrxType,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
      operator: currentUser.name || 'Petugas Koperasi',
      receiptNumber: receiptNo,
    });

    handleCloseModal();
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'No. Kuitansi',
      'Tanggal & Waktu',
      'Nomor Anggota',
      'Nama Anggota',
      'Jenis Transaksi',
      'Jenis Simpanan',
      'Nominal (Rp)',
      'Keterangan',
      'Petugas',
    ];

    const rows = filteredRecords.map((s, idx) => [
      idx + 1,
      s.receiptNumber || s.id,
      formatDateTimeIndo(s.date),
      s.memberNumber,
      s.memberName,
      s.transactionType === 'setor' ? 'SETORAN' : 'PENARIKAN',
      `Simpanan ${s.type.toUpperCase()}`,
      s.amount,
      s.notes || '-',
      s.operator,
    ]);

    exportToCSV(`Laporan_Mutasi_Simpanan_Koperasi_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['LAPORAN MUTASI SIMPANAN KOPERASI AMANAH BARAYA - RSUD AL-MULK'],
      [`Total Simpanan Pokok: ${formatRupiah(totalPokok)}`],
      [`Total Simpanan Wajib: ${formatRupiah(totalWajib)}`],
      [`Total Simpanan Sukarela: ${formatRupiah(totalSukarela)}`],
      [`Total Seluruh Simpanan: ${formatRupiah(totalAll)}`],
      [],
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Total Simpanan Terkumpul
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2 text-white">{formatRupiah(totalAll)}</div>
          <div className="text-[11px] text-emerald-100/80 mt-1">
            Dari {members.length} anggota RSUD terdaftar
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">1. Simpanan Pokok</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold">P</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalPokok)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Setoran awal saat masuk anggota</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">2. Simpanan Wajib</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold">W</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalWajib)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Iuran rutin bulanan anggota</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">3. Simpanan Sukarela</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="text-xs font-bold">S</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(totalSukarela)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dapat disetor & ditarik sewaktu-waktu</div>
        </div>
      </div>

      {/* Action Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi simpanan, nama anggota, nomor..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none"
          >
            <option value="ALL">Semua Jenis Simpanan</option>
            <option value="pokok">Simpanan Pokok</option>
            <option value="wajib">Simpanan Wajib</option>
            <option value="sukarela">Simpanan Sukarela</option>
          </select>

          <select
            value={trxTypeFilter}
            onChange={(e) => setTrxTypeFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none"
          >
            <option value="ALL">Semua Mutasi</option>
            <option value="setor">Setoran (+)</option>
            <option value="tarik">Penarikan (-)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenModal('setor')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Setor Simpanan</span>
          </button>

          <button
            onClick={() => handleOpenModal('tarik')}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Tarik Simpanan</span>
          </button>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Riwayat Transaksi & Mutasi Simpanan</h3>
            <p className="text-xs text-slate-500">
              Total {filteredRecords.length} transaksi tercatat
            </p>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-4">
            <PiggyBank className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">Belum Ada Transaksi Simpanan</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Klik tombol Setor Simpanan di atas untuk mencatat setoran simpanan anggota koperasi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">No. Kuitansi & Waktu</th>
                  <th className="p-4">Anggota Koperasi</th>
                  <th className="p-4">Jenis Transaksi</th>
                  <th className="p-4">Jenis Simpanan</th>
                  <th className="p-4 text-right">Nominal</th>
                  <th className="p-4">Keterangan / Catatan</th>
                  <th className="p-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {record.receiptNumber || record.id}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateTimeIndo(record.date)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{record.memberName}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {record.memberNumber}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          record.transactionType === 'setor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {record.transactionType === 'setor' ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            <span>Setoran (+)</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            <span>Penarikan (-)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 uppercase">
                      Simpanan {record.type}
                    </td>
                    <td
                      className={`p-4 text-right font-black text-sm ${
                        record.transactionType === 'setor' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {record.transactionType === 'setor' ? '+' : '-'} {formatRupiah(record.amount)}
                    </td>
                    <td className="p-4 text-slate-600">{record.notes || '-'}</td>
                    <td className="p-4 text-slate-500">{record.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setor / Tarik Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold ${
                    modalTrxType === 'setor' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {modalTrxType === 'setor' ? (
                    <PlusCircle className="w-5 h-5" />
                  ) : (
                    <MinusCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {modalTrxType === 'setor' ? 'Form Setoran Simpanan' : 'Form Penarikan Simpanan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Koperasi Amanah Baraya &bull; RSUD Al-Mulk
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Pilih Anggota */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Anggota Koperasi: <span className="text-rose-500">*</span>
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

              {/* Tampilkan Saldo Anggota Terpilih */}
              {currentMember && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-600">
                    Saldo Simpanan {currentMember.name}:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Pokok:</span>
                      <span className="font-bold text-slate-800">
                        {formatRupiah(currentMember.simpananPokok)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Wajib:</span>
                      <span className="font-bold text-slate-800">
                        {formatRupiah(currentMember.simpananWajib)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sukarela:</span>
                      <span className="font-bold text-amber-700">
                        {formatRupiah(currentMember.simpananSukarela)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Jenis Simpanan & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Simpanan: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={savingsType}
                    onChange={(e) => setSavingsType(e.target.value as SavingsType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="wajib">Simpanan Wajib</option>
                    <option value="sukarela">Simpanan Sukarela</option>
                    <option value="pokok">Simpanan Pokok</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nominal (Rp): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Nominal Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[20000, 50000, 100000, 200000, 500000, 1000000].map((quick) => (
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

              {/* Tanggal & Waktu */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal & Waktu Transaksi:
                </label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Berita Transaksi:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Iuran wajib bulan September 2026 / Setoran tunai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 ${
                    modalTrxType === 'setor'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{modalTrxType === 'setor' ? 'Proses Setoran' : 'Proses Penarikan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

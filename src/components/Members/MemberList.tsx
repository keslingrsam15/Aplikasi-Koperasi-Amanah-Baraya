import React, { useState, useMemo } from 'react';
import { Member, SavingsRecord, LoanRecord, Transaction } from '../../types';
import { MemberFormModal } from './MemberFormModal';
import { MemberDetailModal } from './MemberDetailModal';
import { formatRupiah, formatDateIndo, exportToCSV } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Calendar,
  PiggyBank,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface MemberListProps {
  members: Member[];
  savingsRecords: SavingsRecord[];
  loanRecords?: LoanRecord[];
  loans?: LoanRecord[];
  transactions: Transaction[];
  onSaveMember?: (member: Member) => void;
  onAddMember?: (member: Member) => void;
  onUpdateMember?: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onOpenNewSavings?: (member: Member, type: 'setor' | 'tarik') => void;
  onOpenNewLoan?: (member: Member) => void;
  onOpenPayInstallment?: (loan: LoanRecord) => void;
  onNavigateToSavings?: (member: Member, action: 'setor' | 'tarik') => void;
  onNavigateToLoanApply?: (member: Member) => void;
  onNavigateToPayInstallment?: (loan: LoanRecord) => void;
  triggerAddSignal?: number;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  savingsRecords,
  loanRecords,
  loans,
  transactions,
  onSaveMember,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onOpenNewSavings,
  onOpenNewLoan,
  onOpenPayInstallment,
  onNavigateToSavings,
  onNavigateToLoanApply,
  onNavigateToPayInstallment,
  triggerAddSignal,
}) => {
  const effectiveLoans = loanRecords || loans || [];
  const handleOpenSavings = onOpenNewSavings || onNavigateToSavings;
  const handleOpenLoan = onOpenNewLoan || onNavigateToLoanApply;
  const handlePayInstallment = onOpenPayInstallment || onNavigateToPayInstallment;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'number' | 'savings' | 'joinDate'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);

  // Trigger add modal when signal received from universal header button
  React.useEffect(() => {
    if (triggerAddSignal && triggerAddSignal > 0) {
      setMemberToEdit(null);
      setIsFormOpen(true);
    }
  }, [triggerAddSignal]);

  // Units list for filter
  const unitList = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.unitKerja) set.add(m.unitKerja);
    });
    return Array.from(set).sort();
  }, [members]);

  // Metrics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const totalAllSavings = members.reduce(
    (sum, m) => sum + (m.simpananPokok + m.simpananWajib + m.simpananSukarela),
    0
  );
  const avgSavings = totalMembers > 0 ? totalAllSavings / totalMembers : 0;

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.nikOrNip && m.nikOrNip.toLowerCase().includes(searchTerm.toLowerCase())) ||
          m.unitKerja.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesUnit = selectedUnit === 'ALL' || m.unitKerja === selectedUnit;
        const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

        return matchesSearch && matchesUnit && matchesStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') {
          comp = a.name.localeCompare(b.name);
        } else if (sortBy === 'number') {
          comp = a.memberNumber.localeCompare(b.memberNumber);
        } else if (sortBy === 'joinDate') {
          comp = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        } else if (sortBy === 'savings') {
          const totA = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
          const totB = b.simpananPokok + b.simpananWajib + b.simpananSukarela;
          comp = totA - totB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [members, searchTerm, selectedUnit, selectedStatus, sortBy, sortOrder]);

  const handleExportMembersCSV = () => {
    const headers = [
      'No',
      'Nomor Anggota',
      'Nama Lengkap',
      'NIP / NIK',
      'Unit Kerja RSUD',
      'No. Telepon',
      'Tanggal Bergabung',
      'Status',
      'Simpanan Pokok (Rp)',
      'Simpanan Wajib (Rp)',
      'Simpanan Sukarela (Rp)',
      'Total Simpanan (Rp)',
      'Catatan',
    ];

    const rows = filteredMembers.map((m, index) => {
      const total = m.simpananPokok + m.simpananWajib + m.simpananSukarela;
      return [
        index + 1,
        m.memberNumber,
        m.name,
        m.nikOrNip || '-',
        m.unitKerja,
        m.phone || '-',
        formatDateIndo(m.joinDate),
        m.status === 'active' ? 'Aktif' : 'Non-Aktif',
        m.simpananPokok,
        m.simpananWajib,
        m.simpananSukarela,
        total,
        m.notes || '-',
      ];
    });

    exportToCSV(`Data_Anggota_Koperasi_RSUD_AlMulk_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['DAFTAR ANGGOTA KOPERASI AMANAH BARAYA - RSUD AL-MULK KOTA SUKABUMI'],
      [`Tanggal Cetak: ${formatDateIndo(new Date().toISOString().slice(0, 10))}`],
      [`Total Anggota: ${filteredMembers.length} Orang`],
      [],
      headers,
      ...rows,
    ]);
  };

  const handleOpenAddModal = () => {
    setMemberToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setMemberToEdit(member);
    setIsFormOpen(true);
  };

  const handleDelete = (member: Member) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus data anggota "${member.name}" (${member.memberNumber})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      onDeleteMember(member.id);
    }
  };

  const handleSaveMember = (member: Member) => {
    if (onSaveMember) {
      onSaveMember(member);
    } else if (memberToEdit && onUpdateMember) {
      onUpdateMember(member);
    } else if (onAddMember) {
      onAddMember(member);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Anggota Terdaftar</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalMembers}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{activeMembers} Aktif</span>
            <span>&bull;</span>
            <span className="text-slate-400">{totalMembers - activeMembers} Non-Aktif</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Seluruh Simpanan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {formatRupiah(totalAllSavings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Simpanan Pokok + Wajib + Sukarela
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Rata-rata Simpanan</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(avgSavings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Per anggota terdaftar
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Unit Kerja RSUD</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{unitList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Instalasi & Unit RSUD terwakili
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama anggota, nomor anggota, NIP, atau unit kerja..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Filter Unit Kerja */}
          <div className="sm:col-span-3">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="ALL">Semua Unit Kerja RSUD</option>
              {unitList.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="ALL">Semua Status Anggota</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Non-Aktif Saja</option>
            </select>
          </div>
        </div>

        {/* Sort & Count Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredMembers.length}</span> dari {totalMembers} anggota
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-medium outline-none"
            >
              <option value="number">Nomor Anggota</option>
              <option value="name">Nama Lengkap</option>
              <option value="savings">Saldo Simpanan</option>
              <option value="joinDate">Tanggal Bergabung</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              title="Ubah Arah Urutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Belum Ada Data Anggota</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              {searchTerm || selectedUnit !== 'ALL' || selectedStatus !== 'ALL'
                ? 'Tidak ada anggota yang cocok dengan filter pencarian.'
                : 'Mulai daftarkan anggota koperasi dari karyawan dan staf RSUD Al-Mulk.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-md inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Anggota Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">Nomor & Nama Anggota</th>
                  <th className="p-4">Unit Kerja di RSUD</th>
                  <th className="p-4">Tanggal Gabung</th>
                  <th className="p-4 text-right">Saldo Simpanan</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member, index) => {
                  const totalSimpanan =
                    member.simpananPokok + member.simpananWajib + member.simpananSukarela;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition group">
                      {/* No */}
                      <td className="p-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Nama & Nomor Anggota */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                              {member.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                                {member.memberNumber}
                              </span>
                              {member.nikOrNip && (
                                <span className="text-[10px] text-slate-400">
                                  NIP: {member.nikOrNip}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Unit Kerja */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{member.unitKerja}</span>
                        </div>
                        {member.phone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            WA: {member.phone}
                          </div>
                        )}
                      </td>

                      {/* Tanggal Gabung */}
                      <td className="p-4 text-slate-600 font-medium">
                        {formatDateIndo(member.joinDate)}
                      </td>

                      {/* Saldo Simpanan */}
                      <td className="p-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          {formatRupiah(totalSimpanan)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          P: {formatRupiah(member.simpananPokok)} &bull; W: {formatRupiah(member.simpananWajib)} &bull; S: {formatRupiah(member.simpananSukarela)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            member.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Non-Aktif</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail Modal Trigger */}
                          <button
                            onClick={() => setSelectedMemberDetail(member)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition shadow-2xs"
                            title="Lihat Detail & Buku Rekening Anggota"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Modal Trigger */}
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition shadow-2xs"
                            title="Edit Data Anggota"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Trigger */}
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition shadow-2xs"
                            title="Hapus Data Anggota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Add / Edit Modal */}
      <MemberFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
        existingMembersCount={members.length}
      />

      {/* Detail Riwayat Anggota Modal */}
      <MemberDetailModal
        isOpen={!!selectedMemberDetail}
        onClose={() => setSelectedMemberDetail(null)}
        member={selectedMemberDetail}
        savingsRecords={savingsRecords}
        loanRecords={effectiveLoans}
        transactions={transactions}
        onOpenNewSavings={handleOpenSavings}
        onOpenNewLoan={handleOpenLoan}
        onOpenPayInstallment={handlePayInstallment}
      />
    </div>
  );
};

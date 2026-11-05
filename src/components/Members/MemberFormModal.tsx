import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { X, UserCheck, Save, Plus, Check } from 'lucide-react';

const STORAGE_UNIT_KEY = 'koperasi_rsud_unit_kerja_list';

// Daftar unit kerja resmi RSUD Al-Mulk Kota Sukabumi
export const DEFAULT_UNIT_KERJA_OPTIONS: string[] = [
  'Manajemen',
  'Penunjang',
  'Pendaftaran',
  'RM',
  'Farmasi',
  'Laboratorium',
  'Radiologi',
  'IGD',
  'Usman',
  'Fatimah',
  'Khadijah',
  'Aisyah',
  'IBS',
  'ICU',
  'CSSD',
  'Kebersihan',
  'IPSRS',
  'Kesling',
  'Humas',
  'Ambulance',
  'Lainnya',
];

const mergeUnits = (customList: string[]): string[] => {
  const result = [...DEFAULT_UNIT_KERJA_OPTIONS];
  customList.forEach((item) => {
    const trimmed = item.trim();
    if (trimmed && !result.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      result.push(trimmed);
    }
  });
  return result;
};

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  memberToEdit?: Member | null;
  existingMembersCount: number;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
  existingMembersCount,
}) => {
  // Pilihan Unit Kerja bawaan RSUD Al-Mulk yang dapat digabung dengan unit tersimpan lokal
  const [savedUnits, setSavedUnits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNIT_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return mergeUnits(parsed);
      }
      return DEFAULT_UNIT_KERJA_OPTIONS;
    } catch {
      return DEFAULT_UNIT_KERJA_OPTIONS;
    }
  });

  const [unitInput, setUnitInput] = useState<string>('');
  const [unitSuccessMsg, setUnitSuccessMsg] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Member>>({
    memberNumber: '',
    name: '',
    gender: 'P',
    nikOrNip: '',
    unitKerja: '',
    phone: '',
    email: '',
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    simpananPokok: 200000,
    simpananWajib: 30000,
    simpananSukarela: 0,
    simpananWisata: 20000,
    kekuranganKaryawisata: 0,
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (memberToEdit) {
      setFormData({ ...memberToEdit });
      setUnitInput(memberToEdit.unitKerja || '');
      if (
        memberToEdit.unitKerja &&
        !savedUnits.some((u) => u.toLowerCase() === memberToEdit.unitKerja?.toLowerCase())
      ) {
        const updated = [...savedUnits, memberToEdit.unitKerja];
        setSavedUnits(updated);
        try {
          localStorage.setItem(STORAGE_UNIT_KEY, JSON.stringify(updated));
        } catch {}
      }
    } else {
      const nextSeq = String(existingMembersCount + 1).padStart(3, '0');
      const year = new Date().getFullYear();
      setFormData({
        memberNumber: `ANG-${year}-${nextSeq}`,
        name: '',
        gender: 'P',
        nikOrNip: '',
        unitKerja: '',
        phone: '',
        email: '',
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        simpananPokok: 200000,
        simpananWajib: 30000,
        simpananSukarela: 0,
        simpananWisata: 20000,
        kekuranganKaryawisata: 0,
        address: '',
        notes: '',
      });
      setUnitInput('');
    }
  }, [memberToEdit, existingMembersCount, isOpen]);

  if (!isOpen) return null;

  // Handle adding new Unit Kerja into dropdown list and localStorage
  const handleAddUnitKerja = () => {
    const trimmed = unitInput.trim();
    if (!trimmed) {
      alert('Silahkan ketik nama unit kerja terlebih dahulu.');
      return;
    }

    if (!savedUnits.includes(trimmed)) {
      const updated = [...savedUnits, trimmed];
      setSavedUnits(updated);
      try {
        localStorage.setItem(STORAGE_UNIT_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Gagal menyimpan unit kerja:', err);
      }
      setUnitSuccessMsg(`Unit "${trimmed}" berhasil ditambahkan ke dropdown!`);
    } else {
      setUnitSuccessMsg(`Unit "${trimmed}" sudah ada di dropdown.`);
    }

    setFormData((prev) => ({ ...prev, unitKerja: trimmed }));
    setTimeout(() => setUnitSuccessMsg(''), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Silahkan masukan nama lengkap.');
      return;
    }

    const finalUnit = (unitInput || formData.unitKerja || '').trim();
    if (!finalUnit) {
      alert('Silahkan tentukan Unit Kerja (ketik manual atau pilih dari dropdown).');
      return;
    }

    // Auto-save unit kerja to dropdown if not present yet
    if (!savedUnits.includes(finalUnit)) {
      const updated = [...savedUnits, finalUnit];
      setSavedUnits(updated);
      try {
        localStorage.setItem(STORAGE_UNIT_KEY, JSON.stringify(updated));
      } catch {}
    }

    const nextSeq = String(existingMembersCount + 1).padStart(3, '0');
    const year = new Date().getFullYear();
    const finalMemberNumber =
      formData.memberNumber?.trim() ||
      (memberToEdit?.memberNumber ? memberToEdit.memberNumber : `ANG-${year}-${nextSeq}`);

    const memberData: Member = {
      id: memberToEdit?.id || `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      memberNumber: finalMemberNumber,
      name: formData.name.trim(),
      gender: (formData.gender as 'L' | 'P') || 'P',
      nikOrNip: formData.nikOrNip?.trim() || undefined,
      unitKerja: finalUnit,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      joinDate: formData.joinDate || new Date().toISOString().slice(0, 10),
      status: (formData.status as 'active' | 'inactive') || 'active',
      simpananPokok: Math.max(0, Number(formData.simpananPokok || 0)),
      simpananWajib: Math.max(0, Number(formData.simpananWajib || 0)),
      simpananSukarela: Math.max(0, Number(formData.simpananSukarela || 0)),
      simpananWisata: Math.max(0, Number(formData.simpananWisata || 0)),
      kekuranganKaryawisata: Math.max(0, Number(formData.kekuranganKaryawisata || 0)),
      address: formData.address?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(memberData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {memberToEdit ? 'Edit Data Anggota' : 'Tambah Anggota Koperasi Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Koperasi Amanah Baraya &bull; RSUD Al-Mulk Kota Sukabumi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nama Lengkap & Jenis Kelamin Anggota */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Nama Lengkap Anggota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Silahkan masukan nama lengkap"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Kelamin:
              </label>
              <select
                value={formData.gender || 'P'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="P">Perempuan</option>
                <option value="L">Laki-Laki</option>
              </select>
            </div>
          </div>

          {/* Baris 2: NIP/NIK & No. HP / WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                NIP / NIK / No. KTP (RSUD)
              </label>
              <input
                type="text"
                value={formData.nikOrNip || ''}
                onChange={(e) => setFormData({ ...formData, nikOrNip: e.target.value })}
                placeholder="Contoh: 19850412 201001 1 004"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                No. HP / WhatsApp
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Baris 3: Unit Kerja (Pilihan Resmi RSUD Al-Mulk & Ketik Manual) */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">
                Unit Kerja <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">
                Pilih unit kerja atau ketik manual
              </span>
            </div>

            {/* Dropdown Unit Kerja */}
            <div>
              <select
                value={formData.unitKerja || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, unitKerja: val }));
                  setUnitInput(val);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Unit Kerja RSUD Al-Mulk --</option>
                {savedUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Ketik Manual & Tombol Tambah Unit Kerja */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Ketik manual nama unit kerja..."
                  value={unitInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUnitInput(val);
                    setFormData((prev) => ({ ...prev, unitKerja: val }));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddUnitKerja}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Unit Kerja</span>
              </button>
            </div>

            {unitSuccessMsg && (
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{unitSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Baris 4: Tanggal Bergabung & Status Keanggotaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Bergabung <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.joinDate || ''}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Status Keanggotaan:
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Aktif (Bisa Transaksi & Pinjam)</option>
                <option value="inactive">Non-Aktif / Pensiun / Keluar</option>
              </select>
            </div>
          </div>

          {/* Section: Saldo Simpanan Awal (Simbol dolar dihilangkan sesuai permintaan) */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="text-sm">Saldo Simpanan Koperasi (Rupiah)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Simpanan Pokok:
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.simpananPokok ?? 0}
                    onChange={(e) => setFormData({ ...formData, simpananPokok: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Rp 200.000 / anggota</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Simpanan Wajib:
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.simpananWajib ?? 0}
                    onChange={(e) => setFormData({ ...formData, simpananWajib: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Rp 30.000 / bln</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Simpanan Sukarela:
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.simpananSukarela ?? 0}
                    onChange={(e) => setFormData({ ...formData, simpananSukarela: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Sesuai kemampuan</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Simpanan Karyawisata:
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.simpananWisata ?? 0}
                    onChange={(e) => setFormData({ ...formData, simpananWisata: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Rp 20.000 / bln</span>
              </div>
            </div>

            <div className="text-right font-bold text-xs text-emerald-800 pt-1 border-t border-emerald-200/60">
              Total Simpanan: Rp{' '}
              {(
                Number(formData.simpananPokok || 0) +
                Number(formData.simpananWajib || 0) +
                Number(formData.simpananSukarela || 0) +
                Number(formData.simpananWisata || 0)
              ).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Tambahan (Opsional):
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: No. Rekening Bank BJB / Catatan khusus anggota"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{memberToEdit ? 'Simpan Perubahan' : 'Daftarkan Anggota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

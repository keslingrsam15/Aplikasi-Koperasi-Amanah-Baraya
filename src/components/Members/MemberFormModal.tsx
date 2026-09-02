import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { initialUnitKerjaList } from '../../data/initialData';
import { X, UserCheck, Save, Phone, Briefcase, Calendar, DollarSign, FileText } from 'lucide-react';

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
  const [formData, setFormData] = useState<Partial<Member>>({
    memberNumber: '',
    name: '',
    nikOrNip: '',
    unitKerja: initialUnitKerjaList[0] || 'Umum',
    phone: '',
    email: '',
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    simpananPokok: 100000,
    simpananWajib: 50000,
    simpananSukarela: 0,
    address: '',
    notes: '',
  });

  const [customUnitKerja, setCustomUnitKerja] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setFormData({ ...memberToEdit });
      if (!initialUnitKerjaList.includes(memberToEdit.unitKerja)) {
        setIsCustomUnit(true);
        setCustomUnitKerja(memberToEdit.unitKerja);
      } else {
        setIsCustomUnit(false);
        setCustomUnitKerja('');
      }
    } else {
      const nextSeq = String(existingMembersCount + 1).padStart(3, '0');
      const year = new Date().getFullYear();
      setFormData({
        memberNumber: `ANG-${year}-${nextSeq}`,
        name: '',
        nikOrNip: '',
        unitKerja: initialUnitKerjaList[0] || 'Umum',
        phone: '',
        email: '',
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        simpananPokok: 100000,
        simpananWajib: 50000,
        simpananSukarela: 0,
        address: '',
        notes: '',
      });
      setIsCustomUnit(false);
      setCustomUnitKerja('');
    }
  }, [memberToEdit, existingMembersCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const finalUnit = isCustomUnit ? customUnitKerja.trim() || 'Umum' : formData.unitKerja || 'Umum';

    const memberData: Member = {
      id: memberToEdit?.id || `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      memberNumber: formData.memberNumber?.trim() || `ANG-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      nikOrNip: formData.nikOrNip?.trim() || undefined,
      unitKerja: finalUnit,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      joinDate: formData.joinDate || new Date().toISOString().slice(0, 10),
      status: (formData.status as 'active' | 'inactive') || 'active',
      simpananPokok: Number(formData.simpananPokok || 0),
      simpananWajib: Number(formData.simpananWajib || 0),
      simpananSukarela: Number(formData.simpananSukarela || 0),
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
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Baris 1: Nomor Anggota & Nama Lengkap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Anggota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.memberNumber || ''}
                onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
                placeholder="Contoh: ANG-2026-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Lengkap Anggota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: dr. H. Rahmat Hidayat, Sp.PD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Baris 2: NIP/NIK & Unit Kerja RSUD */}
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
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Unit Kerja di RSUD <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setIsCustomUnit(!isCustomUnit)}
                  className="text-[10px] text-emerald-600 hover:underline font-normal"
                >
                  {isCustomUnit ? 'Pilih dari Daftar' : '+ Ketik Manual'}
                </button>
              </label>
              {isCustomUnit ? (
                <input
                  type="text"
                  required
                  placeholder="Ketik nama unit kerja..."
                  value={customUnitKerja}
                  onChange={(e) => setCustomUnitKerja(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <select
                  value={formData.unitKerja}
                  onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {initialUnitKerjaList.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Baris 3: No Telp/WhatsApp & Tanggal Bergabung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {/* Section: Saldo Simpanan Awal */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Saldo Simpanan Koperasi (Rupiah)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <span className="text-[10px] text-slate-500 block mt-0.5">Dibayar saat awal masuk</span>
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
                <span className="text-[10px] text-slate-500 block mt-0.5">Iuran rutin bulanan</span>
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
                <span className="text-[10px] text-slate-500 block mt-0.5">Tabungan bebas/fleksibel</span>
              </div>
            </div>

            <div className="text-right font-bold text-xs text-emerald-800 pt-1 border-t border-emerald-200/60">
              Total Simpanan: Rp{' '}
              {(
                Number(formData.simpananPokok || 0) +
                Number(formData.simpananWajib || 0) +
                Number(formData.simpananSukarela || 0)
              ).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Status & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
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

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contoh: No. Rekening Bank BJB / Catatan khusus"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
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

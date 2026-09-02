import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import {
  Users,
  Shield,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Award,
  Package,
  Check,
  Phone,
  Clock,
  KeyRound,
  AlertCircle,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';

interface UserManagementProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

interface PermissionOption {
  id: string;
  label: string;
  desc: string;
}

const AVAILABLE_PERMISSIONS: PermissionOption[] = [
  { id: 'pos', label: 'Kasir & Transaksi', desc: 'Akses menu kasir, input belanja, scan barcode, dan cetak struk' },
  { id: 'products', label: 'Master Produk', desc: 'Tambah, ubah data barang, atur harga jual & harga modal' },
  { id: 'barcodes', label: 'Cetak Barcode', desc: 'Cetak label barcode stiker thermal dan kertas label A4' },
  { id: 'stock', label: 'Stok & Mutasi', desc: 'Kelola restock barang masuk, barang keluar, dan opname fisik' },
  { id: 'reports', label: 'Laporan Keuangan', desc: 'Lihat rekap omset penjualan, estimasi laba kotor, dan riwayat kasir' },
  { id: 'users', label: 'Kelola Pengguna', desc: 'Akses menu data pengguna dan pengaturan hak akses peran' },
  { id: 'settings', label: 'Pengaturan Sistem', desc: 'Atur identitas koperasi, printer thermal, dan sinkronisasi cloud Supabase' },
  { id: 'delete_users', label: 'Otoritas Hapus Akun', desc: 'Hak khusus Kepala Toko untuk menghapus akun pengguna' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['pos', 'products', 'barcodes', 'stock', 'reports', 'users', 'settings', 'delete_users'],
  kasir: ['pos', 'products', 'barcodes'],
  pengurus: ['reports', 'stock', 'users', 'settings'],
  gudang: ['products', 'barcodes', 'stock'],
};

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('kasir');
  const [formNip, setFormNip] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formShift, setFormShift] = useState<string>('Shift Pagi (07:00 - 15:00)');
  const [formAvatarColor, setFormAvatarColor] = useState<string>('bg-emerald-600');
  const [formPermissions, setFormPermissions] = useState<string[]>(DEFAULT_ROLE_PERMISSIONS.kasir);

  // Modal confirmation delete
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const isCurrentAdmin = currentUser.role === 'admin';

  const avatarColorOptions = [
    { label: 'Biru (Admin)', value: 'bg-blue-600' },
    { label: 'Hijau (Kasir)', value: 'bg-emerald-600' },
    { label: 'Amber (Pengurus)', value: 'bg-amber-600' },
    { label: 'Ungu (Gudang)', value: 'bg-purple-600' },
    { label: 'Teal', value: 'bg-teal-600' },
    { label: 'Indigo', value: 'bg-indigo-600' },
    { label: 'Merah', value: 'bg-rose-600' },
  ];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormRole('kasir');
    setFormNip('');
    setFormPhone('');
    setFormShift('Shift Pagi (07:00 - 15:00)');
    setFormAvatarColor('bg-emerald-600');
    setFormPermissions(DEFAULT_ROLE_PERMISSIONS.kasir);
    setIsFormOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    setFormPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
    if (newRole === 'admin') setFormAvatarColor('bg-blue-600');
    else if (newRole === 'pengurus') setFormAvatarColor('bg-amber-600');
    else if (newRole === 'gudang') setFormAvatarColor('bg-purple-600');
    else setFormAvatarColor('bg-emerald-600');
  };

  const handleTogglePermission = (permId: string) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormRole(u.role);
    setFormNip(u.nipOrNik || '');
    setFormPhone(u.phone || '');
    setFormShift(u.shift || 'Shift Pagi (07:00 - 15:00)');
    setFormAvatarColor(u.avatarColor || 'bg-emerald-600');
    setFormPermissions(u.permissions && u.permissions.length > 0 ? u.permissions : DEFAULT_ROLE_PERMISSIONS[u.role] || []);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama pengguna wajib diisi!');
      return;
    }

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: formName.trim(),
        role: formRole,
        nipOrNik: formNip.trim() || undefined,
        phone: formPhone.trim() || undefined,
        shift: formShift.trim() || undefined,
        avatarColor: formAvatarColor,
        permissions: formPermissions,
      });
    } else {
      onAddUser({
        id: `USR-${Date.now()}`,
        name: formName.trim(),
        role: formRole,
        nipOrNik: formNip.trim() || undefined,
        phone: formPhone.trim() || undefined,
        shift: formShift.trim() || undefined,
        avatarColor: formAvatarColor,
        permissions: formPermissions,
      });
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    onDeleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  const handleResetUsers = () => {
    if (window.confirm('Reset data pengguna ke akun Kepala Toko standar (menghapus akun dummy/lama)?')) {
      const cleanAdmin: UserProfile = {
        id: 'USR-ADMIN-01',
        name: 'Kepala Toko',
        role: 'admin',
        avatarColor: 'bg-blue-600',
        nipOrNik: '',
        shift: 'Akses Penuh Sistem',
        permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
      };
      // Keep or reset
      users.forEach((u) => {
        if (u.id !== cleanAdmin.id) onDeleteUser(u.id);
      });
      onUpdateUser(cleanAdmin);
      onSwitchUser(cleanAdmin);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Centered Titles & Subtitles */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Manajemen Data Pengguna & Hak Akses</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola akun petugas kasir, pengelola stok, pengurus, dan Kepala Toko Koperasi Amanah Baraya
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Role Permission Guidance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Kepala Toko</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Akses penuh sistem, kelola produk, stok, laporan, tambah/edit/hapus pengguna, dan pengaturan Supabase.
          </p>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Kasir / Penjualan</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Fokus transaksi harian: scan barcode produk, simpan antrian, pembayaran QRIS/tunai, dan cetak struk thermal.
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
          <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
            <Package className="w-4 h-4 text-purple-600" />
            <span>Petugas Gudang / Stok</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Kelola barang masuk, pengadaan supplier, penyesuaian opname stok fisik, dan cetak label barcode.
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Pengurus / Auditor</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Monitoring rekapitulasi penjualan, laporan laba rugi kotor, analisis produk terlaris, dan data SHU.
          </p>
        </div>
      </div>

      {/* Admin Privilege Notification */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Status Akun Aktif: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role.toUpperCase()}) &bull;{' '}
            {isCurrentAdmin ? (
              <span className="text-emerald-700 font-semibold">
                Memiliki otorisasi penuh untuk menambah, mengedit, dan menghapus akun pengguna.
              </span>
            ) : (
              <span className="text-amber-700 font-semibold">
                Fitur hapus pengguna hanya dapat dijalankan oleh role Kepala Toko.
              </span>
            )}
          </span>
        </div>
      </div>

      {/* User Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((user) => {
          const isCurrent = user.id === currentUser.id;
          const userPerms = user.permissions && user.permissions.length > 0
            ? user.permissions
            : DEFAULT_ROLE_PERMISSIONS[user.role] || [];

          return (
            <div
              key={user.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isCurrent
                  ? 'bg-emerald-50/80 border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* User Card Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl ${user.avatarColor || 'bg-emerald-600'} text-white font-bold text-base flex items-center justify-center shadow shrink-0`}
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'pengurus'
                              ? 'bg-amber-100 text-amber-800'
                              : user.role === 'gudang'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {user.role}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Ubah Data Pengguna & Hak Akses"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setUserToDelete(user)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title={`Hapus pengguna "${user.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Information: NIP, Shift, Phone */}
                <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {user.nipOrNik && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-700">NIP/NIK:</span>
                      <span className="font-mono text-slate-800">{user.nipOrNik}</span>
                    </div>
                  )}
                  {user.shift && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.shift}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Hak Akses Badges */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Hak Akses ({userPerms.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {userPerms.map((permId) => {
                      const pInfo = AVAILABLE_PERMISSIONS.find((p) => p.id === permId);
                      return (
                        <span
                          key={permId}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                        >
                          {pInfo ? pInfo.label : permId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Switch User Button */}
              <button
                disabled={isCurrent}
                onClick={() => {
                  onSwitchUser(user);
                  alert(`Berhasil berganti ke akun: ${user.name} (${user.role.toUpperCase()})`);
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 mt-4 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white cursor-default shadow-xs'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                }`}
              >
                {isCurrent ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Sedang Digunakan</span>
                  </>
                ) : (
                  <span>Gunakan Akun Ini</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingUser ? 'Ubah Profil & Hak Akses Pengguna' : 'Tambah Pengguna & Hak Akses Baru'}
                </h3>
                <p className="text-xs text-slate-400">Koperasi Amanah Baraya RSUD Al-Mulk</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, A.Md / Petugas Kasir 1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Role / Peran:
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:border-emerald-600 focus:bg-white outline-none"
                  >
                    <option value="kasir">Kasir (Transaksi & Struk)</option>
                    <option value="admin">Kepala Toko (Akses Penuh)</option>
                    <option value="gudang">Petugas Gudang / Stok</option>
                    <option value="pengurus">Pengurus / Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Warna Avatar:
                  </label>
                  <select
                    value={formAvatarColor}
                    onChange={(e) => setFormAvatarColor(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:border-emerald-600 focus:bg-white outline-none"
                  >
                    {avatarColorOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP / NIK Pegawai (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19950312 202012 2 004"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Shift / Keterangan Jadwal:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Shift Pagi (07:00 - 15:00) / Shift Siang"
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              {/* Granular Hak Akses (Permissions) Checkboxes */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Konfigurasi Hak Akses Fitur:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPermissions(AVAILABLE_PERMISSIONS.map((p) => p.id))}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-bold"
                  >
                    Pilih Semua
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] leading-tight">{perm.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition active:scale-95"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal (Role Administrator) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Konfirmasi Hapus Pengguna
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus akun pengguna{' '}
                <strong className="text-slate-900">"{userToDelete.name}"</strong> ({userToDelete.role.toUpperCase()})?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-2">
                Tindakan ini hanya dapat dilakukan oleh role Kepala Toko dan akan menghapus akun dari sistem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs text-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { UserProfile, CoopConfig } from '../../types';
import {
  ShieldCheck,
  ShoppingCart,
  ArrowLeft,
  UserCheck,
  ChevronRight,
  Store,
  CheckCircle2,
  Lock,
  Cloud,
  Sparkles,
} from 'lucide-react';

interface AccountSelectionScreenProps {
  users: UserProfile[];
  coopConfig: CoopConfig;
  onSelectUser: (user: UserProfile, targetTab?: string) => void;
  onBackToWelcome: () => void;
  isCloudConnected?: boolean;
}

export const AccountSelectionScreen: React.FC<AccountSelectionScreenProps> = ({
  users,
  coopConfig,
  onSelectUser,
  onBackToWelcome,
  isCloudConnected = false,
}) => {
  // Separate users by role category
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'pengurus');
  const cashierUsers = users.filter((u) => u.role === 'kasir' || u.role === 'gudang');

  // If no specific users exist in category, fallback gracefully
  const effectiveAdmins = adminUsers.length > 0 ? adminUsers : users.slice(0, 1);
  const effectiveCashiers = cashierUsers.length > 0 ? cashierUsers : users;

  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    effectiveAdmins[0]?.id || ''
  );
  const [selectedCashierId, setSelectedCashierId] = useState<string>(
    effectiveCashiers[0]?.id || ''
  );

  const [hoveredCard, setHoveredCard] = useState<'admin' | 'cashier' | null>(null);

  const handleChooseAdmin = (user?: UserProfile) => {
    const target = user || effectiveAdmins.find((u) => u.id === selectedAdminId) || effectiveAdmins[0];
    if (target) {
      onSelectUser(target, 'dashboard');
    }
  };

  const handleChooseCashier = (user?: UserProfile) => {
    const target = user || effectiveCashiers.find((u) => u.id === selectedCashierId) || effectiveCashiers[0];
    if (target) {
      onSelectUser(target, 'pos');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-teal-100 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-emerald-50 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <button
          id="btn-back-to-welcome"
          onClick={onBackToWelcome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-700 hover:text-emerald-700 font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Layar Pembuka</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Supabase Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold shadow-2xs">
            <Cloud className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className={isCloudConnected ? 'text-emerald-800 font-bold' : 'text-slate-600'}>
              {isCloudConnected ? 'Supabase Terhubung' : 'Lokal / Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Header Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koperasi Amanah Baraya • RSUD Al-Mulk</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Pilih Akun Masuk
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 font-medium">
            Silakan pilih peran akun untuk melanjutkan transaksi penjualan kasir atau akses pengelolaan sistem koperasi.
          </p>
        </div>

        {/* Two Modern Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Card 1: Akun Administrator */}
          <div
            id="card-role-admin"
            onMouseEnter={() => setHoveredCard('admin')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group bg-white rounded-3xl border-2 transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-2xl ${
              hoveredCard === 'admin'
                ? 'border-emerald-600 shadow-emerald-900/10 -translate-y-1'
                : 'border-slate-200/90'
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wide border border-emerald-200">
                  Akses Penuh / Master
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Akun Administrator
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mb-6">
                Akses lengkap manajemen produk, stok & mutasi, data anggota, simpan pinjam, laporan keuangan & pengaturan sistem koperasi.
              </p>

              {/* User Selector for Admins */}
              <div className="space-y-2 mb-6">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Petugas Administrator:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {effectiveAdmins.map((user) => {
                    const isSelected = user.id === selectedAdminId;
                    return (
                      <div
                        key={user.id}
                        onClick={() => setSelectedAdminId(user.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${user.avatarColor || 'bg-emerald-700'} text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0`}
                          >
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {user.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {user.nipOrNik ? `NIP: ${user.nipOrNik}` : 'Petugas Pengelola'}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="btn-login-admin"
              onClick={() => handleChooseAdmin()}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition cursor-pointer"
            >
              <span>Masuk sebagai Administrator</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Akun Kasir */}
          <div
            id="card-role-kasir"
            onMouseEnter={() => setHoveredCard('cashier')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group bg-white rounded-3xl border-2 transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-2xl ${
              hoveredCard === 'cashier'
                ? 'border-emerald-600 shadow-emerald-900/10 -translate-y-1'
                : 'border-slate-200/90'
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wide border border-emerald-200">
                  Kasir POS & Transaksi
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Akun Kasir
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mb-6">
                Layanan transaksi kasir cepat (POS), pencarian barcode barang, diskon anggota RSUD Al-Mulk, dan cetak struk thermal otomatis.
              </p>

              {/* User Selector for Cashiers */}
              <div className="space-y-2 mb-6">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Petugas Kasir yang Bertugas:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {effectiveCashiers.map((user) => {
                    const isSelected = user.id === selectedCashierId;
                    return (
                      <div
                        key={user.id}
                        onClick={() => setSelectedCashierId(user.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${user.avatarColor || 'bg-emerald-600'} text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0`}
                          >
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {user.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {user.shift || 'Kasir Operasional'}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="btn-login-cashier"
              onClick={() => handleChooseCashier()}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition cursor-pointer"
            >
              <span>Masuk sebagai Kasir (Buka POS)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-200/60">
        <p className="font-semibold text-slate-600">
          {coopConfig.name || 'KOPERASI AMANAH BARAYA'} • {coopConfig.hospitalName || 'RSUD AL-MULK KOTA SUKABUMI'}
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Sistem Informasi Kasir, Inventaris Produk & Simpan Pinjam Terintegrasi Cloud Supabase
        </p>
      </footer>
    </div>
  );
};

export default AccountSelectionScreen;

import React, { useState } from 'react';
import { UserProfile, CoopConfig, isTabAccessibleForUser } from '../../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowDownLeft,
  FileText,
  Users,
  Settings,
  ChevronDown,
  X,
  Building2,
  ShieldCheck,
  PiggyBank,
  Landmark,
  UserCheck,
  LogOut,
  Store,
  Lock,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  coopConfig: CoopConfig;
  lowStockCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onLogoutOrSwitchScreen?: () => void;
  onReturnToWelcome?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  users,
  onSwitchUser,
  coopConfig,
  lowStockCount,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onLogoutOrSwitchScreen,
  onReturnToWelcome,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<{ isOpen: boolean; menuName: string } | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir / Penjualan', icon: ShoppingCart },
    { id: 'products', label: 'Produk', icon: Package },
    {
      id: 'stock',
      label: 'Stok & Mutasi',
      icon: ArrowDownLeft,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'members', label: 'Data Anggota', icon: UserCheck },
    { id: 'simpanpinjam', label: 'Simpan Pinjam', icon: Landmark },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'users', label: 'Data Pengguna', icon: Users },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const getRoleLabel = (role: string): string => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Kepala Toko';
      case 'pengurus':
        return 'Pengurus Koperasi';
      case 'gudang':
        return 'Pengelola Gudang';
      case 'kasir':
        return 'Petugas Kasir';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Pengguna';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 bg-emerald-700 text-white flex flex-col border-r border-emerald-800 transition-all duration-300 ease-in-out shrink-0 select-none print:hidden no-scrollbar ${
          isCollapsed ? 'w-[240px] lg:w-[68px]' : 'w-[240px]'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`pt-4 pb-3.5 px-3 flex flex-col items-center justify-center text-center bg-emerald-800/40 relative ${
          isCollapsed ? 'lg:px-1' : 'px-3'
        }`}>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden absolute top-3 right-3 p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Logo */}
          {coopConfig.logoUrl ? (
            <div className="flex items-center justify-center">
              <div className={`${isCollapsed ? 'w-10 h-10 rounded-xl' : 'w-13 h-13 sm:w-14 sm:h-14 rounded-2xl'} bg-white p-0.5 shrink-0 shadow-md border-2 border-emerald-400/50 flex items-center justify-center overflow-hidden transition-all duration-200`}>
                <img
                  src={coopConfig.logoUrl}
                  alt="Logo Koperasi"
                  className="w-full h-full object-contain p-0 scale-100"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : (
            <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold transition-all duration-200`}>
              <Building2 className="w-6 h-6 text-emerald-200" />
            </div>
          )}

          {/* Dynamic Brand Text - Hidden when collapsed */}
          {!isCollapsed && (coopConfig.name || coopConfig.hospitalName) && (
            <div className="w-full space-y-0.5 mt-2">
              {coopConfig.name && (
                <div className="text-[12px] font-black text-[#f7f7f7] uppercase tracking-tight leading-tight">
                  {coopConfig.name.replace(/karyawan\s*/gi, '').replace(/\s+/g, ' ').trim()}
                </div>
              )}
              {coopConfig.hospitalName && (
                <div className="text-[12px] font-bold text-white uppercase tracking-wider leading-tight">
                  {coopConfig.hospitalName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Premium Gold Gradient Line Header Divider */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-600/30 via-amber-300 via-yellow-200 to-amber-500/30 shadow-xs" />

        {/* Navigation List */}
        <nav className="flex-1 py-3 px-2 sm:px-2.5 overflow-y-auto space-y-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAccessible = isTabAccessibleForUser(item.id, currentUser);
            const isLocked = !isAccessible;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                title={isLocked ? `${item.label} (Terkunci - Khusus Kepala Toko)` : item.label}
                onClick={() => {
                  if (isLocked) {
                    setLockedNotice({ isOpen: true, menuName: item.label });
                    return;
                  }
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full py-2.5 transition-all duration-200 text-left font-semibold text-xs sm:text-sm relative group flex items-center rounded-xl sm:rounded-2xl cursor-pointer ${
                  isCollapsed ? 'px-0 lg:justify-center' : 'px-3.5 gap-3'
                } ${
                  isActive
                    ? 'neumorphism-sidebar-active text-amber-300 font-extrabold border-l-4 border-amber-300'
                    : isLocked
                    ? 'text-emerald-200/70 hover:bg-emerald-800/40 hover:text-white border-l-4 border-transparent opacity-85'
                    : 'text-emerald-100 hover:bg-emerald-600/70 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <div
                  className={`w-5 h-5 shrink-0 transition-transform flex items-center justify-center ${
                    isActive ? 'opacity-100 text-amber-300 animate-smooth-jump-5s' : 'opacity-85 group-hover:opacity-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-amber-300' : isLocked ? 'text-emerald-300/80' : 'text-emerald-100 group-hover:text-white'}`} />
                </div>
                {!isCollapsed && (
                  <span className={`truncate ${isActive ? 'text-amber-300 font-extrabold' : isLocked ? 'text-emerald-200/80' : 'text-emerald-100 group-hover:text-white font-bold'}`}>
                    {item.label}
                  </span>
                )}

                {/* Lock indicator for locked menu items */}
                {isLocked ? (
                  isCollapsed ? (
                    <span className="absolute top-1 right-1 p-0.5 rounded-full bg-amber-400/30 text-amber-300 ring-1 ring-amber-300/40" title="Terkunci">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-amber-300/90 font-medium bg-amber-400/20 px-1.5 py-0.5 rounded-md border border-amber-300/30">
                      <Lock className="w-3 h-3" />
                      <span className="text-[9px]">Kunci</span>
                    </span>
                  )
                ) : item.badge ? (
                  <span
                    className={`${
                      isCollapsed
                        ? 'absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-300 ring-2 ring-emerald-700'
                        : isActive
                        ? 'ml-auto px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black text-[9px] leading-tight border border-amber-300/40'
                        : 'ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white font-black text-[9px] leading-tight backdrop-blur-xs border border-white/30'
                    }`}
                  >
                    {!isCollapsed && item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Premium Gold Gradient Line Footer Divider */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-600/30 via-amber-300 via-yellow-200 to-amber-500/30 shadow-xs" />

        {/* User Card & Switcher in Footer */}
        <div className={`p-3 bg-emerald-800 relative ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title={currentUser.name}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-1' : 'justify-between gap-2.5 p-1'} rounded-lg hover:bg-emerald-700 transition text-left`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
              <div
                className={`w-8 h-8 rounded-full ${
                  currentUser.avatarColor || 'bg-teal-500'
                } flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs border border-white/20`}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-200 font-medium truncate flex items-center gap-1 mt-0.5">
                    <span className="font-semibold">{getRoleLabel(currentUser.role)}</span>
                    {currentUser.shift && currentUser.shift !== 'Akses Penuh Sistem' && (
                      <>
                        <span className="text-emerald-400/70">•</span>
                        <span className="text-emerald-300/80 text-[9px] truncate">
                          {currentUser.shift.replace(/\(.*\)/, '').trim()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-4 h-4 text-emerald-200 shrink-0" />}
          </button>

          {/* User selection dropdown */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight px-2.5 py-1">
                Ganti Akun / Petugas:
              </div>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto no-scrollbar">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left flex items-center gap-2 text-xs transition ${
                      u.id === currentUser.id
                        ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full ${u.avatarColor} text-white font-bold text-[9px] flex items-center justify-center shrink-0`}
                    >
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate flex-1 font-medium">{u.name}</span>
                    <span className="text-[9px] font-semibold uppercase text-slate-400 shrink-0">
                      {getRoleLabel(u.role)}
                    </span>
                  </button>
                ))}
              </div>

              {(onLogoutOrSwitchScreen || onReturnToWelcome) && (
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                  {onLogoutOrSwitchScreen && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogoutOrSwitchScreen();
                      }}
                      className="w-full p-2 rounded-lg text-left flex items-center gap-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ganti Akun Masuk</span>
                    </button>
                  )}
                  {onReturnToWelcome && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onReturnToWelcome();
                      }}
                      className="w-full p-2 rounded-lg text-left flex items-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kembali ke Layar Welcome</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Modal Peringatan Hak Akses Terkunci untuk Kasir */}
      {lockedNotice?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1.5">
              Menu {lockedNotice.menuName} Terkunci
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Akun Kasir (<strong>{currentUser.name}</strong>) hanya memiliki hak akses untuk menu: <strong>Dashboard</strong>, <strong>Kasir / Penjualan</strong>, <strong>Produk</strong>, serta <strong>Stok & Mutasi</strong>.
            </p>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 mb-5 text-left flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Menu <strong>{lockedNotice.menuName}</strong> terkunci dan hanya dapat diakses dengan akun <strong>Kepala Toko</strong>.</span>
            </div>
            <div className="space-y-2">
              {onLogoutOrSwitchScreen && (
                <button
                  onClick={() => {
                    setLockedNotice(null);
                    onLogoutOrSwitchScreen();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Ganti ke Akun Kepala Toko
                </button>
              )}
              <button
                onClick={() => setLockedNotice(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

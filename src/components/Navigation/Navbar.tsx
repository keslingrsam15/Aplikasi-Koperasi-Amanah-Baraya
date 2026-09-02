import React, { useState, useEffect } from 'react';
import { UserProfile, CoopConfig } from '../../types';
import { formatDateTimeIndo } from '../../utils/formatters';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Barcode,
  ArrowDownLeft,
  FileText,
  Users,
  Settings,
  Camera,
  AlertTriangle,
  ChevronDown,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  coopConfig: CoopConfig;
  lowStockCount: number;
  onOpenQuickScan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  users,
  onSwitchUser,
  coopConfig,
  lowStockCount,
  onOpenQuickScan,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [timeString, setTimeString] = useState(new Date().toLocaleTimeString('id-ID'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir POS', icon: ShoppingCart, highlight: true },
    { id: 'products', label: 'Master Barang', icon: Package },
    { id: 'barcodes', label: 'Cetak Barcode', icon: Barcode },
    { id: 'stock', label: 'Stok Barang', icon: ArrowDownLeft, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const getRoleLabel = (role: string): string => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrator';
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
      {/* Top institution banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-900 text-white px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
          <span className="font-extrabold uppercase tracking-tight text-emerald-200">
            {coopConfig.hospitalName}
          </span>
          <span className="text-white/40 hidden sm:inline">&bull;</span>
          <span className="font-semibold text-white/90 hidden sm:inline">
            Unit Kasir Koperasi Barcode Scanner
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-emerald-100/90">
          <div className="flex items-center space-x-1 font-mono">
            <Clock className="w-3 h-3 text-emerald-300" />
            <span>{timeString} WIB</span>
          </div>

          <button
            onClick={onOpenQuickScan}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition font-semibold"
          >
            <Camera className="w-3 h-3" />
            <span>Scan Cepat</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition">
              AB
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-sm text-slate-900 dark:text-white leading-tight tracking-tight">
                AMANAH BARAYA
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                RSUD AL-MULK
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active User Switcher */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <div
                className={`w-7 h-7 rounded-xl ${currentUser.avatarColor} text-white font-bold text-xs flex items-center justify-center`}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[110px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pengguna Aktif:</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold uppercase">
                    Role: {getRoleLabel(currentUser.role)}
                  </p>
                </div>

                <div className="py-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase px-3 pt-1">
                    Ganti Profil Kasir / Operator:
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left flex items-center space-x-2.5 transition text-xs mt-1 ${
                        u.id === currentUser.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg ${u.avatarColor} text-white font-bold text-[10px] flex items-center justify-center`}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate flex-1">
                        <div className="truncate">{u.name}</div>
                        <div className="text-[9px] text-slate-400 uppercase">{getRoleLabel(u.role)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

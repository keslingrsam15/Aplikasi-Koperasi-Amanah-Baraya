import React, { useState, useEffect } from 'react';
import { UserProfile, CoopConfig } from '../../types';
import { Menu } from 'lucide-react';

interface TopHeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onOpenQuickScan: () => void;
  onNavigateToPos: () => void;
  coopConfig: CoopConfig;
  currentUser: UserProfile;
  isCloudConnected?: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenQuickScan,
  onNavigateToPos,
  coopConfig,
  currentUser,
  isCloudConnected = false,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('id-ID');

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 print:hidden shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Hamburger Button (Desktop & Mobile) */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              onOpenMobileMenu();
            } else if (onToggleSidebar) {
              onToggleSidebar();
            }
          }}
          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 cursor-pointer"
          title={isSidebarCollapsed ? "Tampilkan Menu Sidebar" : "Sembunyikan Menu Sidebar"}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5 text-emerald-700" />
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Live Date & Time Display Widget - Elegant & Premium (No Icons) */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-50/90 hover:bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors select-none">
          <div className="text-right sm:text-left">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 tracking-tight capitalize select-text">
              {formattedDate}
            </span>
          </div>
          <div className="h-3.5 w-[1px] bg-slate-300" />
          <div className="flex items-baseline gap-1 font-mono select-text">
            <span className="text-xs sm:text-sm font-extrabold text-emerald-950 tracking-tight tabular-nums">
              {formattedTime}
            </span>
            <span className="text-[10px] font-bold text-amber-600 tracking-wider">
              WIB
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

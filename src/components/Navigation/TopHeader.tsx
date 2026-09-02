import React, { useState, useEffect } from 'react';
import { UserProfile, CoopConfig } from '../../types';
import {
  Menu,
  Clock,
  Calendar,
} from 'lucide-react';

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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
        {/* Live Date & Time Display Widget */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="text-xs font-black text-slate-800 font-mono tracking-tight">
              {formattedTime} WIB
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

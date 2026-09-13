import React from 'react';
import { Transaction, Product, StockMutation, UserProfile, CoopConfig } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { BannerSlider } from './BannerSlider';
import { SalesActivityChart } from './SalesActivityChart';
import { RecentTransactionsTable } from './RecentTransactionsTable';
import { ChevronRight } from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  products: Product[];
  mutations: StockMutation[];
  currentUser: UserProfile;
  coopConfig: CoopConfig;
  onNavigate: (tab: string) => void;
  onOpenQuickScan: () => void;
  onViewReceipt: (transaction: Transaction) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  products,
  currentUser,
  coopConfig,
  onNavigate,
  onViewReceipt,
}) => {
  const todayStr = new Date().toDateString();
  const transactionsToday = transactions.filter(
    (t) => new Date(t.date).toDateString() === todayStr
  );

  const salesToday = transactionsToday.reduce((sum, t) => sum + t.grandTotal, 0);
  const profitToday = transactionsToday.reduce((sum, t) => sum + t.totalProfit, 0);
  const itemsSoldToday = transactionsToday.reduce((sum, t) => sum + t.totalItems, 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  return (
    <div className="space-y-6">
      {/* 0. Banner Slider Promosi & Pengumuman Koperasi */}
      {coopConfig.showBannerSlider !== false && (
        <BannerSlider
          slides={coopConfig.bannerSlides}
          autoPlayInterval={coopConfig.bannerAutoPlayInterval || 5}
          onNavigate={onNavigate}
          onManageBanners={() => onNavigate('settings')}
          canManage={currentUser.role === 'admin' || currentUser.role === 'pengurus'}
        />
      )}

      {/* 1. Main Neumorphism Metric 4-Card Grid with Varied Bottom Border Lines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Penjualan Hari Ini (Garis Hijau Emerald) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-white/80 shadow-[6px_6px_16px_rgba(203,213,225,0.5),-6px_-6px_16px_rgba(255,255,255,0.95)] border-b-4 border-b-emerald-500 hover:translate-y-[-2px] transition-all">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight mb-1">
            Penjualan Hari Ini
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {formatRupiah(salesToday)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
            <span className="font-bold">+{formatRupiah(profitToday)}</span>
            <span className="text-slate-400 font-normal">&bull; Est. Laba</span>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi (Garis Biru Sky) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-white/80 shadow-[6px_6px_16px_rgba(203,213,225,0.5),-6px_-6px_16px_rgba(255,255,255,0.95)] border-b-4 border-b-sky-500 hover:translate-y-[-2px] transition-all">
          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-tight mb-1">
            Jumlah Transaksi
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {transactionsToday.length}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1.5">
            {itemsSoldToday} unit barang kasir terjual
          </div>
        </div>

        {/* Card 3: Total Produk (Garis Nila Indigo) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-white/80 shadow-[6px_6px_16px_rgba(203,213,225,0.5),-6px_-6px_16px_rgba(255,255,255,0.95)] border-b-4 border-b-indigo-500 hover:translate-y-[-2px] transition-all">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight mb-1">
            Total Produk
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {products.length}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1.5">
            {Array.from(new Set(products.map((p) => p.category))).length} Kategori aktif
          </div>
        </div>

        {/* Card 4: Stok Menipis (Garis Oranye Amber Alert) */}
        <div
          onClick={() => onNavigate('stock')}
          className="bg-slate-50 p-5 rounded-2xl border border-white/80 shadow-[6px_6px_16px_rgba(203,213,225,0.5),-6px_-6px_16px_rgba(255,255,255,0.95)] border-b-4 border-b-amber-500 hover:translate-y-[-2px] transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-tight mb-1">
            Stok Menipis
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tracking-tight font-mono">
            {lowStockProducts.length}
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center justify-between">
            <span>{outOfStockProducts.length > 0 ? `${outOfStockProducts.length} Habis total` : 'Perlu restock segera'}</span>
            <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 2. Real-time Interactive Sales Activity Chart with Multi-period Filters */}
      <SalesActivityChart
        transactions={transactions}
        onNavigateToPos={() => onNavigate('pos')}
        onNavigateToReports={() => onNavigate('reports')}
      />

      {/* 3. Recent Transactions Table with Receipt Popup & History Preview */}
      <RecentTransactionsTable
        transactions={transactions}
        coopConfig={coopConfig}
        onNavigateToReports={() => onNavigate('reports')}
        onViewReceipt={onViewReceipt}
      />
    </div>
  );
};


import React from 'react';
import { Transaction, Product, StockMutation, UserProfile, CoopConfig } from '../../types';
import { formatRupiah, formatDateTimeIndo } from '../../utils/formatters';
import { BannerSlider } from './BannerSlider';
import {
  TrendingUp,
  Receipt,
  ChevronRight,
} from 'lucide-react';

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

  // Hourly distribution for today's chart
  const hourlyBuckets: Record<string, number> = {
    '07:00': 0,
    '09:00': 0,
    '11:00': 0,
    '13:00': 0,
    '15:00': 0,
    '17:00': 0,
    '19:00': 0,
  };

  transactions.slice(-20).forEach((t) => {
    const d = new Date(t.date);
    const hour = d.getHours();
    if (hour < 9) hourlyBuckets['07:00'] += t.grandTotal;
    else if (hour < 11) hourlyBuckets['09:00'] += t.grandTotal;
    else if (hour < 13) hourlyBuckets['11:00'] += t.grandTotal;
    else if (hour < 15) hourlyBuckets['13:00'] += t.grandTotal;
    else if (hour < 17) hourlyBuckets['15:00'] += t.grandTotal;
    else if (hour < 19) hourlyBuckets['17:00'] += t.grandTotal;
    else hourlyBuckets['19:00'] += t.grandTotal;
  });

  const maxBucketValue = Math.max(1, ...Object.values(hourlyBuckets));

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

      {/* 2. Bottom: Sales Hourly Visualizer & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Activity Graph */}
        <div className="lg:col-span-6 bg-slate-50 p-5.5 rounded-3xl border border-white/80 shadow-[8px_8px_20px_rgba(203,213,225,0.5),-8px_-8px_20px_rgba(255,255,255,0.95)] border-b-4 border-b-teal-500 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Aktivitas Grafik Penjualan Hari Ini
              </h3>
              <p className="text-[11px] text-slate-400">Distribusi omzet per jam transaksi</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
            >
              <span>Laporan Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-3 pb-1">
            <div className="h-40 flex items-end justify-between gap-2 px-2 border-b border-slate-200/80">
              {Object.entries(hourlyBuckets).map(([hour, val]) => {
                const heightPercent = Math.max(10, Math.round((val / maxBucketValue) * 100));
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatRupiah(val)}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 ${
                        val > 0
                          ? 'bg-teal-600 group-hover:bg-teal-500'
                          : 'bg-slate-200/80'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-400 pt-1">
                      {hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-6 bg-slate-50 p-5.5 rounded-3xl border border-white/80 shadow-[8px_8px_20px_rgba(203,213,225,0.5),-8px_-8px_20px_rgba(255,255,255,0.95)] border-b-4 border-b-cyan-500 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              Transaksi Nota Terbaru
            </h3>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-teal-600 hover:underline"
            >
              Lihat Rekap
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2 px-2.5">No. Struk</th>
                  <th className="py-2 px-2.5">Waktu</th>
                  <th className="py-2 px-2.5">Pelanggan</th>
                  <th className="py-2 px-2.5 text-right">Total</th>
                  <th className="py-2 px-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      Belum ada transaksi hari ini.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 4).map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-2.5 font-mono font-semibold text-teal-600">
                        {trx.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-500 text-[11px]">
                        {formatDateTimeIndo(trx.date)}
                      </td>
                      <td className="py-2.5 px-2.5 font-medium truncate max-w-[100px]">
                        {trx.customerName || trx.customerType.toUpperCase()}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold font-mono">
                        {formatRupiah(trx.grandTotal)}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          onClick={() => onViewReceipt(trx)}
                          className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded text-[10px] font-semibold transition"
                        >
                          Struk
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

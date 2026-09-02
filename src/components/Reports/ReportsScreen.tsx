import React, { useState, useMemo } from 'react';
import { Transaction, Product, CoopConfig, Member, LoanRecord, SavingsRecord } from '../../types';
import { formatRupiah, formatDateTimeIndo, formatDateIndo, exportToCSV } from '../../utils/formatters';
import {
  downloadSalesReportPdf,
  downloadShuReportPdf,
  downloadStockReportPdf,
} from '../../utils/pdfGenerator';
import { ReceiptModal } from '../Cashier/ReceiptModal';
import {
  FileText,
  TrendingUp,
  Award,
  DollarSign,
  Package,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Percent,
  Layers,
  Users,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsScreenProps {
  transactions: Transaction[];
  products: Product[];
  members: Member[];
  savingsRecords: SavingsRecord[];
  loans: LoanRecord[];
  coopConfig: CoopConfig;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  transactions,
  products,
  members,
  savingsRecords,
  loans,
  coopConfig,
}) => {
  // Main Tab State: 'sales' | 'shu' | 'stock'
  const [mainTab, setMainTab] = useState<'sales' | 'shu' | 'stock'>('sales');

  // Sales tab states
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly'>('daily');
  const [searchInvoice, setSearchInvoice] = useState<string>('');
  const [selectedReceiptTrx, setSelectedReceiptTrx] = useState<Transaction | null>(null);

  // SHU tab states
  const [shuYear, setShuYear] = useState<number>(new Date().getFullYear());
  const [operationalCost, setOperationalCost] = useState<number>(
    coopConfig.shuConfig?.biayaOperasionalKoperasi || 0
  );
  const [jasaModalPct, setJasaModalPct] = useState<number>(
    coopConfig.shuConfig?.jasaModalPercent ?? 40
  );
  const [jasaUsahaPct, setJasaUsahaPct] = useState<number>(
    coopConfig.shuConfig?.jasaUsahaPercent ?? 30
  );
  const [cadanganPct, setCadanganPct] = useState<number>(
    coopConfig.shuConfig?.danaCadanganPercent ?? 20
  );
  const [pengurusPct, setPengurusPct] = useState<number>(
    coopConfig.shuConfig?.danaPengurusPercent ?? 10
  );

  // Stock tab states
  const [stockFilterCategory, setStockFilterCategory] = useState<string>('ALL');
  const [stockSearch, setStockSearch] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'low' | 'out' | 'safe'>('ALL');

  /* ==========================================================================
     1. LOGIKA LAPORAN PENJUALAN
     ========================================================================== */
  const now = new Date();
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const trxDate = new Date(trx.date);
      if (timeRange === 'today') {
        return trxDate.toDateString() === now.toDateString();
      }
      if (timeRange === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
        return trxDate >= oneWeekAgo;
      }
      if (timeRange === 'month') {
        return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'year') {
        return trxDate.getFullYear() === now.getFullYear();
      }
      return true;
    }).filter((trx) => {
      return (
        trx.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        trx.cashierName.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        (trx.customerName && trx.customerName.toLowerCase().includes(searchInvoice.toLowerCase())) ||
        (trx.memberNumber && trx.memberNumber.toLowerCase().includes(searchInvoice.toLowerCase()))
      );
    });
  }, [transactions, timeRange, searchInvoice]);

  const salesSummary = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
    const totalCOGS = filteredTransactions.reduce((sum, t) => sum + t.totalCost, 0);
    const totalGrossProfit = filteredTransactions.reduce((sum, t) => sum + t.totalProfit, 0);
    const totalItemsSold = filteredTransactions.reduce((sum, t) => sum + t.totalItems, 0);
    const overallMarginPercent =
      totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalCOGS,
      totalGrossProfit,
      totalItemsSold,
      totalTransactions: filteredTransactions.length,
      overallMarginPercent,
    };
  }, [filteredTransactions]);

  // Product sales mapping for top sellers
  const productSalesMap = useMemo(() => {
    const map: Record<
      string,
      { product: Product; totalQty: number; totalRevenue: number; totalProfit: number }
    > = {};

    filteredTransactions.forEach((trx) => {
      trx.items.forEach((item) => {
        if (!map[item.product.id]) {
          map[item.product.id] = {
            product: item.product,
            totalQty: 0,
            totalRevenue: 0,
            totalProfit: 0,
          };
        }
        map[item.product.id].totalQty += item.quantity;
        map[item.product.id].totalRevenue += item.subtotal;
        map[item.product.id].totalProfit +=
          item.subtotal - item.product.buyPrice * item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
  }, [filteredTransactions]);

  // Chart data: Daily (last 7 / 14 days) or Monthly (12 months)
  const chartData = useMemo(() => {
    if (chartPeriod === 'daily') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

        const dayTrxs = transactions.filter((t) => t.date.startsWith(dateStr));
        const omzet = dayTrxs.reduce((s, t) => s + t.grandTotal, 0);
        const profit = dayTrxs.reduce((s, t) => s + t.totalProfit, 0);

        days.push({
          label: dayLabel,
          omzet,
          profit,
          count: dayTrxs.length,
        });
      }
      return days;
    } else {
      // 12 months of current year
      const months = [];
      const currentYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const monthDate = new Date(currentYear, m, 1);
        const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'short' });
        const monthStr = `${currentYear}-${String(m + 1).padStart(2, '0')}`;

        const monthTrxs = transactions.filter((t) => t.date.startsWith(monthStr));
        const omzet = monthTrxs.reduce((s, t) => s + t.grandTotal, 0);
        const profit = monthTrxs.reduce((s, t) => s + t.totalProfit, 0);

        months.push({
          label: monthLabel,
          omzet,
          profit,
          count: monthTrxs.length,
        });
      }
      return months;
    }
  }, [transactions, chartPeriod]);

  const maxChartValue = Math.max(1000, ...chartData.map((d) => d.omzet));

  // Export Sales Excel / CSV
  const handleExportSalesCSV = () => {
    const headers = [
      'No. Faktur',
      'Tanggal & Waktu',
      'Kasir',
      'Pelanggan / Anggota',
      'Metode Bayar',
      'Item Terjual',
      'Total Belanja (Rp)',
      'HPP Total (Rp)',
      'Laba Kotor (Rp)',
    ];

    const rows = filteredTransactions.map((t) => [
      t.invoiceNumber,
      formatDateTimeIndo(t.date),
      t.cashierName,
      t.customerName || (t.customerType === 'anggota' ? `Anggota (${t.memberNumber})` : t.customerType),
      t.paymentMethod.toUpperCase(),
      t.items.map((it) => `${it.product.name} (${it.quantity}x)`).join(', '),
      t.grandTotal,
      t.totalCost,
      t.totalProfit,
    ]);

    exportToCSV(`Laporan_Penjualan_Koperasi_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['LAPORAN PENJUALAN KASIR KOPERASI AMANAH BARAYA - RSUD AL-MULK'],
      [`Periode: ${timeRange.toUpperCase()} | Total Transaksi: ${filteredTransactions.length}`],
      [`Total Omzet: ${formatRupiah(salesSummary.totalRevenue)}`],
      [`Total Laba Kotor: ${formatRupiah(salesSummary.totalGrossProfit)}`],
      [],
      headers,
      ...rows,
    ]);
  };

  // Export Sales PDF
  const handleExportSalesPDF = () => {
    const top5 = productSalesMap.slice(0, 5).map((p) => ({
      name: p.product.name,
      qty: p.totalQty,
      revenue: p.totalRevenue,
    }));

    downloadSalesReportPdf(
      'Laporan Penjualan Kasir Koperasi',
      timeRange.toUpperCase(),
      salesSummary,
      top5,
      filteredTransactions,
      coopConfig
    );
  };

  /* ==========================================================================
     2. LOGIKA LAPORAN SHU (SISA HASIL USAHA)
     ========================================================================== */
  // Filter transactions and loans by SHU year
  const shuYearTransactions = useMemo(() => {
    return transactions.filter((t) => new Date(t.date).getFullYear() === shuYear);
  }, [transactions, shuYear]);

  const shuYearLoans = useMemo(() => {
    return loans.filter((l) => new Date(l.createdAt).getFullYear() === shuYear);
  }, [loans, shuYear]);

  // 1) Laba Bersih Usaha Toko (dari Penjualan Kasir)
  const labaToko = shuYearTransactions.reduce((sum, t) => sum + t.totalProfit, 0);

  // 2) Pendapatan Jasa Pinjaman Anggota
  const pendapatanJasaPinjaman = shuYearLoans.reduce((sum, l) => {
    const totalJasa = (l.amount * (l.interestRate / 100)) * l.tenorMonths;
    // Jasa diakui sebanding dengan yang sudah terbayar
    const ratio = l.totalRepayment > 0 ? l.totalPaid / l.totalRepayment : 1;
    return sum + Math.round(totalJasa * ratio);
  }, 0);

  // 3) Total SHU Kotor & SHU Bersih
  const totalShuKotor = labaToko + pendapatanJasaPinjaman;
  const totalShuBersih = Math.max(0, totalShuKotor - operationalCost);

  // 4) Alokasi Pembagian SHU Sesuai AD/ART Koperasi
  const jasaModalAlloc = Math.round(totalShuBersih * (jasaModalPct / 100));
  const jasaUsahaAlloc = Math.round(totalShuBersih * (jasaUsahaPct / 100));
  const danaCadanganAlloc = Math.round(totalShuBersih * (cadanganPct / 100));
  const danaPengurusAlloc = Math.round(totalShuBersih * (pengurusPct / 100));

  // 5) Total Simpanan seluruh anggota & Total Belanja seluruh anggota
  const totalAllMembersSavings = members.reduce(
    (sum, m) => sum + (m.simpananPokok + m.simpananWajib + m.simpananSukarela),
    0
  );

  const totalAllMembersShopping = shuYearTransactions
    .filter((t) => t.customerType === 'anggota' || t.memberId || t.memberNumber)
    .reduce((sum, t) => sum + t.grandTotal, 0);

  // 6) Pembagian SHU per Anggota
  const memberShuList = useMemo(() => {
    return members.map((member) => {
      const memberTotalSavings =
        member.simpananPokok + member.simpananWajib + member.simpananSukarela;

      // Calculate total belanja by this member
      const memberShoppingTrxs = shuYearTransactions.filter(
        (t) =>
          t.memberId === member.id ||
          t.memberNumber === member.memberNumber ||
          (t.customerName && t.customerName.toLowerCase() === member.name.toLowerCase())
      );
      const memberTotalShopping = memberShoppingTrxs.reduce((sum, t) => sum + t.grandTotal, 0);

      // SHU Jasa Modal (Simpanan)
      const shuModal =
        totalAllMembersSavings > 0
          ? Math.round((memberTotalSavings / totalAllMembersSavings) * jasaModalAlloc)
          : 0;

      // SHU Jasa Usaha (Belanja)
      const shuUsaha =
        totalAllMembersShopping > 0
          ? Math.round((memberTotalShopping / totalAllMembersShopping) * jasaUsahaAlloc)
          : 0;

      const totalShu = shuModal + shuUsaha;

      return {
        id: member.id,
        memberNumber: member.memberNumber,
        name: member.name,
        unitKerja: member.unitKerja,
        totalSimpanan: memberTotalSavings,
        shuModal,
        totalBelanja: memberTotalShopping,
        shuUsaha,
        totalShu,
      };
    }).sort((a, b) => b.totalShu - a.totalShu);
  }, [
    members,
    shuYearTransactions,
    totalAllMembersSavings,
    totalAllMembersShopping,
    jasaModalAlloc,
    jasaUsahaAlloc,
  ]);

  const handleExportShuCSV = () => {
    const headers = [
      'No',
      'Nomor Anggota',
      'Nama Anggota',
      'Unit Kerja RSUD',
      'Total Simpanan (Rp)',
      'SHU Jasa Modal (Rp)',
      'Total Belanja Toko (Rp)',
      'SHU Jasa Belanja (Rp)',
      'TOTAL SHU DITERIMA (Rp)',
    ];

    const rows = memberShuList.map((m, idx) => [
      idx + 1,
      m.memberNumber,
      m.name,
      m.unitKerja,
      m.totalSimpanan,
      m.shuModal,
      m.totalBelanja,
      m.shuUsaha,
      m.totalShu,
    ]);

    exportToCSV(`Laporan_SHU_Koperasi_${shuYear}.csv`, [
      [`LAPORAN SISA HASIL USAHA (SHU) KOPERASI AMANAH BARAYA - TAHUN ${shuYear}`],
      [`RSUD AL-MULK KOTA SUKABUMI`],
      [`Laba Bersih Toko/Kasir: ${formatRupiah(labaToko)}`],
      [`Pendapatan Jasa Pinjaman: ${formatRupiah(pendapatanJasaPinjaman)}`],
      [`Beban Operasional Koperasi: ${formatRupiah(operationalCost)}`],
      [`Total SHU Bersih Koperasi: ${formatRupiah(totalShuBersih)}`],
      [`Alokasi Jasa Modal (${jasaModalPct}%): ${formatRupiah(jasaModalAlloc)}`],
      [`Alokasi Jasa Usaha/Belanja (${jasaUsahaPct}%): ${formatRupiah(jasaUsahaAlloc)}`],
      [],
      headers,
      ...rows,
    ]);
  };

  const handleExportShuPDF = () => {
    downloadShuReportPdf(
      shuYear,
      {
        labaToko,
        pendapatanJasaPinjaman,
        biayaOperasional: operationalCost,
        totalShuBersih,
        jasaModalAlloc,
        jasaUsahaAlloc,
        danaCadanganAlloc,
        danaPengurusAlloc,
      },
      memberShuList,
      coopConfig
    );
  };

  /* ==========================================================================
     3. LOGIKA LAPORAN STOK & PERSEDIAAN
     ========================================================================== */
  const stockCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filteredStockProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(stockSearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(stockSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(stockSearch.toLowerCase());

      const matchCat = stockFilterCategory === 'ALL' || p.category === stockFilterCategory;

      let matchStatus = true;
      if (stockStatusFilter === 'out') matchStatus = p.stock <= 0;
      else if (stockStatusFilter === 'low') matchStatus = p.stock > 0 && p.stock <= p.minStock;
      else if (stockStatusFilter === 'safe') matchStatus = p.stock > p.minStock;

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, stockSearch, stockFilterCategory, stockStatusFilter]);

  const totalInventoryBuyValue = products.reduce((sum, p) => sum + p.buyPrice * p.stock, 0);
  const totalInventorySellValue = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
  const potentialInventoryProfit = totalInventorySellValue - totalInventoryBuyValue;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const safeStockCount = products.filter((p) => p.stock > p.minStock).length;

  const handleExportStockCSV = () => {
    const headers = [
      'No',
      'Kode Barang',
      'Barcode',
      'Nama Barang',
      'Kategori',
      'Stok Saat Ini',
      'Satuan',
      'Stok Minimum',
      'HPP / Beli (Rp)',
      'Harga Jual (Rp)',
      'Total Nilai HPP (Rp)',
      'Total Nilai Jual (Rp)',
      'Status Stok',
    ];

    const rows = filteredStockProducts.map((p, idx) => [
      idx + 1,
      p.code,
      p.barcode,
      p.name,
      p.category,
      p.stock,
      p.unit,
      p.minStock,
      p.buyPrice,
      p.sellPrice,
      p.buyPrice * p.stock,
      p.sellPrice * p.stock,
      p.stock <= 0 ? 'HABIS' : p.stock <= p.minStock ? 'MENIPIS' : 'AMAN',
    ]);

    exportToCSV(`Laporan_Stok_Koperasi_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['LAPORAN PERSEDIAAN & VALUASI STOK KOPERASI AMANAH BARAYA - RSUD AL-MULK'],
      [`Total SKU Barang: ${products.length}`],
      [`Total Valuasi HPP Aset: ${formatRupiah(totalInventoryBuyValue)}`],
      [`Estimasi Nilai Jual Aset: ${formatRupiah(totalInventorySellValue)}`],
      [],
      headers,
      ...rows,
    ]);
  };

  const handleExportStockPDF = () => {
    downloadStockReportPdf(filteredStockProducts, coopConfig);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan & Akuntansi Koperasi</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Laporan Penjualan Kasir, Sisa Hasil Usaha (SHU) Anggota, dan Laporan Persediaan Stok Barang
            </p>
          </div>
        </div>

        {/* 3 Main Tab Buttons */}
        <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setMainTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'sales'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. Laporan Penjualan</span>
          </button>

          <button
            onClick={() => setMainTab('shu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'shu'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>2. Laporan SHU</span>
          </button>

          <button
            onClick={() => setMainTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'stock'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>3. Laporan Stok</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: LAPORAN PENJUALAN
          ========================================================================= */}
      {mainTab === 'sales' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Periode:
              </span>
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: 'week', label: '7 Hari Terakhir' },
                { id: 'month', label: 'Bulan Ini' },
                { id: 'year', label: 'Tahun Ini' },
                { id: 'all', label: 'Semua Waktu' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTimeRange(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    timeRange === p.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSalesCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Excel / CSV</span>
              </button>

              <button
                onClick={handleExportSalesPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Omzet Penjualan</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(salesSummary.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Dari {salesSummary.totalTransactions} struk transaksi
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Laba Kotor</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                {formatRupiah(salesSummary.totalGrossProfit)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                Margin Rata-rata: {salesSummary.overallMarginPercent}%
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total HPP Barang Terjual</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(salesSummary.totalCOGS)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Modal beli barang yang terjual</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Kuantitas Terjual</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {salesSummary.totalItemsSold}{' '}
                <span className="text-sm font-medium text-slate-500">Item</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Seluruh varian barang kasir</div>
            </div>
          </div>

          {/* Interactive Sales Chart (Harian vs Bulanan) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Grafik Penjualan & Omzet Koperasi</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi performa omzet harian atau bulanan
                </p>
              </div>

              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setChartPeriod('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    chartPeriod === 'daily'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grafik Harian (7 Hari)
                </button>
                <button
                  onClick={() => setChartPeriod('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    chartPeriod === 'monthly'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grafik Bulanan (Tahun {now.getFullYear()})
                </button>
              </div>
            </div>

            {/* Custom Bar Visualization */}
            <div className="pt-4 pb-2">
              <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-48 border-b border-slate-200 px-2">
                {chartData.map((item, idx) => {
                  const heightPercent =
                    maxChartValue > 0 ? Math.min(100, Math.max(8, (item.omzet / maxChartValue) * 100)) : 8;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-slate-900 text-white px-2 py-0.5 rounded-md shadow-xs">
                        {formatRupiah(item.omzet)}
                      </div>

                      <div
                        className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all duration-500 hover:brightness-110 relative"
                        style={{ height: `${heightPercent}%` }}
                      />

                      <div className="text-[10px] font-bold text-slate-500 truncate text-center w-full mt-1">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Selling Ranking & Transactions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Produk Terlaris</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Top Ranking</span>
              </div>

              {productSalesMap.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada data penjualan pada periode ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {productSalesMap.slice(0, 6).map((item, idx) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400">{item.product.category}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-800 text-xs">
                          {item.totalQty} {item.product.unit}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          {formatRupiah(item.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rincian Transaksi */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Rincian Transaksi Kasir</h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan {filteredTransactions.length} transaksi penjualan
                  </p>
                </div>

                <div className="w-48 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchInvoice}
                    onChange={(e) => setSearchInvoice(e.target.value)}
                    placeholder="Cari faktur / nama..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1 max-h-[380px]">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    Tidak ada transaksi pada filter yang dipilih.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-3">No. Faktur</th>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">Pelanggan</th>
                        <th className="p-3">Metode</th>
                        <th className="p-3 text-right">Total Belanja</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {trx.invoiceNumber}
                          </td>
                          <td className="p-3 text-slate-600">{formatDateTimeIndo(trx.date)}</td>
                          <td className="p-3 font-medium text-slate-800">
                            {trx.customerName || (trx.customerType === 'anggota' ? 'Anggota Koperasi' : 'Umum')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                                trx.paymentMethod === 'potong_gaji'
                                  ? 'bg-purple-100 text-purple-800'
                                  : trx.paymentMethod === 'qris'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {trx.paymentMethod === 'potong_gaji' ? 'Potong Gaji' : trx.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            {formatRupiah(trx.grandTotal)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedReceiptTrx(trx)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                              title="Lihat & Cetak Struk"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LAPORAN SHU (SISA HASIL USAHA)
          ========================================================================= */}
      {mainTab === 'shu' && (
        <div className="space-y-6">
          {/* Toolbar SHU */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Tahun Buku SHU:
              </span>
              <select
                value={shuYear}
                onChange={(e) => setShuYear(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun Buku {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportShuCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Excel / CSV</span>
              </button>

              <button
                onClick={handleExportShuPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Export PDF Laporan SHU</span>
              </button>
            </div>
          </div>

          {/* Rincian Sumber SHU & Formula Alokasi */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kartu Ringkasan Perhitungan SHU */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 rounded-3xl text-white shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  Total SHU Bersih Tahun {shuYear}
                </span>
                <Percent className="w-5 h-5 text-emerald-300" />
              </div>

              <div className="text-3xl font-black text-white">{formatRupiah(totalShuBersih)}</div>

              <div className="space-y-2 text-xs pt-3 border-t border-emerald-700/60 text-emerald-100/90">
                <div className="flex justify-between">
                  <span>1. Laba Usaha Toko/Kasir:</span>
                  <span className="font-bold text-white">{formatRupiah(labaToko)}</span>
                </div>
                <div className="flex justify-between">
                  <span>2. Jasa Pinjaman Anggota:</span>
                  <span className="font-bold text-white">{formatRupiah(pendapatanJasaPinjaman)}</span>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>3. Beban Operasional:</span>
                  <span className="font-bold">- {formatRupiah(operationalCost)}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-emerald-300">
                SHU siap dibagikan kepada seluruh anggota yang berpartisipasi secara adil & proporsional.
              </div>
            </div>

            {/* Pengaturan Alokasi AD/ART */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Alokasi Pembagian SHU (AD/ART Koperasi)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Persentase pembagian laba usaha untuk anggota dan pengembangan koperasi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-800">Jasa Modal (Simpanan)</div>
                  <div className="text-lg font-black text-emerald-700 mt-1">{jasaModalPct}%</div>
                  <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {formatRupiah(jasaModalAlloc)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Dibagi per saldo simpanan</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="text-[11px] font-bold text-blue-800">Jasa Usaha (Belanja)</div>
                  <div className="text-lg font-black text-blue-700 mt-1">{jasaUsahaPct}%</div>
                  <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {formatRupiah(jasaUsahaAlloc)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Dibagi per transaksi belanja</div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl">
                  <div className="text-[11px] font-bold text-purple-800">Dana Cadangan</div>
                  <div className="text-lg font-black text-purple-700 mt-1">{cadanganPct}%</div>
                  <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {formatRupiah(danaCadanganAlloc)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Penguatan modal koperasi</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="text-[11px] font-bold text-amber-800">Pengurus & Karyawan</div>
                  <div className="text-lg font-black text-amber-700 mt-1">{pengurusPct}%</div>
                  <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {formatRupiah(danaPengurusAlloc)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Insentif pengelola</div>
                </div>
              </div>

              {/* Setting Operasional Cepat */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold">Input Beban Operasional:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={operationalCost}
                      onChange={(e) => setOperationalCost(parseFloat(e.target.value) || 0)}
                      className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none w-36"
                    />
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  Total Anggota Terdaftar: {members.length} Orang
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Pembagian SHU per Anggota */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Pembagian SHU per Anggota Koperasi
                </h3>
                <p className="text-xs text-slate-500">
                  Dihitung secara proporsional berdasarkan saldo simpanan dan akumulasi belanja kasir
                </p>
              </div>
            </div>

            {memberShuList.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Belum ada data anggota untuk perhitungan SHU.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">Nomor & Nama Anggota</th>
                      <th className="p-4">Unit Kerja di RSUD</th>
                      <th className="p-4 text-right">Saldo Simpanan</th>
                      <th className="p-4 text-right text-emerald-700">SHU Modal (40%)</th>
                      <th className="p-4 text-right">Total Belanja Toko</th>
                      <th className="p-4 text-right text-blue-700">SHU Usaha (30%)</th>
                      <th className="p-4 text-right font-black">TOTAL SHU DITERIMA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberShuList.map((m, index) => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{m.memberNumber}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{m.unitKerja}</td>
                        <td className="p-4 text-right text-slate-700 font-medium">
                          {formatRupiah(m.totalSimpanan)}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-700">
                          {formatRupiah(m.shuModal)}
                        </td>
                        <td className="p-4 text-right text-slate-700 font-medium">
                          {formatRupiah(m.totalBelanja)}
                        </td>
                        <td className="p-4 text-right font-bold text-blue-700">
                          {formatRupiah(m.shuUsaha)}
                        </td>
                        <td className="p-4 text-right font-black text-sm text-emerald-800 bg-emerald-50/50">
                          {formatRupiah(m.totalShu)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LAPORAN STOK & PERSEDIAAN
          ========================================================================= */}
      {mainTab === 'stock' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Cari barang, kode, barcode, kategori..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={stockFilterCategory}
                onChange={(e) => setStockFilterCategory(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                {stockCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none"
              >
                <option value="ALL">Semua Status Stok</option>
                <option value="low">Stok Menipis Saja</option>
                <option value="out">Stok Habis (0)</option>
                <option value="safe">Stok Aman</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportStockCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleExportStockPDF}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Export PDF Stok</span>
              </button>
            </div>
          </div>

          {/* Valuasi Aset Metrik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Valuasi HPP Aset Barang</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(totalInventoryBuyValue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Modal persediaan saat ini</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Estimasi Nilai Jual Aset</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                {formatRupiah(totalInventorySellValue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Potensi pendapatan kotor</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Potensi Laba Tertahan</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(potentialInventoryProfit)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Estimasi selisih keuntungan</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Kondisi Status Stok</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {products.length} <span className="text-xs font-normal text-slate-500">SKU</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="text-rose-600 font-bold">{outOfStockCount} Habis</span>
                <span>&bull;</span>
                <span className="text-amber-600 font-bold">{lowStockCount} Menipis</span>
                <span>&bull;</span>
                <span className="text-emerald-600 font-bold">{safeStockCount} Aman</span>
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tabel Lengkap Persediaan Barang</h3>
                <p className="text-xs text-slate-500">
                  Menampilkan {filteredStockProducts.length} dari {products.length} barang terdaftar
                </p>
              </div>
            </div>

            {filteredStockProducts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Belum ada produk atau tidak ada barang yang sesuai filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">Kode & Nama Barang</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4 text-center">Sisa Stok</th>
                      <th className="p-4 text-right">HPP / Beli</th>
                      <th className="p-4 text-right">Harga Jual</th>
                      <th className="p-4 text-right">Total Nilai Aset</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStockProducts.map((product, index) => {
                      const assetValue = product.buyPrice * product.stock;
                      const isOutOfStock = product.stock <= 0;
                      const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                      return (
                        <tr key={product.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                                {product.code}
                              </span>
                              {product.barcode && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  {product.barcode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{product.category}</td>
                          <td className="p-4 text-center">
                            <span
                              className={`font-black text-sm ${
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {product.stock}
                            </span>{' '}
                            <span className="text-[11px] text-slate-500 font-medium">
                              {product.unit}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-700 font-medium">
                            {formatRupiah(product.buyPrice)}
                          </td>
                          <td className="p-4 text-right font-bold text-slate-900">
                            {formatRupiah(product.sellPrice)}
                          </td>
                          <td className="p-4 text-right font-black text-emerald-700">
                            {formatRupiah(assetValue)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? 'Habis' : isLowStock ? 'Menipis' : 'Aman'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Struk Modal */}
      {selectedReceiptTrx && (
        <ReceiptModal
          transaction={selectedReceiptTrx}
          coopConfig={coopConfig}
          onClose={() => setSelectedReceiptTrx(null)}
        />
      )}
    </div>
  );
};

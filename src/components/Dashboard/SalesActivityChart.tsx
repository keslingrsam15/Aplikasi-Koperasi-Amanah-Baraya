import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  TrendingUp,
  BarChart2,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export type ChartFilterPeriod = 'harian' | 'mingguan' | 'bulanan' | 'semester' | 'tahunan';
export type ChartMetric = 'omzet' | 'laba' | 'transaksi';
export type ChartVisualType = 'area' | 'bar';

interface DataPoint {
  key: string;
  label: string;
  shortLabel: string;
  omzet: number;
  laba: number;
  transaksi: number;
  timestamp?: number;
}

interface SalesActivityChartProps {
  transactions: Transaction[];
  onNavigateToPos?: () => void;
  onNavigateToReports?: () => void;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const SalesActivityChart: React.FC<SalesActivityChartProps> = ({
  transactions,
  onNavigateToPos,
  onNavigateToReports,
}) => {
  const [period, setPeriod] = useState<ChartFilterPeriod>('harian');
  const [metric, setMetric] = useState<ChartMetric>('omzet');
  const [visualType, setVisualType] = useState<ChartVisualType>('area');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Reference date: current system time
  const now = new Date();

  // 1. Process chart data points based on selected period
  const chartData = useMemo<DataPoint[]>(() => {
    if (period === 'harian') {
      // Harian: Hourly distribution for today (07:00 - 22:00 + other hours)
      const hoursList = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
        '19:00', '20:00', '21:00', '22:00'
      ];

      const buckets: Record<string, { omzet: number; laba: number; count: number }> = {};
      hoursList.forEach((h) => {
        buckets[h] = { omzet: 0, laba: 0, count: 0 };
      });

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      transactions.forEach((trx) => {
        const trxDate = new Date(trx.date);
        if (trxDate >= todayStart && trxDate <= todayEnd) {
          const hour = trxDate.getHours();
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          if (!buckets[hourStr]) {
            buckets[hourStr] = { omzet: 0, laba: 0, count: 0 };
          }
          buckets[hourStr].omzet += trx.grandTotal || 0;
          buckets[hourStr].laba += trx.totalProfit || 0;
          buckets[hourStr].count += 1;
        }
      });

      // Format to array
      return hoursList.map((h) => ({
        key: h,
        label: `Pukul ${h} WIB`,
        shortLabel: h,
        omzet: buckets[h]?.omzet || 0,
        laba: buckets[h]?.laba || 0,
        transaksi: buckets[h]?.count || 0,
      }));
    }

    if (period === 'mingguan') {
      // Mingguan: 7 Hari Terakhir
      const points: DataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const dayName = DAY_NAMES_ID[d.getDay()];
        const dateNum = d.getDate();
        const monthShort = MONTH_SHORT_ID[d.getMonth()];

        let omzet = 0;
        let laba = 0;
        let count = 0;

        transactions.forEach((trx) => {
          const trxDate = new Date(trx.date);
          if (trxDate >= d && trxDate < nextD) {
            omzet += trx.grandTotal || 0;
            laba += trx.totalProfit || 0;
            count += 1;
          }
        });

        points.push({
          key: d.toISOString(),
          label: `${dayName}, ${dateNum} ${monthShort} ${d.getFullYear()}`,
          shortLabel: `${dayName} ${dateNum}`,
          omzet,
          laba,
          transaksi: count,
          timestamp: d.getTime(),
        });
      }
      return points;
    }

    if (period === 'bulanan') {
      // Bulanan: Hari-hari dalam bulan berjalan
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const points: DataPoint[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dStart = new Date(currentYear, currentMonth, day, 0, 0, 0);
        const dEnd = new Date(currentYear, currentMonth, day, 23, 59, 59, 999);

        let omzet = 0;
        let laba = 0;
        let count = 0;

        transactions.forEach((trx) => {
          const trxDate = new Date(trx.date);
          if (trxDate >= dStart && trxDate <= dEnd) {
            omzet += trx.grandTotal || 0;
            laba += trx.totalProfit || 0;
            count += 1;
          }
        });

        points.push({
          key: `day-${day}`,
          label: `Tanggal ${day} ${MONTH_NAMES_ID[currentMonth]} ${currentYear}`,
          shortLabel: `${day}`,
          omzet,
          laba,
          transaksi: count,
        });
      }
      return points;
    }

    if (period === 'semester') {
      // Semester: Semester 1 (Jan-Jun) atau Semester 2 (Jul-Des)
      const currentYear = now.getFullYear();
      const isSemester1 = now.getMonth() < 6;
      const startMonth = isSemester1 ? 0 : 6;
      const endMonth = isSemester1 ? 5 : 11;

      const points: DataPoint[] = [];
      for (let m = startMonth; m <= endMonth; m++) {
        const mStart = new Date(currentYear, m, 1, 0, 0, 0);
        const mEnd = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);

        let omzet = 0;
        let laba = 0;
        let count = 0;

        transactions.forEach((trx) => {
          const trxDate = new Date(trx.date);
          if (trxDate >= mStart && trxDate <= mEnd) {
            omzet += trx.grandTotal || 0;
            laba += trx.totalProfit || 0;
            count += 1;
          }
        });

        points.push({
          key: `sem-${m}`,
          label: `${MONTH_NAMES_ID[m]} ${currentYear}`,
          shortLabel: MONTH_SHORT_ID[m],
          omzet,
          laba,
          transaksi: count,
        });
      }
      return points;
    }

    // Tahunan: 12 Bulan dalam tahun ini
    const currentYear = now.getFullYear();
    const points: DataPoint[] = [];
    for (let m = 0; m < 12; m++) {
      const mStart = new Date(currentYear, m, 1, 0, 0, 0);
      const mEnd = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);

      let omzet = 0;
      let laba = 0;
      let count = 0;

      transactions.forEach((trx) => {
        const trxDate = new Date(trx.date);
        if (trxDate >= mStart && trxDate <= mEnd) {
          omzet += trx.grandTotal || 0;
          laba += trx.totalProfit || 0;
          count += 1;
        }
      });

      points.push({
        key: `year-${m}`,
        label: `${MONTH_NAMES_ID[m]} ${currentYear}`,
        shortLabel: MONTH_SHORT_ID[m],
        omzet,
        laba,
        transaksi: count,
      });
    }
    return points;
  }, [transactions, period, now.getFullYear(), now.getMonth(), now.getDate()]);

  // Summary Metrics calculation
  const summary = useMemo(() => {
    const totalOmzet = chartData.reduce((acc, p) => acc + p.omzet, 0);
    const totalLaba = chartData.reduce((acc, p) => acc + p.laba, 0);
    const totalTrx = chartData.reduce((acc, p) => acc + p.transaksi, 0);
    const avgBasket = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;
    const profitMargin = totalOmzet > 0 ? ((totalLaba / totalOmzet) * 100).toFixed(1) : '0';

    // Find peak point
    let peakPoint = chartData[0] || null;
    let peakVal = 0;
    chartData.forEach((p) => {
      const val = metric === 'omzet' ? p.omzet : metric === 'laba' ? p.laba : p.transaksi;
      if (val > peakVal) {
        peakVal = val;
        peakPoint = p;
      }
    });

    return {
      totalOmzet,
      totalLaba,
      totalTrx,
      avgBasket,
      profitMargin,
      peakPoint,
      peakVal,
    };
  }, [chartData, metric]);

  // Max value for chart Y scaling
  const maxValue = useMemo(() => {
    let max = 0;
    chartData.forEach((p) => {
      const val = metric === 'omzet' ? p.omzet : metric === 'laba' ? p.laba : p.transaksi;
      if (val > max) max = val;
    });
    return Math.max(max, metric === 'transaksi' ? 5 : 10000);
  }, [chartData, metric]);

  // Helper to format values according to metric
  const formatMetricValue = (val: number) => {
    if (metric === 'transaksi') return `${val.toLocaleString('id-ID')} Trx`;
    return formatRupiah(val);
  };

  // SVG Chart Geometry Constants
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Grid steps (4 horizontal guide lines)
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];

  // Coordinates calculation for SVG points
  const pointsCoords = useMemo(() => {
    const totalPoints = chartData.length;
    if (totalPoints <= 1) return [];

    return chartData.map((d, index) => {
      const x = paddingLeft + (index / (totalPoints - 1)) * chartWidth;
      const rawVal = metric === 'omzet' ? d.omzet : metric === 'laba' ? d.laba : d.transaksi;
      const ratio = maxValue > 0 ? rawVal / maxValue : 0;
      const y = paddingTop + chartHeight - ratio * chartHeight;
      return { x, y, data: d, rawVal };
    });
  }, [chartData, metric, maxValue, chartWidth, chartHeight]);

  // Generate Smooth Bezier Curve Path for Area Chart
  const svgPathData = useMemo(() => {
    if (pointsCoords.length === 0) return { pathLine: '', pathArea: '' };

    let lineStr = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;

    for (let i = 0; i < pointsCoords.length - 1; i++) {
      const current = pointsCoords[i];
      const next = pointsCoords[i + 1];
      const midX = (current.x + next.x) / 2;
      // Cubic bezier curve control points
      lineStr += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }

    const firstX = pointsCoords[0].x;
    const lastX = pointsCoords[pointsCoords.length - 1].x;
    const baseY = paddingTop + chartHeight;
    const areaStr = `${lineStr} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

    return { pathLine: lineStr, pathArea: areaStr };
  }, [pointsCoords, paddingTop, chartHeight]);

  // Label period title
  const periodTitle = useMemo(() => {
    switch (period) {
      case 'harian':
        return `Penjualan Hari Ini (${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})`;
      case 'mingguan':
        return 'Penjualan 7 Hari Terakhir';
      case 'bulanan':
        return `Penjualan Bulan ${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`;
      case 'semester': {
        const semNum = now.getMonth() < 6 ? '1 (Jan - Jun)' : '2 (Jul - Des)';
        return `Penjualan Semester ${semNum} ${now.getFullYear()}`;
      }
      case 'tahunan':
        return `Penjualan Tahunan Sepanjang ${now.getFullYear()}`;
    }
  }, [period, now]);

  return (
    <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-white/80 shadow-[8px_8px_20px_rgba(203,213,225,0.5),-8px_-8px_20px_rgba(255,255,255,0.95)] border-b-4 border-b-teal-500 space-y-5">
      {/* 1. Header with Title and Period Filter Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-200 shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span>Aktivitas Grafik Penjualan</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">{periodTitle}</span>
          </p>
        </div>

        {/* Filter Period Pills (Harian, Mingguan, Bulanan, Semester, Tahunan) */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/60 shadow-inner">
          {(
            [
              { id: 'harian', label: 'Harian' },
              { id: 'mingguan', label: 'Mingguan' },
              { id: 'bulanan', label: 'Bulanan' },
              { id: 'semester', label: 'Semester' },
              { id: 'tahunan', label: 'Tahunan' },
            ] as { id: ChartFilterPeriod; label: string }[]
          ).map((item) => {
            const active = period === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPeriod(item.id);
                  setHoveredPoint(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'bg-white text-teal-700 shadow-md scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls Row: Metric Selector + Visual Type (Area vs Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold hidden sm:inline mr-1">Metrik:</span>
          {(
            [
              { id: 'omzet', label: 'Omzet Penjualan' },
              { id: 'laba', label: 'Estimasi Laba' },
              { id: 'transaksi', label: 'Jumlah Transaksi' },
            ] as { id: ChartMetric; label: string }[]
          ).map((m) => {
            const active = metric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition border ${
                  active
                    ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Visual Type Selector (Area vs Bar) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setVisualType('area')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              visualType === 'area'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampilkan grafik kurva gradien halus"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Kurva Area</span>
          </button>
          <button
            onClick={() => setVisualType('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              visualType === 'bar'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampilkan grafik diagram batang"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Diagram Batang</span>
          </button>
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total {metric === 'omzet' ? 'Omzet' : metric === 'laba' ? 'Laba' : 'Transaksi'} Periode
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-0.5 truncate">
            {metric === 'transaksi'
              ? `${summary.totalTrx} Transaksi`
              : metric === 'laba'
              ? formatRupiah(summary.totalLaba)
              : formatRupiah(summary.totalOmzet)}
          </div>
          <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">
            {period === 'harian' ? 'Realtime Hari Ini' : `Kumulatif ${period}`}
          </span>
        </div>

        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Transaksi
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-0.5">
            {summary.totalTrx} <span className="text-xs font-normal text-slate-500 font-sans">Nota</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Rata-rata: {formatRupiah(summary.avgBasket)}/nota
          </span>
        </div>

        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Est. Laba & Margin
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 font-mono mt-0.5 truncate">
            {formatRupiah(summary.totalLaba)}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
            Margin: {summary.profitMargin}%
          </span>
        </div>

        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Puncak Tertinggi
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-indigo-700 font-mono mt-0.5 truncate">
            {formatMetricValue(summary.peakVal)}
          </div>
          <span className="text-[11px] text-slate-600 font-medium mt-0.5 block truncate">
            {summary.peakPoint ? summary.peakPoint.label : '-'}
          </span>
        </div>
      </div>

      {/* 4. Main SVG Interactive Chart */}
      <div className="relative bg-white p-4 rounded-2xl border border-slate-200/80 shadow-inner overflow-hidden">
        {/* Floating Tooltip if point hovered */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/95 text-white p-3 rounded-xl shadow-xl backdrop-blur-md border border-slate-700/80 text-xs animate-fade-in pointer-events-none max-w-xs">
            <div className="font-bold text-teal-300 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{hoveredPoint.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-teal-900/80 rounded font-mono text-teal-200">
                {hoveredPoint.transaksi} Transaksi
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Omzet Penjualan:</span>
                <span className="font-bold text-white">{formatRupiah(hoveredPoint.omzet)}</span>
              </div>
              <div className="flex justify-between gap-4 text-emerald-400">
                <span>Estimasi Laba:</span>
                <span className="font-bold">{formatRupiah(hoveredPoint.laba)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sky-300">
                <span>Jumlah Nota:</span>
                <span className="font-bold">{hoveredPoint.transaksi} Nota</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state overlay if zero transactions in this period */}
        {summary.totalTrx === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 backdrop-blur-xs p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">
              Belum Ada Transaksi Pada Periode Ini
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">
              Ketika kasir memproses transaksi baru, grafik akan otomatis muncul seketika secara realtime!
            </p>
            {onNavigateToPos && (
              <button
                onClick={onNavigateToPos}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                + Buka Kasir & Buat Transaksi
              </button>
            )}
          </div>
        )}

        {/* Vector SVG Chart Component */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
            >
              <defs>
                {/* Emerald Gradient for Area Chart */}
                <linearGradient id="salesEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#0d9488" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
                </linearGradient>

                {/* Bar Gradient */}
                <linearGradient id="barColumnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>

                <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {gridSteps.map((step, idx) => {
                const y = paddingTop + (1 - step) * chartHeight;
                const stepValue = maxValue * step;
                return (
                  <g key={idx} className="transition-all duration-300">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={step === 0 ? undefined : '4 4'}
                      strokeWidth={step === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono font-medium select-none"
                    >
                      {metric === 'transaksi'
                        ? Math.round(stepValue)
                        : stepValue >= 1000000
                        ? `${(stepValue / 1000000).toFixed(1)}jt`
                        : stepValue >= 1000
                        ? `${(stepValue / 1000).toFixed(0)}rb`
                        : stepValue.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Area Chart Mode */}
              {visualType === 'area' && (
                <>
                  {/* Fill Area with Gradient */}
                  {svgPathData.pathArea && (
                    <path
                      d={svgPathData.pathArea}
                      fill="url(#salesEmeraldGrad)"
                      className="transition-all duration-500 ease-out"
                    />
                  )}

                  {/* Stroke Line */}
                  {svgPathData.pathLine && (
                    <path
                      d={svgPathData.pathLine}
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-500 ease-out"
                    />
                  )}

                  {/* Data Points and Interaction Circles */}
                  {pointsCoords.map((pt, idx) => {
                    const isHovered = hoveredPoint?.key === pt.data.key;
                    const isPeak = summary.peakPoint?.key === pt.data.key && summary.peakVal > 0;
                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredPoint(pt.data)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer group"
                      >
                        {/* Hover vertical guideline */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={paddingTop}
                            x2={pt.x}
                            y2={paddingTop + chartHeight}
                            stroke="#0d9488"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        )}

                        {/* Outer glow for peak or hovered */}
                        {(isHovered || isPeak) && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 8 : 6}
                            fill="#0d9488"
                            fillOpacity="0.25"
                            className="animate-pulse"
                          />
                        )}

                        {/* Center dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5 : isPeak ? 4.5 : 3.5}
                          fill={isPeak ? '#f59e0b' : '#ffffff'}
                          stroke="#0d9488"
                          strokeWidth="2.5"
                          className="transition-all duration-200 group-hover:scale-125"
                        />

                        {/* Broad touch/click catcher */}
                        <rect
                          x={pt.x - chartWidth / (pointsCoords.length * 2)}
                          y={paddingTop}
                          width={chartWidth / pointsCoords.length}
                          height={chartHeight + 20}
                          fill="transparent"
                        />
                      </g>
                    );
                  })}
                </>
              )}

              {/* Bar Chart Mode */}
              {visualType === 'bar' && (
                <>
                  {chartData.map((d, index) => {
                    const totalBars = chartData.length;
                    const stepWidth = chartWidth / totalBars;
                    const barWidth = Math.max(8, Math.min(36, stepWidth * 0.65));
                    const x = paddingLeft + index * stepWidth + (stepWidth - barWidth) / 2;

                    const rawVal = metric === 'omzet' ? d.omzet : metric === 'laba' ? d.laba : d.transaksi;
                    const ratio = maxValue > 0 ? rawVal / maxValue : 0;
                    const bHeight = Math.max(3, ratio * chartHeight);
                    const y = paddingTop + chartHeight - bHeight;

                    const isHovered = hoveredPoint?.key === d.key;
                    const isPeak = summary.peakPoint?.key === d.key && summary.peakVal > 0;

                    return (
                      <g
                        key={d.key}
                        onMouseEnter={() => setHoveredPoint(d)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="cursor-pointer group"
                      >
                        {/* Background column highlight on hover */}
                        {isHovered && (
                          <rect
                            x={paddingLeft + index * stepWidth}
                            y={paddingTop}
                            width={stepWidth}
                            height={chartHeight}
                            fill="#f1f5f9"
                            opacity="0.8"
                            rx="6"
                          />
                        )}

                        {/* Bar Pillar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={bHeight}
                          rx={barWidth / 3}
                          fill={
                            isHovered
                              ? 'url(#barHoverGrad)'
                              : isPeak
                              ? '#0f766e'
                              : rawVal > 0
                              ? 'url(#barColumnGrad)'
                              : '#e2e8f0'
                          }
                          className="transition-all duration-300"
                        />

                        {/* Bar Top Value on hover or peak */}
                        {(isHovered || isPeak) && rawVal > 0 && (
                          <text
                            x={x + barWidth / 2}
                            y={y - 5}
                            textAnchor="middle"
                            fontSize="8.5"
                            fill="#0f172a"
                            className="font-mono font-bold"
                          >
                            {metric === 'transaksi' ? rawVal : formatRupiah(rawVal)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              )}

              {/* X-Axis Labels */}
              {chartData.map((d, index) => {
                const totalPoints = chartData.length;
                let x = 0;
                if (visualType === 'area') {
                  x = paddingLeft + (index / (totalPoints - 1)) * chartWidth;
                } else {
                  const stepWidth = chartWidth / totalPoints;
                  x = paddingLeft + index * stepWidth + stepWidth / 2;
                }

                // If many points (e.g. monthly 30 days), show every 3rd or 4th label to prevent clutter
                if (totalPoints > 16 && index % 3 !== 0 && index !== totalPoints - 1) {
                  return null;
                }

                const isHovered = hoveredPoint?.key === d.key;

                return (
                  <text
                    key={`label-${d.key}`}
                    x={x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize={totalPoints > 20 ? '8' : '9.5'}
                    fill={isHovered ? '#0d9488' : '#64748b'}
                    className={`font-mono transition-colors select-none ${
                      isHovered ? 'font-extrabold' : 'font-medium'
                    }`}
                  >
                    {d.shortLabel}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-teal-600" />
          <span>Arahkan kursor / sentuh titik grafik untuk melihat rincian omzet, laba & jumlah transaksi.</span>
        </span>
        {onNavigateToReports && (
          <button
            onClick={onNavigateToReports}
            className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
          >
            <span>Analisis Laporan Lengkap</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

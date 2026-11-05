import React, { useState, useMemo, useEffect } from 'react';
import {
  Transaction,
  Product,
  CoopConfig,
  Member,
  SavingsRecord,
  LoanRecord,
  StockMutation,
  UserProfile,
} from '../../types';
import {
  LpjReportParams,
  LpjPeriodeBulanFormat,
  defaultLpjReportParams,
  buildParamsForPeriod,
  calculateLpjRealtimeData,
  formatNumberPlain,
  formatDecimalTwoIndo,
  downloadLpjWordDocument,
  renderDynamicCoverDataUrl,
} from '../../utils/lpjReportGenerator';
import {
  Printer,
  CheckCircle2,
  ChevronDown,
  FileDown,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface ReportsScreenProps {
  transactions: Transaction[];
  products: Product[];
  coopConfig: CoopConfig;
  members?: Member[];
  savingsRecords?: SavingsRecord[];
  loans?: LoanRecord[];
  mutations?: StockMutation[];
  users?: UserProfile[];
  onSaveCoopConfig?: (newConfig: CoopConfig) => void;
}

const LPJ_PARAMS_STORAGE_KEY = 'koperasi_rsud_lpj_params_v3';

const TAHUN_RAT_OPTIONS = ['2025', '2026', '2027', '2028'];
const TAHUN_BUKU_OPTIONS = ['2024', '2025', '2026', '2027'];

// Helper to render the exact PDF Page Footer ("KOPERASI AMANAH BARAYA | [Green Page Box]")
const LpjPageFooter: React.FC<{ pageNo: number | string }> = ({ pageNo }) => (
  <div className="mt-auto pt-6 flex items-center justify-end gap-2 text-[10pt] font-sans text-slate-800 select-none">
    <span className="tracking-wide uppercase">KOPERASI AMANAH BARAYA</span>
    <span
      className="inline-flex items-center justify-center min-w-[28px] h-[22px] px-1.5 text-white font-bold text-[10pt]"
      style={{ backgroundColor: '#70ad47' }}
    >
      {pageNo}
    </span>
  </div>
);

// Helper to render accounting-style Rp cell ("Rp" on left, formatted amount or "-" on right)
const RpCell: React.FC<{ value: number; bold?: boolean }> = ({ value, bold }) => (
  <div className={`flex items-center justify-between gap-2 tabular-nums ${bold ? 'font-bold' : ''}`}>
    <span>Rp</span>
    <span>{value === 0 ? '-' : formatNumberPlain(value)}</span>
  </div>
);

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  transactions,
  products,
  coopConfig,
  members = [],
  savingsRecords = [],
  loans = [],
  mutations = [],
  users = [],
}) => {
  const [openDropdown, setOpenDropdown] = useState<'RAT' | 'TAHUN_BUKU' | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [coverImageSrc, setCoverImageSrc] = useState<string>('/assets/lpj_cover_page1.jpg');

  const [lpjParams, setLpjParams] = useState<LpjReportParams>(() => {
    try {
      const saved = localStorage.getItem(LPJ_PARAMS_STORAGE_KEY);
      if (saved) {
        return { ...defaultLpjReportParams, ...JSON.parse(saved) };
      }
      return defaultLpjReportParams;
    } catch {
      return defaultLpjReportParams;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LPJ_PARAMS_STORAGE_KEY, JSON.stringify(lpjParams));
    } catch (err) {
      console.error('Failed saving LPJ params:', err);
    }
  }, [lpjParams]);

  // Dynamically update Page 1 Cover whenever Tahun Buku or Tahun RAT changes
  useEffect(() => {
    let cancelled = false;
    renderDynamicCoverDataUrl(
      '/assets/lpj_cover_page1.jpg',
      lpjParams.tahunBuku,
      lpjParams.tahunRat
    ).then((dataUrl) => {
      if (!cancelled) {
        setCoverImageSrc(dataUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lpjParams.tahunBuku, lpjParams.tahunRat]);

  // Real-time calculation integrated from all menus in the application
  const lpjData = useMemo(() => {
    return calculateLpjRealtimeData(
      members,
      savingsRecords,
      loans,
      transactions,
      products,
      mutations,
      lpjParams,
      users
    );
  }, [members, savingsRecords, loans, transactions, products, mutations, lpjParams, users]);

  const filteredMemberRows = lpjData.memberRows;
  const activeSection = 'ALL';
  const memberSearch = '';

  const handleSelectTahunRat = (newTahunRat: string) => {
    setLpjParams((prev) => buildParamsForPeriod(prev.tahunBuku, newTahunRat, prev));
    setOpenDropdown(null);
  };

  const handleSelectTahunBuku = (
    newTahunBuku: string,
    newFormat?: LpjPeriodeBulanFormat
  ) => {
    setLpjParams((prev) =>
      buildParamsForPeriod(
        newTahunBuku,
        prev.tahunRat,
        prev,
        newFormat || prev.periodeBulanFormat
      )
    );
    setOpenDropdown(null);
  };

  const handleDownloadWord = async () => {
    setIsDownloading(true);
    try {
      await downloadLpjWordDocument(lpjData, lpjParams, coopConfig);
      setDownloadNotice(true);
      setTimeout(() => setDownloadNotice(false), 4500);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const f = (n: number) => (n === 0 ? '0' : formatNumberPlain(n));

  const prevTahunBuku = String((parseInt(lpjParams.tahunBuku, 10) || 2025) - 1);
  const periodePembandingText =
    lpjParams.periodePembandingText || `April ${prevTahunBuku} sd Maret ${lpjParams.tahunBuku}`;

  const prevTotalAnggota = lpjParams.prevAnggotaLaki + lpjParams.prevAnggotaPerempuan;
  const prevTotalSimpanan =
    lpjParams.prevSimpananPokok +
    lpjParams.prevSimpananWajib +
    lpjParams.prevSimpananSukarela +
    lpjParams.prevSimpananWisata;
  const prevTotalKesejahteraan = lpjParams.prevShuAnggota + lpjParams.prevBingkisan;

  const pctPinjamanDiff =
    lpjParams.prevPemberianPinjaman > 0
      ? Math.abs(
          ((lpjData.pemberianPinjaman - lpjParams.prevPemberianPinjaman) /
            lpjParams.prevPemberianPinjaman) *
            100
        )
          .toFixed(1)
          .replace('.', ',')
      : '0';
  const pctAngsuranRatio =
    lpjData.pemberianPinjaman > 0
      ? ((lpjData.angsuranPinjaman / lpjData.pemberianPinjaman) * 100).toFixed(1).replace('.', ',')
      : '0';
  const pctSisaRatio =
    lpjData.pemberianPinjaman > 0
      ? ((lpjData.sisaPinjaman / lpjData.pemberianPinjaman) * 100).toFixed(1).replace('.', ',')
      : '0';

  return (
    <div className="space-y-6 pb-14">
      {/* Print F4 Page Rule (21.5cm x 33.0cm, Margin 2.5cm top/right/bottom/left) */}
      <style>{`
        @media print {
          @page {
            size: 215mm 330mm;
            margin: 25mm 25mm 25mm 25mm;
          }
          body {
            background: #ffffff !important;
          }
          .f4-sheet-portrait,
          .f4-sheet-landscape {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            page-break-after: always;
          }
          .f4-cover-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: -25mm !important;
            padding: 0 !important;
            width: 215mm !important;
            height: 330mm !important;
            page-break-after: always;
          }
        }
      `}</style>

      {/* Clean Period Selector & Export Toolbar (Hidden on Print) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3 sm:px-5 sm:py-3.5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Tombol Periode RAT & Tombol Periode Tahun Buku */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* 1. Tombol Periode RAT */}
            <div className="relative">
              <button
                id="btn-periode-rat"
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'RAT' ? null : 'RAT'))
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer whitespace-nowrap ${
                  openDropdown === 'RAT'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-emerald-50/90 hover:bg-emerald-100/80 text-emerald-900 border-emerald-200'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-75 leading-tight">
                    Periode RAT
                  </span>
                  <span className="text-xs font-extrabold leading-tight">
                    RAT Tahun {lpjParams.tahunRat} ({lpjParams.tanggalRat})
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80 shrink-0" />
              </button>

              {openDropdown === 'RAT' && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-30 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Pilih Tahun Pelaksanaan RAT
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TAHUN_RAT_OPTIONS.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleSelectTahunRat(yr)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            lpjParams.tahunRat === yr
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          RAT Tahun {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tanggal Pelaksanaan RAT
                      </label>
                      <input
                        type="text"
                        value={lpjParams.tanggalRat}
                        onChange={(e) =>
                          setLpjParams({ ...lpjParams, tanggalRat: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        placeholder="Contoh: 06 Maret 2026"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tanggal Kata Pengantar
                      </label>
                      <input
                        type="text"
                        value={lpjParams.tanggalKataPengantar}
                        onChange={(e) =>
                          setLpjParams({
                            ...lpjParams,
                            tanggalKataPengantar: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        placeholder="Contoh: 05 Maret 2026"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Tombol Periode Tahun Buku */}
            <div className="relative">
              <button
                id="btn-periode-tahun-buku"
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) =>
                    prev === 'TAHUN_BUKU' ? null : 'TAHUN_BUKU'
                  )
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer whitespace-nowrap ${
                  openDropdown === 'TAHUN_BUKU'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-75 leading-tight">
                    Periode Tahun Buku
                  </span>
                  <span className="text-xs font-extrabold leading-tight">
                    Tahun Buku {lpjParams.tahunBuku} ({lpjParams.periodeBukuText})
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80 shrink-0" />
              </button>

              {openDropdown === 'TAHUN_BUKU' && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-30 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Pilih Tahun Buku LPJ
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TAHUN_BUKU_OPTIONS.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleSelectTahunBuku(yr)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            lpjParams.tahunBuku === yr
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Tahun Buku {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Rentang Bulan Periode Buku
                    </label>
                    {[
                      {
                        id: 'APRIL_DESEMBER' as LpjPeriodeBulanFormat,
                        label: `April sd Desember ${lpjParams.tahunBuku}`,
                      },
                      {
                        id: 'JANUARI_DESEMBER' as LpjPeriodeBulanFormat,
                        label: `Januari sd Desember ${lpjParams.tahunBuku}`,
                      },
                      {
                        id: 'APRIL_MARET' as LpjPeriodeBulanFormat,
                        label: `April ${prevTahunBuku} sd Maret ${lpjParams.tahunBuku}`,
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleSelectTahunBuku(lpjParams.tahunBuku, opt.id)
                        }
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          lpjParams.periodeBukuText === opt.label
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cetak F4 / PDF & Download Word F4 (.doc) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Cetak F4 / PDF</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadWord}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>
                {isDownloading
                  ? 'Menyiapkan Dokumen Word F4...'
                  : 'Download Laporan Word F4 (.doc)'}
              </span>
            </button>
          </div>
        </div>

        {downloadNotice && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Dokumen Word resmi ukuran <strong>F4 (Margin 2,5 cm)</strong>{' '}
              <strong>
                RAT_KOPERASI_AMBAR_LPJ_{lpjParams.tahunRat}_TahunBuku_{lpjParams.tahunBuku}_F4.doc
              </strong>{' '}
              berhasil diunduh lengkap dengan Desain Cover &amp; Halaman 1–31.
            </span>
          </div>
        )}
      </div>

      {/* =================================================================================
          OFFICIAL F4 DOCUMENT SHEETS (21.5cm x 33.0cm, Margin 2.5cm all 4 sides)
          100% IDENTICAL TO RAT KOPERASI AMBAR LPJ 2026.pdf (PAGES 1 - 31)
      ================================================================================= */}
      <div className="space-y-8 print:space-y-0">
        {/* ==================== SECTION I: PAGES 1 - 7 ==================== */}
        {(activeSection === 'ALL' || activeSection === 'COVER_TATIB') && (
          <>
            {/* PAGE 1: EXACT COVER PAGE FROM PDF (Full Bleed F4 21.5cm x 33.0cm, Dynamic Tahun Buku & Tahun RAT) */}
            <div className="f4-cover-sheet bg-white shadow-md border border-slate-300 mx-auto overflow-hidden w-full max-w-[21.5cm] aspect-[215/330] relative">
              <img
                src={coverImageSrc}
                alt={`Cover Laporan Pertanggung Jawaban Pengurus dan Pengawas Tahun Buku ${lpjParams.tahunBuku} - RAT Tahun ${lpjParams.tahunRat} Koperasi Amanah Baraya RSUD Al-Mulk`}
                className="w-full h-full object-fill block"
              />
            </div>

            {/* PAGE 2: KATA PENGANTAR (100% Identical to PDF Page 2) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <h2 className="text-center font-bold text-[12.5pt] uppercase mb-6">
                  KATA PENGANTAR
                </h2>

                <p className="indent-9">
                  Puji dan syukur kita panjatkan ke hadirat Allah SWT karena atas rahmat dan
                  karunia-Nya Laporan Pertanggungjawaban (LPJ) <strong>Koperasi Amanah Baraya</strong>{' '}
                  dapat disusun dengan baik. Laporan ini merupakan bentuk pertanggungjawaban pengurus
                  Koperasi Periode Tahun {prevTahunBuku} – {lpjParams.tahunBuku} untuk Tahun{' '}
                  {lpjParams.tahunRat} kepada seluruh anggota atas pelaksanaan kegiatan dan
                  pengelolaan koperasi selama satu periode kerja.
                </p>

                <p className="indent-9">
                  LPJ ini disusun sebagai gambaran mengenai kondisi, perkembangan, serta kinerja
                  pengelolaan keuangan dan kegiatan usaha Koperasi Amanah Baraya. Selain itu, laporan
                  ini juga menjadi sarana transparansi dan evaluasi bersama agar pengelolaan koperasi
                  ke depan dapat berjalan lebih baik, profesional, dan memberikan manfaat yang lebih
                  besar bagi seluruh anggota.
                </p>

                <p className="indent-9">
                  Kami menyadari bahwa keberlangsungan dan perkembangan Koperasi Amanah Baraya tidak
                  terlepas dari dukungan, partisipasi, dan kepercayaan seluruh anggota serta
                  pihak-pihak yang telah membantu dalam setiap kegiatan koperasi. Untuk itu, kami
                  mengucapkan terima kasih kepada seluruh anggota dan pengurus yang telah berperan
                  aktif dalam memajukan koperasi ini.
                </p>

                <p className="indent-9">
                  Kami telah berusaha sesuai dengan kemampuan untuk melaksanakan tugas dan kewajiban,
                  memberikan pelayanan kepada seluruh anggota Koperasi Amanah Baray, walaupun dengan
                  segala keterbatasan waktu dan kemampuan kami. Oleh karena itu kami mohon maaf dan
                  maklum atas segala kekuarangan dan keterbatasan ini.
                </p>

                <p className="indent-9">
                  Selanjutnya kepada seluruh anggota Koperasi Amanah Baraya agar tetap semangat
                  mendukung dan menghidupkan Koperasi Amanah Baraya ini sehingga lebih maju dan
                  berkembang lagi.
                </p>

                <p className="indent-9">
                  Akhirnya kepada semua pihak yang telah membantu kami ucapan terimakasih, semoga
                  Allah SWT selalu melimpahkan Rahmat dan Hidayahnya kepada kita semua. Aamiin...
                </p>

                <div className="pt-8 text-center space-y-1">
                  <p className="font-bold">Sukabumi, {lpjParams.tanggalKataPengantar}</p>
                  <p className="font-bold">KOPERASI PEGAWAI UOBK RSUD AL-MULK KOTA SUKABUMI</p>
                  <p className="font-bold">“AMANAH BARAYA”</p>
                  <div className="py-8">
                    <p>ttd</p>
                    <p>PENGURUS</p>
                  </div>
                </div>
              </div>

              <LpjPageFooter pageNo={2} />
            </div>

            {/* PAGE 3: SUSUNAN ACARA (100% Identical to PDF Page 3) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.6] flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-center font-bold text-[12.5pt] uppercase mb-6">
                  SUSUNAN ACARA
                </h2>

                <p className="font-bold">A. &nbsp;ACARA UMUM</p>
                <ol className="list-decimal pl-8 space-y-1.5">
                  <li>PEMBUKAAN</li>
                  <li>SAMBUTAN / PRAKATA KETUA KOPERASI “AMANAH Baraya”</li>
                  <li>
                    SAMBUTAN
                    <div className="pl-4">a. &nbsp;Direktur UOBK RSUD AL-Mulk</div>
                  </li>
                  <li>DOA / RAMAH TAMAH</li>
                </ol>

                <p className="font-bold pt-4">
                  B. &nbsp;ACARA KHUSUS RAPAT ANGGOTA TAHUN (RAT)
                </p>
                <ol className="list-decimal pl-8 space-y-1.5">
                  <li>PEMBUKAAN</li>
                  <li>PEMBACAAN DAN PENGESAHAN ACARA DAN TATA TERTIB</li>
                  <li>
                    LAPORAN PERTANGGUNGJAWABAN PENGURUS TAHUN BUKU {lpjParams.tahunBuku} (singkat)
                  </li>
                  <li>PANDANGAN UMUM ( 2 orang penanya dari anggota)</li>
                  <li>
                    PENGESAHAN LAPORAN PERTANGGUNGJAWABAN PENGURUS DAN PENGAWAS TAHUN{' '}
                    {lpjParams.tahunBuku}
                  </li>
                  <li>
                    PEMBAHASAN RENCANA KERJA DAN RAPB TAHUN {lpjParams.tahunRat} (singkat) DAN
                    PENGESAHANNYA
                  </li>
                  <li>KEPUTUSAN-KE[UTUSAN RAPAT</li>
                </ol>
              </div>

              <LpjPageFooter pageNo={3} />
            </div>

            {/* PAGE 4: RAPAT ANGGOTA TAHUNAN (RAT) TAHUN BUKU 2025 (100% Identical to PDF Page 4) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.6] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <div className="text-center font-bold text-[12.5pt] mb-6">
                  <p>Rapat Anggota Tahunan (RAT)</p>
                  <p>Tahun Buku {lpjParams.tahunBuku}</p>
                </div>

                <p className="font-bold">I. Dasar Penyelenggara</p>
                <ol className="list-[lower-alpha] pl-8 space-y-1">
                  <li>Anggaran Dasar dan Anggaran Rumah Tangga Koperasi Amanah Baraya</li>
                  <li>Program Kerja Koperasi Amanah Baraya</li>
                </ol>

                <p className="font-bold pt-2">II. Maksud Dan Tujuan</p>
                <p className="pl-6 indent-8">
                  Rapat Anggota Tahunan (RAT) dimaksud untuk menyampaikan laporan pertangung jawaban
                  baik pengurus maupun pengawas kepada anggota tentang hasil pelaksanaan kerja selama
                  periode buku bulan {lpjParams.periodeBukuText}, kemudian penyampaian pembahasan
                  dan pengesahan Rencana Kerja dan Pengesahan Anggaran, Pendapatan dan Belanja (RAPB)
                  tahun {lpjParams.tahunRat} sebagai pedoman pengurus dalam pelaksanaan tugas yang
                  akan datang.
                </p>

                <p className="font-bold pt-2">III. Umum</p>
                <p className="pl-6 indent-8">
                  Dalam RAT setiap anggota dapat menyampaikan tanggapan, usul dan saran untuk
                  kemajuan koperasi baik secara lisan mau secara tertulis. RAT dapat dianggap sah
                  apabila dihadiri oleh lebih setengah dari jumlah anggota dengan keputusan diambil
                  berdasarkan musyawarah untuk mufakat dengan dijiwai oleh semangat kekeluargaan.
                </p>
                <p className="pl-6 indent-8">
                  Suksesnya RAT ini, tidak terlepas dari peran aktif para pengurus, pengawas serta
                  seluruh anggota koperasi. Diharapkan bahwa penyelenggaraan RAT akan memperoleh
                  manfaat yang dapat menunjukan kemampuan dan kemandirian pengurus dalam menjalankan
                  organisasi koperasi.
                </p>
              </div>

              <LpjPageFooter pageNo={4} />
            </div>

            {/* PAGE 5: TATA TERTIB RAT BAB I - BAB III (100% Identical to PDF Page 5) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <div className="text-center font-bold uppercase mb-4">
                  <p>TATA TERTIB RAPAT ANGGOTA TAHUNAN (RAT)</p>
                  <p>TAHUN BUKU {lpjParams.tahunBuku}</p>
                </div>

                <div className="text-center font-bold">
                  <p>BAB I</p>
                  <p>NAMA, WAKTU, DAN TEMPAT</p>
                  <p>Pasal 1</p>
                </div>
                <p className="indent-8">
                  Rapat ini bernama Rapat Anggota Tahunan Koperasi Pegawai Republik Indonesia (KPRI)
                  “Amanah Baraya” untuk tahun buku bulan {lpjParams.periodeBukuText} diselenggarakan
                  di UOBK RSUD Al-Mulk Kota Sukabumi pada tanggal {lpjParams.tanggalRat}
                </p>

                <div className="text-center font-bold pt-2">
                  <p>BAB II</p>
                  <p>DASAR PENYELENGGARAAN</p>
                  <p>PASAL 2</p>
                </div>
                <p>Rapat Anggota Tahunan ini di laksanakan berdasarkan :</p>
                <ol className="list-[lower-alpha] pl-8 space-y-1">
                  <li>Undang Undang No.25 tahun 1992 tentang berkoperasi.</li>
                  <li>Anggaran Dasar Koperasi Amanah Baraya.</li>
                  <li>Anggaran Dasar dan Anggaran Rumah Tangga Koperasi Amanah Baraya</li>
                </ol>

                <div className="text-center font-bold pt-2">
                  <p>BAB III</p>
                  <p>MAKSUD DAN TUJUAN</p>
                  <p>Pasal 3</p>
                </div>
                <ol className="list-[lower-alpha] pl-8 space-y-1.5">
                  <li>
                    Rapat Anggota Tahunan (RAT) bermaksud untuk menyampaian laporan pertanggung
                    jawaban pengurus kepada anggota tentang hasil pelaksanaan kerja selama tahun buku
                    bulan {lpjParams.periodeBukuText}
                  </li>
                  <li>
                    Rapat Anggota Tahunan (RAT) bertujuan untuk membahas dan mengesahan Rencana Kerja
                    serta Rencana Pendapatan dan Belanja untuk Tahun buku bulan{' '}
                    {lpjParams.periodeBukuText} sebagai pedoman pelaksanaan tugas yang akan datang
                    dan untuk dilaksanakan oleh pengurus.
                  </li>
                </ol>
              </div>

              <LpjPageFooter pageNo={5} />
            </div>

            {/* PAGE 6: TATA TERTIB RAT BAB IV - BAB VII (100% Identical to PDF Page 6) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <div className="text-center font-bold">
                  <p>BAB IV</p>
                  <p>KEWAJIBAN DAN HAK PESERTA</p>
                  <p>Pasal 4</p>
                </div>
                <ol className="list-[lower-alpha] pl-8 space-y-1">
                  <li>Sebelum rapat dimulai, peserta rapat diwajibkan melakukan absensi kehadiran</li>
                  <li>
                    Pada waktu rapat virtual berlangsung, seluruh peserta rapat di harapkan dapat
                    mengikuti rapat sampai selesai
                  </li>
                  <li>Dalam menggunakan hak bicara, anggota harus objektif, tegas dan jelas</li>
                  <li>
                    Setiap peserta rpat berkewajiban untuk menaati tata tertib rapat dan
                    mengindahkan kewajiban pimpinan rapat.
                  </li>
                  <li>Hak suara yaitu satu orang anggota satu suara.</li>
                  <li>
                    Peserta rapat mempunyai hak untuk menyampaikan tanggapan,usul dan saran dengan
                    waktu ditentukan oleh rapat anggota
                  </li>
                </ol>

                <div className="text-center font-bold pt-2">
                  <p>BAB V</p>
                  <p>PIMPINAN RAPAT</p>
                  <p>Pasal 5</p>
                </div>
                <ol className="list-[lower-alpha] pl-8 space-y-1">
                  <li>
                    Rapat dipimpin oleh ketua atau pengurus lain yang diberikan kewenangan oleh
                    Ketua.
                  </li>
                  <li>
                    Pimpinan rapat berwenang mengatur, mengarahkan dan mengusahakan agar rapat dapat
                    berjalan lancer dan tertib sesuai dengan peraturan tata tertib ini yang selalu
                    dijiwai oleh semangat kekeluargaan, silih asih ,silih asuh, musyawarah mufakat.
                  </li>
                  <li>
                    Pimpinan rapat berhak memperingati pembicaraan yang dianggap menyimpang dari
                    pokok permasalahan dan apabila perlu dapat meminta untuk meninggalkan rapat
                  </li>
                </ol>

                <div className="text-center font-bold pt-2">
                  <p>BAB VI</p>
                  <p>SAHNYA RAPAT</p>
                  <p>Pasal 6</p>
                </div>
                <p className="text-center">
                  Rapat anggota sah apabila dihadiri oleh lebih dari setengah jumlah anggota
                </p>

                <div className="text-center font-bold pt-2">
                  <p>BAB VII</p>
                  <p>SAHNYA KEPUTUSAN RAPAT</p>
                  <p>Pasal 7</p>
                </div>
              </div>

              <LpjPageFooter pageNo={6} />
            </div>

            {/* PAGE 7: TATA TERTIB RAT LANJUTAN PASAL 7 - BAB IX (100% Identical to PDF Page 7) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <ol className="list-[lower-alpha] pl-8 space-y-1.5">
                  <li>
                    Keputusan Rapat Anggota sah apabila berdasarkan dengan cara musyawarah untuk
                    mufakat dan di setujui oleh Sebagian anggota peserta rapat
                  </li>
                  <li>
                    Apabila tidak terdapat / tidak tercapai kesepakatan secara musyawarah untuk
                    mufakat, maka pimpinan rapat mengusahakan suatu keputusan berdasarkan pemungutan
                    suara dan dianggap sah bila disetujui oleh Sebagian terbesar peserta rapat
                  </li>
                </ol>

                <div className="text-center font-bold pt-2">
                  <p>BAB VIII</p>
                  <p>LAIN-LAIN</p>
                  <p>Pasal 8</p>
                </div>
                <p className="indent-8">
                  Hal – hal lain yang belum diatur dalam peraturan tata tertib ini akan ditentukan
                  oleh pimpinan rapat atas dasar persetujuan rapat
                </p>

                <div className="text-center font-bold pt-2">
                  <p>BAB IX</p>
                  <p>PENUTUPAN</p>
                  <p>PASAL 9</p>
                </div>
                <p className="indent-8">
                  Peraturan tata tertib rapat ini disetujui dan di sahkan oleh rapat anggota pada
                  tanggal {lpjParams.tanggalRat}
                </p>

                <div className="pt-12 text-center space-y-1">
                  <p>Sukabumi, {lpjParams.tanggalRat}</p>
                  <p>RAPAT ANGGOTA TAHUNAN (RAT)</p>
                  <p>KPRI “AMANAH BARAYA ” TAHUN BUKU {lpjParams.tahunBuku}</p>
                  <hr className="border-t-2 border-slate-900 w-3/4 mx-auto mt-2" />
                </div>
              </div>

              <LpjPageFooter pageNo={7} />
            </div>
          </>
        )}

        {/* ==================== SECTION II: PAGES 8 - 17 (ISI LPJ, TABEL 1-6, EVALUASI) ==================== */}
        {(activeSection === 'ALL' || activeSection === 'BAB_LAPORAN') && (
          <>
            {/* PAGE 8: PENDAHULUAN & 1. BIDANG ORGANISASI (a, b, c) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <div className="text-center font-bold uppercase space-y-0.5 mb-5">
                  <p>LAPORAN PERTANGGUNG JAWABAN</p>
                  <p>PENGURUS KPRI “AMANAH BARAYA”</p>
                  <p>TAHUN BUKU {lpjParams.periodeBukuText.toUpperCase()}</p>
                </div>

                <p className="font-bold">I. &nbsp;&nbsp;PENDAHULUAN</p>
                <p className="pl-6 indent-8">
                  Laporan pertanggung jawaban ini disusun secara ringkas dan sederhana, dalam
                  menguraikan kegiatan KPRI “Amanah Baraya” Tahun buku bulan{' '}
                  {lpjParams.periodeBukuText}.
                </p>
                <p className="pl-6">
                  Penyusunan laporan pertanggung jawaban dimaksudkan untuk mempertanggung jawabankan
                  hasil pelaksanaan kegiatan dan keuangan bulan {lpjParams.periodeBukuText} ,
                  berdasarkan evaluasi, usulan,saran dan masukan baik dari pengawas, maupun dari
                  anggota yang selanjutnya dievaluasi kembali untuk dijadikan acuan dalam memperbaiki
                  langkah kearah yang lebih baik dimasa yang akan datang.
                </p>

                <p className="font-bold pt-2">
                  II. &nbsp;PERKEMBANGAN KPRI KOPERASI AMANAH BARAYA
                </p>
                <p className="font-bold pl-6">1. &nbsp;BIDANG ORGANISASI</p>
                <div className="pl-10 space-y-3">
                  <p>
                    a. &nbsp;Susunan pengurus untuk masa bakti Th. {lpjParams.tahunBuku}-
                    {lpjParams.tahunRat} adalah sbb :
                  </p>
                  <div className="grid grid-cols-12 gap-y-1 pl-4 text-left">
                    <span className="col-span-5">- &nbsp;Ketua</span>
                    <span className="col-span-7">: {lpjParams.ketuaPengurus}</span>
                    <span className="col-span-5">- &nbsp;Sekretaris dan Kepala Toko</span>
                    <span className="col-span-7">: {lpjParams.sekretarisPengurus}</span>
                    <span className="col-span-5">- &nbsp;Bendahara</span>
                    <span className="col-span-7">: {lpjParams.bendaharaPengurus}</span>
                  </div>

                  <p className="pt-2">
                    b. &nbsp;Susunan Pengawasan untuk masa bakti {prevTahunBuku}-
                    {lpjParams.tahunRat} adalah sbb :
                  </p>
                  <div className="grid grid-cols-12 gap-y-1 pl-4 text-left">
                    <span className="col-span-5">&#10146; &nbsp;Ketua</span>
                    <span className="col-span-7">: {lpjParams.ketuaPengawasOrganisasi}</span>
                    <span className="col-span-5">&#10146; &nbsp;Anggota</span>
                    <span className="col-span-7">: {lpjParams.anggotaPengawas1}</span>
                    <span className="col-span-5"></span>
                    <span className="col-span-7">&nbsp;&nbsp;{lpjParams.anggotaPengawas2}</span>
                    <span className="col-span-5"></span>
                    <span className="col-span-7">&nbsp;&nbsp;{lpjParams.anggotaPengawas3}</span>
                  </div>

                  <p className="pt-2">c. &nbsp;Karyawan</p>
                  <p className="pl-4">
                    Jumlah karyawan koperasi Amanah Baraya tahun {lpjParams.tahunBuku} berjumlah{' '}
                    {lpjParams.jumlahKaryawan} orang.
                  </p>
                </div>
              </div>

              <LpjPageFooter pageNo={8} />
            </div>

            {/* PAGE 9: d. Keanggotaan & TABEL 1 (100% Identical to PDF Page 9) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11pt] leading-[1.5] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <p className="pl-10">d. &nbsp;Keanggotaan</p>
                <p className="text-center text-[10.5pt]">
                  Tabel 1: Perkembangan Data Anggota Tahun {prevTahunBuku} - {lpjParams.tahunBuku}
                </p>

                <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
                  <thead>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center w-12">
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-3 text-center">
                        URAIAN
                      </th>
                      <th colSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                        PERIODE
                      </th>
                    </tr>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {periodePembandingText}
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.periodeBukuText}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">1</td>
                      <td className="border border-slate-900 py-1.5 px-3 text-center">LAKI LAKI</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.prevAnggotaLaki}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjData.anggotaLaki}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">2</td>
                      <td className="border border-slate-900 py-1.5 px-3 text-center">PEREMPUAN</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.prevAnggotaPerempuan}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjData.anggotaPerempuan}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1.5 px-3 text-center">JUMLAH</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {prevTotalAnggota}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjData.totalAnggota}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <ul className="list-disc pl-12 space-y-2">
                  <li>
                    Berdasarkan data administrasi keanggotaan Koperasi, perkembangan jumlah anggota
                    selama periode Tahun Buku {prevTahunBuku} sampai dengan Tahun{' '}
                    {lpjParams.tahunBuku} menunjukkan adanya penambahan dan pengurangan anggota yang
                    tercatat secara resmi. Jumlah anggota koperasi Amanah Baraya sampai saat ini baru
                    seitar 57,5% dari jumlah seluruh karyawan RSUD Al Mulk Kota Sukabumi.
                  </li>
                  <li>
                    Pada Tahun {prevTahunBuku}, jumlah anggota yang masuk tercatat sebanyak{' '}
                    {prevTotalAnggota} orang, terdiri dari {lpjParams.prevAnggotaLaki} anggota
                    laki-laki dan {lpjParams.prevAnggotaPerempuan} anggota perempuan. Pada Tahun{' '}
                    {lpjParams.tahunBuku}, terdapat perkembangan jumlah anggota dibandingkan tahun{' '}
                    {prevTahunBuku} menjadi {lpjData.totalAnggota} orang ({lpjData.anggotaLaki}{' '}
                    anggota laki-laki dan {lpjData.anggotaPerempuan} anggota perempuan).
                  </li>
                  <li>
                    Adapun anggota yang keluar pada Tahun {prevTahunBuku} tercatat sebanyak 2 orang,
                    seluruhnya anggota perempuan. Sedangkan pada Tahun {lpjParams.tahunBuku} jumlah
                    anggota yang keluar/nonaktif tercatat sebanyak {lpjData.anggotaNonAktifCount}{' '}
                    orang. Alasan anggota keluar adalah karena pindah atau mutasi tempat kerja.
                  </li>
                  <li>
                    Dengan demikian, jumlah anggota koperasi yang masih aktif sampai dengan bulan
                    Desember tahun {lpjParams.tahunBuku} adalah sebanyak {lpjData.anggotaAktifCount}{' '}
                    orang, dengan rincian {lpjData.anggotaLaki} anggota laki-laki dan{' '}
                    {lpjData.anggotaPerempuan} anggota perempuan.
                  </li>
                  <li>
                    Secara keseluruhan, kondisi keanggotaan koperasi dapat dinyatakan dalam keadaan
                    stabil dengan tingkat partisipasi anggota yang tetap terjaga. Pengurus akan terus
                    berupaya meningkatkan jumlah dan partisipasi aktif anggota guna memperkuat
                    permodalan dan keberlangsungan usaha koperasi.
                  </li>
                </ul>
              </div>

              <LpjPageFooter pageNo={9} />
            </div>

            {/* PAGE 10: 2. BIDANG USAHA -> a. Unit Usaha Simpan Pinjam (USP) & TABEL 2 (100% Identical to PDF Page 10) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11pt] leading-[1.5] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <p className="font-bold pl-6">2. &nbsp;BIDANG USAHA</p>
                <p className="font-bold pl-10">a. &nbsp;Unit Usaha Simpan Pinjam (USP)</p>
                <p className="text-center text-[10.5pt]">
                  Tabel 2: Perkembangan Unit Usaha Simpan Pinjam Tahun {prevTahunBuku} -{' '}
                  {lpjParams.tahunBuku}
                </p>

                <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
                  <thead>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center w-12">
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-3 text-center">
                        URAIAN
                      </th>
                      <th colSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                        CAPAIAN PERIODE
                      </th>
                    </tr>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {periodePembandingText}
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.periodeBukuText}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">1</td>
                      <td className="border border-slate-900 py-1.5 px-3">Anggota yang dilayani</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.prevPinjamAnggotaDilayani}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjData.pinjamAnggotaDilayani}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">2</td>
                      <td className="border border-slate-900 py-1.5 px-3">Pemberian Pinjaman</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevPemberianPinjaman} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.pemberianPinjaman} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">3</td>
                      <td className="border border-slate-900 py-1.5 px-3">Angsuran Pinjaman</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevAngsuranPinjaman} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.angsuranPinjaman} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">4</td>
                      <td className="border border-slate-900 py-1.5 px-3">Sisa Pinjaman</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevSisaPinjaman} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.sisaPinjaman} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">5</td>
                      <td className="border border-slate-900 py-1.5 px-3">Jasa / Ujroh</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevJasaPinjaman} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.jasaPinjaman} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <ul className="list-disc pl-12 space-y-2">
                  <li>
                    Jumlah Pemberian pinjaman periode bulan {lpjParams.periodeBukuText} adalah
                    sebesar Rp. {f(lpjData.pemberianPinjaman)}, berbeda sekitar {pctPinjamanDiff}%
                    dibandingkan dengan pemberian pinjaman pada periode {periodePembandingText}{' '}
                    yaitu Rp. {f(lpjParams.prevPemberianPinjaman)}
                  </li>
                  <li>
                    Jumlah angsuran pinjaman yang sudah dibayarkan pada periode{' '}
                    {lpjParams.periodeBukuText} adalah Rp. {f(lpjData.angsuranPinjaman)}, yaitu{' '}
                    {pctAngsuranRatio}% dari total pinjaman.
                  </li>
                  <li>
                    Jumlah sisa pinjaman anggota sampai Desember {lpjParams.tahunBuku} adalah{' '}
                    {f(lpjData.sisaPinjaman)}, yaitu {pctSisaRatio}% dari total pemberian pinjaman.
                  </li>
                  <li>
                    Jumlah jasa / ujroh yang terkumpul pada periode {lpjParams.periodeBukuText}{' '}
                    adalah sebesar Rp. {f(lpjData.jasaPinjaman)} dibandingkan dengan capaian jumlah
                    jasa periode {periodePembandingText} sebesar Rp. {f(lpjParams.prevJasaPinjaman)}.
                    Hal ini disesuaikan dengan periode waktu pelaporan bulan{' '}
                    {lpjParams.periodeBukuText}, sedangkan periode sebelumnya dilaporkan dalam kurun
                    waktu periode {periodePembandingText}.
                  </li>
                </ul>
              </div>

              <LpjPageFooter pageNo={10} />
            </div>

            {/* PAGE 11: b. Unit Usaha Waserda, TABEL 3 & 3. Bidang Permodalan (100% Identical to PDF Page 11) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11pt] leading-[1.5] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <p className="font-bold pl-10">b. &nbsp;Unit Usaha Waserda</p>
                <p className="text-center text-[10.5pt]">
                  Tabel 3 : Perkembangan Unit Usaha Waserda tahun {prevTahunBuku} -{' '}
                  {lpjParams.tahunBuku}
                </p>

                <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
                  <thead>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center w-12">
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-3 text-center">
                        URAIAN
                      </th>
                      <th colSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                        CAPAIAN PERIODE
                      </th>
                    </tr>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {periodePembandingText}
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.periodeBukuText}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">1</td>
                      <td className="border border-slate-900 py-1.5 px-3">Anggota yang dilayani</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.prevWaserdaAnggotaDilayani}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjData.waserdaAnggotaDilayani}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">2</td>
                      <td className="border border-slate-900 py-1.5 px-3">Pembelian Barang</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevPembelianWaserda} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.pembelianBarangWaserda} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">3</td>
                      <td className="border border-slate-900 py-1.5 px-3">Pendapatan</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevPendapatanWaserda} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.pendapatanWaserda} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">4</td>
                      <td className="border border-slate-900 py-1.5 px-3">Saldo Piutang Barang</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevPiutangWaserda} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.saldoPiutangWaserda} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">5</td>
                      <td className="border border-slate-900 py-1.5 px-3">Persediaan Barang</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevPersediaanBarang} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.persediaanBarangWaserda} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="pl-10 indent-8">
                  Trend perkembangan usaha waserda tahun {lpjParams.tahunBuku} dibandiingkan dengan
                  tahun sebelumnya dapat dijelaskan sebagai berikut :
                </p>
                <ul className="list-disc pl-14 space-y-1.5">
                  <li>
                    Pengeluaran pembelian barang, pendapatan dan saldo piutang barang periode{' '}
                    {lpjParams.periodeBukuText} tercatat secara realtime dibandingkan dengan periode
                    sebelumnya yaitu periode {periodePembandingText}.
                  </li>
                  <li>Pendapatan dengan pembelian barang terdapat surplus.</li>
                  <li>
                    Selain terdapat surplus pendapatan, terdapat juga persediaan barang senilai Rp.{' '}
                    {f(lpjData.persediaanBarangWaserda)} dan Piutang barang sebesar Rp.{' '}
                    {f(lpjData.saldoPiutangWaserda)}
                  </li>
                  <li>Diharapkan waserda dapat berkembang lebih baik lagi</li>
                </ul>

                <p className="font-bold pl-6 pt-2">3. &nbsp;Bidang Permodalan</p>
                <p className="pl-10">
                  Modal usaha di koperasi Amanah baraya berasal dari simpanan pokok, simpanan wajib,
                  simpanan sukarela, dan simpanan karyawisata yang berkembang dengan adanya
                  kesepakatan dan Kerjasama Bersama rumah sakit dengan pemotongan secara otomatis
                  dari bagian keuangan rumah sakit. Serta penghitungan oleh bagian rumah sakit dalam
                  menghitung dan memperkirakan kemampuan bayar dari anggota.
                </p>
                <p className="pl-10">
                  Besarnya simpanan anggota yang disepakati dan berjalan sampai pada tahun{' '}
                  {lpjParams.tahunBuku} adalah :
                </p>
              </div>

              <LpjPageFooter pageNo={11} />
            </div>

            {/* PAGE 12: SIMPANAN RATES & TABEL 4 (100% Identical to PDF Page 12) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11pt] leading-[1.5] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <div className="grid grid-cols-12 gap-y-1 pl-12 text-left">
                  <span className="col-span-5">&#10146; &nbsp;Simpanan pokok</span>
                  <span className="col-span-7">: Rp. 200.000,- / anggota</span>
                  <span className="col-span-5">&#10146; &nbsp;Simpanan wajib</span>
                  <span className="col-span-7">: Rp. &nbsp;30.000,- / bulan / anggota</span>
                  <span className="col-span-5">&#10146; &nbsp;Simpanan sukarela</span>
                  <span className="col-span-7">: sesuai kemampuan</span>
                  <span className="col-span-5">&#10146; &nbsp;Simpanan karyawisata</span>
                  <span className="col-span-7">: Rp. 20.000,- / bulan / anggota</span>
                </div>

                <p className="text-center text-[10.5pt] pt-2">
                  Tabel 4 : Perkembangan Jumlah Simpanan Anggota
                </p>

                <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
                  <thead>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center w-12">
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-3 text-center">
                        URAIAN
                      </th>
                      <th colSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                        CAPAIAN PERIODE
                      </th>
                    </tr>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {periodePembandingText}
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.periodeBukuText}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">1</td>
                      <td className="border border-slate-900 py-1.5 px-3">Simpanan Pokok</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevSimpananPokok} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.totalSimpananPokok} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">2</td>
                      <td className="border border-slate-900 py-1.5 px-3">Simpanan Wajib</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevSimpananWajib} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.totalSimpananWajib} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">3</td>
                      <td className="border border-slate-900 py-1.5 px-3">Simpanan Sukarela</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevSimpananSukarela} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.totalSimpananSukarela} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">4</td>
                      <td className="border border-slate-900 py-1.5 px-3">Simpanan Karyawisata</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevSimpananWisata} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.totalSimpananWisata} />
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="border border-slate-900 py-1.5 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1.5 px-3 text-center">Jumlah</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={prevTotalSimpanan} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.totalSeluruhSimpanan} bold />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="pl-10">
                  Trend jumlah simpanan Pokok, simpanan wajib, simpanan sukarela, dan simpanan
                  karyawisata dapat dijelaskan sebagai berikut:
                </p>
                <div className="pl-12 space-y-2">
                  <p>
                    &#10146; &nbsp;Jumlah simpanan pokok dan simpanan wajib periode{' '}
                    {lpjParams.periodeBukuText} tercatat sebesar Rp. {f(lpjData.totalSimpananPokok)}{' '}
                    untuk simpanan Pokok dan Rp. {f(lpjData.totalSimpananWajib)} untuk simpanan
                    wajib jika dibandingkan dengan jumlah simpanan pada periode sebelumnya. Hal ini
                    disebabkan masuknya anggota baru yang menambah jumlah simpanan Pokok dan simpanan
                    wajib koperasi.
                  </p>
                  <p>
                    &#10146; &nbsp;Untuk simpanan sukarela, pada periode {lpjParams.periodeBukuText}{' '}
                    tercatat sebesar Rp. {f(lpjData.totalSimpananSukarela)} dari periode sebelumnya,
                    sesuai transaksi setoran dan penarikan simpanan sukarela anggota sebelum bulan
                    Desember {lpjParams.tahunBuku} untuk alasan kepentingan pribadi.
                  </p>
                  <p>
                    &#10146; &nbsp;Simpanan karyawisata mengalami sedikit penurunan karena pada
                    periode pelaporan {lpjParams.periodeBukuText}, telah dilakukan kegiatan
                    karyawisata ke Pangalengan Bandung yang diikuti oleh 30 orang anggota
                  </p>
                </div>
              </div>

              <LpjPageFooter pageNo={12} />
            </div>

            {/* PAGE 13: 4. DANA KESEJAHTERAAN (TABEL 5) & III. REALISASI PENDAPATAN DAN BELANJA (TABEL 6) (100% Identical to PDF Page 13) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11pt] leading-[1.5] flex flex-col justify-between">
              <div className="space-y-3.5 text-justify">
                <p className="pl-12">
                  koperasi Amanah Baraya dengan menggunakan simpanan karyawisata masing masing,
                  sehingga jumlah simpanan karyawisata berkurang.
                </p>

                <p className="font-bold pl-6 pt-1">4. &nbsp;Dana Kesejahteraan</p>
                <p className="pl-10">
                  Dana kesejahteraan anggota koperasi Amanah Baraya dalam bentuk Surplus Hasil Usaha
                  (SHU) dan bingkisan yang diberikan kepada anggota pada waktu akhir periode
                  pelaporan tutup buku.
                </p>
                <p className="pl-10">
                  SHU diperoleh dari pengurangan pendapatan terhadap biaya operasional yang
                  dikeluarkan. SHU dibagikan kepada anggota dalam bentuk jasa penyimpan dan jasa
                  peminjam sesuai dengan aturan yang telah ditetapkan. Bingkisan untuk anggota
                  dialokasikan dalam biaya operasional koperasi.
                </p>

                <p className="text-center text-[10.5pt]">
                  Tabel 5 : Perkembangan Dana Kesejahteraan Anggota Tahun {prevTahunBuku} –{' '}
                  {lpjParams.tahunBuku}
                </p>

                <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
                  <thead>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center w-12">
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-3 text-center">
                        URAIAN
                      </th>
                      <th colSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                        CAPAIAN PERIODE
                      </th>
                    </tr>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {periodePembandingText}
                      </th>
                      <th className="border border-slate-900 py-1.5 px-2 text-center">
                        {lpjParams.periodeBukuText}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">1</td>
                      <td className="border border-slate-900 py-1.5 px-3">SHU anggota</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevShuAnggota} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.shuAnggotaKesejahteraan} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1.5 px-2 text-center">2</td>
                      <td className="border border-slate-900 py-1.5 px-3">Bingkisan</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjParams.prevBingkisan} />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.bingkisanKesejahteraan} />
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="border border-slate-900 py-1.5 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1.5 px-3">Jumlah</td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={prevTotalKesejahteraan} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3">
                        <RpCell value={lpjData.totalDanaKesejahteraan} bold />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="font-bold pt-2">III. &nbsp;&nbsp;REALISASI PENDAPATAN DAN BELANJA</p>
                <p className="text-center text-[10.5pt]">
                  Tabel 6 : Realisasi Pendapatan dan Belanja
                  <br />
                  Periode {lpjParams.periodeBukuText}
                </p>

                <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
                  <thead>
                    <tr className="bg-[#b4c6e7] font-bold">
                      <th className="border border-slate-900 py-1.5 px-2 text-center w-12">NO</th>
                      <th className="border border-slate-900 py-1.5 px-3 text-center">URAIAN</th>
                      <th className="border border-slate-900 py-1.5 px-3 text-center w-48">
                        REALISASI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr className="font-bold">
                      <td className="border border-slate-900 py-1 px-2 text-center">A</td>
                      <td className="border border-slate-900 py-1 px-3">PENDAPATAN</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.totalPendapatanLabaRugi} bold />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">1. Jasa / Ujroh</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.pendapatanJasaUjroh} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">2. Pendapatan Waserda</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.pendapatanWaserdaLabaRugi} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">3. Persediaan Barang</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.pendapatanPersediaanBarang} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">4. Bank</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.pendapatanBank} />
                      </td>
                    </tr>

                    <tr className="font-bold">
                      <td className="border border-slate-900 py-1 px-2 text-center">B</td>
                      <td className="border border-slate-900 py-1 px-3">BIAYA BIAYA</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.totalBiayaLabaRugi} bold />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">
                        1. Pembelian Barang Waserda
                      </td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.biayaPembelianWaserda} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">
                        2. Biaya Paket Bingkisan
                      </td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.biayaPaketBingkisan} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">3. Honor Karyawan</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.biayaHonorKaryawan} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3">4. Potongan Admin Bank</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.biayaAdminBank} />
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="border border-slate-900 py-1 px-2 text-center"></td>
                      <td className="border border-slate-900 py-1 px-3 text-center">SHU</td>
                      <td className="border border-slate-900 py-1 px-3">
                        <RpCell value={lpjData.surplusHasilUsaha} bold />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <LpjPageFooter pageNo={13} />
            </div>

            {/* PAGE 14: IV. EVALUASI AKHIR KEGIATAN (a & b.1-5) (100% Identical to PDF Page 14) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <p className="font-bold">IV. &nbsp;&nbsp;EVALUASI AKHIR KEGIATAN</p>
                <p className="pl-10">
                  Berdasarkan rencana kegiatan yang disusun untuk dilaksanakan pada tahun{' '}
                  {lpjParams.tahunBuku}, masih ada beberapa rencana kegiatan yang belum terlaksana
                  secara maksimal. Berikut beberapa catatan yang dirangkum sebagai evaluasi dan
                  bahan pertimbangan untuk rencana kegiatan tahun {lpjParams.tahunRat}.
                </p>

                <p className="font-bold pl-6 pt-2">a. &nbsp;Catatan Bidang Kelembagaan</p>
                <ol className="list-decimal pl-12 space-y-1.5">
                  <li>
                    Diperlukan penataan ulang struktur organisasi serta kejelasan tugas pokok dan
                    fungsi masing-masing pengurus dan pengawas koperasi sehingga dapat lebih
                    memajukan koperasi Amanah Baraya
                  </li>
                  <li>
                    Perlu adanya penyusunan dan penetapan standar operasional prosedur (SOP)
                    pelayanan, pengelolaan keuangan, serta pengelolaan barang, sehingga pencatatan
                    akan lebih rapi.
                  </li>
                  <li>
                    Perlu adanya pengembangan unit usaha simpan pinjam dan waserda dengan
                    mengedepankan prinsip syariah.
                  </li>
                  <li>Perlu adanya jadwal pelaksanaan rapat rutin pengurus dan pengawas koperasi.</li>
                  <li>
                    Penyusunan laporan keuangan perlu dilakukan secara berkala (bulanan dan tahunan)
                    secara transparan dan akuntabel.
                  </li>
                  <li>
                    Untuk pengembangan Koperasi Amanah Baraya kedepannya, maka diperlukan pengajuan
                    legalitas perijinan koperasi Amanah Baraya.
                  </li>
                </ol>

                <p className="font-bold pl-6 pt-2">b. &nbsp;Catatan Bidang Permodalan</p>
                <ol className="list-decimal pl-12 space-y-1.5">
                  <li>
                    Mengoptimalkan modal sendiri untuk memenuhi kebutuhan pinjaman anggota. Salah
                    satu upaya yang dapat dilakukan adalah dengan mengajak seluruh karyawan RSUD Al
                    Mulk untuk menjadi anggota koperasi Amanah Baraya, sehingga akan menambah jumlah
                    simpanan koperasi.
                  </li>
                  <li>Mengupayakan kemandirian permodalan unit waserda.</li>
                  <li>Menjaga keseimbangan antara likuiditas dan penyaluran pinjaman.</li>
                  <li>
                    Meningkatkan disiplin pembayaran anggota guna menjaga kesehatan keuangan
                    koperasi.
                  </li>
                  <li>
                    Simpanan wajib dan simpanan pokok tidak bisa diambil, kecuali anggotanya keluar.
                  </li>
                </ol>
              </div>

              <LpjPageFooter pageNo={14} />
            </div>

            {/* PAGE 15: LANJUTAN b.6-8 & c. CATATAN BIDANG USAHA (1. USP) (100% Identical to PDF Page 15) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <ol start={6} className="list-decimal pl-12 space-y-1.5">
                  <li>Dana simpanan poko diusulkan penambahan menjadi Rp. 300.000;00</li>
                  <li>
                    Dana sukarela diwajibkan untuk setiap anggota menyimpan tabunga minimal Rp.
                    30.000;00
                  </li>
                  <li>
                    Dana wisata hanya bisa dipakai untuk kegiatan wisata / pembelian akomodasi untuk
                    kegiatan program koperasi Amanah Baraya
                  </li>
                </ol>

                <p className="font-bold pl-6 pt-2">c. &nbsp;Catatan Bidang Usaha</p>
                <p className="font-bold pl-6">1. &nbsp;Unit Simpan Pinjam</p>
                <ul className="list-disc pl-12 space-y-1.5">
                  <li>
                    Meningkatkan sistem pengawasan dan pencatatan melalui sistem administrasi yang
                    tertib.
                  </li>
                  <li>
                    Pinjaman diberikan kepada anggota aktif dengan mempertimbangkan kemampuan
                    pembayaran (potong gaji melalui Bank BJB).
                  </li>
                  <li>
                    Anggota baru dapat mengajukan pinjaman setelah minimal 3 bulan masa keanggotaan.
                  </li>
                  <li>Besaran pinjaman maksimal 6 kali jumlah simpanan.</li>
                  <li>Jangka waktu pinjaman maksimal 12 bulan (1 tahun).</li>
                  <li>
                    Ujroh/jasa pinjaman sebesar 1,5% tetap per bulan (mengacu prinsip syariah).
                  </li>
                  <li>Pengajuan pinjaman maksimal tanggal 15 setiap bulan.</li>
                  <li>
                    Perlu ada kesepakatan batas maksimal tenor peminjaman dan jumlah peminjaman
                  </li>
                  <li>
                    Sistem pembayaran melalui potong gaji/tunjangan kinerja atau transfer ke rekening
                    koperasi.
                  </li>
                  <li>
                    Setiap anggota peminjam, diharuskan melunasi pinjamannya sebelum mengajukan
                    peminjaman baru.
                  </li>
                  <li>
                    Setiap peminjaman apabila ada yang melunasi di pertengahan cicilan, makan
                    pelunasan terhitung semua jumlah sisa hutang ditambah ujroh sampai bulan cicilan
                    pelunasan.
                  </li>
                </ul>
              </div>

              <LpjPageFooter pageNo={15} />
            </div>

            {/* PAGE 16: d. Unit Waserda, e. Catatan Umum RAPB 2026 & V. PENUTUP (100% Identical to PDF Page 16) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-4 text-justify">
                <p className="font-bold pl-6">d. &nbsp;Unit Waserda</p>
                <ul className="list-disc pl-12 space-y-1.5">
                  <li>
                    Untuk mempermudah dan merapihkan pencatatan kegiatan waserda oleh
                    petugas/karyawan koperasi, dipandang perlu adanya mesin kasir di waserda
                    koperasi.
                  </li>
                  <li>Menambah variasi dan persediaan barang kebutuhan anggota.</li>
                  <li>Pengelolaan dana waserda dipisahkan dari unit simpan pinjam.</li>
                  <li>Pembaruan kerja sama dengan supplier untuk mendapatkan harga kompetitif.</li>
                  <li>Peningkatan sistem pencatatan stok dan pengawasan barang.</li>
                  <li>
                    Pembelian dengan kasbon untuk pegawai RS maksimal 300.000/bulan dan untuk
                    petugas kebersihan maksimal 100.000/bulan
                  </li>
                </ul>

                <p className="font-bold pl-6 pt-2">
                  e. &nbsp;Catatan Umum RAPB {lpjParams.tahunRat}
                </p>
                <ul className="list-disc pl-12 space-y-1.5">
                  <li>
                    RAPB disusun berdasarkan proyeksi pendapatan jasa pinjaman, margin waserda, serta
                    pendapatan lainnya.
                  </li>
                  <li>
                    Biaya operasional difokuskan pada efisiensi dan efektivitas penggunaan anggaran.
                  </li>
                  <li>SHU yang diperoleh akan dibagikan sesuai ketentuan AD/ART koperasi.</li>
                  <li>
                    Pengurus berkomitmen menjaga prinsip transparansi dan akuntabilitas dalam
                    pengelolaan keuangan.
                  </li>
                </ul>

                <p className="font-bold pt-3">V. &nbsp;&nbsp;PENUTUP</p>
                <p className="pl-10">
                  Demikian laporan pertanggungjawaban pengurus Koperasi Amanah Baraya tahun buku{' '}
                  {lpjParams.periodeBukuText}, semoga dapat dijadikan bahan evaluasi dalam program
                  dan kegiatan pengurus dimasa yang akan datang.
                </p>
                <p className="pl-10">
                  Atas partisipasi seluruh anggota terhadap kelancaran Koperasi Amanah Baraya kami
                  ucapkan terima kasih.
                </p>
              </div>

              <LpjPageFooter pageNo={16} />
            </div>

            {/* PAGE 17: LEMBAR TANDA TANGAN PENGURUS & PENGAWAS (100% Identical to PDF Page 17) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11.5pt] leading-[1.6] flex flex-col justify-between">
              <div className="space-y-6 pt-4">
                <div className="text-center font-bold space-y-0.5">
                  <p>Sukabumi, {lpjParams.tanggalRat}</p>
                  <p>Koperasi Amanah Baraya</p>
                  <p>Pengurus</p>
                </div>

                <div className="space-y-5 pt-4">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Ketua</span>
                    <span className="col-span-5">: {lpjParams.ketuaPengurus}</span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Sekertaris &amp; Pengelola Toko</span>
                    <span className="col-span-5">: {lpjParams.sekretarisPengurus}</span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Bendahara</span>
                    <span className="col-span-5">: {lpjParams.bendaharaPengurus}</span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                </div>

                <p className="text-center font-bold pt-4">Pengawas</p>

                <div className="space-y-5 pt-2">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Ketua</span>
                    <span className="col-span-5">
                      : {lpjParams.ketuaPengawasLembarPengesahan}
                    </span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Anggota</span>
                    <span className="col-span-5">: {lpjParams.anggotaPengawas1}</span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Anggota</span>
                    <span className="col-span-5">: {lpjParams.anggotaPengawas2}</span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4">Anggota</span>
                    <span className="col-span-5">: {lpjParams.anggotaPengawas3}</span>
                    <span className="col-span-3 text-right">(…………………………..)</span>
                  </div>
                </div>
              </div>

              <LpjPageFooter pageNo={17} />
            </div>
          </>
        )}

        {/* ==================== SECTION III: PAGES 18 - 19 (LABA/RUGI & PEMBAGIAN SHU) ==================== */}
        {(activeSection === 'ALL' || activeSection === 'LABA_RUGI_SHU') && (
          <>
            {/* PAGE 18: PERHITUNGAN HASIL USAHA (LABA/RUGI) (100% Identical to PDF Page 18) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[11pt] leading-[1.55] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="text-center space-y-0.5">
                  <p>PERHITUNGAN HASIL USAHA (LABA/RUGI)</p>
                  <p>KOPERASI AMANAH BARAYA KOTA SUKABUMI</p>
                  <p>PER : {lpjParams.tanggalTutupBuku.toUpperCase()}</p>
                </div>

                <table className="w-full border-collapse text-[11pt]">
                  <tbody className="tabular-nums">
                    <tr>
                      <td colSpan={3} className="py-1">
                        PENDAPATAN :
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="py-1 w-[55%]">PENDAPATAN</td>
                      <td className="py-1 w-[20%]"></td>
                      <td className="py-1 w-[25%]">
                        <RpCell value={lpjData.totalPendapatanLabaRugi} bold />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">1. Jasa / Ujroh</td>
                      <td className="py-1"></td>
                      <td className="py-1">
                        <RpCell value={lpjData.pendapatanJasaUjroh} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">2. Pendapatan Waserda</td>
                      <td className="py-1"></td>
                      <td className="py-1">
                        <RpCell value={lpjData.pendapatanWaserdaLabaRugi} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">3. Persediaan Barang</td>
                      <td className="py-1"></td>
                      <td className="py-1">
                        <RpCell value={lpjData.pendapatanPersediaanBarang} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">4. Bank</td>
                      <td className="py-1"></td>
                      <td className="py-1">
                        <RpCell value={lpjData.pendapatanBank} />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={3} className="h-5"></td>
                    </tr>

                    <tr className="font-bold">
                      <td className="py-1">BIAYA BIAYA</td>
                      <td className="py-1 pr-4">
                        <RpCell value={lpjData.totalBiayaLabaRugi} bold />
                      </td>
                      <td className="py-1"></td>
                    </tr>
                    <tr>
                      <td className="py-1">1. Pembelian Barang Waserda</td>
                      <td className="py-1 pr-4">
                        <RpCell value={lpjData.biayaPembelianWaserda} />
                      </td>
                      <td className="py-1"></td>
                    </tr>
                    <tr>
                      <td className="py-1">2. Biaya Paket Bingkisan</td>
                      <td className="py-1 pr-4">
                        <RpCell value={lpjData.biayaPaketBingkisan} />
                      </td>
                      <td className="py-1"></td>
                    </tr>
                    <tr>
                      <td className="py-1">4. Honor Karyawan</td>
                      <td className="py-1 pr-4">
                        <RpCell value={lpjData.biayaHonorKaryawan} />
                      </td>
                      <td className="py-1"></td>
                    </tr>
                    <tr>
                      <td className="py-1">5. Potongan Admin Bank</td>
                      <td className="py-1 pr-4">
                        <RpCell value={lpjData.biayaAdminBank} />
                      </td>
                      <td className="py-1"></td>
                    </tr>
                    <tr className="font-bold">
                      <td className="py-2 text-center">SHU</td>
                      <td className="py-2 pr-4">
                        <RpCell value={lpjData.surplusHasilUsaha} bold />
                      </td>
                      <td className="py-2"></td>
                    </tr>
                  </tbody>
                </table>

                <div className="pt-8 space-y-6">
                  <div className="text-right pr-8">
                    <p>sukabumi, {lpjParams.tanggalTutupBuku}</p>
                    <p>KPRI Amanah Baraya Kota Sukabumi</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center pt-2">
                    <div className="space-y-16">
                      <p>Ketua,</p>
                      <p>{lpjParams.ketuaPengurus}</p>
                    </div>
                    <div className="space-y-16">
                      <p>Kepala Toko</p>
                      <p>{lpjParams.sekretarisPengurus}</p>
                    </div>
                    <div className="space-y-16">
                      <p>Bendahara,</p>
                      <p>{lpjParams.bendaharaPengurus}</p>
                    </div>
                  </div>
                </div>
              </div>

              <LpjPageFooter pageNo={18} />
            </div>

            {/* PAGE 19: PEMBAGIAN SURPLUS HASIL USAHA & PRESENTASI PEMBAGIAN SHU (100% Identical to PDF Page 19) */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[10.5pt] leading-[1.5] flex flex-col justify-between">
              <div className="space-y-5">
                <div className="text-center space-y-0.5">
                  <p className="text-[11.5pt]">PEMBAGIAN SURPLUS HASIL USAHA</p>
                  <p className="text-[11.5pt]">
                    KOPERASI AMANAH BARAYA RSUD AL MULK KKOTA SUKABUMI
                  </p>
                  <p className="text-[11pt]">PER {lpjParams.tanggalTutupBuku.toUpperCase()}</p>
                </div>

                <table className="w-full border-collapse text-[10.5pt]">
                  <tbody className="tabular-nums">
                    <tr>
                      <td className="py-1 w-[42%]">SURPLUS HASIL USAHA</td>
                      <td className="py-1 w-[10%]"></td>
                      <td className="py-1 w-[22%]"></td>
                      <td className="py-1 w-[4%] text-center">=</td>
                      <td className="py-1 w-[22%]">
                        <RpCell value={lpjData.surplusHasilUsaha} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">ZAKAT</td>
                      <td className="py-1 text-center">
                        {formatDecimalTwoIndo(lpjParams.zakatPercent)}%
                      </td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.surplusHasilUsaha)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1 border-b border-slate-900">
                        <RpCell value={lpjData.zakatNominal} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">SHU YANG DIBAGIKAN</td>
                      <td className="py-1"></td>
                      <td className="py-1"></td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.shuYangDibagikan} />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="h-4"></td>
                    </tr>

                    <tr>
                      <td className="py-1">1. DANA CADANGAN</td>
                      <td className="py-1 text-center">{lpjParams.shuCadanganPercent}%</td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiCadangan} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">2. BAGIAN ANGGOTA PENYIMPAN</td>
                      <td className="py-1 text-center">{lpjParams.shuAnggotaPenyimpanPercent}%</td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiAnggotaPenyimpan} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">3. BAGIAN ANGGOTA BERJASA</td>
                      <td className="py-1 text-center">{lpjParams.shuAnggotaBerjasaPercent}%</td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiAnggotaBerjasa} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">4. DANA PENGURUS</td>
                      <td className="py-1 text-center">{lpjParams.shuPengurusPercent}%</td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiDanaPengurus} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">5. DANA PENGAWAS</td>
                      <td className="py-1 text-center">{lpjParams.shuPengawasPercent}%</td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiDanaPengawas} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">6. DANA PEMBANGUNAN DAERAH KERJA</td>
                      <td className="py-1 text-center">
                        {lpjParams.shuPembangunanDaerahKerjaPercent}%
                      </td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiPembangunanDaerahKerja} />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">7. DANA SOSIAL</td>
                      <td className="py-1 text-center">{lpjParams.shuDanaSosialPercent}%</td>
                      <td className="py-1">
                        X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;{f(lpjData.shuYangDibagikan)}
                      </td>
                      <td className="py-1 text-center">=</td>
                      <td className="py-1">
                        <RpCell value={lpjData.alokasiDanaSosial} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="pt-3 space-y-2">
                  <p>PRESENTASI PEMBAGIAN SHU</p>
                  <table className="w-full border-collapse text-[10.5pt]">
                    <tbody className="tabular-nums">
                      <tr>
                        <td className="py-1 w-[42%]">1. BAGIAN ANGGOTA PENYIMPAN</td>
                        <td className="py-1 w-[24%] border-b border-slate-900">
                          <RpCell value={lpjData.alokasiAnggotaPenyimpan} />
                        </td>
                        <td className="py-1 w-[6%] text-center">X</td>
                        <td className="py-1 w-[10%] text-center">100%</td>
                        <td className="py-1 w-[4%] text-center">=</td>
                        <td className="py-1 w-[14%] text-right font-bold">
                          {lpjData.persenShuSimpananFormatted}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1"></td>
                        <td className="py-1">
                          <RpCell value={lpjData.totalSeluruhSimpanan} />
                        </td>
                        <td colSpan={4} className="py-1"></td>
                      </tr>

                      <tr>
                        <td colSpan={6} className="h-2"></td>
                      </tr>

                      <tr>
                        <td className="py-1">2. BAGIAN ANGGOTA BERJASA</td>
                        <td className="py-1 border-b border-slate-900">
                          <RpCell value={lpjData.alokasiAnggotaBerjasa} />
                        </td>
                        <td className="py-1 text-center">X</td>
                        <td className="py-1 text-center">100%</td>
                        <td className="py-1 text-center">=</td>
                        <td className="py-1 text-right font-bold">
                          {lpjData.persenShuJasaFormatted}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1"></td>
                        <td className="py-1">
                          <RpCell value={lpjData.totalJasaPinjamanAnggota} />
                        </td>
                        <td colSpan={4} className="py-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-6 space-y-4">
                  <div className="text-right pr-8">
                    <p>sukabumi, {lpjParams.tanggalTutupBuku}</p>
                    <p>KPRI Amanah Baraya Kota Sukabumi</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center pt-2">
                    <div className="space-y-14">
                      <p>Ketua,</p>
                      <p>{lpjParams.ketuaPengurus}</p>
                    </div>
                    <div className="space-y-14">
                      <p>Kepala Toko</p>
                      <p>{lpjParams.sekretarisPengurus}</p>
                    </div>
                    <div className="space-y-14">
                      <p>Bendahara,</p>
                      <p>{lpjParams.bendaharaPengurus}</p>
                    </div>
                  </div>
                </div>
              </div>

              <LpjPageFooter pageNo={19} />
            </div>
          </>
        )}

        {/* ==================== SECTION IV: PAGES 20 - 23 (REKAP SIMPANAN & SISA HUTANG PER 31 DESEMBER) ==================== */}
        {(activeSection === 'ALL' || activeSection === 'LAMPIRAN_PIUTANG') && (
          <div className="f4-sheet-landscape bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[33cm] p-4 sm:p-[2.5cm] text-slate-900 font-sans text-[9.5pt] leading-[1.35] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-center font-bold uppercase space-y-0.5">
                <p className="text-[10.5pt]">REKAP SIMPANAN ANGGOTA KOPERASI AMANAH BARAYA</p>
                <p className="text-[10.5pt]">RSUD AL MULK KOTA SUKABUMI</p>
                <p className="text-[10pt]">PER : {lpjParams.tanggalTutupBuku.toUpperCase()}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-[8.5pt]">
                  <thead>
                    <tr className="font-bold">
                      <th
                        rowSpan={2}
                        className="border border-slate-900 py-1.5 px-1.5 text-center w-8"
                      >
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                        NAMA
                      </th>
                      <th colSpan={4} className="border border-slate-900 py-1 px-2 text-center">
                        SIMPANAN KOPERASI
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-slate-900 py-1.5 px-2 text-center w-24"
                      >
                        JUMLAH
                        <br />
                        SIMPANAN
                      </th>
                      <th colSpan={3} className="border border-slate-900 py-1 px-2 text-center">
                        SISA HUTANG
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-slate-900 py-1.5 px-2 text-center w-24"
                      >
                        JUMLAH PIUTANG
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-slate-900 py-1.5 px-2 text-center w-24"
                      >
                        JUMLAH JASA
                        <br />
                        PINJAMAN
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-slate-900 py-1.5 px-2 text-center w-20"
                      >
                        KETERANGAN
                      </th>
                    </tr>
                    <tr className="font-bold">
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        POKOK
                      </th>
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        WAJIB
                      </th>
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        SUKARELA
                      </th>
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        WISATA
                      </th>
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        HUTANG
                        <br />
                        PINJAMAN
                      </th>
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        HUTANG
                        <br />
                        BARANG
                      </th>
                      <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                        KEKURANGAN
                        <br />
                        KARYAWISATA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {filteredMemberRows.map((row) => (
                      <tr key={row.memberId} className="hover:bg-slate-50">
                        <td className="border border-slate-900 py-1 px-1.5 text-center">
                          {row.no}
                        </td>
                        <td className="border border-slate-900 py-1 px-2">{row.name}</td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.pokok} />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.wajib} />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.sukarela} />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.wisata} />
                        </td>
                        <td className="border border-slate-900 py-1 px-2">
                          <RpCell value={row.jumlahSimpanan} bold />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.hutangPinjaman} />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.hutangBarang} />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5">
                          <RpCell value={row.kekuranganKaryawisata} />
                        </td>
                        <td className="border border-slate-900 py-1 px-2">
                          <RpCell value={row.jumlahPiutang} bold />
                        </td>
                        <td className="border border-slate-900 py-1 px-2">
                          <RpCell value={row.jumlahJasaPinjaman} />
                        </td>
                        <td className="border border-slate-900 py-1 px-1.5 text-center">
                          {row.keterangan}
                        </td>
                      </tr>
                    ))}

                    {!memberSearch.trim() &&
                      lpjData.nonMemberRows.map((na) => (
                        <tr key={`na-${na.no}`}>
                          <td className="border border-slate-900 py-1 px-1.5 text-center"></td>
                          <td className="border border-slate-900 py-1 px-2">{na.name}</td>
                          <td className="border border-slate-900 py-1 px-1.5"></td>
                          <td className="border border-slate-900 py-1 px-1.5"></td>
                          <td className="border border-slate-900 py-1 px-1.5"></td>
                          <td className="border border-slate-900 py-1 px-1.5"></td>
                          <td className="border border-slate-900 py-1 px-2"></td>
                          <td className="border border-slate-900 py-1 px-1.5"></td>
                          <td className="border border-slate-900 py-1 px-1.5">
                            <RpCell value={na.hutangBarang} />
                          </td>
                          <td className="border border-slate-900 py-1 px-1.5"></td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={na.jumlahPiutang} />
                          </td>
                          <td className="border border-slate-900 py-1 px-2"></td>
                          <td className="border border-slate-900 py-1 px-1.5 text-center">
                            NON ANGGOTA
                          </td>
                        </tr>
                      ))}

                    <tr className="font-bold bg-slate-50">
                      <td className="border border-slate-900 py-1.5 px-1.5"></td>
                      <td className="border border-slate-900 py-1.5 px-2"></td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalSimpananPokok} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalSimpananWajib} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalSimpananSukarela} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalSimpananWisata} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2">
                        <RpCell value={lpjData.totalSeluruhSimpanan} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalHutangPinjamanAnggota} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalHutangBarangAnggota} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5">
                        <RpCell value={lpjData.totalKekuranganKaryawisataAnggota} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2">
                        <RpCell value={lpjData.totalPiutangAnggota} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2">
                        <RpCell value={lpjData.totalJasaPinjamanAnggota} bold />
                      </td>
                      <td className="border border-slate-900 py-1.5 px-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <LpjPageFooter pageNo="20-23" />
          </div>
        )}

        {/* ==================== SECTION V: PAGES 24 - 31 (REKAP SIMPANAN & SHU + TANDA TERIMA SHU RAT) ==================== */}
        {(activeSection === 'ALL' || activeSection === 'LAMPIRAN_SHU_TANDA_TERIMA') && (
          <>
            {/* PAGES 24 - 27: REKAP SIMPANAN ANGGOTA BULAN DESEMBER 2025 (SHU SIMPANAN & SHU JASA) */}
            <div className="f4-sheet-landscape bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[33cm] p-4 sm:p-[2.5cm] text-slate-900 font-sans text-[9.5pt] leading-[1.35] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center font-bold uppercase space-y-0.5">
                  <p className="text-[10.5pt]">REKAP SIMPANAN ANGGOTA KOPERASI AMANAH BARAYA</p>
                  <p className="text-[10.5pt]">RSUD AL MULK KOTA SUKABUMI</p>
                  <p className="text-[10pt]">BULAN DESEMBER {lpjParams.tahunBuku}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-[8.5pt]">
                    <thead>
                      <tr className="font-bold">
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-1.5 px-1.5 text-center w-8"
                        >
                          NO
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-1.5 px-2 text-center">
                          NAMA
                        </th>
                        <th colSpan={4} className="border border-slate-900 py-1 px-2 text-center">
                          SIMPANAN KOPERASI
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-1.5 px-2 text-center w-24"
                        >
                          JUMLAH
                          <br />
                          SIMPANAN
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-1.5 px-2 text-center w-24"
                        >
                          SHU SIMPANAN
                          <br />
                          {lpjData.persenShuSimpananFormatted}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-1.5 px-2 text-center w-24"
                        >
                          JUMLAH JASA
                          <br />
                          PINJAMAN
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-1.5 px-2 text-center w-24"
                        >
                          SHU JASA
                          <br />
                          {lpjData.persenShuJasaFormatted}
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-1.5 px-2 text-center w-24"
                        >
                          JUMLAH
                          <br />
                          DITERIMA
                        </th>
                      </tr>
                      <tr className="font-bold">
                        <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                          POKOK
                        </th>
                        <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                          WAJIB
                        </th>
                        <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                          SUKARELA
                        </th>
                        <th className="border border-slate-900 py-1 px-1.5 text-center w-20">
                          WISATA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {filteredMemberRows.map((row) => (
                        <tr key={`shu-${row.memberId}`} className="hover:bg-slate-50">
                          <td className="border border-slate-900 py-1 px-1.5 text-center">
                            {row.no}
                          </td>
                          <td className="border border-slate-900 py-1 px-2">{row.name}</td>
                          <td className="border border-slate-900 py-1 px-1.5">
                            <RpCell value={row.pokok} />
                          </td>
                          <td className="border border-slate-900 py-1 px-1.5">
                            <RpCell value={row.wajib} />
                          </td>
                          <td className="border border-slate-900 py-1 px-1.5">
                            <RpCell value={row.sukarela} />
                          </td>
                          <td className="border border-slate-900 py-1 px-1.5">
                            <RpCell value={row.wisata} />
                          </td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.jumlahSimpanan} bold />
                          </td>
                          <td className="border border-slate-900 py-1 px-2 text-right">
                            {formatDecimalTwoIndo(row.shuSimpananExact)}
                          </td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.jumlahJasaPinjaman} />
                          </td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.shuJasa} />
                          </td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.jumlahTandaTerimaRat} bold />
                          </td>
                        </tr>
                      ))}

                      <tr className="font-bold bg-slate-50">
                        <td className="border border-slate-900 py-1.5 px-1.5"></td>
                        <td className="border border-slate-900 py-1.5 px-2"></td>
                        <td className="border border-slate-900 py-1.5 px-1.5">
                          <RpCell value={lpjData.totalSimpananPokok} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-1.5">
                          <RpCell value={lpjData.totalSimpananWajib} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-1.5">
                          <RpCell value={lpjData.totalSimpananSukarela} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-1.5">
                          <RpCell value={lpjData.totalSimpananWisata} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalSeluruhSimpanan} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2 text-right">
                          {formatDecimalTwoIndo(lpjData.totalShuSimpananExactAnggota)}
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalJasaPinjamanAnggota} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalShuJasaAnggota} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalTandaTerimaRat} bold />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <LpjPageFooter pageNo="24-27" />
            </div>

            {/* PAGES 28 - 31: TANDA TERIMA SHU ANGGOTA RAT TANGGAL 06 MARET 2026 */}
            <div className="f4-sheet-portrait bg-white shadow-md border border-slate-300 mx-auto w-full max-w-[21.5cm] min-h-[33cm] p-6 sm:p-[2.5cm] text-slate-900 font-sans text-[9.5pt] leading-[1.35] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center font-bold uppercase space-y-0.5">
                  <p className="text-[10.5pt]">
                    TANDA TERIMA SHU ANGGOTA KOPERASI AMANAH BARAYA
                  </p>
                  <p className="text-[10.5pt]">RSUD AL MULK KOTA SUKABUMI</p>
                  <p className="text-[10pt]">RAT TANGGAL {lpjParams.tanggalRat.toUpperCase()}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-[9pt]">
                    <thead>
                      <tr className="font-bold">
                        <th className="border border-slate-900 py-1.5 px-1.5 text-center w-8">
                          NO
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 text-center">NAMA</th>
                        <th className="border border-slate-900 py-1.5 px-2 text-center w-24">
                          SUKARELA
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 text-center w-24">
                          SHU SIMPANAN
                          <br />
                          {lpjData.persenShuSimpananFormatted}
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 text-center w-24">
                          SHU JASA {lpjData.persenShuJasaFormatted}
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 text-center w-28">
                          JUMLAH
                          <br />
                          DITERIMA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {filteredMemberRows.map((row) => (
                        <tr key={`ttd-${row.memberId}`} className="hover:bg-slate-50">
                          <td className="border border-slate-900 py-1 px-1.5 text-center">
                            {row.no}
                          </td>
                          <td className="border border-slate-900 py-1 px-2">{row.name}</td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.sukarela} />
                          </td>
                          <td className="border border-slate-900 py-1 px-2 text-right">
                            {formatDecimalTwoIndo(row.shuSimpananExact)}
                          </td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.shuJasa} />
                          </td>
                          <td className="border border-slate-900 py-1 px-2">
                            <RpCell value={row.jumlahTandaTerimaRat} bold />
                          </td>
                        </tr>
                      ))}

                      <tr className="font-bold bg-slate-50">
                        <td className="border border-slate-900 py-1.5 px-1.5"></td>
                        <td className="border border-slate-900 py-1.5 px-2"></td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalSimpananSukarela} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2 text-right">
                          {formatDecimalTwoIndo(lpjData.totalShuSimpananExactAnggota)}
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalShuJasaAnggota} bold />
                        </td>
                        <td className="border border-slate-900 py-1.5 px-2">
                          <RpCell value={lpjData.totalTandaTerimaRat} bold />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <LpjPageFooter pageNo="28-31" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

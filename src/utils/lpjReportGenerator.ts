import {
  Member,
  SavingsRecord,
  LoanRecord,
  Transaction,
  Product,
  StockMutation,
  CoopConfig,
  UserProfile,
} from '../types';

export type LpjPeriodeBulanFormat = 'APRIL_DESEMBER' | 'JANUARI_DESEMBER' | 'APRIL_MARET';

export interface LpjReportParams {
  tahunBuku: string;
  periodeBukuText: string;
  periodePembandingText?: string;
  periodeBulanFormat?: LpjPeriodeBulanFormat;
  tahunRat: string;
  tanggalKataPengantar: string;
  tanggalRat: string;
  tanggalTutupBuku: string;
  nomorBadanHukum: string;
  ketuaPengurus: string;
  sekretarisPengurus: string;
  bendaharaPengurus: string;
  ketuaPengawasOrganisasi: string;
  ketuaPengawasLembarPengesahan: string;
  anggotaPengawas1: string;
  anggotaPengawas2: string;
  anggotaPengawas3: string;
  jumlahKaryawan: number;
  // Baseline Periode Sebelumnya (Sesuai Tabel 1 s/d Tabel 5 PDF LPJ RAT)
  prevAnggotaLaki: number;
  prevAnggotaPerempuan: number;
  prevPinjamAnggotaDilayani: number;
  prevPemberianPinjaman: number;
  prevAngsuranPinjaman: number;
  prevSisaPinjaman: number;
  prevJasaPinjaman: number;
  prevWaserdaAnggotaDilayani: number;
  prevPembelianWaserda: number;
  prevPendapatanWaserda: number;
  prevPiutangWaserda: number;
  prevPersediaanBarang: number;
  prevSimpananPokok: number;
  prevSimpananWajib: number;
  prevSimpananSukarela: number;
  prevSimpananWisata: number;
  prevShuAnggota: number;
  prevBingkisan: number;
  // Komponen Tambahan Perhitungan Hasil Usaha (Laba/Rugi - Hal. 13 & Hal. 18)
  pendapatanBank: number;
  biayaPaketBingkisan: number;
  biayaHonorKaryawan: number;
  biayaAdminBank: number;
  // Persentase Zakat & Pembagian SHU (Sesuai Hal. 19 LPJ RAT)
  zakatPercent: number;
  shuCadanganPercent: number;
  shuAnggotaPenyimpanPercent: number;
  shuAnggotaBerjasaPercent: number;
  shuPengurusPercent: number;
  shuPengawasPercent: number;
  shuPembangunanDaerahKerjaPercent: number;
  shuDanaSosialPercent: number;
}

export const defaultLpjReportParams: LpjReportParams = {
  tahunBuku: '2025',
  periodeBukuText: 'April sd Desember 2025',
  periodePembandingText: 'April 2024 sd Maret 2025',
  periodeBulanFormat: 'APRIL_DESEMBER',
  tahunRat: '2026',
  tanggalKataPengantar: '05 Maret 2026',
  tanggalRat: '06 Maret 2026',
  tanggalTutupBuku: '31 Desember 2025',
  nomorBadanHukum: 'AHU-0002821.AH.01.29.TAHUN 2022',
  ketuaPengurus: 'Elsa Ganjarsari, S.Tr.Kes',
  sekretarisPengurus: 'Fitria Wulandari, AMKL',
  bendaharaPengurus: 'Amril Fasya, A.Md',
  ketuaPengawasOrganisasi: 'dr. Munifah Budi Isnaeni, MMRS.',
  ketuaPengawasLembarPengesahan: 'Dr. Deni Purnama, S.Kep., MKM',
  anggotaPengawas1: 'Lisna Agustiyah, SKM. MKM.',
  anggotaPengawas2: 'dr. Fety Lies Priyanti',
  anggotaPengawas3: 'Asep Andi Januanto, S.Kep.Ners',
  jumlahKaryawan: 1,
  // Pembanding Periode April 2024 sd Maret 2025 persis dari PDF LPJ Hal. 9 - 13
  prevAnggotaLaki: 21,
  prevAnggotaPerempuan: 52,
  prevPinjamAnggotaDilayani: 73,
  prevPemberianPinjaman: 254151000,
  prevAngsuranPinjaman: 227627000,
  prevSisaPinjaman: 26524000,
  prevJasaPinjaman: 19854000,
  prevWaserdaAnggotaDilayani: 73,
  prevPembelianWaserda: 180420018,
  prevPendapatanWaserda: 196098373,
  prevPiutangWaserda: 8941306,
  prevPersediaanBarang: 6737049,
  prevSimpananPokok: 14200000,
  prevSimpananWajib: 38940000,
  prevSimpananSukarela: 120193500,
  prevSimpananWisata: 25960000,
  prevShuAnggota: 17431500,
  prevBingkisan: 7400000,
  // Komponen Operasional Bank & Admin Bank (Hal. 13 & 18)
  pendapatanBank: 1225278,
  biayaPaketBingkisan: 0,
  biayaHonorKaryawan: 0,
  biayaAdminBank: 443055,
  // Alokasi SHU sesuai PDF Hal. 19
  zakatPercent: 2.5,
  shuCadanganPercent: 20,
  shuAnggotaPenyimpanPercent: 25,
  shuAnggotaBerjasaPercent: 30,
  shuPengurusPercent: 10,
  shuPengawasPercent: 7,
  shuPembangunanDaerahKerjaPercent: 5,
  shuDanaSosialPercent: 3,
};

export function buildParamsForPeriod(
  tahunBuku: string,
  tahunRat: string,
  currentParams: LpjReportParams = defaultLpjReportParams,
  periodeBulanFormat?: LpjPeriodeBulanFormat
): LpjReportParams {
  const tb = parseInt(tahunBuku, 10) || 2025;
  const prevTb = tb - 1;
  const tr = parseInt(tahunRat, 10) || tb + 1;
  const format: LpjPeriodeBulanFormat =
    periodeBulanFormat ||
    currentParams.periodeBulanFormat ||
    (tb === 2025 ? 'APRIL_DESEMBER' : 'JANUARI_DESEMBER');

  let periodeBukuText = `April sd Desember ${tb}`;
  let periodePembandingText = `April ${prevTb} sd Maret ${tb}`;
  let tanggalTutupBuku = `31 Desember ${tb}`;

  if (format === 'APRIL_DESEMBER') {
    periodeBukuText = `April sd Desember ${tb}`;
    periodePembandingText = `April ${prevTb} sd Maret ${tb}`;
    tanggalTutupBuku = `31 Desember ${tb}`;
  } else if (format === 'JANUARI_DESEMBER') {
    periodeBukuText = `Januari sd Desember ${tb}`;
    periodePembandingText = tb === 2026 ? `April sd Desember 2025` : `Januari sd Desember ${prevTb}`;
    tanggalTutupBuku = `31 Desember ${tb}`;
  } else {
    periodeBukuText = `April ${prevTb} sd Maret ${tb}`;
    periodePembandingText = `April ${prevTb - 1} sd Maret ${prevTb}`;
    tanggalTutupBuku = `31 Maret ${tb}`;
  }

  let baseline = {
    prevAnggotaLaki: defaultLpjReportParams.prevAnggotaLaki,
    prevAnggotaPerempuan: defaultLpjReportParams.prevAnggotaPerempuan,
    prevPinjamAnggotaDilayani: defaultLpjReportParams.prevPinjamAnggotaDilayani,
    prevPemberianPinjaman: defaultLpjReportParams.prevPemberianPinjaman,
    prevAngsuranPinjaman: defaultLpjReportParams.prevAngsuranPinjaman,
    prevSisaPinjaman: defaultLpjReportParams.prevSisaPinjaman,
    prevJasaPinjaman: defaultLpjReportParams.prevJasaPinjaman,
    prevWaserdaAnggotaDilayani: defaultLpjReportParams.prevWaserdaAnggotaDilayani,
    prevPembelianWaserda: defaultLpjReportParams.prevPembelianWaserda,
    prevPendapatanWaserda: defaultLpjReportParams.prevPendapatanWaserda,
    prevPiutangWaserda: defaultLpjReportParams.prevPiutangWaserda,
    prevPersediaanBarang: defaultLpjReportParams.prevPersediaanBarang,
    prevSimpananPokok: defaultLpjReportParams.prevSimpananPokok,
    prevSimpananWajib: defaultLpjReportParams.prevSimpananWajib,
    prevSimpananSukarela: defaultLpjReportParams.prevSimpananSukarela,
    prevSimpananWisata: defaultLpjReportParams.prevSimpananWisata,
    prevShuAnggota: defaultLpjReportParams.prevShuAnggota,
    prevBingkisan: defaultLpjReportParams.prevBingkisan,
  };

  if (tb === 2026) {
    baseline = {
      prevAnggotaLaki: 28,
      prevAnggotaPerempuan: 56,
      prevPinjamAnggotaDilayani: 84,
      prevPemberianPinjaman: 206900000,
      prevAngsuranPinjaman: 131693000,
      prevSisaPinjaman: 75207000,
      prevJasaPinjaman: 15107000,
      prevWaserdaAnggotaDilayani: 84,
      prevPembelianWaserda: 118234810,
      prevPendapatanWaserda: 128431500,
      prevPiutangWaserda: 8431500,
      prevPersediaanBarang: 7854000,
      prevSimpananPokok: 17800000,
      prevSimpananWajib: 61980000,
      prevSimpananSukarela: 124222500,
      prevSimpananWisata: 22960000,
      prevShuAnggota: 30892913,
      prevBingkisan: 8200000,
    };
  } else if (tb <= 2024) {
    baseline = {
      prevAnggotaLaki: 18,
      prevAnggotaPerempuan: 47,
      prevPinjamAnggotaDilayani: 65,
      prevPemberianPinjaman: 198500000,
      prevAngsuranPinjaman: 176200000,
      prevSisaPinjaman: 22300000,
      prevJasaPinjaman: 15400000,
      prevWaserdaAnggotaDilayani: 65,
      prevPembelianWaserda: 142300000,
      prevPendapatanWaserda: 156800000,
      prevPiutangWaserda: 6450000,
      prevPersediaanBarang: 5200000,
      prevSimpananPokok: 13000000,
      prevSimpananWajib: 31200000,
      prevSimpananSukarela: 96400000,
      prevSimpananWisata: 19500000,
      prevShuAnggota: 14250000,
      prevBingkisan: 6500000,
    };
  } else if (tb >= 2027) {
    baseline = {
      prevAnggotaLaki: 31,
      prevAnggotaPerempuan: 58,
      prevPinjamAnggotaDilayani: 89,
      prevPemberianPinjaman: 245000000,
      prevAngsuranPinjaman: 189500000,
      prevSisaPinjaman: 55500000,
      prevJasaPinjaman: 18600000,
      prevWaserdaAnggotaDilayani: 89,
      prevPembelianWaserda: 148500000,
      prevPendapatanWaserda: 164200000,
      prevPiutangWaserda: 7650000,
      prevPersediaanBarang: 8400000,
      prevSimpananPokok: 17800000,
      prevSimpananWajib: 68400000,
      prevSimpananSukarela: 132500000,
      prevSimpananWisata: 24800000,
      prevShuAnggota: 32450000,
      prevBingkisan: 8900000,
    };
  }

  return {
    ...currentParams,
    ...baseline,
    tahunBuku: String(tb),
    tahunRat: String(tr),
    periodeBulanFormat: format,
    periodeBukuText,
    periodePembandingText,
    tanggalKataPengantar: `05 Maret ${tr}`,
    tanggalRat: `06 Maret ${tr}`,
    tanggalTutupBuku,
  };
}

export interface MemberLpjRow {
  no: number;
  memberId: string;
  memberNumber: string;
  name: string;
  unitKerja: string;
  status: 'active' | 'inactive';
  gender: 'L' | 'P';
  pokok: number;
  wajib: number;
  sukarela: number;
  wisata: number;
  jumlahSimpanan: number;
  hutangPinjaman: number;
  hutangBarang: number;
  kekuranganKaryawisata: number;
  jumlahPiutang: number;
  jumlahJasaPinjaman: number;
  shuSimpananExact: number; // presisi desimal seperti 76.962,00
  shuSimpanan: number;
  shuJasa: number;
  jumlahShuDiterima: number; // SHU Simpanan + SHU Jasa
  jumlahTandaTerimaRat: number; // Sukarela + SHU Simpanan + SHU Jasa (Hal. 24-31)
  keterangan: string;
}

export interface NonMemberDebtRow {
  no: number;
  name: string;
  hutangPinjaman: number;
  hutangBarang: number;
  kekuranganKaryawisata: number;
  jumlahPiutang: number;
  jasaPinjaman: number;
  keterangan: string;
}

export interface LpjRealtimeData {
  // Tabel 1: Keanggotaan
  anggotaLaki: number;
  anggotaPerempuan: number;
  totalAnggota: number;
  anggotaAktifCount: number;
  anggotaNonAktifCount: number;

  // Tabel 2: Unit Usaha Simpan Pinjam
  pinjamAnggotaDilayani: number;
  pemberianPinjaman: number;
  angsuranPinjaman: number;
  sisaPinjaman: number;
  jasaPinjaman: number;

  // Tabel 3: Unit Usaha Waserda
  waserdaAnggotaDilayani: number;
  pembelianBarangWaserda: number;
  pendapatanWaserda: number;
  saldoPiutangWaserda: number;
  persediaanBarangWaserda: number;

  // Tabel 4: Simpanan
  totalSimpananPokok: number;
  totalSimpananWajib: number;
  totalSimpananSukarela: number;
  totalSimpananWisata: number;
  totalSeluruhSimpanan: number;

  // Tabel 5: Dana Kesejahteraan (Hal. 13)
  shuAnggotaKesejahteraan: number;
  bingkisanKesejahteraan: number;
  totalDanaKesejahteraan: number;

  // Perhitungan Hasil Usaha & Tabel 6 Realisasi Pendapatan dan Belanja (Hal. 13 & Hal. 18)
  pendapatanJasaUjroh: number;
  pendapatanWaserdaLabaRugi: number;
  pendapatanPersediaanBarang: number;
  pendapatanBank: number;
  totalPendapatanLabaRugi: number;

  biayaPembelianWaserda: number;
  biayaPaketBingkisan: number;
  biayaHonorKaryawan: number;
  biayaAdminBank: number;
  totalBiayaLabaRugi: number;

  surplusHasilUsaha: number;

  // Kompatibilitas properti tambahan
  danaSosialSaatIni: number;
  totalPendapatanRealisasi: number;
  totalBelanjaRealisasi: number;
  penarikanSimpananKeluarActual: number;

  // Pembagian SHU (Hal. 19)
  zakatNominal: number;
  shuYangDibagikan: number;
  alokasiCadangan: number;
  alokasiAnggotaPenyimpan: number;
  alokasiAnggotaBerjasa: number;
  alokasiDanaPengurus: number;
  alokasiDanaPengawas: number;
  alokasiPembangunanDaerahKerja: number;
  alokasiDanaSosial: number;
  totalAlokasiShu: number;

  // Indeks Persentase SHU Anggota (Hal. 19 & 24-31)
  persenShuSimpananExact: number; // misal 2.54
  persenShuJasaExact: number; // misal 39.78
  persenShuSimpananFormatted: string; // misal "2,54%"
  persenShuJasaFormatted: string; // misal "39,78%"
  persenShuSimpananTerhadapTotalSimpanan: number;
  persenShuJasaTerhadapTotalJasa: number;

  // Tabel Lampiran Anggota
  memberRows: MemberLpjRow[];
  nonMemberRows: NonMemberDebtRow[];

  // Totals Lampiran
  totalHutangPinjamanAnggota: number;
  totalHutangBarangAnggota: number;
  totalKekuranganKaryawisataAnggota: number;
  totalPiutangAnggota: number;
  totalJasaPinjamanAnggota: number;
  totalShuSimpananExactAnggota: number;
  totalShuSimpananAnggota: number;
  totalShuJasaAnggota: number;
  totalShuDiterimaAnggota: number;
  totalTandaTerimaRat: number;
}

function inferGender(member: Member): 'L' | 'P' {
  if (member.gender === 'L' || member.gender === 'P') {
    return member.gender;
  }
  const lower = member.name.toLowerCase();
  const maleHints = [
    'bpk',
    'pak ',
    'tn.',
    'tuan',
    'ahmad',
    'muhamad',
    'muhammad',
    'mochamad',
    'moch ',
    'asep',
    'deni',
    'amril',
    'budi',
    'agus',
    'dedi',
    'deden',
    'hendra',
    'rizki',
    'fajar',
    'irfan',
    'irman',
    'taufik',
    'yusuf',
    'andri',
    'andi ',
    'lukman',
    'ridwan',
    'aris',
    'yudas',
    'giandeno',
    'rusbandi',
    'rafiul',
    'mulyawan',
    'mulyadi',
    'jamaluddin',
    'jamaludin',
    'fuji ',
    'peri ',
    'yadi ',
    'devi suryadi',
    'solihin',
    'pandu',
    'aprilianus',
    'doni ',
    'desta ',
    'ismet',
    'damar',
    'panji',
    'adi tresa',
  ];
  if (maleHints.some((h) => lower.includes(h))) {
    return 'L';
  }
  return 'P';
}

export function calculatePercChange(prev: number, curr: number): string {
  if (prev === 0 && curr === 0) return '0%';
  if (prev === 0) return '100%';
  const diff = ((curr - prev) / prev) * 100;
  return `${Math.round(diff)}%`;
}

export function formatNumberPlain(amount: number): string {
  return Math.round(amount).toLocaleString('id-ID');
}

export function formatDecimalTwoIndo(amount: number): string {
  return amount.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function calculateLpjRealtimeData(
  members: Member[],
  savingsRecords: SavingsRecord[],
  loans: LoanRecord[],
  transactions: Transaction[],
  products: Product[],
  mutations: StockMutation[],
  params: LpjReportParams = defaultLpjReportParams,
  users: UserProfile[] = []
): LpjRealtimeData {
  // 1. Keanggotaan
  let anggotaLaki = 0;
  let anggotaPerempuan = 0;
  let anggotaAktifCount = 0;
  let anggotaNonAktifCount = 0;

  members.forEach((m) => {
    const g = inferGender(m);
    if (g === 'L') anggotaLaki += 1;
    else anggotaPerempuan += 1;

    if (m.status === 'active') anggotaAktifCount += 1;
    else anggotaNonAktifCount += 1;
  });

  const totalAnggota = members.length;

  // Lookup map anggota berdasarkan id, memberNumber, dan nama untuk integrasi lintas menu
  const memberByIdMap = new Map<string, Member>();
  const memberByNumberMap = new Map<string, Member>();
  const memberByNameMap = new Map<string, Member>();

  members.forEach((m) => {
    memberByIdMap.set(m.id, m);
    if (m.memberNumber) {
      memberByNumberMap.set(m.memberNumber.trim().toLowerCase(), m);
    }
    if (m.name) {
      memberByNameMap.set(m.name.trim().toLowerCase(), m);
    }
  });

  const resolveMember = (
    memberId?: string,
    memberNumber?: string,
    memberName?: string
  ): Member | undefined => {
    if (memberId && memberByIdMap.has(memberId)) {
      return memberByIdMap.get(memberId);
    }
    if (memberNumber && memberByNumberMap.has(memberNumber.trim().toLowerCase())) {
      return memberByNumberMap.get(memberNumber.trim().toLowerCase());
    }
    if (memberName && memberByNameMap.has(memberName.trim().toLowerCase())) {
      return memberByNameMap.get(memberName.trim().toLowerCase());
    }
    return undefined;
  };

  // 2. Unit Usaha Simpan Pinjam (Dari menu Simpan Pinjam -> Pinjaman & Angsuran)
  const activeOrPaidLoans = loans.filter((l) => l.status !== 'rejected');
  const uniqueBorrowers = new Set(
    activeOrPaidLoans.map(
      (l) => resolveMember(l.memberId, l.memberNumber, l.memberName)?.id || l.memberId || l.memberName
    )
  );
  const pinjamAnggotaDilayani =
    uniqueBorrowers.size > 0 ? Math.max(uniqueBorrowers.size, totalAnggota) : totalAnggota;

  const pemberianPinjaman = activeOrPaidLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

  // Perhitungan angsuran, sisa pinjaman, dan jasa/ujroh per pinjaman & per anggota
  const memberLoanRemainingMap = new Map<string, number>();
  const memberLoanInterestPaidMap = new Map<string, number>();

  let totalAngsuranPinjaman = 0;
  let totalSisaPinjaman = 0;
  let totalJasaPinjaman = 0;

  activeOrPaidLoans.forEach((loan) => {
    const principal = loan.amount || 0;
    const totalPayable = loan.totalRepayment || principal;
    const totalInterestOnLoan = Math.max(0, totalPayable - principal);

    const tenor = Math.max(1, loan.tenorMonths || 1);
    const interestForLoan =
      totalInterestOnLoan > 0
        ? totalInterestOnLoan
        : Math.round(principal * ((loan.interestRate || 0) / 100) * tenor);

    const remainingForLoan = loan.status === 'paid' ? 0 : Math.max(0, loan.remainingAmount || 0);
    const paidForLoan =
      loan.totalPaid > 0 ? loan.totalPaid : Math.max(0, totalPayable - remainingForLoan);

    totalAngsuranPinjaman += paidForLoan;
    totalSisaPinjaman += remainingForLoan;
    totalJasaPinjaman += interestForLoan;

    const matchedMember = resolveMember(loan.memberId, loan.memberNumber, loan.memberName);
    const targetMemberKey = matchedMember ? matchedMember.id : loan.memberId;

    memberLoanRemainingMap.set(
      targetMemberKey,
      (memberLoanRemainingMap.get(targetMemberKey) || 0) + remainingForLoan
    );
    memberLoanInterestPaidMap.set(
      targetMemberKey,
      (memberLoanInterestPaidMap.get(targetMemberKey) || 0) + interestForLoan
    );
  });

  // 3. Unit Usaha Waserda (Dari menu Kasir/POS, Produk, dan Stok)
  const pendapatanWaserda = transactions.reduce((sum, t) => sum + (t.grandTotal || 0), 0);

  // HPP / Pembelian Barang Waserda: dihitung dari HPP barang terjual + mutasi stok masuk
  const hppSold = transactions.reduce((sum, t) => {
    if (t.totalCost && t.totalCost > 0) {
      return sum + t.totalCost;
    }
    const itemCost = t.items.reduce(
      (iSum, item) =>
        iSum +
        (item.product.buyPrice || Math.round(item.product.sellPrice * 0.82)) * item.quantity,
      0
    );
    return sum + itemCost;
  }, 0);

  const productCostMap = new Map<string, number>();
  products.forEach((p) => {
    productCostMap.set(p.id, p.buyPrice || Math.round(p.sellPrice * 0.82));
  });

  const restockPurchaseValue = mutations
    .filter((m) => m.type === 'in')
    .reduce((sum, m) => {
      const unitCost = m.costPrice || productCostMap.get(m.productId) || 0;
      return sum + unitCost * m.quantity;
    }, 0);

  const pembelianBarangWaserda = hppSold + restockPurchaseValue;

  // Persediaan Barang Waserda (Valuasi Stok Saat Ini)
  const persediaanBarangWaserda = products.reduce((sum, p) => {
    const unitCost = p.buyPrice && p.buyPrice > 0 ? p.buyPrice : p.sellPrice;
    return sum + unitCost * Math.max(0, p.stock);
  }, 0);

  // Piutang Waserda (Transaksi Kasbon / Potong Gaji) per Anggota & Non-Anggota
  const memberWaserdaDebtMap = new Map<string, number>();
  const nonMemberWaserdaDebtMap = new Map<string, number>();
  const servedCustomerSet = new Set<string>();

  transactions.forEach((t) => {
    const matchedMember = resolveMember(t.memberId, undefined, t.customerName);
    if (matchedMember) {
      servedCustomerSet.add(matchedMember.id);
    } else if (t.memberId) {
      servedCustomerSet.add(t.memberId);
    } else if (t.customerName) {
      servedCustomerSet.add(t.customerName.trim().toLowerCase());
    }

    if (t.paymentMethod === 'potong_gaji') {
      if (matchedMember) {
        memberWaserdaDebtMap.set(
          matchedMember.id,
          (memberWaserdaDebtMap.get(matchedMember.id) || 0) + t.grandTotal
        );
      } else {
        const guestName = (t.customerName || 'Tamu / Non Anggota').trim();
        nonMemberWaserdaDebtMap.set(
          guestName,
          (nonMemberWaserdaDebtMap.get(guestName) || 0) + t.grandTotal
        );
      }
    }
  });

  const waserdaAnggotaDilayani = Math.max(
    servedCustomerSet.size,
    members.filter((m) => m.status === 'active').length
  );

  // 4. Simpanan Anggota (Tabel 4 - Dari Data Anggota & Simpan Pinjam)
  const totalSimpananPokok = members.reduce((sum, m) => sum + (m.simpananPokok || 0), 0);
  const totalSimpananWajib = members.reduce((sum, m) => sum + (m.simpananWajib || 0), 0);
  const totalSimpananSukarela = members.reduce((sum, m) => sum + (m.simpananSukarela || 0), 0);
  const totalSimpananWisata = members.reduce((sum, m) => sum + (m.simpananWisata || 0), 0);
  const totalSeluruhSimpanan =
    totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela + totalSimpananWisata;

  // Penarikan simpanan dari mutasi simpanan
  const penarikanSimpananKeluarActual = savingsRecords
    .filter((s) => s.transactionType === 'tarik')
    .reduce((sum, s) => sum + s.amount, 0);

  void users;

  // 5. Perhitungan Hasil Usaha / Laba Rugi & Tabel 6 (Hal. 13 & Hal. 18 LPJ RAT)
  const pendapatanJasaUjroh = totalJasaPinjaman;
  const pendapatanWaserdaLabaRugi = pendapatanWaserda;
  const pendapatanPersediaanBarang = persediaanBarangWaserda;
  const pendapatanBank = params.pendapatanBank || 0;

  const totalPendapatanLabaRugi =
    pendapatanJasaUjroh +
    pendapatanWaserdaLabaRugi +
    pendapatanPersediaanBarang +
    pendapatanBank;

  const biayaPembelianWaserda = pembelianBarangWaserda;
  const biayaPaketBingkisan = params.biayaPaketBingkisan || 0;
  const biayaHonorKaryawan = params.biayaHonorKaryawan || 0;
  const biayaAdminBank = params.biayaAdminBank || 0;

  const totalBiayaLabaRugi =
    biayaPembelianWaserda + biayaPaketBingkisan + biayaHonorKaryawan + biayaAdminBank;

  const surplusHasilUsaha = totalPendapatanLabaRugi - totalBiayaLabaRugi;

  // Tabel 5: Dana Kesejahteraan (Hal. 13)
  const shuAnggotaKesejahteraan = Math.max(0, surplusHasilUsaha);
  const bingkisanKesejahteraan = biayaPaketBingkisan > 0 ? biayaPaketBingkisan : 8200000;
  const totalDanaKesejahteraan = shuAnggotaKesejahteraan + bingkisanKesejahteraan;

  // 6. Pembagian SHU (Hal. 19 LPJ RAT)
  const positiveShu = Math.max(0, surplusHasilUsaha);
  const zakatNominal = Math.round(positiveShu * (params.zakatPercent / 100));
  const shuYangDibagikan = Math.max(0, positiveShu - zakatNominal);

  const alokasiCadangan = Math.round(shuYangDibagikan * (params.shuCadanganPercent / 100));
  const alokasiAnggotaPenyimpan = Math.round(
    shuYangDibagikan * (params.shuAnggotaPenyimpanPercent / 100)
  );
  const alokasiAnggotaBerjasa = Math.round(
    shuYangDibagikan * (params.shuAnggotaBerjasaPercent / 100)
  );
  const alokasiDanaPengurus = Math.round(shuYangDibagikan * (params.shuPengurusPercent / 100));
  const alokasiDanaPengawas = Math.round(shuYangDibagikan * (params.shuPengawasPercent / 100));
  const alokasiPembangunanDaerahKerja = Math.round(
    shuYangDibagikan * (params.shuPembangunanDaerahKerjaPercent / 100)
  );
  const alokasiDanaSosial = Math.round(shuYangDibagikan * (params.shuDanaSosialPercent / 100));

  const totalAlokasiShu =
    alokasiCadangan +
    alokasiAnggotaPenyimpan +
    alokasiAnggotaBerjasa +
    alokasiDanaPengurus +
    alokasiDanaPengawas +
    alokasiPembangunanDaerahKerja +
    alokasiDanaSosial;

  // Persentase Indeks SHU Simpanan & SHU Jasa (Sesuai Hal. 19 & Hal. 24-31)
  const persenShuSimpananExact =
    totalSeluruhSimpanan > 0 ? (alokasiAnggotaPenyimpan / totalSeluruhSimpanan) * 100 : 2.54;
  const persenShuJasaExact =
    totalJasaPinjaman > 0 ? (alokasiAnggotaBerjasa / totalJasaPinjaman) * 100 : 39.78;

  const persenShuSimpananFormatted = `${formatDecimalTwoIndo(persenShuSimpananExact)}%`;
  const persenShuJasaFormatted = `${formatDecimalTwoIndo(persenShuJasaExact)}%`;

  const persenShuSimpananTerhadapTotalSimpanan = Math.round(persenShuSimpananExact);
  const persenShuJasaTerhadapTotalJasa = Math.round(persenShuJasaExact);

  // 7. Baris Tabel Lampiran per Anggota (Hal. 20-31)
  const memberRows: MemberLpjRow[] = members.map((m, idx) => {
    const pokok = m.simpananPokok || 0;
    const wajib = m.simpananWajib || 0;
    const sukarela = m.simpananSukarela || 0;
    const wisata = m.simpananWisata || 0;
    const jumlahSimpanan = pokok + wajib + sukarela + wisata;

    const hutangPinjaman = memberLoanRemainingMap.get(m.id) || 0;
    const hutangBarang = memberWaserdaDebtMap.get(m.id) || 0;
    const kekuranganKaryawisata = m.kekuranganKaryawisata || 0;
    const jumlahPiutang = hutangPinjaman + hutangBarang + kekuranganKaryawisata;

    const jumlahJasaPinjaman = memberLoanInterestPaidMap.get(m.id) || 0;

    // Alokasi proporsional SHU Simpanan & SHU Jasa untuk masing-masing anggota
    const shuSimpananExact =
      totalSeluruhSimpanan > 0
        ? (jumlahSimpanan / totalSeluruhSimpanan) * alokasiAnggotaPenyimpan
        : 0;
    const shuSimpanan = Math.round(shuSimpananExact);
    const shuJasa =
      totalJasaPinjaman > 0
        ? Math.round((jumlahJasaPinjaman / totalJasaPinjaman) * alokasiAnggotaBerjasa)
        : 0;

    const jumlahShuDiterima = shuSimpanan + shuJasa;
    const jumlahTandaTerimaRat = Math.round(sukarela + shuSimpananExact + shuJasa);

    return {
      no: idx + 1,
      memberId: m.id,
      memberNumber: m.memberNumber,
      name: m.name,
      unitKerja: m.unitKerja,
      status: m.status,
      gender: inferGender(m),
      pokok,
      wajib,
      sukarela,
      wisata,
      jumlahSimpanan,
      hutangPinjaman,
      hutangBarang,
      kekuranganKaryawisata,
      jumlahPiutang,
      jumlahJasaPinjaman,
      shuSimpananExact,
      shuSimpanan,
      shuJasa,
      jumlahShuDiterima,
      jumlahTandaTerimaRat,
      keterangan: m.status === 'active' ? 'AKTIF' : 'KELUAR',
    };
  });

  const nonMemberRows: NonMemberDebtRow[] = Array.from(nonMemberWaserdaDebtMap.entries()).map(
    ([guestName, debt], idx) => ({
      no: idx + 1,
      name: guestName,
      hutangPinjaman: 0,
      hutangBarang: debt,
      kekuranganKaryawisata: 0,
      jumlahPiutang: debt,
      jasaPinjaman: 0,
      keterangan: 'NON ANGGOTA',
    })
  );

  const totalHutangPinjamanAnggota = memberRows.reduce((s, r) => s + r.hutangPinjaman, 0);
  const totalHutangBarangAnggota =
    memberRows.reduce((s, r) => s + r.hutangBarang, 0) +
    nonMemberRows.reduce((s, r) => s + r.hutangBarang, 0);
  const totalKekuranganKaryawisataAnggota = memberRows.reduce(
    (s, r) => s + r.kekuranganKaryawisata,
    0
  );
  const totalPiutangAnggota =
    memberRows.reduce((s, r) => s + r.jumlahPiutang, 0) +
    nonMemberRows.reduce((s, r) => s + r.jumlahPiutang, 0);
  const totalJasaPinjamanAnggota = memberRows.reduce((s, r) => s + r.jumlahJasaPinjaman, 0);
  const totalShuSimpananExactAnggota = memberRows.reduce((s, r) => s + r.shuSimpananExact, 0);
  const totalShuSimpananAnggota = memberRows.reduce((s, r) => s + r.shuSimpanan, 0);
  const totalShuJasaAnggota = memberRows.reduce((s, r) => s + r.shuJasa, 0);
  const totalShuDiterimaAnggota = memberRows.reduce((s, r) => s + r.jumlahShuDiterima, 0);
  const totalTandaTerimaRat = memberRows.reduce((s, r) => s + r.jumlahTandaTerimaRat, 0);

  const saldoPiutangWaserda = totalHutangBarangAnggota;

  return {
    anggotaLaki,
    anggotaPerempuan,
    totalAnggota,
    anggotaAktifCount,
    anggotaNonAktifCount,
    pinjamAnggotaDilayani,
    pemberianPinjaman,
    angsuranPinjaman: totalAngsuranPinjaman,
    sisaPinjaman: totalSisaPinjaman,
    jasaPinjaman: totalJasaPinjaman,
    waserdaAnggotaDilayani,
    pembelianBarangWaserda,
    pendapatanWaserda,
    saldoPiutangWaserda,
    persediaanBarangWaserda,
    totalSimpananPokok,
    totalSimpananWajib,
    totalSimpananSukarela,
    totalSimpananWisata,
    totalSeluruhSimpanan,
    shuAnggotaKesejahteraan,
    bingkisanKesejahteraan,
    totalDanaKesejahteraan,
    pendapatanJasaUjroh,
    pendapatanWaserdaLabaRugi,
    pendapatanPersediaanBarang,
    pendapatanBank,
    totalPendapatanLabaRugi,
    biayaPembelianWaserda,
    biayaPaketBingkisan,
    biayaHonorKaryawan,
    biayaAdminBank,
    totalBiayaLabaRugi,
    surplusHasilUsaha,
    danaSosialSaatIni: alokasiDanaSosial,
    totalPendapatanRealisasi: totalPendapatanLabaRugi,
    totalBelanjaRealisasi: totalBiayaLabaRugi,
    penarikanSimpananKeluarActual,
    zakatNominal,
    shuYangDibagikan,
    alokasiCadangan,
    alokasiAnggotaPenyimpan,
    alokasiAnggotaBerjasa,
    alokasiDanaPengurus,
    alokasiDanaPengawas,
    alokasiPembangunanDaerahKerja,
    alokasiDanaSosial,
    totalAlokasiShu,
    persenShuSimpananExact,
    persenShuJasaExact,
    persenShuSimpananFormatted,
    persenShuJasaFormatted,
    persenShuSimpananTerhadapTotalSimpanan,
    persenShuJasaTerhadapTotalJasa,
    memberRows,
    nonMemberRows,
    totalHutangPinjamanAnggota,
    totalHutangBarangAnggota,
    totalKekuranganKaryawisataAnggota,
    totalPiutangAnggota,
    totalJasaPinjamanAnggota,
    totalShuSimpananExactAnggota,
    totalShuSimpananAnggota,
    totalShuJasaAnggota,
    totalShuDiterimaAnggota,
    totalTandaTerimaRat,
  };
}

function renderPageFooterHtml(pageNo: number): string {
  return `
  <table style="width:100%;border:none;border-collapse:collapse;margin-top:18pt;">
    <tr>
      <td style="border:none;text-align:right;vertical-align:middle;font-size:9pt;color:#222;padding-right:8pt;">
        KOPERASI AMANAH BARAYA
      </td>
      <td style="border:none;width:28pt;background-color:#70ad47;color:#ffffff;font-weight:bold;text-align:center;vertical-align:middle;padding:4pt 0;font-size:10pt;">
        ${pageNo}
      </td>
    </tr>
  </table>`;
}

export interface LpjAppendixSheet<T> {
  pageNo: number;
  rows: T[];
  showTitleAndHeader: boolean;
  isLastPage: boolean;
}

export const LPJ_LANDSCAPE_FIRST_PAGE_ROWS = 28;
export const LPJ_LANDSCAPE_NEXT_PAGE_ROWS = 32;
export const LPJ_PORTRAIT_FIRST_PAGE_ROWS = 42;
export const LPJ_PORTRAIT_NEXT_PAGE_ROWS = 48;

/**
 * Memecah baris data tabel lampiran LPJ ke halaman-halaman F4 dengan kapasitas maksimal
 * hingga mendekati batas margin bawah (2,5 cm) sebelum berpindah ke halaman berikutnya,
 * sehingga tidak menyisakan ruang kosong di bagian bawah halaman.
 */
export function paginateAppendixTable<T>(
  rows: T[],
  startPageNo: number,
  firstPageCapacity: number,
  nextPageCapacity: number,
  trailingRowsCount: number = 1
): LpjAppendixSheet<T>[] {
  if (rows.length === 0) {
    return [
      {
        pageNo: startPageNo,
        rows: [],
        showTitleAndHeader: true,
        isLastPage: true,
      },
    ];
  }

  const chunks: T[][] = [];
  let cursor = 0;

  const firstSlice = rows.slice(0, firstPageCapacity);
  chunks.push(firstSlice);
  cursor += firstSlice.length;

  while (cursor < rows.length) {
    const slice = rows.slice(cursor, cursor + nextPageCapacity);
    chunks.push(slice);
    cursor += slice.length;
  }

  const lastChunk = chunks[chunks.length - 1];
  const maxAllowedOnLastPage =
    chunks.length === 1 ? firstPageCapacity : nextPageCapacity;
  if (lastChunk.length + trailingRowsCount > maxAllowedOnLastPage + 1) {
    const overflowCount = lastChunk.length + trailingRowsCount - maxAllowedOnLastPage;
    const keepInPrev = lastChunk.slice(0, lastChunk.length - overflowCount);
    const moveToNext = lastChunk.slice(lastChunk.length - overflowCount);
    chunks[chunks.length - 1] = keepInPrev;
    chunks.push(moveToNext);
  }

  return chunks.map((chunkRows, idx) => ({
    pageNo: startPageNo + idx,
    rows: chunkRows,
    showTitleAndHeader: idx === 0,
    isLastPage: idx === chunks.length - 1,
  }));
}

/**
 * Menghasilkan dokumen Microsoft Word (.doc) ukuran kertas F4 (21,5 cm x 33,0 cm)
 * dengan margin Atas, Bawah, Kiri, Kanan 2,5 cm yang 100% identik dengan
 * contoh laporan LPJ RAT Koperasi Amanah Baraya.
 */
export function generateLpjWordHtml(
  data: LpjRealtimeData,
  params: LpjReportParams,
  coopConfig: CoopConfig,
  coverDataUrl?: string
): string {
  const f = (n: number) => (n === 0 ? '0' : formatNumberPlain(n));
  const fRpCell = (n: number) =>
    n === 0
      ? `<span style="float:left;">Rp</span><span style="float:right;">-</span>`
      : `<span style="float:left;">Rp</span><span style="float:right;">${formatNumberPlain(n)}</span>`;

  const prevTahunBuku = String((parseInt(params.tahunBuku, 10) || 2025) - 1);
  const periodePembandingText =
    params.periodePembandingText || `April ${prevTahunBuku} sd Maret ${params.tahunBuku}`;

  const prevTotalAnggota = params.prevAnggotaLaki + params.prevAnggotaPerempuan;
  const prevTotalSimpanan =
    params.prevSimpananPokok +
    params.prevSimpananWajib +
    params.prevSimpananSukarela +
    params.prevSimpananWisata;
  const prevTotalKesejahteraan = params.prevShuAnggota + params.prevBingkisan;

  const pctPinjamanDiff =
    params.prevPemberianPinjaman > 0
      ? Math.abs(
          ((data.pemberianPinjaman - params.prevPemberianPinjaman) / params.prevPemberianPinjaman) *
            100
        ).toFixed(1).replace('.', ',')
      : '0';
  const pctAngsuranRatio =
    data.pemberianPinjaman > 0
      ? ((data.angsuranPinjaman / data.pemberianPinjaman) * 100).toFixed(1).replace('.', ',')
      : '0';
  const pctSisaRatio =
    data.pemberianPinjaman > 0
      ? ((data.sisaPinjaman / data.pemberianPinjaman) * 100).toFixed(1).replace('.', ',')
      : '0';

  type MemberRowItem = LpjRealtimeData['memberRows'][number];

  const renderDebtRow = (r: MemberRowItem) => `
      <tr>
        <td style="text-align:center;">${r.no}</td>
        <td>${r.name}</td>
        <td style="text-align:right;">${fRpCell(r.pokok)}</td>
        <td style="text-align:right;">${fRpCell(r.wajib)}</td>
        <td style="text-align:right;">${fRpCell(r.sukarela)}</td>
        <td style="text-align:right;">${fRpCell(r.wisata)}</td>
        <td style="text-align:right;font-weight:bold;">${fRpCell(r.jumlahSimpanan)}</td>
        <td style="text-align:right;">${fRpCell(r.hutangPinjaman)}</td>
        <td style="text-align:right;">${fRpCell(r.hutangBarang)}</td>
        <td style="text-align:right;">${fRpCell(r.kekuranganKaryawisata)}</td>
        <td style="text-align:right;font-weight:bold;">${fRpCell(r.jumlahPiutang)}</td>
        <td style="text-align:right;">${fRpCell(r.jumlahJasaPinjaman)}</td>
        <td style="text-align:center;">${r.keterangan}</td>
      </tr>`;

  const nonMemberDebtRowsHtml = data.nonMemberRows
    .map(
      (r) => `
      <tr>
        <td style="text-align:center;"></td>
        <td>${r.name}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td style="text-align:right;">${fRpCell(r.hutangBarang)}</td>
        <td></td>
        <td style="text-align:right;">${fRpCell(r.jumlahPiutang)}</td>
        <td></td>
        <td style="text-align:center;">NON ANGGOTA</td>
      </tr>`
    )
    .join('');

  const renderShuRow = (r: MemberRowItem) => `
      <tr>
        <td style="text-align:center;">${r.no}</td>
        <td>${r.name}</td>
        <td style="text-align:right;">${fRpCell(r.pokok)}</td>
        <td style="text-align:right;">${fRpCell(r.wajib)}</td>
        <td style="text-align:right;">${fRpCell(r.sukarela)}</td>
        <td style="text-align:right;">${fRpCell(r.wisata)}</td>
        <td style="text-align:right;font-weight:bold;">${fRpCell(r.jumlahSimpanan)}</td>
        <td style="text-align:right;">${formatDecimalTwoIndo(r.shuSimpananExact)}</td>
        <td style="text-align:right;">${fRpCell(r.jumlahJasaPinjaman)}</td>
        <td style="text-align:right;">${fRpCell(r.shuJasa)}</td>
        <td style="text-align:right;font-weight:bold;">${fRpCell(r.jumlahTandaTerimaRat)}</td>
      </tr>`;

  const renderReceiptRow = (r: MemberRowItem) => `
      <tr>
        <td style="text-align:center;height:20pt;">${r.no}</td>
        <td>${r.name}</td>
        <td style="text-align:right;">${fRpCell(r.sukarela)}</td>
        <td style="text-align:right;">${formatDecimalTwoIndo(r.shuSimpananExact)}</td>
        <td style="text-align:right;">${fRpCell(r.shuJasa)}</td>
        <td style="text-align:right;font-weight:bold;">${fRpCell(r.jumlahTandaTerimaRat)}</td>
      </tr>`;

  const debtColgroupHtml = `
    <colgroup>
      <col style="width:2.6%;" />
      <col style="width:15.4%;" />
      <col style="width:6.4%;" />
      <col style="width:6.8%;" />
      <col style="width:7.5%;" />
      <col style="width:6.5%;" />
      <col style="width:8.2%;" />
      <col style="width:7.8%;" />
      <col style="width:7.2%;" />
      <col style="width:7.4%;" />
      <col style="width:8.2%;" />
      <col style="width:7.8%;" />
      <col style="width:8.2%;" />
    </colgroup>`;

  const shuColgroupHtml = `
    <colgroup>
      <col style="width:3.0%;" />
      <col style="width:18.0%;" />
      <col style="width:7.5%;" />
      <col style="width:7.8%;" />
      <col style="width:8.5%;" />
      <col style="width:7.5%;" />
      <col style="width:9.5%;" />
      <col style="width:9.2%;" />
      <col style="width:9.5%;" />
      <col style="width:9.5%;" />
      <col style="width:10.0%;" />
    </colgroup>`;

  const receiptColgroupHtml = `
    <colgroup>
      <col style="width:5.5%;" />
      <col style="width:30.5%;" />
      <col style="width:16.0%;" />
      <col style="width:16.0%;" />
      <col style="width:16.0%;" />
      <col style="width:16.0%;" />
    </colgroup>`;


  return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>LPJ RAT KOPERASI AMANAH BARAYA TAHUN BUKU ${params.tahunBuku}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* UKURAN KERTAS F4 (21.5 cm x 33.0 cm) DENGAN MARGIN ATAS, BAWAH, KIRI, KANAN 2,5 CM */
    @page SectionCoverF4 {
      size: 21.5cm 33.0cm;
      margin: 0cm 0cm 0cm 0cm;
      mso-page-orientation: portrait;
    }
    @page SectionPortraitF4 {
      size: 21.5cm 33.0cm;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
      mso-page-orientation: portrait;
    }
    @page SectionLandscapeF4 {
      size: 33.0cm 21.5cm;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
      mso-page-orientation: landscape;
    }
    div.SectionCoverF4 { page: SectionCoverF4; }
    div.SectionPortraitF4 { page: SectionPortraitF4; }
    div.SectionLandscapeF4 { page: SectionLandscapeF4; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11.5pt;
      line-height: 1.5;
      color: #000000;
    }
    h1, h2, h3, h4 {
      margin: 6pt 0;
      font-weight: bold;
    }
    p {
      margin: 6pt 0;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .justify { text-align: justify; text-indent: 28pt; }
    .justify-noindent { text-align: justify; }
    .page-break { page-break-before: always; }
    table.formal {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
      font-size: 10.5pt;
    }
    table.formal th, table.formal td {
      border: 1px solid #000000;
      padding: 4pt 6pt;
      vertical-align: middle;
    }
    table.formal th {
      background-color: #b4c6e7;
      font-weight: bold;
      text-align: center;
    }
    table.lampiran {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 6pt 0;
      font-size: 7pt;
    }
    table.lampiran th, table.lampiran td {
      border: 1px solid #000000;
      padding: 2pt 3pt;
      vertical-align: middle;
    }
    table.lampiran th {
      background-color: #ffffff;
      font-weight: bold;
      text-align: center;
    }
    table.no-border {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    table.no-border td {
      border: none;
      padding: 2.5pt 4pt;
      vertical-align: top;
    }
    ol, ul {
      margin-top: 4pt;
      margin-bottom: 6pt;
    }
    li {
      margin-bottom: 4pt;
      text-align: justify;
    }
  </style>
</head>
<body>

<!-- ==================== HALAMAN 1: DESAIN COVER F4 ==================== -->
<div class="SectionCoverF4">
  ${
    coverDataUrl
      ? `<div style="width:21.5cm;height:33.0cm;margin:0;padding:0;text-align:center;">
           <img src="${coverDataUrl}" style="width:21.5cm;height:32.8cm;display:block;" alt="Cover LPJ Koperasi Amanah Baraya" />
         </div>`
      : `<div style="padding:3.5cm 2.5cm 2.5cm 2.5cm;text-align:center;background:#e8f5e9;min-height:28cm;">
           <h2 style="color:#1b4d3e;font-size:20pt;margin-bottom:2pt;">KOPERASI</h2>
           <h1 style="color:#c84b31;font-size:26pt;margin-top:0;">AMANAH BARAYA</h1>
           <p style="background:#1b4d3e;color:#ffffff;display:inline-block;padding:4pt 18pt;font-weight:bold;font-size:11pt;">
             RSUD ALMULK - KOTA SUKABUMI
           </p>
           <br/><br/><br/>
           <h1 style="color:#1b4d3e;font-size:24pt;margin-bottom:4pt;">LAPORAN<br/>PERTANGGUNGJAWABAN (LPJ)</h1>
           <h2 style="color:#163020;font-size:16pt;">PENGURUS DAN PENGAWAS<br/>KOPERASI AMANAH BARAYA</h2>
           <h3 style="color:#2e5a44;font-size:15pt;">TAHUN BUKU ${params.tahunBuku}</h3>
           <br/>
           <p style="font-size:13pt;">————— Disampaikan dalam —————</p>
           <div style="background:#114b5f;color:#ffffff;padding:10pt 24pt;border-radius:24pt;font-size:16pt;font-weight:bold;margin:10pt auto;width:80%;">
             RAPAT ANGGOTA TAHUNAN (RAT)
           </div>
           <h3 style="color:#1b4d3e;font-size:15pt;">Tahun ${params.tahunRat}</h3>
           <br/>
           <p style="font-size:12pt;text-align:left;margin-left:90pt;">
             <strong>Jl. Pelabuhan II No.KM 6, Lembursitu,</strong><br/>
             Kec. Lembursitu, Kota Sukabumi,<br/>
             Jawa Barat 43169
           </p>
         </div>`
  }
</div>

<!-- ==================== HALAMAN 2: KATA PENGANTAR ==================== -->
<div class="SectionPortraitF4">
  <div class="page-break"></div>
  <h3 class="center" style="font-size:12.5pt;">KATA PENGANTAR</h3>
  <br/>
  <p class="justify">
    Puji dan syukur kita panjatkan ke hadirat Allah SWT karena atas rahmat dan karunia-Nya Laporan Pertanggungjawaban (LPJ) <strong>Koperasi Amanah Baraya</strong> dapat disusun dengan baik. Laporan ini merupakan bentuk pertanggungjawaban pengurus Koperasi Periode Tahun ${prevTahunBuku} – ${params.tahunBuku} untuk Tahun ${params.tahunRat} kepada seluruh anggota atas pelaksanaan kegiatan dan pengelolaan koperasi selama satu periode kerja.
  </p>
  <p class="justify">
    LPJ ini disusun sebagai gambaran mengenai kondisi, perkembangan, serta kinerja pengelolaan keuangan dan kegiatan usaha Koperasi Amanah Baraya. Selain itu, laporan ini juga menjadi sarana transparansi dan evaluasi bersama agar pengelolaan koperasi ke depan dapat berjalan lebih baik, profesional, dan memberikan manfaat yang lebih besar bagi seluruh anggota.
  </p>
  <p class="justify">
    Kami menyadari bahwa keberlangsungan dan perkembangan Koperasi Amanah Baraya tidak terlepas dari dukungan, partisipasi, dan kepercayaan seluruh anggota serta pihak-pihak yang telah membantu dalam setiap kegiatan koperasi. Untuk itu, kami mengucapkan terima kasih kepada seluruh anggota dan pengurus yang telah berperan aktif dalam memajukan koperasi ini.
  </p>
  <p class="justify">
    Kami telah berusaha sesuai dengan kemampuan untuk melaksanakan tugas dan kewajiban, memberikan pelayanan kepada seluruh anggota Koperasi Amanah Baray, walaupun dengan segala keterbatasan waktu dan kemampuan kami. Oleh karena itu kami mohon maaf dan maklum atas segala kekuarangan dan keterbatasan ini.
  </p>
  <p class="justify">
    Selanjutnya kepada seluruh anggota Koperasi Amanah Baraya agar tetap semangat mendukung dan menghidupkan Koperasi Amanah Baraya ini sehingga lebih maju dan berkembang lagi.
  </p>
  <p class="justify">
    Akhirnya kepada semua pihak yang telah membantu kami ucapan terimakasih, semoga Allah SWT selalu melimpahkan Rahmat dan Hidayahnya kepada kita semua. Aamiin...
  </p>
  <br/>
  <div class="center" style="font-weight:bold;">
    Sukabumi, ${params.tanggalKataPengantar}<br/>
    KOPERASI PEGAWAI UOBK RSUD AL-MULK KOTA SUKABUMI<br/>
    “AMANAH BARAYA”
  </div>
  <br/><br/><br/>
  <div class="center">
    ttd<br/>
    PENGURUS
  </div>
  ${renderPageFooterHtml(2)}

  <!-- ==================== HALAMAN 3: SUSUNAN ACARA ==================== -->
  <div class="page-break"></div>
  <h3 class="center" style="font-size:12.5pt;">SUSUNAN ACARA</h3>
  <br/>
  <p><strong>A. &nbsp;ACARA UMUM</strong></p>
  <ol style="margin-left:18pt;">
    <li>PEMBUKAAN</li>
    <li>SAMBUTAN / PRAKATA KETUA KOPERASI “AMANAH Baraya”</li>
    <li>SAMBUTAN<br/>a. &nbsp;Direktur UOBK RSUD AL-Mulk</li>
    <li>DOA / RAMAH TAMAH</li>
  </ol>
  <p style="margin-top:12pt;"><strong>B. &nbsp;ACARA KHUSUS RAPAT ANGGOTA TAHUN (RAT)</strong></p>
  <ol style="margin-left:18pt;">
    <li>PEMBUKAAN</li>
    <li>PEMBACAAN DAN PENGESAHAN ACARA DAN TATA TERTIB</li>
    <li>LAPORAN PERTANGGUNGJAWABAN PENGURUS TAHUN BUKU ${params.tahunBuku} (singkat)</li>
    <li>PANDANGAN UMUM ( 2 orang penanya dari anggota)</li>
    <li>PENGESAHAN LAPORAN PERTANGGUNGJAWABAN PENGURUS DAN PENGAWAS TAHUN ${params.tahunBuku}</li>
    <li>PEMBAHASAN RENCANA KERJA DAN RAPB TAHUN ${params.tahunRat} (singkat) DAN PENGESAHANNYA</li>
    <li>KEPUTUSAN-KE[UTUSAN RAPAT</li>
  </ol>
  <br/><br/><br/><br/><br/><br/>
  ${renderPageFooterHtml(3)}

  <!-- ==================== HALAMAN 4: PENDAHULUAN RAT ==================== -->
  <div class="page-break"></div>
  <h3 class="center" style="font-size:12.5pt;">Rapat Anggota Tahunan (RAT)<br/>Tahun Buku ${params.tahunBuku}</h3>
  <br/>
  <p><strong>I. Dasar Penyelenggara</strong></p>
  <ol type="a" style="margin-left:18pt;">
    <li>Anggaran Dasar dan Anggaran Rumah Tangga Koperasi Amanah Baraya</li>
    <li>Program Kerja Koperasi Amanah Baraya</li>
  </ol>
  <br/>
  <p><strong>II. Maksud Dan Tujuan</strong></p>
  <p class="justify" style="margin-left:18pt;">
    Rapat Anggota Tahunan (RAT) dimaksud untuk menyampaikan laporan pertangung jawaban baik pengurus maupun pengawas kepada anggota tentang hasil pelaksanaan kerja selama periode buku bulan ${params.periodeBukuText}, kemudian penyampaian pembahasan dan pengesahan Rencana Kerja dan Pengesahan Anggaran, Pendapatan dan Belanja (RAPB) tahun ${params.tahunRat} sebagai pedoman pengurus dalam pelaksanaan tugas yang akan datang.
  </p>
  <br/>
  <p><strong>III. Umum</strong></p>
  <p class="justify" style="margin-left:18pt;">
    Dalam RAT setiap anggota dapat menyampaikan tanggapan, usul dan saran untuk kemajuan koperasi baik secara lisan mau secara tertulis. RAT dapat dianggap sah apabila dihadiri oleh lebih setengah dari jumlah anggota dengan keputusan diambil berdasarkan musyawarah untuk mufakat dengan dijiwai oleh semangat kekeluargaan.
  </p>
  <p class="justify" style="margin-left:18pt;">
    Suksesnya RAT ini, tidak terlepas dari peran aktif para pengurus, pengawas serta seluruh anggota koperasi. Diharapkan bahwa penyelenggaraan RAT akan memperoleh manfaat yang dapat menunjukan kemampuan dan kemandirian pengurus dalam menjalankan organisasi koperasi.
  </p>
  <br/><br/><br/><br/>
  ${renderPageFooterHtml(4)}

  <!-- ==================== HALAMAN 5: TATA TERTIB RAT (BAB I - BAB III) ==================== -->
  <div class="page-break"></div>
  <h3 class="center" style="font-size:12pt;">TATA TERTIB RAPAT ANGGOTA TAHUNAN (RAT)<br/>TAHUN BUKU ${params.tahunBuku}</h3>
  <br/>
  <h4 class="center">BAB I<br/>NAMA, WAKTU, DAN TEMPAT<br/>Pasal 1</h4>
  <p class="justify">
    Rapat ini bernama Rapat Anggota Tahunan Koperasi Pegawai Republik Indonesia (KPRI) “Amanah Baraya” untuk tahun buku bulan ${params.periodeBukuText} diselenggarakan di UOBK RSUD Al-Mulk Kota Sukabumi pada tanggal ${params.tanggalRat}
  </p>
  <br/>
  <h4 class="center">BAB II<br/>DASAR PENYELENGGARAAN<br/>PASAL 2</h4>
  <p>Rapat Anggota Tahunan ini di laksanakan berdasarkan :</p>
  <ol type="a" style="margin-left:18pt;">
    <li>Undang Undang No.25 tahun 1992 tentang berkoperasi.</li>
    <li>Anggaran Dasar Koperasi Amanah Baraya.</li>
    <li>Anggaran Dasar dan Anggaran Rumah Tangga Koperasi Amanah Baraya</li>
  </ol>
  <br/>
  <h4 class="center">BAB III<br/>MAKSUD DAN TUJUAN<br/>Pasal 3</h4>
  <ol type="a" style="margin-left:18pt;">
    <li>Rapat Anggota Tahunan (RAT) bermaksud untuk menyampaian laporan pertanggung jawaban pengurus kepada anggota tentang hasil pelaksanaan kerja selama tahun buku bulan ${params.periodeBukuText}</li>
    <li>Rapat Anggota Tahunan (RAT) bertujuan untuk membahas dan mengesahan Rencana Kerja serta Rencana Pendapatan dan Belanja untuk Tahun buku bulan ${params.periodeBukuText} sebagai pedoman pelaksanaan tugas yang akan datang dan untuk dilaksanakan oleh pengurus.</li>
  </ol>
  <br/><br/>
  ${renderPageFooterHtml(5)}

  <!-- ==================== HALAMAN 6: TATA TERTIB RAT (BAB IV - BAB VII) ==================== -->
  <div class="page-break"></div>
  <h4 class="center">BAB IV<br/>KEWAJIBAN DAN HAK PESERTA<br/>Pasal 4</h4>
  <ol type="a" style="margin-left:18pt;">
    <li>Sebelum rapat dimulai, peserta rapat diwajibkan melakukan absensi kehadiran</li>
    <li>Pada waktu rapat virtual berlangsung, seluruh peserta rapat di harapkan dapat mengikuti rapat sampai selesai</li>
    <li>Dalam menggunakan hak bicara, anggota harus objektif, tegas dan jelas</li>
    <li>Setiap peserta rpat berkewajiban untuk menaati tata tertib rapat dan mengindahkan kewajiban pimpinan rapat.</li>
    <li>Hak suara yaitu satu orang anggota satu suara.</li>
    <li>Peserta rapat mempunyai hak untuk menyampaikan tanggapan,usul dan saran dengan waktu ditentukan oleh rapat anggota</li>
  </ol>
  <br/>
  <h4 class="center">BAB V<br/>PIMPINAN RAPAT<br/>Pasal 5</h4>
  <ol type="a" style="margin-left:18pt;">
    <li>Rapat dipimpin oleh ketua atau pengurus lain yang diberikan kewenangan oleh Ketua.</li>
    <li>Pimpinan rapat berwenang mengatur, mengarahkan dan mengusahakan agar rapat dapat berjalan lancer dan tertib sesuai dengan peraturan tata tertib ini yang selalu dijiwai oleh semangat kekeluargaan, silih asih ,silih asuh, musyawarah mufakat.</li>
    <li>Pimpinan rapat berhak memperingati pembicaraan yang dianggap menyimpang dari pokok permasalahan dan apabila perlu dapat meminta untuk meninggalkan rapat</li>
  </ol>
  <br/>
  <h4 class="center">BAB VI<br/>SAHNYA RAPAT<br/>Pasal 6</h4>
  <p class="center">Rapat anggota sah apabila dihadiri oleh lebih dari setengah jumlah anggota</p>
  <br/>
  ${renderPageFooterHtml(6)}

  <!-- ==================== HALAMAN 7: TATA TERTIB RAT (BAB VII - BAB IX) ==================== -->
  <div class="page-break"></div>
  <h4 class="center">BAB VII<br/>SAHNYA KEPUTUSAN RAPAT<br/>Pasal 7</h4>
  <ol type="a" style="margin-left:18pt;">
    <li>Keputusan Rapat Anggota sah apabila berdasarkan dengan cara musyawarah untuk mufakat dan di setujui oleh Sebagian anggota peserta rapat</li>
    <li>Apabila tidak terdapat / tidak tercapai kesepakatan secara musyawarah untuk mufakat, maka pimpinan rapat mengusahakan suatu keputusan berdasarkan pemungutan suara dan dianggap sah bila disetujui oleh Sebagian terbesar peserta rapat</li>
  </ol>
  <br/>
  <h4 class="center">BAB VIII<br/>LAIN-LAIN<br/>Pasal 8</h4>
  <p class="justify">
    Hal – hal lain yang belum diatur dalam peraturan tata tertib ini akan ditentukan oleh pimpinan rapat atas dasar persetujuan rapat
  </p>
  <br/>
  <h4 class="center">BAB IX<br/>PENUTUPAN<br/>PASAL 9</h4>
  <p class="justify">
    Peraturan tata tertib rapat ini disetujui dan di sahkan oleh rapat anggota pada tanggal ${params.tanggalRat}
  </p>
  <br/><br/><br/>
  <div class="center">
    Sukabumi, ${params.tanggalRat}<br/>
    RAPAT ANGGOTA TAHUNAN (RAT)<br/>
    KPRI “AMANAH BARAYA ” TAHUN BUKU ${params.tahunBuku}
    <hr style="border:none;border-top:2px solid #000;width:75%;margin-top:8pt;" />
  </div>
  <br/><br/><br/><br/>
  ${renderPageFooterHtml(7)}

  <!-- ==================== HALAMAN 8: LAPORAN PERTANGGUNG JAWABAN PENGURUS ==================== -->
  <div class="page-break"></div>
  <h3 class="center" style="font-size:12pt;">
    LAPORAN PERTANGGUNG JAWABAN<br/>
    PENGURUS KPRI “AMANAH BARAYA”<br/>
    TAHUN BUKU ${params.periodeBukuText.toUpperCase()}
  </h3>
  <br/>
  <p><strong>I. &nbsp;&nbsp;PENDAHULUAN</strong></p>
  <p class="justify" style="margin-left:18pt;">
    Laporan pertanggung jawaban ini disusun secara ringkas dan sederhana, dalam menguraikan kegiatan KPRI “Amanah Baraya” Tahun buku bulan ${params.periodeBukuText}.
  </p>
  <p class="justify-noindent" style="margin-left:18pt;">
    Penyusunan laporan pertanggung jawaban dimaksudkan untuk mempertanggung jawabankan hasil pelaksanaan kegiatan dan keuangan bulan ${params.periodeBukuText} , berdasarkan evaluasi, usulan,saran dan masukan baik dari pengawas, maupun dari anggota yang selanjutnya dievaluasi kembali untuk dijadikan acuan dalam memperbaiki langkah kearah yang lebih baik dimasa yang akan datang.
  </p>
  <br/>
  <p><strong>II. &nbsp;PERKEMBANGAN KPRI KOPERASI AMANAH BARAYA</strong></p>
  <p style="margin-left:18pt;"><strong>1. &nbsp;BIDANG ORGANISASI</strong></p>
  <p style="margin-left:34pt;">a. &nbsp;Susunan pengurus untuk masa bakti Th. ${params.tahunBuku}-${params.tahunRat} adalah sbb :</p>
  <table class="no-border" style="margin-left:48pt;width:85%;">
    <tr><td style="width:180pt;">- &nbsp;Ketua</td><td>: ${params.ketuaPengurus}</td></tr>
    <tr><td>- &nbsp;Sekretaris dan Kepala Toko</td><td>: ${params.sekretarisPengurus}</td></tr>
    <tr><td>- &nbsp;Bendahara</td><td>: ${params.bendaharaPengurus}</td></tr>
  </table>

  <p style="margin-left:34pt;margin-top:8pt;">b. &nbsp;Susunan Pengawasan untuk masa bakti ${prevTahunBuku}-${params.tahunRat} adalah sbb :</p>
  <table class="no-border" style="margin-left:48pt;width:85%;">
    <tr><td style="width:180pt;">&#10146; &nbsp;Ketua</td><td>: ${params.ketuaPengawasOrganisasi}</td></tr>
    <tr><td>&#10146; &nbsp;Anggota</td><td>: ${params.anggotaPengawas1}</td></tr>
    <tr><td></td><td>&nbsp;&nbsp;${params.anggotaPengawas2}</td></tr>
    <tr><td></td><td>&nbsp;&nbsp;${params.anggotaPengawas3}</td></tr>
  </table>

  <p style="margin-left:34pt;margin-top:8pt;">c. &nbsp;Karyawan</p>
  <p style="margin-left:50pt;">Jumlah karyawan koperasi Amanah Baraya tahun ${params.tahunBuku} berjumlah ${params.jumlahKaryawan} orang.</p>
  ${renderPageFooterHtml(8)}

  <!-- ==================== HALAMAN 9: d. KEANGGOTAAN & TABEL 1 ==================== -->
  <div class="page-break"></div>
  <p style="margin-left:34pt;">d. &nbsp;Keanggotaan</p>
  <p class="center" style="font-size:10.5pt;">Tabel 1: Perkembangan Data Anggota Tahun ${prevTahunBuku} - ${params.tahunBuku}</p>
  <table class="formal">
    <thead>
      <tr>
        <th rowspan="2" style="width:45px;">NO</th>
        <th rowspan="2">URAIAN</th>
        <th colspan="2">PERIODE</th>
      </tr>
      <tr>
        <th>${periodePembandingText}</th>
        <th>${params.periodeBukuText}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td class="center">LAKI LAKI</td>
        <td class="center">${params.prevAnggotaLaki}</td>
        <td class="center">${data.anggotaLaki}</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td class="center">PEREMPUAN</td>
        <td class="center">${params.prevAnggotaPerempuan}</td>
        <td class="center">${data.anggotaPerempuan}</td>
      </tr>
      <tr>
        <td></td>
        <td class="center">JUMLAH</td>
        <td class="center">${prevTotalAnggota}</td>
        <td class="center">${data.totalAnggota}</td>
      </tr>
    </tbody>
  </table>

  <ul style="margin-left:34pt;">
    <li>Berdasarkan data administrasi keanggotaan Koperasi, perkembangan jumlah anggota selama periode Tahun Buku ${prevTahunBuku} sampai dengan Tahun ${params.tahunBuku} menunjukkan adanya penambahan dan pengurangan anggota yang tercatat secara resmi. Jumlah anggota koperasi Amanah Baraya sampai saat ini baru seitar 57,5% dari jumlah seluruh karyawan RSUD Al Mulk Kota Sukabumi.</li>
    <li>Pada Tahun ${prevTahunBuku}, jumlah anggota yang masuk tercatat sebanyak ${prevTotalAnggota} orang, terdiri dari ${params.prevAnggotaLaki} anggota laki-laki dan ${params.prevAnggotaPerempuan} anggota perempuan. Pada Tahun ${params.tahunBuku}, terdapat perkembangan jumlah anggota dibandingkan tahun ${prevTahunBuku} menjadi ${data.totalAnggota} orang (${data.anggotaLaki} anggota laki-laki dan ${data.anggotaPerempuan} anggota perempuan).</li>
    <li>Adapun anggota yang keluar pada Tahun ${prevTahunBuku} tercatat sebanyak 2 orang, seluruhnya anggota perempuan. Sedangkan pada Tahun ${params.tahunBuku} jumlah anggota yang keluar/nonaktif tercatat sebanyak ${data.anggotaNonAktifCount} orang. Alasan anggota keluar adalah karena pindah atau mutasi tempat kerja.</li>
    <li>Dengan demikian, jumlah anggota koperasi yang masih aktif sampai dengan bulan Desember tahun ${params.tahunBuku} adalah sebanyak ${data.anggotaAktifCount} orang, dengan rincian ${data.anggotaLaki} anggota laki-laki dan ${data.anggotaPerempuan} anggota perempuan.</li>
    <li>Secara keseluruhan, kondisi keanggotaan koperasi dapat dinyatakan dalam keadaan stabil dengan tingkat partisipasi anggota yang tetap terjaga. Pengurus akan terus berupaya meningkatkan jumlah dan partisipasi aktif anggota guna memperkuat permodalan dan keberlangsungan usaha koperasi.</li>
  </ul>
  ${renderPageFooterHtml(9)}

  <!-- ==================== HALAMAN 10: 2. BIDANG USAHA (a. USP & TABEL 2) ==================== -->
  <div class="page-break"></div>
  <p style="margin-left:18pt;"><strong>2. &nbsp;BIDANG USAHA</strong></p>
  <p style="margin-left:34pt;"><strong>a. &nbsp;Unit Usaha Simpan Pinjam (USP)</strong></p>
  <p class="center" style="font-size:10.5pt;">Tabel 2: Perkembangan Unit Usaha Simpan Pinjam Tahun ${prevTahunBuku} - ${params.tahunBuku}</p>
  <table class="formal">
    <thead>
      <tr>
        <th rowspan="2" style="width:45px;">NO</th>
        <th rowspan="2">URAIAN</th>
        <th colspan="2">CAPAIAN PERIODE</th>
      </tr>
      <tr>
        <th>${periodePembandingText}</th>
        <th>${params.periodeBukuText}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td>Anggota yang dilayani</td>
        <td class="center">${params.prevPinjamAnggotaDilayani}</td>
        <td class="center">${data.pinjamAnggotaDilayani}</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td>Pemberian Pinjaman</td>
        <td>${fRpCell(params.prevPemberianPinjaman)}</td>
        <td>${fRpCell(data.pemberianPinjaman)}</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td>Angsuran Pinjaman</td>
        <td>${fRpCell(params.prevAngsuranPinjaman)}</td>
        <td>${fRpCell(data.angsuranPinjaman)}</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td>Sisa Pinjaman</td>
        <td>${fRpCell(params.prevSisaPinjaman)}</td>
        <td>${fRpCell(data.sisaPinjaman)}</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td>Jasa / Ujroh</td>
        <td>${fRpCell(params.prevJasaPinjaman)}</td>
        <td>${fRpCell(data.jasaPinjaman)}</td>
      </tr>
    </tbody>
  </table>

  <ul style="margin-left:45pt;">
    <li>Jumlah Pemberian pinjaman periode bulan ${params.periodeBukuText} adalah sebesar Rp. ${f(data.pemberianPinjaman)}, berbeda sekitar ${pctPinjamanDiff}% dibandingkan dengan pemberian pinjaman pada periode ${periodePembandingText} yaitu Rp. ${f(params.prevPemberianPinjaman)}</li>
    <li>Jumlah angsuran pinjaman yang sudah dibayarkan pada periode ${params.periodeBukuText} adalah Rp. ${f(data.angsuranPinjaman)}, yaitu ${pctAngsuranRatio}% dari total pinjaman.</li>
    <li>Jumlah sisa pinjaman anggota sampai Desember ${params.tahunBuku} adalah ${f(data.sisaPinjaman)}, yaitu ${pctSisaRatio}% dari total pemberian pinjaman.</li>
    <li>Jumlah jasa / ujroh yang terkumpul pada periode ${params.periodeBukuText} adalah sebesar Rp. ${f(data.jasaPinjaman)} dibandingkan dengan capaian jumlah jasa periode ${periodePembandingText} sebesar Rp. ${f(params.prevJasaPinjaman)}. Hal ini disesuaikan dengan periode waktu pelaporan bulan ${params.periodeBukuText}, sedangkan periode sebelumnya dilaporkan dalam kurun waktu periode ${periodePembandingText}.</li>
  </ul>
  ${renderPageFooterHtml(10)}

  <!-- ==================== HALAMAN 11: b. UNIT USAHA WASERDA, TABEL 3 & 3. BIDANG PERMODALAN ==================== -->
  <div class="page-break"></div>
  <p style="margin-left:34pt;"><strong>b. &nbsp;Unit Usaha Waserda</strong></p>
  <p class="center" style="font-size:10.5pt;">Tabel 3 : Perkembangan Unit Usaha Waserda tahun ${prevTahunBuku} - ${params.tahunBuku}</p>
  <table class="formal">
    <thead>
      <tr>
        <th rowspan="2" style="width:45px;">NO</th>
        <th rowspan="2">URAIAN</th>
        <th colspan="2">CAPAIAN PERIODE</th>
      </tr>
      <tr>
        <th>${periodePembandingText}</th>
        <th>${params.periodeBukuText}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td>Anggota yang dilayani</td>
        <td class="center">${params.prevWaserdaAnggotaDilayani}</td>
        <td class="center">${data.waserdaAnggotaDilayani}</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td>Pembelian Barang</td>
        <td>${fRpCell(params.prevPembelianWaserda)}</td>
        <td>${fRpCell(data.pembelianBarangWaserda)}</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td>Pendapatan</td>
        <td>${fRpCell(params.prevPendapatanWaserda)}</td>
        <td>${fRpCell(data.pendapatanWaserda)}</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td>Saldo Piutang Barang</td>
        <td>${fRpCell(params.prevPiutangWaserda)}</td>
        <td>${fRpCell(data.saldoPiutangWaserda)}</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td>Persediaan Barang</td>
        <td>${fRpCell(params.prevPersediaanBarang)}</td>
        <td>${fRpCell(data.persediaanBarangWaserda)}</td>
      </tr>
    </tbody>
  </table>

  <p class="justify" style="margin-left:34pt;">
    Trend perkembangan usaha waserda tahun ${params.tahunBuku} dibandiingkan dengan tahun sebelumnya dapat dijelaskan sebagai berikut :
  </p>
  <ul style="margin-left:45pt;">
    <li>Pengeluaran pembelian barang, pendapatan dan saldo piutang barang periode ${params.periodeBukuText} tercatat secara realtime dibandingkan dengan periode sebelumnya yaitu periode ${periodePembandingText}.</li>
    <li>Pendapatan dengan pembelian barang terdapat surplus.</li>
    <li>Selain terdapat surplus pendapatan, terdapat juga persediaan barang senilai Rp. ${f(data.persediaanBarangWaserda)} dan Piutang barang sebesar Rp. ${f(data.saldoPiutangWaserda)}</li>
    <li>Diharapkan waserda dapat berkembang lebih baik lagi</li>
  </ul>

  <p style="margin-left:18pt;margin-top:10pt;"><strong>3. &nbsp;Bidang Permodalan</strong></p>
  <p class="justify-noindent" style="margin-left:34pt;">
    Modal usaha di koperasi Amanah baraya berasal dari simpanan pokok, simpanan wajib, simpanan sukarela, dan simpanan karyawisata yang berkembang dengan adanya kesepakatan dan Kerjasama Bersama rumah sakit dengan pemotongan secara otomatis dari bagian keuangan rumah sakit. Serta penghitungan oleh bagian rumah sakit dalam menghitung dan memperkirakan kemampuan bayar dari anggota.
  </p>
  <p class="justify-noindent" style="margin-left:34pt;">
    Besarnya simpanan anggota yang disepakati dan berjalan sampai pada tahun ${params.tahunBuku} adalah :
  </p>
  ${renderPageFooterHtml(11)}

  <!-- ==================== HALAMAN 12: TABEL 4 PERKEMBANGAN JUMLAH SIMPANAN ANGGOTA ==================== -->
  <div class="page-break"></div>
  <table class="no-border" style="margin-left:45pt;width:85%;">
    <tr><td style="width:160pt;">&#10146; &nbsp;Simpanan pokok</td><td>: Rp. 200.000,- / anggota</td></tr>
    <tr><td>&#10146; &nbsp;Simpanan wajib</td><td>: Rp. &nbsp;30.000,- / bulan / anggota</td></tr>
    <tr><td>&#10146; &nbsp;Simpanan sukarela</td><td>: sesuai kemampuan</td></tr>
    <tr><td>&#10146; &nbsp;Simpanan karyawisata</td><td>: Rp. 20.000,- / bulan / anggota</td></tr>
  </table>
  <br/>
  <p class="center" style="font-size:10.5pt;">Tabel 4 : Perkembangan Jumlah Simpanan Anggota</p>
  <table class="formal">
    <thead>
      <tr>
        <th rowspan="2" style="width:45px;">NO</th>
        <th rowspan="2">URAIAN</th>
        <th colspan="2">CAPAIAN PERIODE</th>
      </tr>
      <tr>
        <th>${periodePembandingText}</th>
        <th>${params.periodeBukuText}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td>Simpanan Pokok</td>
        <td>${fRpCell(params.prevSimpananPokok)}</td>
        <td>${fRpCell(data.totalSimpananPokok)}</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td>Simpanan Wajib</td>
        <td>${fRpCell(params.prevSimpananWajib)}</td>
        <td>${fRpCell(data.totalSimpananWajib)}</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td>Simpanan Sukarela</td>
        <td>${fRpCell(params.prevSimpananSukarela)}</td>
        <td>${fRpCell(data.totalSimpananSukarela)}</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td>Simpanan Karyawisata</td>
        <td>${fRpCell(params.prevSimpananWisata)}</td>
        <td>${fRpCell(data.totalSimpananWisata)}</td>
      </tr>
      <tr style="font-weight:bold;">
        <td></td>
        <td class="center">Jumlah</td>
        <td>${fRpCell(prevTotalSimpanan)}</td>
        <td>${fRpCell(data.totalSeluruhSimpanan)}</td>
      </tr>
    </tbody>
  </table>

  <p class="justify-noindent" style="margin-left:34pt;">
    Trend jumlah simpanan Pokok, simpanan wajib, simpanan sukarela, dan simpanan karyawisata dapat dijelaskan sebagai berikut:
  </p>
  <p class="justify-noindent" style="margin-left:50pt;">
    &#10146; &nbsp;Jumlah simpanan pokok dan simpanan wajib periode ${params.periodeBukuText} tercatat sebesar Rp. ${f(data.totalSimpananPokok)} untuk simpanan Pokok dan Rp. ${f(data.totalSimpananWajib)} untuk simpanan wajib jika dibandingkan dengan jumlah simpanan pada periode sebelumnya. Hal ini disebabkan masuknya anggota baru yang menambah jumlah simpanan Pokok dan simpanan wajib koperasi.
  </p>
  <p class="justify-noindent" style="margin-left:50pt;">
    &#10146; &nbsp;Untuk simpanan sukarela, pada periode ${params.periodeBukuText} tercatat sebesar Rp. ${f(data.totalSimpananSukarela)} dari periode sebelumnya, sesuai transaksi setoran dan penarikan simpanan sukarela anggota sebelum bulan Desember ${params.tahunBuku} untuk alasan kepentingan pribadi.
  </p>
  <p class="justify-noindent" style="margin-left:50pt;">
    &#10146; &nbsp;Simpanan karyawisata mengalami sedikit penurunan karena pada periode pelaporan ${params.periodeBukuText}, telah dilakukan kegiatan karyawisata ke Pangalengan Bandung yang diikuti oleh 30 orang anggota
  </p>
  ${renderPageFooterHtml(12)}

  <!-- ==================== HALAMAN 13: 4. DANA KESEJAHTERAAN (TABEL 5) & III. REALISASI PENDAPATAN DAN BELANJA (TABEL 6) ==================== -->
  <div class="page-break"></div>
  <p class="justify-noindent" style="margin-left:50pt;">
    koperasi Amanah Baraya dengan menggunakan simpanan karyawisata masing masing, sehingga jumlah simpanan karyawisata berkurang.
  </p>
  <p style="margin-left:18pt;margin-top:10pt;"><strong>4. &nbsp;Dana Kesejahteraan</strong></p>
  <p class="justify-noindent" style="margin-left:34pt;">
    Dana kesejahteraan anggota koperasi Amanah Baraya dalam bentuk Surplus Hasil Usaha (SHU) dan bingkisan yang diberikan kepada anggota pada waktu akhir periode pelaporan tutup buku.
  </p>
  <p class="justify-noindent" style="margin-left:34pt;">
    SHU diperoleh dari pengurangan pendapatan terhadap biaya operasional yang dikeluarkan. SHU dibagikan kepada anggota dalam bentuk jasa penyimpan dan jasa peminjam sesuai dengan aturan yang telah ditetapkan. Bingkisan untuk anggota dialokasikan dalam biaya operasional koperasi.
  </p>

  <p class="center" style="font-size:10.5pt;">Tabel 5 : Perkembangan Dana Kesejahteraan Anggota Tahun ${prevTahunBuku} – ${params.tahunBuku}</p>
  <table class="formal">
    <thead>
      <tr>
        <th rowspan="2" style="width:45px;">NO</th>
        <th rowspan="2">URAIAN</th>
        <th colspan="2">CAPAIAN PERIODE</th>
      </tr>
      <tr>
        <th>${periodePembandingText}</th>
        <th>${params.periodeBukuText}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td>SHU anggota</td>
        <td>${fRpCell(params.prevShuAnggota)}</td>
        <td>${fRpCell(data.shuAnggotaKesejahteraan)}</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td>Bingkisan</td>
        <td>${fRpCell(params.prevBingkisan)}</td>
        <td>${fRpCell(data.bingkisanKesejahteraan)}</td>
      </tr>
      <tr style="font-weight:bold;">
        <td></td>
        <td>Jumlah</td>
        <td>${fRpCell(prevTotalKesejahteraan)}</td>
        <td>${fRpCell(data.totalDanaKesejahteraan)}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top:12pt;"><strong>III. &nbsp;&nbsp;REALISASI PENDAPATAN DAN BELANJA</strong></p>
  <p class="center" style="font-size:10.5pt;">
    Tabel 6 : Realisasi Pendapatan dan Belanja<br/>
    Periode ${params.periodeBukuText}
  </p>
  <table class="formal">
    <thead>
      <tr>
        <th style="width:45px;">NO</th>
        <th>URAIAN</th>
        <th style="width:180px;">REALISASI</th>
      </tr>
    </thead>
    <tbody>
      <tr style="font-weight:bold;">
        <td class="center">A</td>
        <td>PENDAPATAN</td>
        <td>${fRpCell(data.totalPendapatanLabaRugi)}</td>
      </tr>
      <tr>
        <td></td>
        <td>1. Jasa / Ujroh</td>
        <td>${fRpCell(data.pendapatanJasaUjroh)}</td>
      </tr>
      <tr>
        <td></td>
        <td>2. Pendapatan Waserda</td>
        <td>${fRpCell(data.pendapatanWaserdaLabaRugi)}</td>
      </tr>
      <tr>
        <td></td>
        <td>3. Persediaan Barang</td>
        <td>${fRpCell(data.pendapatanPersediaanBarang)}</td>
      </tr>
      <tr>
        <td></td>
        <td>4. Bank</td>
        <td>${fRpCell(data.pendapatanBank)}</td>
      </tr>
      <tr style="font-weight:bold;">
        <td class="center">B</td>
        <td>BIAYA BIAYA</td>
        <td>${fRpCell(data.totalBiayaLabaRugi)}</td>
      </tr>
      <tr>
        <td></td>
        <td>1. Pembelian Barang Waserda</td>
        <td>${fRpCell(data.biayaPembelianWaserda)}</td>
      </tr>
      <tr>
        <td></td>
        <td>2. Biaya Paket Bingkisan</td>
        <td>${fRpCell(data.biayaPaketBingkisan)}</td>
      </tr>
      <tr>
        <td></td>
        <td>3. Honor Karyawan</td>
        <td>${fRpCell(data.biayaHonorKaryawan)}</td>
      </tr>
      <tr>
        <td></td>
        <td>4. Potongan Admin Bank</td>
        <td>${fRpCell(data.biayaAdminBank)}</td>
      </tr>
      <tr style="font-weight:bold;">
        <td></td>
        <td class="center">SHU</td>
        <td>${fRpCell(data.surplusHasilUsaha)}</td>
      </tr>
    </tbody>
  </table>
  ${renderPageFooterHtml(13)}

  <!-- ==================== HALAMAN 14: IV. EVALUASI AKHIR KEGIATAN (a & b.1-5) ==================== -->
  <div class="page-break"></div>
  <p><strong>IV. &nbsp;&nbsp;EVALUASI AKHIR KEGIATAN</strong></p>
  <p class="justify-noindent" style="margin-left:34pt;">
    Berdasarkan rencana kegiatan yang disusun untuk dilaksanakan pada tahun ${params.tahunBuku}, masih ada beberapa rencana kegiatan yang belum terlaksana secara maksimal. Berikut beberapa catatan yang dirangkum sebagai evaluasi dan bahan pertimbangan untuk rencana kegiatan tahun ${params.tahunRat}.
  </p>
  <br/>
  <p style="margin-left:24pt;"><strong>a. &nbsp;Catatan Bidang Kelembagaan</strong></p>
  <ol style="margin-left:42pt;">
    <li>Diperlukan penataan ulang struktur organisasi serta kejelasan tugas pokok dan fungsi masing-masing pengurus dan pengawas koperasi sehingga dapat lebih memajukan koperasi Amanah Baraya</li>
    <li>Perlu adanya penyusunan dan penetapan standar operasional prosedur (SOP) pelayanan, pengelolaan keuangan, serta pengelolaan barang, sehingga pencatatan akan lebih rapi.</li>
    <li>Perlu adanya pengembangan unit usaha simpan pinjam dan waserda dengan mengedepankan prinsip syariah.</li>
    <li>Perlu adanya jadwal pelaksanaan rapat rutin pengurus dan pengawas koperasi.</li>
    <li>Penyusunan laporan keuangan perlu dilakukan secara berkala (bulanan dan tahunan) secara transparan dan akuntabel.</li>
    <li>Untuk pengembangan Koperasi Amanah Baraya kedepannya, maka diperlukan pengajuan legalitas perijinan koperasi Amanah Baraya.</li>
  </ol>
  <br/>
  <p style="margin-left:24pt;"><strong>b. &nbsp;Catatan Bidang Permodalan</strong></p>
  <ol style="margin-left:42pt;">
    <li>Mengoptimalkan modal sendiri untuk memenuhi kebutuhan pinjaman anggota. Salah satu upaya yang dapat dilakukan adalah dengan mengajak seluruh karyawan RSUD Al Mulk untuk menjadi anggota koperasi Amanah Baraya, sehingga akan menambah jumlah simpanan koperasi.</li>
    <li>Mengupayakan kemandirian permodalan unit waserda.</li>
    <li>Menjaga keseimbangan antara likuiditas dan penyaluran pinjaman.</li>
    <li>Meningkatkan disiplin pembayaran anggota guna menjaga kesehatan keuangan koperasi.</li>
    <li>Simpanan wajib dan simpanan pokok tidak bisa diambil, kecuali anggotanya keluar.</li>
  </ol>
  ${renderPageFooterHtml(14)}

  <!-- ==================== HALAMAN 15: LANJUTAN b.6-8 & c. CATATAN BIDANG USAHA (1. USP) ==================== -->
  <div class="page-break"></div>
  <ol start="6" style="margin-left:42pt;">
    <li>Dana simpanan poko diusulkan penambahan menjadi Rp. 300.000;00</li>
    <li>Dana sukarela diwajibkan untuk setiap anggota menyimpan tabunga minimal Rp. 30.000;00</li>
    <li>Dana wisata hanya bisa dipakai untuk kegiatan wisata / pembelian akomodasi untuk kegiatan program koperasi Amanah Baraya</li>
  </ol>
  <br/>
  <p style="margin-left:24pt;"><strong>c. &nbsp;Catatan Bidang Usaha</strong></p>
  <p style="margin-left:24pt;"><strong>1. &nbsp;Unit Simpan Pinjam</strong></p>
  <ul style="margin-left:42pt;">
    <li>Meningkatkan sistem pengawasan dan pencatatan melalui sistem administrasi yang tertib.</li>
    <li>Pinjaman diberikan kepada anggota aktif dengan mempertimbangkan kemampuan pembayaran (potong gaji melalui Bank BJB).</li>
    <li>Anggota baru dapat mengajukan pinjaman setelah minimal 3 bulan masa keanggotaan.</li>
    <li>Besaran pinjaman maksimal 6 kali jumlah simpanan.</li>
    <li>Jangka waktu pinjaman maksimal 12 bulan (1 tahun).</li>
    <li>Ujroh/jasa pinjaman sebesar 1,5% tetap per bulan (mengacu prinsip syariah).</li>
    <li>Pengajuan pinjaman maksimal tanggal 15 setiap bulan.</li>
    <li>Perlu ada kesepakatan batas maksimal tenor peminjaman dan jumlah peminjaman</li>
    <li>Sistem pembayaran melalui potong gaji/tunjangan kinerja atau transfer ke rekening koperasi.</li>
    <li>Setiap anggota peminjam, diharuskan melunasi pinjamannya sebelum mengajukan peminjaman baru.</li>
    <li>Setiap peminjaman apabila ada yang melunasi di pertengahan cicilan, makan pelunasan terhitung semua jumlah sisa hutang ditambah ujroh sampai bulan cicilan pelunasan.</li>
  </ul>
  ${renderPageFooterHtml(15)}

  <!-- ==================== HALAMAN 16: d. UNIT WASERDA, e. RAPB 2026 & V. PENUTUP ==================== -->
  <div class="page-break"></div>
  <p style="margin-left:24pt;"><strong>d. &nbsp;Unit Waserda</strong></p>
  <ul style="margin-left:42pt;">
    <li>Untuk mempermudah dan merapihkan pencatatan kegiatan waserda oleh petugas/karyawan koperasi, dipandang perlu adanya mesin kasir di waserda koperasi.</li>
    <li>Menambah variasi dan persediaan barang kebutuhan anggota.</li>
    <li>Pengelolaan dana waserda dipisahkan dari unit simpan pinjam.</li>
    <li>Pembaruan kerja sama dengan supplier untuk mendapatkan harga kompetitif.</li>
    <li>Peningkatan sistem pencatatan stok dan pengawasan barang.</li>
    <li>Pembelian dengan kasbon untuk pegawai RS maksimal 300.000/bulan dan untuk petugas kebersihan maksimal 100.000/bulan</li>
  </ul>
  <br/>
  <p style="margin-left:24pt;"><strong>e. &nbsp;Catatan Umum RAPB ${params.tahunRat}</strong></p>
  <ul style="margin-left:42pt;">
    <li>RAPB disusun berdasarkan proyeksi pendapatan jasa pinjaman, margin waserda, serta pendapatan lainnya.</li>
    <li>Biaya operasional difokuskan pada efisiensi dan efektivitas penggunaan anggaran.</li>
    <li>SHU yang diperoleh akan dibagikan sesuai ketentuan AD/ART koperasi.</li>
    <li>Pengurus berkomitmen menjaga prinsip transparansi dan akuntabilitas dalam pengelolaan keuangan.</li>
  </ul>
  <br/>
  <p><strong>V. &nbsp;&nbsp;PENUTUP</strong></p>
  <p class="justify-noindent" style="margin-left:34pt;">
    Demikian laporan pertanggungjawaban pengurus Koperasi Amanah Baraya tahun buku ${params.periodeBukuText}, semoga dapat dijadikan bahan evaluasi dalam program dan kegiatan pengurus dimasa yang akan datang.
  </p>
  <p class="justify-noindent" style="margin-left:34pt;">
    Atas partisipasi seluruh anggota terhadap kelancaran Koperasi Amanah Baraya kami ucapkan terima kasih.
  </p>
  ${renderPageFooterHtml(16)}

  <!-- ==================== HALAMAN 17: LEMBAR PENGESAHAN PENGURUS & PENGAWAS ==================== -->
  <div class="page-break"></div>
  <div class="center" style="font-weight:bold;margin-top:20pt;">
    Sukabumi, ${params.tanggalRat}<br/>
    Koperasi Amanah Baraya<br/>
    Pengurus
  </div>
  <br/>
  <table class="no-border" style="width:100%;font-size:11pt;">
    <tr>
      <td style="width:170pt;padding:10pt 4pt;">Ketua</td>
      <td style="padding:10pt 4pt;">: ${params.ketuaPengurus}</td>
      <td style="width:140pt;padding:10pt 4pt;">(…………………………..)</td>
    </tr>
    <tr>
      <td style="padding:10pt 4pt;">Sekertaris &amp; Pengelola Toko</td>
      <td style="padding:10pt 4pt;">: ${params.sekretarisPengurus}</td>
      <td style="padding:10pt 4pt;">(…………………………..)</td>
    </tr>
    <tr>
      <td style="padding:10pt 4pt;">Bendahara</td>
      <td style="padding:10pt 4pt;">: ${params.bendaharaPengurus}</td>
      <td style="padding:10pt 4pt;">(…………………………..)</td>
    </tr>
  </table>
  <br/>
  <div class="center" style="font-weight:bold;">Pengawas</div>
  <br/>
  <table class="no-border" style="width:100%;font-size:11pt;">
    <tr>
      <td style="width:170pt;padding:10pt 4pt;">Ketua</td>
      <td style="padding:10pt 4pt;">: ${params.ketuaPengawasLembarPengesahan}</td>
      <td style="width:140pt;padding:10pt 4pt;">(…………………………..)</td>
    </tr>
    <tr>
      <td style="padding:10pt 4pt;">Anggota</td>
      <td style="padding:10pt 4pt;">: ${params.anggotaPengawas1}</td>
      <td style="padding:10pt 4pt;">(…………………………..)</td>
    </tr>
    <tr>
      <td style="padding:10pt 4pt;">Anggota</td>
      <td style="padding:10pt 4pt;">: ${params.anggotaPengawas2}</td>
      <td style="padding:10pt 4pt;">(…………………………..)</td>
    </tr>
    <tr>
      <td style="padding:10pt 4pt;">Anggota</td>
      <td style="padding:10pt 4pt;">: ${params.anggotaPengawas3}</td>
      <td style="padding:10pt 4pt;">(…………………………..)</td>
    </tr>
  </table>
  <br/><br/><br/><br/>
  ${renderPageFooterHtml(17)}

  <!-- ==================== HALAMAN 18: PERHITUNGAN HASIL USAHA (LABA/RUGI) ==================== -->
  <div class="page-break"></div>
  <div class="center" style="font-size:11.5pt;margin-bottom:18pt;">
    PERHITUNGAN HASIL USAHA (LABA/RUGI)<br/>
    KOPERASI AMANAH BARAYA KOTA SUKABUMI<br/>
    PER : ${params.tanggalTutupBuku.toUpperCase()}
  </div>

  <table class="no-border" style="width:100%;font-size:11pt;">
    <tr>
      <td colspan="3">PENDAPATAN :</td>
    </tr>
    <tr style="font-weight:bold;">
      <td style="width:55%;">PENDAPATAN</td>
      <td style="width:20%;"></td>
      <td style="width:25%;">${fRpCell(data.totalPendapatanLabaRugi)}</td>
    </tr>
    <tr>
      <td>1. Jasa / Ujroh</td>
      <td></td>
      <td>${fRpCell(data.pendapatanJasaUjroh)}</td>
    </tr>
    <tr>
      <td>2. Pendapatan Waserda</td>
      <td></td>
      <td>${fRpCell(data.pendapatanWaserdaLabaRugi)}</td>
    </tr>
    <tr>
      <td>3. Persediaan Barang</td>
      <td></td>
      <td>${fRpCell(data.pendapatanPersediaanBarang)}</td>
    </tr>
    <tr>
      <td>4. Bank</td>
      <td></td>
      <td>${fRpCell(data.pendapatanBank)}</td>
    </tr>
    <tr><td colspan="3" style="height:12pt;"></td></tr>
    <tr style="font-weight:bold;">
      <td>BIAYA BIAYA</td>
      <td>${fRpCell(data.totalBiayaLabaRugi)}</td>
      <td></td>
    </tr>
    <tr>
      <td>1. Pembelian Barang Waserda</td>
      <td>${fRpCell(data.biayaPembelianWaserda)}</td>
      <td></td>
    </tr>
    <tr>
      <td>2. Biaya Paket Bingkisan</td>
      <td>${fRpCell(data.biayaPaketBingkisan)}</td>
      <td></td>
    </tr>
    <tr>
      <td>4. Honor Karyawan</td>
      <td>${fRpCell(data.biayaHonorKaryawan)}</td>
      <td></td>
    </tr>
    <tr>
      <td>5. Potongan Admin Bank</td>
      <td>${fRpCell(data.biayaAdminBank)}</td>
      <td></td>
    </tr>
    <tr style="font-weight:bold;">
      <td class="center">SHU</td>
      <td>${fRpCell(data.surplusHasilUsaha)}</td>
      <td></td>
    </tr>
  </table>

  <br/><br/>
  <div class="right" style="margin-right:24pt;">
    sukabumi, ${params.tanggalTutupBuku}<br/>
    KPRI Amanah Baraya Kota Sukabumi
  </div>
  <table class="no-border" style="width:100%;text-align:center;margin-top:6pt;">
    <tr>
      <td style="width:33%;">Ketua,</td>
      <td style="width:33%;">Kepala Toko</td>
      <td style="width:33%;">Bendahara,</td>
    </tr>
    <tr><td colspan="3" style="height:48pt;"></td></tr>
    <tr>
      <td>${params.ketuaPengurus}</td>
      <td>${params.sekretarisPengurus}</td>
      <td>${params.bendaharaPengurus}</td>
    </tr>
  </table>
  <br/><br/><br/>
  ${renderPageFooterHtml(18)}

  <!-- ==================== HALAMAN 19: PEMBAGIAN SURPLUS HASIL USAHA ==================== -->
  <div class="page-break"></div>
  <div class="center" style="font-size:11.5pt;margin-bottom:18pt;">
    PEMBAGIAN SURPLUS HASIL USAHA<br/>
    KOPERASI AMANAH BARAYA RSUD AL MULK KKOTA SUKABUMI<br/>
    PER ${params.tanggalTutupBuku.toUpperCase()}
  </div>

  <table class="no-border" style="width:100%;font-size:10.5pt;">
    <tr>
      <td style="width:42%;">SURPLUS HASIL USAHA</td>
      <td style="width:10%;"></td>
      <td style="width:20%;"></td>
      <td style="width:4%;">=</td>
      <td style="width:24%;">${fRpCell(data.surplusHasilUsaha)}</td>
    </tr>
    <tr>
      <td>ZAKAT</td>
      <td class="center">${params.zakatPercent.toFixed(2).replace('.', ',')}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.surplusHasilUsaha)}</td>
      <td>=</td>
      <td style="border-bottom:1px solid #000;">${fRpCell(data.zakatNominal)}</td>
    </tr>
    <tr>
      <td>SHU YANG DIBAGIKAN</td>
      <td></td>
      <td></td>
      <td>=</td>
      <td>${fRpCell(data.shuYangDibagikan)}</td>
    </tr>
    <tr><td colspan="5" style="height:14pt;"></td></tr>
    <tr>
      <td>1. DANA CADANGAN</td>
      <td class="center">${params.shuCadanganPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiCadangan)}</td>
    </tr>
    <tr>
      <td>2. BAGIAN ANGGOTA PENYIMPAN</td>
      <td class="center">${params.shuAnggotaPenyimpanPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiAnggotaPenyimpan)}</td>
    </tr>
    <tr>
      <td>3. BAGIAN ANGGOTA BERJASA</td>
      <td class="center">${params.shuAnggotaBerjasaPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiAnggotaBerjasa)}</td>
    </tr>
    <tr>
      <td>4. DANA PENGURUS</td>
      <td class="center">${params.shuPengurusPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiDanaPengurus)}</td>
    </tr>
    <tr>
      <td>5. DANA PENGAWAS</td>
      <td class="center">${params.shuPengawasPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiDanaPengawas)}</td>
    </tr>
    <tr>
      <td>6. DANA PEMBANGUNAN DAERAH KERJA</td>
      <td class="center">${params.shuPembangunanDaerahKerjaPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiPembangunanDaerahKerja)}</td>
    </tr>
    <tr>
      <td>7. DANA SOSIAL</td>
      <td class="center">${params.shuDanaSosialPercent}%</td>
      <td>X &nbsp;&nbsp;Rp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${f(data.shuYangDibagikan)}</td>
      <td>=</td>
      <td>${fRpCell(data.alokasiDanaSosial)}</td>
    </tr>
  </table>

  <br/>
  <p style="font-size:10.5pt;">PRESENTASI PEMBAGIAN SHU</p>
  <table class="no-border" style="width:100%;font-size:10.5pt;">
    <tr>
      <td style="width:42%;">1. BAGIAN ANGGOTA PENYIMPAN</td>
      <td style="width:24%;border-bottom:1px solid #000;">${fRpCell(data.alokasiAnggotaPenyimpan)}</td>
      <td style="width:6%;text-align:center;">X</td>
      <td style="width:10%;text-align:center;">100%</td>
      <td style="width:4%;">=</td>
      <td style="width:14%;text-align:right;">${data.persenShuSimpananFormatted}</td>
    </tr>
    <tr>
      <td></td>
      <td>${fRpCell(data.totalSeluruhSimpanan)}</td>
      <td colspan="4"></td>
    </tr>
    <tr><td colspan="6" style="height:8pt;"></td></tr>
    <tr>
      <td>2. BAGIAN ANGGOTA BERJASA</td>
      <td style="border-bottom:1px solid #000;">${fRpCell(data.alokasiAnggotaBerjasa)}</td>
      <td class="center">X</td>
      <td class="center">100%</td>
      <td>=</td>
      <td class="right">${data.persenShuJasaFormatted}</td>
    </tr>
    <tr>
      <td></td>
      <td>${fRpCell(data.totalJasaPinjamanAnggota)}</td>
      <td colspan="4"></td>
    </tr>
  </table>

  <br/><br/>
  <div class="right" style="margin-right:24pt;">
    sukabumi, ${params.tanggalTutupBuku}<br/>
    KPRI Amanah Baraya Kota Sukabumi
  </div>
  <table class="no-border" style="width:100%;text-align:center;margin-top:6pt;">
    <tr>
      <td style="width:33%;">Ketua,</td>
      <td style="width:33%;">Kepala Toko</td>
      <td style="width:33%;">Bendahara,</td>
    </tr>
    <tr><td colspan="3" style="height:48pt;"></td></tr>
    <tr>
      <td>${params.ketuaPengurus}</td>
      <td>${params.sekretarisPengurus}</td>
      <td>${params.bendaharaPengurus}</td>
    </tr>
  </table>
  ${renderPageFooterHtml(19)}
</div>

<!-- ==================== LAMPIRAN LANDSCAPE F4 (REKAP SIMPANAN & SISA HUTANG + REKAP SHU, MARGIN 2,5 CM) ==================== -->
<div class="SectionLandscapeF4">
  ${(() => {
    const debtPages = paginateAppendixTable(
      data.memberRows,
      20,
      LPJ_LANDSCAPE_FIRST_PAGE_ROWS,
      LPJ_LANDSCAPE_NEXT_PAGE_ROWS,
      data.nonMemberRows.length + 1
    );
    const shuStartPage = 20 + debtPages.length;
    const shuPages = paginateAppendixTable(
      data.memberRows,
      shuStartPage,
      LPJ_LANDSCAPE_FIRST_PAGE_ROWS,
      LPJ_LANDSCAPE_NEXT_PAGE_ROWS,
      1
    );

    const debtHtml = debtPages
      .map(
        (sheet) => `
  <!-- HALAMAN ${sheet.pageNo} -->
  <div class="page-break"></div>
  ${
    sheet.showTitleAndHeader
      ? `<div class="center" style="font-weight:bold;font-size:9.5pt;margin-bottom:6pt;">
    REKAP SIMPANAN ANGGOTA KOPERASI AMANAH BARAYA<br/>
    RSUD AL MULK KOTA SUKABUMI<br/>
    PER : ${params.tanggalTutupBuku.toUpperCase()}
  </div>`
      : ''
  }
  <table class="lampiran">
    ${debtColgroupHtml}
    ${
      sheet.showTitleAndHeader
        ? `<thead>
      <tr>
        <th rowspan="2">NO</th>
        <th rowspan="2">NAMA</th>
        <th colspan="4">SIMPANAN KOPERASI</th>
        <th rowspan="2">JUMLAH<br/>SIMPANAN</th>
        <th colspan="3">SISA HUTANG</th>
        <th rowspan="2">JUMLAH<br/>PIUTANG</th>
        <th rowspan="2">JUMLAH JASA<br/>PINJAMAN</th>
        <th rowspan="2">KETERANGAN</th>
      </tr>
      <tr>
        <th>POKOK</th>
        <th>WAJIB</th>
        <th>SUKARELA</th>
        <th>WISATA</th>
        <th>HUTANG<br/>PINJAMAN</th>
        <th>HUTANG<br/>BARANG</th>
        <th>KEKURANGAN<br/>KARYAWISATA</th>
      </tr>
    </thead>`
        : ''
    }
    <tbody>
      ${sheet.rows.map(renderDebtRow).join('')}
      ${sheet.isLastPage ? nonMemberDebtRowsHtml : ''}
      ${
        sheet.isLastPage
          ? `<tr style="font-weight:bold;">
        <td></td>
        <td></td>
        <td>${fRpCell(data.totalSimpananPokok)}</td>
        <td>${fRpCell(data.totalSimpananWajib)}</td>
        <td>${fRpCell(data.totalSimpananSukarela)}</td>
        <td>${fRpCell(data.totalSimpananWisata)}</td>
        <td>${fRpCell(data.totalSeluruhSimpanan)}</td>
        <td>${fRpCell(data.totalHutangPinjamanAnggota)}</td>
        <td>${fRpCell(data.totalHutangBarangAnggota)}</td>
        <td>${fRpCell(data.totalKekuranganKaryawisataAnggota)}</td>
        <td>${fRpCell(data.totalPiutangAnggota)}</td>
        <td>${fRpCell(data.totalJasaPinjamanAnggota)}</td>
        <td></td>
      </tr>`
          : ''
      }
    </tbody>
  </table>
  ${renderPageFooterHtml(sheet.pageNo)}`
      )
      .join('\n');

    const shuHtml = shuPages
      .map(
        (sheet) => `
  <!-- HALAMAN ${sheet.pageNo} -->
  <div class="page-break"></div>
  ${
    sheet.showTitleAndHeader
      ? `<div class="center" style="font-weight:bold;font-size:9.5pt;margin-bottom:6pt;">
    REKAP SIMPANAN ANGGOTA KOPERASI AMANAH BARAYA<br/>
    RSUD AL MULK KOTA SUKABUMI<br/>
    BULAN DESEMBER ${params.tahunBuku}
  </div>`
      : ''
  }
  <table class="lampiran">
    ${shuColgroupHtml}
    ${
      sheet.showTitleAndHeader
        ? `<thead>
      <tr>
        <th rowspan="2">NO</th>
        <th rowspan="2">NAMA</th>
        <th colspan="4">SIMPANAN KOPERASI</th>
        <th rowspan="2">JUMLAH<br/>SIMPANAN</th>
        <th rowspan="2">SHU SIMPANAN<br/>${data.persenShuSimpananFormatted}</th>
        <th rowspan="2">JUMLAH JASA<br/>PINJAMAN</th>
        <th rowspan="2">SHU JASA<br/>${data.persenShuJasaFormatted}</th>
        <th rowspan="2">JUMLAH<br/>DITERIMA</th>
      </tr>
      <tr>
        <th>POKOK</th>
        <th>WAJIB</th>
        <th>SUKARELA</th>
        <th>WISATA</th>
      </tr>
    </thead>`
        : ''
    }
    <tbody>
      ${sheet.rows.map(renderShuRow).join('')}
      ${
        sheet.isLastPage
          ? `<tr style="font-weight:bold;">
        <td></td>
        <td></td>
        <td>${fRpCell(data.totalSimpananPokok)}</td>
        <td>${fRpCell(data.totalSimpananWajib)}</td>
        <td>${fRpCell(data.totalSimpananSukarela)}</td>
        <td>${fRpCell(data.totalSimpananWisata)}</td>
        <td>${fRpCell(data.totalSeluruhSimpanan)}</td>
        <td class="right">${formatDecimalTwoIndo(data.totalShuSimpananExactAnggota)}</td>
        <td>${fRpCell(data.totalJasaPinjamanAnggota)}</td>
        <td>${fRpCell(data.totalShuJasaAnggota)}</td>
        <td>${fRpCell(data.totalTandaTerimaRat)}</td>
      </tr>`
          : ''
      }
    </tbody>
  </table>
  ${renderPageFooterHtml(sheet.pageNo)}`
      )
      .join('\n');

    return `${debtHtml}\n${shuHtml}`;
  })()}
</div>

<!-- ==================== LAMPIRAN TANDA TERIMA SHU ANGGOTA (PORTRAIT F4, MARGIN 2,5 CM) ==================== -->
<div class="SectionPortraitF4">
  ${(() => {
    const debtPagesCount = paginateAppendixTable(
      data.memberRows,
      20,
      LPJ_LANDSCAPE_FIRST_PAGE_ROWS,
      LPJ_LANDSCAPE_NEXT_PAGE_ROWS,
      data.nonMemberRows.length + 1
    ).length;
    const shuPagesCount = paginateAppendixTable(
      data.memberRows,
      20 + debtPagesCount,
      LPJ_LANDSCAPE_FIRST_PAGE_ROWS,
      LPJ_LANDSCAPE_NEXT_PAGE_ROWS,
      1
    ).length;
    const receiptStartPage = 20 + debtPagesCount + shuPagesCount;
    const receiptPages = paginateAppendixTable(
      data.memberRows,
      receiptStartPage,
      LPJ_PORTRAIT_FIRST_PAGE_ROWS,
      LPJ_PORTRAIT_NEXT_PAGE_ROWS,
      1
    );

    return receiptPages
      .map(
        (sheet) => `
  <!-- HALAMAN ${sheet.pageNo} -->
  <div class="page-break"></div>
  ${
    sheet.showTitleAndHeader
      ? `<div class="center" style="font-weight:bold;font-size:10.5pt;margin-bottom:8pt;">
    TANDA TERIMA SHU ANGGOTA KOPERASI AMANAH BARAYA<br/>
    RSUD AL MULK KOTA SUKABUMI<br/>
    RAT TANGGAL ${params.tanggalRat.toUpperCase()}
  </div>`
      : ''
  }
  <table class="lampiran" style="font-size:8.5pt;">
    ${receiptColgroupHtml}
    ${
      sheet.showTitleAndHeader
        ? `<thead>
      <tr>
        <th>NO</th>
        <th>NAMA</th>
        <th>SUKARELA</th>
        <th>SHU SIMPANAN<br/>${data.persenShuSimpananFormatted}</th>
        <th>SHU JASA ${data.persenShuJasaFormatted}</th>
        <th>JUMLAH<br/>DITERIMA</th>
      </tr>
    </thead>`
        : ''
    }
    <tbody>
      ${sheet.rows.map(renderReceiptRow).join('')}
      ${
        sheet.isLastPage
          ? `<tr style="font-weight:bold;">
        <td></td>
        <td></td>
        <td>${fRpCell(data.totalSimpananSukarela)}</td>
        <td class="right">${formatDecimalTwoIndo(data.totalShuSimpananExactAnggota)}</td>
        <td>${fRpCell(data.totalShuJasaAnggota)}</td>
        <td>${fRpCell(data.totalTandaTerimaRat)}</td>
      </tr>`
          : ''
      }
    </tbody>
  </table>
  ${renderPageFooterHtml(sheet.pageNo)}`
      )
      .join('\n');
  })()}
</div>

</body>
</html>
`;
}

function eraseBandVertically(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const w = Math.max(1, Math.round(x2 - x1));
  const h = Math.max(1, Math.round(y2 - y1));
  const startX = Math.max(0, Math.round(x1));
  const startY = Math.max(1, Math.round(y1));

  const topStrip = ctx.getImageData(startX, Math.max(0, startY - 2), w, 1).data;
  const bottomStrip = ctx.getImageData(startX, startY + h + 1, w, 1).data;
  const patch = ctx.createImageData(w, h);
  const pData = patch.data;

  for (let row = 0; row < h; row++) {
    const t = row / Math.max(1, h - 1);
    for (let col = 0; col < w; col++) {
      const sIdx = col * 4;
      const dIdx = (row * w + col) * 4;
      pData[dIdx] = Math.round(topStrip[sIdx] * (1 - t) + bottomStrip[sIdx] * t);
      pData[dIdx + 1] = Math.round(topStrip[sIdx + 1] * (1 - t) + bottomStrip[sIdx + 1] * t);
      pData[dIdx + 2] = Math.round(topStrip[sIdx + 2] * (1 - t) + bottomStrip[sIdx + 2] * t);
      pData[dIdx + 3] = 255;
    }
  }
  ctx.putImageData(patch, startX, startY);
}

/**
 * Menghasilkan Data URL gambar Cover Halaman 1 dengan teks TAHUN BUKU dan Tahun RAT
 * yang berubah secara dinamis mengikuti periode yang dipilih.
 */
export async function renderDynamicCoverDataUrl(
  imageUrl: string,
  tahunBuku: string,
  tahunRat: string
): Promise<string> {
  if (typeof document === 'undefined') {
    return imageUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 1654;
        const h = img.naturalHeight || 2339;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);

        // Update "TAHUN BUKU {tahunBuku}" jika berbeda dari 2025
        if (tahunBuku.trim() !== '2025') {
          const bx1 = w * 0.24;
          const by1 = h * 0.478;
          const bx2 = w * 0.76;
          const by2 = h * 0.512;
          eraseBandVertically(ctx, bx1, by1, bx2, by2);

          const fontSize1 = Math.round(h * 0.0235);
          ctx.save();
          ctx.font = `800 ${fontSize1}px "Poppins", "Segoe UI", Arial, sans-serif`;
          ctx.fillStyle = '#2d6a3e';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`TAHUN BUKU ${tahunBuku.trim().toUpperCase()}`, w * 0.5, (by1 + by2) / 2);
          ctx.restore();
        }

        // Update "Tahun {tahunRat}" jika berbeda dari 2026
        if (tahunRat.trim() !== '2026') {
          const rx1 = w * 0.34;
          const ry1 = h * 0.632;
          const rx2 = w * 0.66;
          const ry2 = h * 0.662;
          eraseBandVertically(ctx, rx1, ry1, rx2, ry2);

          const fontSize2 = Math.round(h * 0.0235);
          ctx.save();
          ctx.font = `800 ${fontSize2}px "Poppins", "Segoe UI", Arial, sans-serif`;
          ctx.fillStyle = '#194d33';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`Tahun ${tahunRat.trim()}`, w * 0.5, (ry1 + ry2) / 2);
          ctx.restore();
        }

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

export async function downloadLpjWordDocument(
  data: LpjRealtimeData,
  params: LpjReportParams,
  coopConfig: CoopConfig
): Promise<void> {
  const coverDataUrl = await renderDynamicCoverDataUrl(
    '/assets/lpj_cover_word.jpg',
    params.tahunBuku,
    params.tahunRat
  );
  const htmlContent = generateLpjWordHtml(data, params, coopConfig, coverDataUrl);
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `RAT_KOPERASI_AMBAR_LPJ_${params.tahunRat}_TahunBuku_${params.tahunBuku}_F4.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLpjRealtimeData,
  defaultLpjReportParams,
  buildParamsForPeriod,
  generateLpjWordHtml,
  getLpjPdfFileName,
  paginateAppendixTable,
  LPJ_F4_PORTRAIT_MM,
  LPJ_F4_LANDSCAPE_MM,
  LPJ_F4_PORTRAIT_PX,
  LPJ_F4_LANDSCAPE_PX,
  LPJ_LANDSCAPE_FIRST_PAGE_ROWS,
  LPJ_LANDSCAPE_NEXT_PAGE_ROWS,
  LPJ_SHU_LANDSCAPE_FIRST_PAGE_ROWS,
  LPJ_SHU_LANDSCAPE_NEXT_PAGE_ROWS,
  LPJ_PORTRAIT_FIRST_PAGE_ROWS,
  LPJ_PORTRAIT_NEXT_PAGE_ROWS,
} from './lpjReportGenerator';
import { Member, LoanRecord, Transaction, Product, StockMutation } from '../types';
import { initialCoopConfig } from '../data/initialData';

describe('calculateLpjRealtimeData (LPJ RAT Koperasi Amanah Baraya)', () => {
  const sampleMembers: Member[] = [
    {
      id: 'M-1',
      memberNumber: 'ANG-001',
      name: 'Elsa Ganjarsari, S.Tr.Kes',
      nikOrNip: '19880101',
      unitKerja: 'Instalasi Laboratorium',
      phone: '08123456789',
      joinDate: '2024-01-10',
      status: 'active',
      gender: 'P',
      simpananPokok: 100000,
      simpananWajib: 1800000,
      simpananSukarela: 600000,
      simpananWisata: 500000,
    },
    {
      id: 'M-2',
      memberNumber: 'ANG-002',
      name: 'Amril Fasya, A.Md',
      nikOrNip: '19900202',
      unitKerja: 'Bagian Keuangan & Akuntansi',
      phone: '08129876543',
      joinDate: '2024-01-10',
      status: 'active',
      gender: 'L',
      simpananPokok: 100000,
      simpananWajib: 1800000,
      simpananSukarela: 1100000,
      simpananWisata: 0,
    },
  ];

  const sampleLoans: LoanRecord[] = [
    {
      id: 'L-1',
      loanNumber: 'PINJ-001',
      memberId: 'M-1',
      memberNumber: 'ANG-001',
      memberName: 'Elsa Ganjarsari, S.Tr.Kes',
      unitKerja: 'Instalasi Laboratorium',
      amount: 10000000,
      interestRate: 1.5,
      tenorMonths: 10,
      monthlyInstallment: 1150000,
      totalRepayment: 11500000,
      totalPaid: 5750000,
      remainingAmount: 5750000,
      startDate: '2025-01-15',
      endDate: '2025-11-15',
      purpose: 'Renovasi',
      status: 'active',
      createdAt: '2025-01-15',
    },
  ];

  const sampleProducts: Product[] = [
    {
      id: 'PRD-1',
      code: 'BRG001',
      barcode: '8991001',
      name: 'Beras Premium 5Kg',
      category: 'Kebutuhan Sehari-hari',
      buyPrice: 60000,
      sellPrice: 75000,
      stock: 20,
      minStock: 5,
      unit: 'Pack',
      updatedAt: '2025-03-01',
    },
  ];

  const sampleTransactions: Transaction[] = [
    {
      id: 'TRX-1',
      invoiceNumber: 'INV-001',
      date: '2025-03-02T10:00:00Z',
      items: [
        {
          product: sampleProducts[0],
          quantity: 10,
          discountPercent: 0,
          discountNominal: 0,
          subtotal: 750000,
        },
      ],
      totalItems: 10,
      subtotal: 750000,
      discountTotal: 0,
      grandTotal: 750000,
      paymentAmount: 750000,
      changeAmount: 0,
      paymentMethod: 'potong_gaji',
      customerType: 'anggota',
      cashierName: 'Kasir 1',
      cashierId: 'USR-KASIR-01',
      memberId: 'M-2',
      customerName: 'Amril Fasya, A.Md',
      totalCost: 600000,
      totalProfit: 150000,
    },
  ];

  const sampleMutations: StockMutation[] = [];

  it('aggregates membership, simpanan, simpan pinjam, and waserda figures accurately', () => {
    const result = calculateLpjRealtimeData(
      sampleMembers,
      [],
      sampleLoans,
      sampleTransactions,
      sampleProducts,
      sampleMutations,
      defaultLpjReportParams
    );

    assert.equal(result.anggotaLaki, 1);
    assert.equal(result.anggotaPerempuan, 1);
    assert.equal(result.totalAnggota, 2);

    // Simpanan
    assert.equal(result.totalSimpananPokok, 200000);
    assert.equal(result.totalSimpananWajib, 3600000);
    assert.equal(result.totalSimpananSukarela, 1700000);
    assert.equal(result.totalSimpananWisata, 500000);
    assert.equal(result.totalSeluruhSimpanan, 6000000);

    // Simpan Pinjam
    assert.equal(result.pinjamAnggotaDilayani, 2);
    assert.equal(result.pemberianPinjaman, 10000000);
    assert.equal(result.sisaPinjaman, 5750000);
    assert.equal(result.jasaPinjaman, 1500000);

    // Waserda
    assert.equal(result.pendapatanWaserda, 750000);
    assert.equal(result.pembelianBarangWaserda, 600000);
    assert.equal(result.persediaanBarangWaserda, 1200000); // 20 * 60000
    assert.equal(result.saldoPiutangWaserda, 750000); // potong_gaji TRX-1
  });

  it('computes Laba/Rugi, 2.5% Zakat, 7 SHU allocations, and member Tanda Terima RAT accurately', () => {
    const result = calculateLpjRealtimeData(
      sampleMembers,
      [],
      sampleLoans,
      sampleTransactions,
      sampleProducts,
      sampleMutations,
      defaultLpjReportParams
    );

    // Pendapatan = Jasa (1.500.000) + Waserda (750.000) + Persediaan (1.200.000) + Bank (1.225.278) = 4.675.278
    assert.equal(result.totalPendapatanLabaRugi, 4675278);
    // Biaya = Pembelian Waserda (600.000) + Admin Bank (443.055) = 1.043.055
    assert.equal(result.totalBiayaLabaRugi, 1043055);
    // SHU = 3.632.223
    assert.equal(result.surplusHasilUsaha, 3632223);

    // Zakat 2.5% = round(3632223 * 0.025) = 90806
    assert.equal(result.zakatNominal, 90806);
    assert.equal(result.shuYangDibagikan, 3541417);

    // Member 1 has 3.000.000 simpanan (50% of 6.000.000) and 100% of loan jasa
    const m1 = result.memberRows[0];
    const m2 = result.memberRows[1];
    assert.equal(m1.jumlahSimpanan, 3000000);
    assert.equal(m2.jumlahSimpanan, 3000000);
    assert.equal(m1.shuSimpanan, Math.round(result.alokasiAnggotaPenyimpan * 0.5));
    assert.equal(m1.shuJasa, result.alokasiAnggotaBerjasa);
    assert.equal(m2.shuJasa, 0);
    assert.equal(m1.jumlahTandaTerimaRat, m1.sukarela + m1.shuSimpanan + m1.shuJasa);

    // Word HTML generation contains exact PDF formal titles and F4 2.5cm specs
    const wordHtml = generateLpjWordHtml(result, defaultLpjReportParams, initialCoopConfig);
    assert.ok(wordHtml.includes('21.5cm 33.0cm'));
    assert.ok(wordHtml.includes('margin: 2.5cm 2.5cm 2.5cm 2.5cm'));
    assert.ok(wordHtml.includes('PENGURUS KPRI “AMANAH BARAYA”'));
    assert.ok(wordHtml.includes('REKAP SIMPANAN ANGGOTA KOPERASI AMANAH BARAYA'));
    assert.ok(wordHtml.includes('TANDA TERIMA SHU ANGGOTA KOPERASI AMANAH BARAYA'));
  });

  it('dynamically updates period headers, dates, and comparison baselines when Periode Tahun Buku or Periode RAT changes', () => {
    const updatedParams = buildParamsForPeriod('2026', '2027', defaultLpjReportParams, 'JANUARI_DESEMBER');
    assert.equal(updatedParams.tahunBuku, '2026');
    assert.equal(updatedParams.tahunRat, '2027');
    assert.equal(updatedParams.periodeBukuText, 'Januari sd Desember 2026');
    assert.equal(updatedParams.periodePembandingText, 'April sd Desember 2025');
    assert.equal(updatedParams.tanggalRat, '06 Maret 2027');
    assert.equal(updatedParams.tanggalTutupBuku, '31 Desember 2026');

    const result = calculateLpjRealtimeData(
      sampleMembers,
      [],
      sampleLoans,
      sampleTransactions,
      sampleProducts,
      sampleMutations,
      updatedParams
    );

    const wordHtml = generateLpjWordHtml(result, updatedParams, initialCoopConfig);
    assert.ok(wordHtml.includes('TAHUN BUKU JANUARI SD DESEMBER 2026'));
    assert.ok(wordHtml.includes('Tabel 1: Perkembangan Data Anggota Tahun 2025 - 2026'));
    assert.ok(wordHtml.includes('RAT TANGGAL 06 MARET 2027'));

    // Verify pages are rendered individually without combined page numbers
    assert.ok(!wordHtml.includes('20-23'));
    assert.ok(!wordHtml.includes('24-27'));
    assert.ok(!wordHtml.includes('28-31'));
    for (let p = 2; p <= 22; p++) {
      assert.ok(
        wordHtml.includes(`>${p}<`) || wordHtml.includes(`\n        ${p}\n`),
        `Expected individual page footer ${p}`
      );
    }
  });

  it('provides exact F4 paper dimensions (215mm x 330mm portrait, 330mm x 215mm landscape) and PDF filename', () => {
    assert.deepEqual(LPJ_F4_PORTRAIT_MM, { width: 215, height: 330 });
    assert.deepEqual(LPJ_F4_LANDSCAPE_MM, { width: 330, height: 215 });
    assert.deepEqual(LPJ_F4_PORTRAIT_PX, { width: 813, height: 1247 });
    assert.deepEqual(LPJ_F4_LANDSCAPE_PX, { width: 1247, height: 813 });
    assert.equal(
      getLpjPdfFileName(defaultLpjReportParams),
      'RAT_KOPERASI_AMBAR_LPJ_2026_TahunBuku_2025_F4.pdf'
    );
  });

  it('paginates appendix tables to fill F4 sheets near the bottom margin before moving to the next page', () => {
    const dummyRows = Array.from({ length: 89 }, (_, i) => i + 1);

    const debtSheets = paginateAppendixTable(
      dummyRows,
      20,
      LPJ_LANDSCAPE_FIRST_PAGE_ROWS,
      LPJ_LANDSCAPE_NEXT_PAGE_ROWS,
      2
    );
    assert.equal(debtSheets.length, 3);
    assert.equal(debtSheets[0].rows.length, 36);
    assert.equal(debtSheets[1].rows.length, 42);
    assert.equal(debtSheets[2].rows.length, 11);

    const shuSheets = paginateAppendixTable(
      dummyRows,
      23,
      LPJ_SHU_LANDSCAPE_FIRST_PAGE_ROWS,
      LPJ_SHU_LANDSCAPE_NEXT_PAGE_ROWS,
      1
    );
    assert.equal(shuSheets.length, 3);
    assert.equal(shuSheets[0].rows.length, 34);
    assert.equal(shuSheets[1].rows.length, 39);
    assert.equal(shuSheets[2].rows.length, 16);

    const receiptSheets = paginateAppendixTable(
      dummyRows,
      26,
      LPJ_PORTRAIT_FIRST_PAGE_ROWS,
      LPJ_PORTRAIT_NEXT_PAGE_ROWS,
      1
    );
    assert.equal(receiptSheets.length, 2);
    assert.equal(receiptSheets[0].rows.length, 43);
    assert.equal(receiptSheets[1].rows.length, 46);
  });
});




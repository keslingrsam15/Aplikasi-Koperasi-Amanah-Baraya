import { Product, UserProfile, Transaction, StockMutation, CoopConfig, Member, SavingsRecord, LoanRecord } from '../types';

export const initialUnitKerjaList = [
  'Ruang Rawat Inap Melati',
  'Ruang Rawat Inap Dahlia',
  'Ruang Rawat Inap Anggrek',
  'Instalasi Gawat Darurat (IGD)',
  'Intensive Care Unit (ICU)',
  'Kamar Operasi (OK / Bedah)',
  'Instalasi Farmasi & Apotek',
  'Instalasi Laboratorium',
  'Instalasi Radiologi',
  'Poliklinik Penyakit Dalam',
  'Poliklinik Anak',
  'Poliklinik Bedah',
  'Poliklinik Gigi & Mulut',
  'Poliklinik Kebidanan & Kandungan (Obgyn)',
  'Sanitasi & Kesehatan Lingkungan (Kesling)',
  'Instalasi Gizi & Dapur',
  'Tata Usaha & Kepegawaian (SDM)',
  'Bagian Keuangan & Akuntansi',
  'Rekam Medis (Medical Record)',
  'Sistem Informasi RS (SIMRS / IT)',
  'Instalasi Pemeliharaan Sarana (IPSRS)',
  'Keamanan & Pengemudi Ambulans',
];

export const initialCoopConfig: CoopConfig = {
  name: 'KOPERASI AMANAH BARAYA',
  subtitle: 'Unit Pertokoan & Kasir Terpadu',
  hospitalName: 'RSUD AL-MULK KOTA SUKABUMI',
  address: 'Jl. Pelabuhan II KM. 6, Lembursitu, Kota Sukabumi',
  city: 'Kota Sukabumi, Jawa Barat 43168',
  phone: '(0266) 6243088 / 0812-3456-7890',
  receiptFooter: 'Terima kasih atas kunjungan & partisipasi Anda.\nBarang yang sudah dibeli dapat ditukar dengan struk.',
  paperWidth: '58mm',
  taxPercent: 0,
  printerConfig: {
    connectionType: 'browser',
    paperWidth: '58mm',
    autoPrintOnPayment: true,
    printCopies: 1,
    showLogoOrKop: true,
    showBarcodeOnReceipt: true,
    charPerLine: 32,
  },
  showBannerSlider: true,
  bannerAutoPlayInterval: 5,
  shuConfig: {
    jasaModalPercent: 40,
    jasaUsahaPercent: 30,
    danaCadanganPercent: 20,
    danaPengurusPercent: 10,
    biayaOperasionalKoperasi: 0,
  },
  bannerSlides: [
    {
      id: 'slide-1',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      title: 'Layanan Kasir & Pertokoan Terpadu',
      subtitle: 'Koperasi Amanah Baraya RSUD Al-Mulk melayani kebutuhan harian seluruh karyawan & pasien.',
      badge: 'KOPERASI AMANAH BARAYA',
      linkTab: 'pos',
      linkText: 'Mulai Transaksi Kasir',
      isActive: true,
    },
    {
      id: 'slide-2',
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
      title: 'Diskon & Potong Gaji Anggota Koperasi',
      subtitle: 'Kemudahan belanja kebutuhan pokok dengan fasilitas potongan payroll otomatis setiap bulan.',
      badge: 'PROGRAM ANGGOTA RSUD',
      linkTab: 'products',
      linkText: 'Lihat Katalog Produk',
      isActive: true,
    },
    {
      id: 'slide-3',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
      title: 'Warkop & Aneka Minuman Segar',
      subtitle: 'Nikmati kopi seduh, aneka snack, dan hidangan warkop koperasi dengan harga bersahabat.',
      badge: 'UNIT WARKOP KOPERASI',
      linkTab: 'pos',
      linkText: 'Pesan Minuman & Snack',
      isActive: true,
    },
  ],
};

export const initialUsers: UserProfile[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Kepala Toko',
    role: 'admin',
    avatarColor: 'bg-blue-600',
    nipOrNik: '',
    shift: 'Akses Penuh Sistem',
  },
];

export const initialCategories = [
  'Semua Kategori',
  'Kopi & Minuman Warkop',
  'Jajanan Warung',
  'Makanan Ringan',
  'Minuman',
  'Kesehatan & Medis',
  'Perlengkapan Pasien',
  'Perlengkapan Mandi',
  'Alat Tulis Kantor',
  'Kebutuhan Sehari-hari',
];

export const initialUnits = [
  'Pcs',
  'Botol',
  'Kotak',
  'Bungkus',
  'Sachet',
  'Strip',
  'Pack',
  'Kaleng',
  'Pasang',
  'Buku',
  'Set',
  'Gelas',
  'Cup',
  'Butir',
  'Porsi',
];

// Data produk kosong (tanpa data dummy/default)
export const initialProducts: Product[] = [];

// Riwayat mutasi stok kosong (tanpa data dummy/default)
export const initialMutations: StockMutation[] = [];

// Riwayat transaksi penjualan kasir kosong (tanpa data dummy/default)
export const initialTransactions: Transaction[] = [];

// Initial Members list (empty default)
export const initialMembers: Member[] = [];

// Initial Savings records (empty default)
export const initialSavings: SavingsRecord[] = [];

// Initial Loans list (empty default)
export const initialLoans: LoanRecord[] = [];


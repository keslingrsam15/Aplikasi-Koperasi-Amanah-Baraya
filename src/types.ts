export type UserRole = 'admin' | 'kasir' | 'pengurus' | 'gudang';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarColor: string;
  nipOrNik?: string;
  shift?: string;
  phone?: string;
  permissions?: string[]; // Daftar hak akses aktif
}

export interface Product {
  id: string;
  code: string; // e.g. 'BRG00001'
  barcode: string; // e.g. 'BRG00001' or EAN13
  name: string;
  category: string;
  buyPrice: number; // Harga Beli
  sellPrice: number; // Harga Jual
  stock: number;
  minStock: number;
  unit: string; // Pcs, Botol, Kotak, Bungkus, Sachet, Strip, Pack, etc.
  updatedAt: string;
  imageUrl?: string; // Image base64 data URL or URL
  supplier?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
  discountNominal: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'potong_gaji';
export type CustomerType = 'umum' | 'anggota' | 'karyawan_rsud' | 'pasien';

export interface Transaction {
  id: string;
  invoiceNumber: string; // e.g. TRX-20260828-0001
  date: string; // ISO string
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  customerType: CustomerType;
  customerName?: string;
  memberId?: string;
  memberNumber?: string;
  cashierName: string;
  cashierId: string;
  notes?: string;
  totalCost: number; // Total HPP
  totalProfit: number; // Keuntungan kotor
}

export type MutationType = 'in' | 'out' | 'adjustment';

export interface StockMutation {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: MutationType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  operator: string;
  referenceNumber?: string;
  costPrice?: number;
}

export interface HeldCart {
  id: string;
  label: string;
  customerType: CustomerType;
  customerName: string;
  items: CartItem[];
  createdAt: string;
}

/* ==========================================================================
   DATA ANGGOTA & SIMPAN PINJAM TYPES
   ========================================================================== */

export interface Member {
  id: string;
  memberNumber: string; // e.g. 'ANG-001'
  name: string;
  nikOrNip?: string;
  unitKerja: string; // e.g. 'Ruang Melati', 'IGD', 'Farmasi'
  phone?: string;
  email?: string;
  joinDate: string; // YYYY-MM-DD
  status: 'active' | 'inactive';
  simpananPokok: number;
  simpananWajib: number;
  simpananSukarela: number;
  address?: string;
  notes?: string;
  updatedAt?: string;
}

export type SavingsType = 'pokok' | 'wajib' | 'sukarela';
export type SavingsTransactionType = 'setor' | 'tarik';

export interface SavingsRecord {
  id: string;
  memberId: string;
  memberNumber: string;
  memberName: string;
  type: SavingsType;
  transactionType: SavingsTransactionType;
  amount: number;
  date: string; // ISO string
  notes?: string;
  operator: string;
  receiptNumber?: string;
}

export type LoanStatus = 'pending' | 'active' | 'paid' | 'rejected';

export interface LoanInstallment {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  principalAmount: number;
  interestAmount: number;
  paidDate?: string;
  paidAmount?: number;
  status: 'unpaid' | 'paid' | 'late';
  receiptNumber?: string;
  operator?: string;
}

export interface LoanRecord {
  id: string;
  loanNumber: string; // e.g. 'PINJ-202609-001'
  memberId: string;
  memberNumber: string;
  memberName: string;
  unitKerja: string;
  amount: number; // Pokok pinjaman
  interestRate: number; // Bunga % per bulan (e.g. 1.0)
  tenorMonths: number; // 6, 10, 12, 24 bulan
  monthlyInstallment: number; // Angsuran per bulan (pokok + bunga)
  totalRepayment: number; // Total harus dibayar
  totalPaid: number; // Total sudah dibayar
  remainingAmount: number; // Sisa pinjaman
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  purpose: string; // Keperluan pinjaman
  status: LoanStatus;
  installments?: LoanInstallment[];
  approvedBy?: string;
  approvedDate?: string;
  createdAt: string;
}

export interface ShuConfig {
  jasaModalPercent: number; // Default 40% (Jasa Simpanan)
  jasaUsahaPercent: number; // Default 30% (Jasa Transaksi Belanja)
  danaCadanganPercent: number; // Default 20%
  danaPengurusPercent: number; // Default 10%
  biayaOperasionalKoperasi: number; // Pengurang laba kotor
}

export interface PrinterConfig {
  connectionType: 'browser' | 'bluetooth' | 'rawbt';
  paperWidth: '58mm' | '80mm';
  autoPrintOnPayment: boolean;
  printCopies: number;
  showLogoOrKop: boolean;
  showBarcodeOnReceipt: boolean;
  bluetoothDeviceName?: string;
  bluetoothDeviceId?: string;
  charPerLine: number; // 32 for 58mm, 48 for 80mm
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  linkTab?: string; // e.g. 'pos' | 'products' | 'stock' | 'reports' | 'coop'
  linkText?: string;
  isActive: boolean;
}

export interface CoopConfig {
  name: string;
  subtitle: string;
  hospitalName: string;
  address: string;
  city: string;
  phone: string;
  receiptFooter: string;
  paperWidth: '58mm' | '80mm';
  taxPercent: number;
  logoUrl?: string; // URL / Base64 logo koperasi
  printerConfig?: PrinterConfig;
  bannerSlides?: BannerSlide[];
  showBannerSlider?: boolean;
  bannerAutoPlayInterval?: number; // In seconds, default 5
  shuConfig?: ShuConfig;
}


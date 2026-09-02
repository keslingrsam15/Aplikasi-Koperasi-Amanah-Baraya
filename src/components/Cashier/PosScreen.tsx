import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, Transaction, CustomerType, PaymentMethod, HeldCart, CoopConfig, UserProfile, Member } from '../../types';
import { formatRupiah, playScanSound, playSuccessSound, playErrorSound, generateInvoiceNumber } from '../../utils/formatters';
import { CameraScannerModal } from '../Scanner/CameraScannerModal';
import { ReceiptModal } from './ReceiptModal';
import confetti from 'canvas-confetti';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Camera,
  ShoppingBag,
  CreditCard,
  User,
  Clock,
  PauseCircle,
  PlayCircle,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Image as ImageIcon,
  Package,
} from 'lucide-react';

interface PosScreenProps {
  products: Product[];
  currentUser: UserProfile;
  coopConfig: CoopConfig;
  members?: Member[];
  onUpdateProductStock?: (productId: string, quantitySold: number) => void;
  onSaveTransaction: (transaction: Transaction) => void;
  transactionsTodayCount?: number;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  products,
  currentUser,
  coopConfig,
  members = [],
  onUpdateProductStock,
  onSaveTransaction,
  transactionsTodayCount = 0,
}) => {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerType, setCustomerType] = useState<CustomerType>('umum');
  const [customerName, setCustomerName] = useState<string>('');
  const [memberNumber, setMemberNumber] = useState<string>('');

  // Barcode scanner input state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Scanner Modal & Receipt Modal states
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState<Transaction | null>(null);

  // Quick Notification Toast when item scanned
  const [scanNotification, setScanNotification] = useState<{
    product: Product;
    time: number;
  } | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Held Carts (Antrian Transaksi)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Auto focus barcode input on mount and after actions
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Categories list
  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered products for visual grid
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const itemDiscountTotal = cart.reduce(
    (sum, item) => sum + item.discountNominal * item.quantity,
    0
  );
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const orderDiscountAmount = Math.round((subtotal * orderDiscountPercent) / 100);
  const totalDiscount = itemDiscountTotal + orderDiscountAmount;
  const grandTotal = Math.max(0, subtotal - orderDiscountAmount);

  // Payment calculation
  const paymentAmount = parseFloat(paymentAmountInput) || 0;
  const changeAmount = Math.max(0, paymentAmount - grandTotal);
  const isPaymentValid = paymentMethod === 'cash' ? paymentAmount >= grandTotal : grandTotal > 0;

  // Add or update item in cart by Product
  const handleAddToCart = (product: Product, quantityToAdd = 1) => {
    if (product.stock <= 0) {
      playErrorSound();
      alert(`Stok untuk "${product.name}" saat ini habis (0 ${product.unit}).`);
      return;
    }

    playScanSound();

    // Show instant prompt highlight toast
    setScanNotification({ product, time: Date.now() });
    setTimeout(() => {
      setScanNotification((prev) => (prev?.product.id === product.id ? null : prev));
    }, 4000);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const existing = prevCart[existingIndex];
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.stock) {
          alert(`Peringatan: Jumlah (${newQty}) melebihi stok tersedia (${product.stock} ${product.unit}).`);
        }
        const unitPrice = product.sellPrice;
        const discountNom = (unitPrice * existing.discountPercent) / 100;
        const newSubtotal = (unitPrice - discountNom) * newQty;

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newSubtotal,
        };
        return updated;
      } else {
        const unitPrice = product.sellPrice;
        return [
          ...prevCart,
          {
            product,
            quantity: quantityToAdd,
            discountPercent: 0,
            discountNominal: 0,
            subtotal: unitPrice * quantityToAdd,
          },
        ];
      }
    });

    // Re-focus barcode input
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // Barcode scanned / entered
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Lookup by barcode or code (case-insensitive)
    const foundProduct = products.find(
      (p) =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.code.toLowerCase() === code.toLowerCase()
    );

    if (foundProduct) {
      handleAddToCart(foundProduct, 1);
      setBarcodeInput('');
    } else {
      playErrorSound();
      alert(`Barang dengan Barcode / Kode "${code}" tidak ditemukan dalam Master Barang.`);
    }
  };

  // Camera scan callback
  const handleCameraScanSuccess = (code: string) => {
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.code.toLowerCase() === code.toLowerCase()
    );
    if (found) {
      handleAddToCart(found, 1);
    } else {
      playErrorSound();
      alert(`Barang dengan Barcode "${code}" tidak ditemukan.`);
    }
  };

  // Quantity modification
  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unitPrice = item.product.sellPrice;
          const discountNom = (unitPrice * item.discountPercent) / 100;
          return {
            ...item,
            quantity: newQty,
            subtotal: (unitPrice - discountNom) * newQty,
          };
        }
        return item;
      })
    );
  };

  // Discount percentage modification per item
  const handleItemDiscountChange = (productId: string, percent: number) => {
    const validPercent = Math.max(0, Math.min(100, percent));
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unitPrice = item.product.sellPrice;
          const discountNom = (unitPrice * validPercent) / 100;
          return {
            ...item,
            discountPercent: validPercent,
            discountNominal: discountNom,
            subtotal: (unitPrice - discountNom) * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan keranjang transaksi saat ini?')) {
      setCart([]);
      setOrderDiscountPercent(0);
      setCustomerName('');
      setMemberNumber('');
    }
  };

  // Hold / Simpan Antrian Cart
  const handleHoldCart = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong, tidak ada transaksi untuk disimpan.');
      return;
    }
    const label = customerName
      ? `Antrian: ${customerName}`
      : `Antrian #${heldCarts.length + 1} (${totalItemCount} item)`;

    const newHeld: HeldCart = {
      id: `HOLD-${Date.now()}`,
      label,
      customerType,
      customerName,
      items: [...cart],
      createdAt: new Date().toISOString(),
    };

    setHeldCarts((prev) => [...prev, newHeld]);
    setCart([]);
    setCustomerName('');
    setMemberNumber('');
    setOrderDiscountPercent(0);
    alert(`Transaksi berhasil disimpan ke antrian: "${label}".`);
  };

  // Restore Held Cart
  const handleResumeCart = (heldId: string) => {
    const target = heldCarts.find((h) => h.id === heldId);
    if (!target) return;

    if (cart.length > 0) {
      if (!window.confirm('Ada transaksi aktif di kasir. Timpa dengan antrian yang dipilih?')) {
        return;
      }
    }

    setCart(target.items);
    setCustomerType(target.customerType);
    setCustomerName(target.customerName);
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
  };

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong.');
      return;
    }
    setPaymentAmountInput(grandTotal.toString());
    setIsPaymentOpen(true);
  };

  // Quick cash quick buttons (Uang Pas, 10k, 20k, 50k, 100k, 200k, 500k)
  const setQuickCash = (amount: number) => {
    setPaymentAmountInput(amount.toString());
  };

  // Finalize Transaction
  const handleFinalizeTransaction = () => {
    if (!isPaymentValid) {
      alert('Jumlah pembayaran kurang dari Total Belanja!');
      return;
    }

    const invoiceNum = generateInvoiceNumber(transactionsTodayCount);
    const totalHPP = cart.reduce(
      (sum, item) => sum + item.product.buyPrice * item.quantity,
      0
    );
    const profit = grandTotal - totalHPP;

    const newTrx: Transaction = {
      id: `TRX-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: new Date().toISOString(),
      items: [...cart],
      totalItems: totalItemCount,
      subtotal,
      discountTotal: totalDiscount,
      grandTotal,
      paymentAmount: paymentMethod === 'cash' ? paymentAmount : grandTotal,
      changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
      paymentMethod,
      customerType,
      customerName: customerName || undefined,
      memberNumber: memberNumber || undefined,
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      notes: paymentNotes || undefined,
      totalCost: totalHPP,
      totalProfit: profit,
    };

    // Deduct stock for each product if callback provided
    if (onUpdateProductStock) {
      cart.forEach((item) => {
        onUpdateProductStock(item.product.id, item.quantity);
      });
    }

    // Save transaction
    onSaveTransaction(newTrx);
    setLastCompletedTransaction(newTrx);

    // Audio & Visual celebratory effect
    playSuccessSound();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    // Close payment modal & open receipt
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);

    // Reset current active cart
    setCart([]);
    setOrderDiscountPercent(0);
    setPaymentNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Antrian Transaksi (Held Carts) if any */}
      {heldCarts.length > 0 && (
        <div className="bg-white p-3 rounded-2xl border-2 border-amber-300 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1 shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Antrian Tersimpan ({heldCarts.length}):</span>
            </span>
            {heldCarts.map((h) => (
              <button
                key={h.id}
                onClick={() => handleResumeCart(h.id)}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black rounded-xl text-xs border border-amber-300 transition flex items-center gap-1.5 shrink-0 shadow-xs"
                title="Buka kembali antrian ini"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-800" />
                <span>{h.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Split: Left Product Catalog + Right Cart Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Visual Catalog & Quick Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md space-y-3">
            {/* Search and Category Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama barang atau kode produk..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-950 placeholder:text-slate-600 outline-none"
                />
              </div>
              <div className="text-xs text-slate-900 font-bold whitespace-nowrap self-center">
                Ditemukan: <span className="font-black text-slate-950">{filteredProducts.length}</span> barang
              </div>
            </div>

            {/* Category scroll bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 text-xs emerald-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
                    selectedCategory === cat
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                      : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-600 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Package className="w-12 h-12 mx-auto text-slate-400 stroke-1" />
                <p className="font-black text-slate-950 text-sm">
                  Tidak ada barang yang ditemukan
                </p>
                <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto">
                  Belum ada produk di kategori ini atau hasil pencarian tidak cocok. Tambahkan produk baru di menu Master Barang.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1.5 emerald-scrollbar">
                {filteredProducts.map((prod) => {
                  const inCart = cart.find((c) => c.product.id === prod.id);
                  const isLowStock = prod.stock <= prod.minStock;
                  const isOutOfStock = prod.stock <= 0;

                  return (
                    <div
                      key={prod.id}
                      id={`pos-product-card-${prod.code}`}
                      onClick={() => !isOutOfStock && handleAddToCart(prod, 1)}
                      className={`relative p-3 rounded-2xl transition-all duration-200 flex flex-col justify-between cursor-pointer group border ${
                        isOutOfStock
                          ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                          : inCart
                          ? 'bg-emerald-50/50 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-white border-slate-200/90 hover:border-emerald-500/60 hover:shadow-xl'
                      }`}
                    >
                      <div>
                        {/* Premium Cafe-style Product Image Box */}
                        <div className="relative w-full h-36 sm:h-44 mb-3 rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/40 to-slate-100/70 border border-slate-200/60 flex items-center justify-center p-2 group-hover:bg-slate-100/80 transition-colors shadow-inner">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                              <ImageIcon className="w-10 h-10 stroke-1" />
                              <span className="text-[10px] font-bold text-slate-400">Tidak Ada Foto</span>
                            </div>
                          )}

                          {/* Top Right Floating Stock Badge */}
                          <span
                            className={`absolute top-2 right-2 text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${
                              isOutOfStock
                                ? 'bg-rose-100/95 text-rose-950 border-rose-300'
                                : isLowStock
                                ? 'bg-amber-100/95 text-amber-950 border-amber-300'
                                : 'bg-emerald-100/95 text-emerald-950 border-emerald-300'
                            }`}
                          >
                            {isOutOfStock ? 'Habis' : `Stok: ${prod.stock}`}
                          </span>
                        </div>

                        {/* Product Header: Name on Left, Price on Right (Aligned) */}
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1">
                          <h4 className="font-bold text-[11px] sm:text-xs md:text-sm text-slate-900 leading-snug line-clamp-2 flex-1 min-w-0 break-words group-hover:text-emerald-800 transition-colors">
                            {prod.name}
                          </h4>
                          <span className="font-black text-[11px] sm:text-xs md:text-sm text-emerald-700 shrink-0 text-right tracking-tight">
                            {formatRupiah(prod.sellPrice)}
                          </span>
                        </div>

                        {/* Category & Unit */}
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 truncate">
                          {prod.category} &bull; {prod.unit}
                        </p>
                      </div>

                      {/* Centered Rounded "Beli" Button */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) handleAddToCart(prod, 1);
                          }}
                          disabled={isOutOfStock}
                          className={`w-full py-2 px-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 active:scale-95 border border-emerald-600'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Beli</span>
                          {inCart && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                              {inCart.quantity}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Cart & Checkout Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md flex flex-col justify-between min-h-[580px]">
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-950">
                      Keranjang Transaksi
                    </h3>
                    <p className="text-xs font-bold text-slate-800">
                      Kasir: <span className="font-black text-slate-950">{currentUser.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black px-2.5 py-1 bg-slate-200 rounded-lg text-slate-950 border border-slate-300">
                    {totalItemCount} item
                  </span>
                  {cart.length > 0 && (
                    <button
                      id="btn-clear-cart"
                      onClick={handleClearCart}
                      className="p-1 text-rose-700 hover:text-rose-900 transition"
                      title="Kosongkan Keranjang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Type / Member Selection */}
              <div className="py-2.5 border-b border-slate-200 grid grid-cols-4 gap-1.5 text-xs">
                {(
                  [
                    { id: 'umum', label: 'Umum' },
                    { id: 'anggota', label: 'Anggota Kop' },
                    { id: 'karyawan_rsud', label: 'Karyawan RS' },
                    { id: 'pasien', label: 'Pasien' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCustomerType(c.id)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold text-center transition truncate border ${
                      customerType === c.id
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                        : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Customer Name or Member ID (Optional) */}
              <div className="py-2 flex items-center space-x-2">
                <input
                  type="text"
                  list={customerType === 'anggota' ? 'members-datalist' : undefined}
                  placeholder={
                    customerType === 'anggota'
                      ? 'Ketik / Pilih Anggota Koperasi (No. Anggota / Nama)...'
                      : customerType === 'karyawan_rsud'
                      ? 'Nama Pegawai / Unit RSUD (Opsional)'
                      : 'Nama Pelanggan (Opsional)'
                  }
                  value={customerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerName(val);
                    if (customerType === 'anggota' && members.length > 0) {
                      const matched = members.find(
                        (m) =>
                          m.memberNumber.toLowerCase() === val.toLowerCase() ||
                          `${m.memberNumber} - ${m.name}`.toLowerCase() === val.toLowerCase() ||
                          m.name.toLowerCase() === val.toLowerCase()
                      );
                      if (matched) {
                        setMemberNumber(matched.memberNumber);
                        setCustomerName(matched.name);
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-600 outline-none"
                />

                {customerType === 'anggota' && (
                  <datalist id="members-datalist">
                    {members.map((m) => (
                      <option key={m.id} value={`${m.memberNumber} - ${m.name}`}>
                        {m.unitKerja} (Simpanan: {formatRupiah(m.simpananPokok + m.simpananWajib + m.simpananSukarela)})
                      </option>
                    ))}
                  </datalist>
                )}
              </div>

              {/* Cart Items List */}
              <div className="max-h-[250px] overflow-y-auto space-y-2 py-2 pr-1.5 emerald-scrollbar">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-800 space-y-2">
                    <Barcode className="w-10 h-10 mx-auto text-slate-400 animate-pulse" />
                    <p className="text-xs font-black text-slate-950">
                      Keranjang masih kosong
                    </p>
                    <p className="text-[11px] font-bold text-slate-700">
                      Scan barcode barang atau klik produk dari katalog sebelah kiri
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 bg-slate-50 rounded-xl border-2 border-slate-200 flex items-center justify-between gap-2"
                    >
                      {/* Product Image Thumbnail */}
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-xl object-contain border border-slate-300 shrink-0 bg-white p-0.5"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-6 h-6 stroke-1" />
                        </div>
                      )}

                      {/* Product details */}
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-xs sm:text-sm text-slate-950 truncate">
                          {item.product.name}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-800">
                          <span className="font-mono text-slate-950 font-black">
                            {item.product.barcode}
                          </span>
                          <span>&bull;</span>
                          <span>{formatRupiah(item.product.sellPrice)}</span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 border border-slate-400 text-slate-950 flex items-center justify-center hover:bg-slate-300 active:scale-95 font-black"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.product.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-10 py-1 bg-white border-2 border-slate-400 rounded-lg text-xs font-black text-center text-slate-950 outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 border border-slate-400 text-slate-950 flex items-center justify-center hover:bg-slate-300 active:scale-95 font-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right min-w-[75px]">
                        <div className="font-black text-xs sm:text-sm text-slate-950">
                          {formatRupiah(item.subtotal)}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-[10px] font-bold text-rose-700 hover:text-rose-950 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer & Checkout Button */}
            <div className="pt-3 border-t-2 border-slate-200 space-y-3">
              {/* Hold Cart button action */}
              {cart.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleHoldCart}
                    className="w-full py-1.5 px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border border-amber-300 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                  >
                    <PauseCircle className="w-3.5 h-3.5 text-amber-800" />
                    <span>Simpan Antrian (Hold)</span>
                  </button>
                </div>
              )}

              {/* Order discount percentage */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Diskon Transaksi (%):</span>
                <div className="flex items-center space-x-1">
                  {[0, 5, 10].map((disc) => (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => setOrderDiscountPercent(disc)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        orderDiscountPercent === disc
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-slate-100 text-slate-950 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {disc}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={orderDiscountPercent}
                    onChange={(e) => setOrderDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-12 px-1.5 py-0.5 bg-white border-2 border-slate-300 rounded text-center text-xs font-black text-slate-950 outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-850">
                  <span className="text-slate-800">Subtotal:</span>
                  <span className="font-black text-slate-950">{formatRupiah(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between font-bold text-rose-800">
                    <span>Total Diskon:</span>
                    <span className="font-black">-{formatRupiah(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-300">
                  <span className="font-black text-sm sm:text-base text-slate-950">
                    TOTAL AKHIR:
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-950">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="btn-pos-checkout"
                disabled={cart.length === 0}
                onClick={handleOpenPayment}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <CreditCard className="w-5 h-5" />
                <span>Bayar Sekarang ({formatRupiah(grandTotal)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Penyelesaian Pembayaran</h3>
                <p className="text-xs text-slate-300">Koperasi Amanah Baraya RSUD Al-Mulk</p>
              </div>
              <button
                id="btn-close-payment-modal"
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Grand Total Box */}
              <div className="bg-slate-100 p-4 rounded-2xl border-2 border-slate-300 text-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Total Tagihan Belanja
                </span>
                <div className="text-3xl font-black text-slate-950 mt-1">
                  {formatRupiah(grandTotal)}
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {totalItemCount} item &bull; Pelanggan: {customerName || customerType.toUpperCase()}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-black text-slate-950 mb-2">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'cash', label: 'Tunai / Cash' },
                      { id: 'qris', label: 'QRIS Baraya' },
                      { id: 'transfer', label: 'Transfer Bank' },
                      { id: 'potong_gaji', label: 'Potong Gaji' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black border-2 text-center transition ${
                        paymentMethod === m.id
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                          : 'bg-slate-100 text-slate-950 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash payment specific: Amount received & quick buttons */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-300">
                  <div>
                    <label className="block text-xs font-black text-slate-950 mb-1">
                      Uang Pembayaran Diterima (Rp):
                    </label>
                    <input
                      id="input-cash-received"
                      type="number"
                      value={paymentAmountInput}
                      onChange={(e) => setPaymentAmountInput(e.target.value)}
                      placeholder="Masukkan nominal uang tunai..."
                      className="w-full px-4 py-3 bg-white border-2 border-slate-400 rounded-xl text-xl font-black text-slate-950 focus:border-emerald-600 outline-none"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-900">
                      Uang Pas & Pecahan Cepat:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickCash(grandTotal)}
                        className="py-1.5 px-2 bg-emerald-100 text-emerald-950 border border-emerald-400 rounded-lg text-xs font-black hover:bg-emerald-200"
                      >
                        Uang Pas
                      </button>
                      {[10000, 20000, 50000, 100000, 200000, 500000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setQuickCash(amt)}
                          className="py-1.5 px-2 bg-white border border-slate-300 text-slate-950 rounded-lg text-xs font-black hover:bg-slate-100"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kembalian calculation */}
                  <div className="pt-2 border-t-2 border-slate-300 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-950">
                      Kembalian:
                    </span>
                    <span
                      className={`text-xl font-black ${
                        paymentAmount < grandTotal
                          ? 'text-rose-800'
                          : 'text-slate-950'
                      }`}
                    >
                      {paymentAmount < grandTotal
                        ? `Kurang ${formatRupiah(grandTotal - paymentAmount)}`
                        : formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS specific helper */}
              {paymentMethod === 'qris' && (
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 text-center space-y-2">
                  <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl shadow-sm border border-slate-300 flex items-center justify-center">
                    <Barcode className="w-16 h-16 text-slate-950" />
                  </div>
                  <p className="text-xs font-black text-slate-950">
                    QRIS Baraya RSUD Al-Mulk Aktif
                  </p>
                  <p className="text-[11px] font-bold text-slate-800">
                    Mendukung GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin Mandiri, dll.
                  </p>
                </div>
              )}

              {/* Potong Gaji specific */}
              {paymentMethod === 'potong_gaji' && (
                <div className="p-3 bg-amber-50 rounded-xl border-2 border-amber-300 text-xs text-amber-950">
                  <p className="font-black">Potong Gaji Anggota Koperasi / Karyawan RSUD</p>
                  <p className="text-[11px] font-bold mt-0.5">
                    Transaksi akan dicatat ke tagihan simpan pinjam / belanja payroll bulanan anggota.
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-slate-950 mb-1">
                  Catatan Struk (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Titip kasir, no pesanan ruangan..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-100 border-t-2 border-slate-300 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black rounded-xl text-sm transition"
              >
                Batal
              </button>
              <button
                id="btn-confirm-finalize-payment"
                type="button"
                disabled={!isPaymentValid}
                onClick={handleFinalizeTransaction}
                className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai & Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          handleCameraScanSuccess(code);
          setIsCameraOpen(false);
        }}
        products={products}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={lastCompletedTransaction}
        coopConfig={coopConfig}
        onNewTransaction={() => {
          setIsReceiptOpen(false);
          setCart([]);
          setTimeout(() => {
            barcodeInputRef.current?.focus();
          }, 100);
        }}
      />
    </div>
  );
};

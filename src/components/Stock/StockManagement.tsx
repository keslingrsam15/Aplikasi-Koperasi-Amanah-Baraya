import React, { useState } from 'react';
import { Product, StockMutation, UserProfile } from '../../types';
import { formatRupiah, formatDateTimeIndo, exportToCSV } from '../../utils/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  History,
  AlertTriangle,
  Plus,
  Minus,
  SlidersHorizontal,
  Search,
  Download,
  Calendar,
  CheckCircle,
  Package,
} from 'lucide-react';

interface StockManagementProps {
  products: Product[];
  mutations: StockMutation[];
  currentUser: UserProfile;
  onAddStockMutation: (mutation: StockMutation, updatedProduct: Product) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  mutations,
  currentUser,
  onAddStockMutation,
}) => {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'adjustment' | 'history' | 'alerts'>('in');

  // Form states for Stok Masuk / Keluar / Adjustment
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [qtyInput, setQtyInput] = useState<string>('10');
  const [actualStockInput, setActualStockInput] = useState<string>('0');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [costPriceInput, setCostPriceInput] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Handle Stok Masuk
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseInt(qtyInput) || 0;
    if (qty <= 0) {
      alert('Jumlah stok masuk harus lebih besar dari 0.');
      return;
    }

    const previousStock = selectedProduct.stock;
    const newStock = previousStock + qty;

    const newMutation: StockMutation = {
      id: `MUT-${Date.now()}`,
      productId: selectedProduct.id,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      type: 'in',
      quantity: qty,
      previousStock,
      newStock,
      reason: reasonInput.trim() || 'Penerimaan stok dari supplier / kulakan',
      date: new Date().toISOString(),
      operator: currentUser.name,
      referenceNumber: referenceInput.trim() || undefined,
      costPrice: parseFloat(costPriceInput) || selectedProduct.buyPrice,
    };

    const updatedProd: Product = {
      ...selectedProduct,
      stock: newStock,
      buyPrice: parseFloat(costPriceInput) || selectedProduct.buyPrice,
      updatedAt: new Date().toISOString(),
    };

    onAddStockMutation(newMutation, updatedProd);
    alert(`Berhasil menambahkan stok masuk: +${qty} ${selectedProduct.unit} untuk "${selectedProduct.name}".`);
    setQtyInput('10');
    setReasonInput('');
    setReferenceInput('');
  };

  // Handle Stok Keluar
  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseInt(qtyInput) || 0;
    if (qty <= 0) {
      alert('Jumlah stok keluar harus lebih besar dari 0.');
      return;
    }
    if (qty > selectedProduct.stock) {
      if (!window.confirm(`Jumlah keluar (${qty}) melebihi stok yang ada (${selectedProduct.stock}). Tetap proses?`)) {
        return;
      }
    }

    const previousStock = selectedProduct.stock;
    const newStock = Math.max(0, previousStock - qty);

    const newMutation: StockMutation = {
      id: `MUT-${Date.now()}`,
      productId: selectedProduct.id,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      type: 'out',
      quantity: qty,
      previousStock,
      newStock,
      reason: reasonInput.trim() || 'Barang rusak / kadaluarsa / pemakaian internal',
      date: new Date().toISOString(),
      operator: currentUser.name,
      referenceNumber: referenceInput.trim() || undefined,
    };

    const updatedProd: Product = {
      ...selectedProduct,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };

    onAddStockMutation(newMutation, updatedProd);
    alert(`Berhasil mencatat stok keluar: -${qty} ${selectedProduct.unit} untuk "${selectedProduct.name}".`);
    setQtyInput('1');
    setReasonInput('');
    setReferenceInput('');
  };

  // Handle Penyesuaian Stok (Stock Opname)
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const actual = parseInt(actualStockInput) || 0;
    const previousStock = selectedProduct.stock;
    const diff = actual - previousStock;

    if (diff === 0) {
      alert('Stok fisik sama dengan stok sistem (tidak ada selisih).');
      return;
    }

    const newMutation: StockMutation = {
      id: `MUT-${Date.now()}`,
      productId: selectedProduct.id,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      type: 'adjustment',
      quantity: diff,
      previousStock,
      newStock: actual,
      reason: reasonInput.trim() || `Penyesuaian Stock Opname Fisik: Selisih ${diff > 0 ? `+${diff}` : diff} ${selectedProduct.unit}`,
      date: new Date().toISOString(),
      operator: currentUser.name,
    };

    const updatedProd: Product = {
      ...selectedProduct,
      stock: actual,
      updatedAt: new Date().toISOString(),
    };

    onAddStockMutation(newMutation, updatedProd);
    alert(`Penyesuaian stok opname berhasil disimpan: Stok fisik ${actual} ${selectedProduct.unit}.`);
    setReasonInput('');
  };

  // Quick Restock from low stock tab
  const handleQuickRestockPrompt = (prod: Product) => {
    setSelectedProductId(prod.id);
    setQtyInput('20');
    setReasonInput('Restock darurat stok menipis');
    setActiveTab('in');
  };

  // Filter mutations history
  const filteredMutations = mutations.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      m.productCode.toLowerCase().includes(searchHistory.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchHistory.toLowerCase()) ||
      m.operator.toLowerCase().includes(searchHistory.toLowerCase());

    const matchesType = historyTypeFilter === 'all' || m.type === historyTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleExportMutationHistory = () => {
    const headers = [
      'Waktu',
      'Kode Barang',
      'Nama Barang',
      'Tipe Mutasi',
      'Jumlah',
      'Stok Sebelum',
      'Stok Sesudah',
      'Keterangan / Alasan',
      'Operator',
      'No. Referensi',
    ];
    const rows = filteredMutations.map((m) => [
      formatDateTimeIndo(m.date),
      m.productCode,
      m.productName,
      m.type === 'in' ? 'Stok Masuk' : m.type === 'out' ? 'Stok Keluar' : 'Stock Opname',
      m.quantity > 0 ? `+${m.quantity}` : m.quantity,
      m.previousStock,
      m.newStock,
      m.reason,
      m.operator,
      m.referenceNumber || '-',
    ]);

    exportToCSV(`Riwayat_Mutasi_Stok_Koperasi_${new Date().toISOString().slice(0, 10)}.csv`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Manajemen & Mutasi Stok Barang
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pencatatan stok masuk, barang keluar/rusak, stock opname, dan riwayat mutasi
            </p>
          </div>

          {lowStockProducts.length > 0 && (
            <button
              onClick={() => setActiveTab('alerts')}
              className="flex items-center space-x-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{lowStockProducts.length} Barang Perlu Restock!</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs border-b border-slate-100 dark:border-slate-700">
          {[
            { id: 'in', label: 'Stok Masuk (Restock)', icon: ArrowDownLeft, color: 'text-emerald-600' },
            { id: 'out', label: 'Stok Keluar (Rusak/Pakai)', icon: ArrowUpRight, color: 'text-rose-600' },
            { id: 'adjustment', label: 'Penyesuaian (Stock Opname)', icon: RefreshCw, color: 'text-blue-600' },
            { id: 'history', label: 'Riwayat Mutasi Stok', icon: History, color: 'text-slate-600' },
            {
              id: 'alerts',
              label: `Notifikasi Stok Minimum (${lowStockProducts.length})`,
              icon: AlertTriangle,
              color: 'text-amber-600',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 rounded-xl font-bold flex items-center space-x-2 whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Stok Masuk */}
      {activeTab === 'in' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              Form Penerimaan Stok Masuk (Restock / Kulakan)
            </h3>

            <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
              {/* Product selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Barang yang Masuk:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Masuk ({selectedProduct?.unit || 'Pcs'}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-700 dark:text-emerald-400 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Beli Satuan Baru (Opsional):
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Default: ${selectedProduct?.buyPrice || 0}`}
                    value={costPriceInput}
                    onChange={(e) => setCostPriceInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Reference & Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Faktur / PO / Surat Jalan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PO-2026-0815"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Penerimaan:
                  </label>
                  <input
                    type="text"
                    placeholder="Supplier PT Tirta Jaya..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="btn-submit-stock-in"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 flex items-center justify-center space-x-2 text-sm"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Simpan Stok Masuk</span>
              </button>
            </form>
          </div>

          {/* Product Quick Info Card */}
          <div className="lg:col-span-5 bg-emerald-50/50 dark:bg-slate-800/60 p-6 rounded-2xl border border-emerald-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Informasi Barang Terpilih
            </h4>
            {selectedProduct && (
              <div className="space-y-3 text-xs">
                {selectedProduct.imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  {selectedProduct.code} &bull; BC: {selectedProduct.barcode}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedProduct.name}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100 dark:border-slate-700">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Stok Saat Ini:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Estimasi Stok Baru:</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {selectedProduct.stock + (parseInt(qtyInput) || 0)} {selectedProduct.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Stok Keluar */}
      {activeTab === 'out' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-rose-600" />
              Form Stok Keluar (Barang Rusak / Kadaluarsa / Internal)
            </h3>

            <form onSubmit={handleStockOutSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Barang:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} (Tersedia: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Keluar ({selectedProduct?.unit || 'Pcs'}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Berita Acara / Memo:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BA-RUSAK-001"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan Pengeluaran Stok:
                </label>
                <select
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none mb-2"
                >
                  <option value="Barang rusak / bocor / kemasan sobek">Barang rusak / bocor / kemasan sobek</option>
                  <option value="Expired Date / Melewati tanggal kadaluarsa">Expired Date / Melewati tanggal kadaluarsa</option>
                  <option value="Pemakaian operasional kasir & ruang RSUD">Pemakaian operasional kasir & ruang RSUD</option>
                  <option value="Sample / Tester produk">Sample / Tester produk</option>
                  <option value="Lainnya">Lainnya (Ketik di bawah)</option>
                </select>
                <input
                  type="text"
                  placeholder="Keterangan rincian..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-stock-out"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 flex items-center justify-center space-x-2 text-sm"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Simpan Stok Keluar</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-rose-50/50 dark:bg-slate-800/60 p-6 rounded-2xl border border-rose-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Pengurangan Stok
            </h4>
            {selectedProduct && (
              <div className="space-y-2 text-xs">
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedProduct.name}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-100 dark:border-slate-700">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Stok Saat Ini:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Sisa Stok Akhir:</span>
                    <span className="text-base font-black text-rose-600">
                      {Math.max(0, selectedProduct.stock - (parseInt(qtyInput) || 0))} {selectedProduct.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Penyesuaian Stok (Stock Opname) */}
      {activeTab === 'adjustment' && (
        <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] max-w-2xl mx-auto space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Penyesuaian Stok Fisik (Stock Opname)
          </h3>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Barang untuk Disesuaikan:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) setActualStockInput(p.stock.toString());
                }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} &mdash; Stok Sistem: {p.stock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">
                  Stok Tercatat Sistem:
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedProduct?.stock} {selectedProduct?.unit}
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Hasil Hitung Fisik Sebenarnya:
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualStockInput}
                  onChange={(e) => setActualStockInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-lg font-bold text-base text-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Hasil Stock Opname:
              </label>
              <input
                type="text"
                placeholder="Penghitungan fisik bulanan di etalase/gudang..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <button
              type="submit"
              id="btn-submit-stock-adjustment"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
            >
              Simpan Penyesuaian Stok Opname
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Riwayat Mutasi Stok */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari mutasi barang, alasan, operator..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">Semua Tipe Mutasi</option>
                <option value="in">Stok Masuk (+)</option>
                <option value="out">Stok Keluar (-)</option>
                <option value="adjustment">Stock Opname (~)</option>
              </select>
            </div>

            <button
              onClick={handleExportMutationHistory}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Mutasi</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kode & Nama Barang</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4 text-center">Jumlah</th>
                  <th className="py-3 px-4 text-center">Sebelum &rarr; Sesudah</th>
                  <th className="py-3 px-4">Keterangan / No. Ref</th>
                  <th className="py-3 px-4">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
                {filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Belum ada riwayat mutasi stok tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((mut) => (
                    <tr key={mut.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {formatDateTimeIndo(mut.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold mr-1.5">
                          {mut.productCode}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {mut.productName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            mut.type === 'in'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : mut.type === 'out'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {mut.type === 'in' ? 'Stok Masuk' : mut.type === 'out' ? 'Stok Keluar' : 'Stock Opname'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={
                            mut.quantity > 0
                              ? 'text-emerald-600 font-extrabold'
                              : mut.quantity < 0
                              ? 'text-rose-600 font-extrabold'
                              : 'text-slate-700'
                          }
                        >
                          {mut.quantity > 0 ? `+${mut.quantity}` : mut.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                        {mut.previousStock} &rarr; <span className="font-bold text-slate-900 dark:text-white">{mut.newStock}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div>{mut.reason}</div>
                        {mut.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {mut.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {mut.operator}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Notifikasi Stok Minimum */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Daftar Barang Stok Menipis & Butuh Order Ulang
              </h3>
              <p className="text-xs text-slate-500">
                Barang yang jumlah stoknya berada pada atau di bawah batas minimum
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold rounded-full text-xs">
              {lowStockProducts.length} Barang Kritis
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                Semua stok barang dalam kondisi aman!
              </p>
              <p className="text-xs">Tidak ada barang yang berada di bawah ambang stok minimum.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400">
                        {prod.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        {prod.stock === 0 ? 'HABIS' : 'MENIPIS'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-slate-500">{prod.category}</p>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Sisa Stok / Batas Min:</span>
                      <span className="font-black text-rose-600 text-sm">
                        {prod.stock} / {prod.minStock} {prod.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickRestockPrompt(prod)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order Restock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

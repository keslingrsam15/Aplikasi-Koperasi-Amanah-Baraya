import React, { useState, useRef, useEffect } from 'react';
import { Product, CoopConfig } from '../../types';
import { formatRupiah, generateNextProductCode, exportToCSV } from '../../utils/formatters';
import { BarcodeRenderer } from '../Barcode/BarcodeRenderer';
import { uploadProductImage } from '../../services/supabase';
import {
  Package,
  Plus,
  Search,
  Filter,
  Printer,
  Edit,
  Trash2,
  Barcode,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Layers,
  Sparkles,
  X,
  Check,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ProductListProps {
  products: Product[];
  coopConfig?: CoopConfig;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenBarcodeStudio?: (selectedProductId?: string) => void;
  triggerAddSignal?: number;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  coopConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenBarcodeStudio,
  triggerAddSignal,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'sellPrice' | 'code'>('code');

  useEffect(() => {
    if (triggerAddSignal && triggerAddSignal > 0) {
      handleOpenAdd();
    }
  }, [triggerAddSignal]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Single barcode preview modal
  const [previewBarcodeProduct, setPreviewBarcodeProduct] = useState<Product | null>(null);

  // Form fields
  const [formCode, setFormCode] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Minuman');
  const [formBuyPrice, setFormBuyPrice] = useState<string>('0');
  const [formSellPrice, setFormSellPrice] = useState<string>('0');
  const [formStock, setFormStock] = useState<string>('0');
  const [formMinStock, setFormMinStock] = useState<string>('5');
  const [formUnit, setFormUnit] = useState<string>('Pcs');
  const [formSupplier, setFormSupplier] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];

  const handleOpenAdd = () => {
    const nextCode = generateNextProductCode(products);
    setEditingProduct(null);
    setFormCode(nextCode);
    setFormBarcode(nextCode); // Barcode automatically matches code
    setFormName('');
    setFormCategory('Minuman');
    setFormBuyPrice('0');
    setFormSellPrice('0');
    setFormStock('10');
    setFormMinStock('5');
    setFormUnit('Pcs');
    setFormSupplier('');
    setFormDescription('');
    setFormImageUrl('');
    setImageInputMode('upload');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormCode(p.code);
    setFormBarcode(p.barcode);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormBuyPrice(p.buyPrice.toString());
    setFormSellPrice(p.sellPrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormUnit(p.unit);
    setFormSupplier(p.supplier || '');
    setFormDescription(p.description || '');
    setFormImageUrl(p.imageUrl || '');
    setImageInputMode('upload');
    setIsFormOpen(true);
  };

  // Process image file with Supabase upload
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadProductImage(file);
      setFormImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Error uploading product image:', err);
      alert('Gagal memproses gambar: ' + (err?.message || String(err)));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama barang wajib diisi!');
      return;
    }
    if (!formCode.trim()) {
      alert('Kode barang wajib diisi!');
      return;
    }

    const buyP = parseFloat(formBuyPrice) || 0;
    const sellP = parseFloat(formSellPrice) || 0;
    const stk = parseInt(formStock) || 0;
    const minStk = parseInt(formMinStock) || 0;

    if (sellP < buyP) {
      if (!window.confirm('Harga Jual lebih rendah dari Harga Beli. Tetap lanjutkan?')) {
        return;
      }
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        code: formCode.trim().toUpperCase(),
        barcode: formBarcode.trim().toUpperCase() || formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        buyPrice: buyP,
        sellPrice: sellP,
        stock: stk,
        minStock: minStk,
        unit: formUnit,
        supplier: formSupplier.trim() || undefined,
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProduct(updated);
    } else {
      const newProd: Product = {
        id: `PRD-${Date.now()}`,
        code: formCode.trim().toUpperCase(),
        barcode: formBarcode.trim().toUpperCase() || formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        buyPrice: buyP,
        sellPrice: sellP,
        stock: stk,
        minStock: minStk,
        unit: formUnit,
        supplier: formSupplier.trim() || undefined,
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onAddProduct(newProd);
    }

    setIsFormOpen(false);
  };

  const handleDelete = (prod: Product) => {
    if (window.confirm(`Hapus barang "${prod.name}" (${prod.code}) dari database?`)) {
      onDeleteProduct(prod.id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Kode Barang',
      'Barcode',
      'Nama Barang',
      'Kategori',
      'Harga Beli',
      'Harga Jual',
      'Margin Keuntungan',
      'Stok Saat Ini',
      'Stok Minimum',
      'Satuan',
      'Pemasok / Supplier',
    ];
    const rows = products.map((p) => [
      p.code,
      p.barcode,
      p.name,
      p.category,
      p.buyPrice,
      p.sellPrice,
      p.sellPrice - p.buyPrice,
      p.stock,
      p.minStock,
      p.unit,
      p.supplier || '-',
    ]);
    exportToCSV(
      `Master_Barang_Koperasi_RSUD_Al_Mulk_${new Date().toISOString().slice(0, 10)}.csv`,
      [headers, ...rows]
    );
  };

  // Filter and sort products
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.stock <= p.minStock && p.stock > 0;
    if (stockFilter === 'out') matchesStock = p.stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    if (sortBy === 'code') cmp = a.code.localeCompare(b.code);
    if (sortBy === 'stock') cmp = a.stock - b.stock;
    if (sortBy === 'sellPrice') cmp = a.sellPrice - b.sellPrice;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: 'name' | 'stock' | 'sellPrice' | 'code') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama barang, barcode (BRG...), supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="sm:col-span-3">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
              className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
            >
              <option value="all">Semua Kondisi Stok</option>
              <option value="low">Stok Menipis (Di bawah Min)</option>
              <option value="out">Stok Habis (0)</option>
            </select>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 font-bold pt-1 border-t border-slate-200">
          <div>
            Menampilkan <span className="font-black text-slate-950">{sorted.length}</span> dari{' '}
            {products.length} total produk
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-emerald-800 font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Tersedia: {products.filter((p) => p.stock > p.minStock).length}
            </span>
            <span className="flex items-center gap-1 text-amber-800 font-black">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Menipis: {products.filter((p) => p.stock <= p.minStock && p.stock > 0).length}
            </span>
            <span className="flex items-center gap-1 text-rose-800 font-black">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Habis: {products.filter((p) => p.stock <= 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-emerald-700 border-b-2 border-emerald-800 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center">Foto</th>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-emerald-100"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Kode Barang</span>
                    <ArrowUpDown className="w-3 h-3 text-white" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-emerald-100"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Nama Barang</span>
                    <ArrowUpDown className="w-3 h-3 text-white" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Kategori</th>
                <th className="py-3 px-4 text-center">Harga Beli</th>
                <th
                  onClick={() => toggleSort('sellPrice')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-emerald-100"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Harga Jual</span>
                    <ArrowUpDown className="w-3 h-3 text-white" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Margin / Laba</th>
                <th
                  onClick={() => toggleSort('stock')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-emerald-100"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Stok</span>
                    <ArrowUpDown className="w-3 h-3 text-white" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-950">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-600">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="w-12 h-12 text-slate-400 stroke-1" />
                      <p className="font-black text-slate-900 text-sm">
                        Belum ada barang di Master Data
                      </p>
                      <p className="text-xs text-slate-600 font-bold max-w-sm">
                        Klik tombol <strong>"Tambah Barang"</strong> di atas untuk menambahkan produk beserta upload foto produk sesuai keinginan Anda.
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 inline-flex items-center gap-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Barang Sekarang</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((prod) => {
                  const profit = prod.sellPrice - prod.buyPrice;
                  const marginPercent =
                    prod.sellPrice > 0 ? Math.round((profit / prod.sellPrice) * 100) : 0;
                  const isLow = prod.stock <= prod.minStock && prod.stock > 0;
                  const isOut = prod.stock <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Product Image Thumbnail */}
                      <td className="py-3 px-4 text-center">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-11 h-11 object-cover rounded-xl border border-slate-300 shadow-sm mx-auto bg-slate-100"
                            onError={(e) => {
                              // Fallback on load error
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 mx-auto">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>

                      {/* Code Barang */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono font-black text-emerald-800">
                          {prod.code}
                        </div>
                        {prod.barcode !== prod.code && (
                          <div className="font-mono text-[10px] text-slate-600 font-bold">
                            BC: {prod.barcode}
                          </div>
                        )}
                      </td>

                      {/* Name & Supplier */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-black text-slate-950 text-xs sm:text-sm">
                          {prod.name}
                        </div>
                        {prod.supplier && (
                          <div className="text-[10px] text-slate-700 font-bold">
                            Pemasok: {prod.supplier}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-900">
                          {prod.category}
                        </span>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {formatRupiah(prod.buyPrice)}
                      </td>

                      {/* Sell Price */}
                      <td className="py-3 px-4 text-center font-black text-slate-950 text-xs sm:text-sm">
                        {formatRupiah(prod.sellPrice)}
                      </td>

                      {/* Margin Profit */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-black text-emerald-800">
                          +{formatRupiah(profit)}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold">
                          {marginPercent}% margin
                        </div>
                      </td>

                      {/* Stock & Unit */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <span
                            className={`font-black px-2.5 py-0.5 rounded-full text-xs border ${
                              isOut
                                ? 'bg-rose-100 text-rose-950 border-rose-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                        </div>
                        {isLow && (
                          <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                            Min: {prod.minStock}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            id={`btn-edit-${prod.code}`}
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-emerald-800 transition"
                            title="Ubah Data & Foto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${prod.code}`}
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal with Image Upload */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-emerald-200" />
                <h3 className="font-black text-base sm:text-lg">
                  {editingProduct ? 'Ubah Data Barang & Foto' : 'Tambah Barang Baru & Foto Produk'}
                </h3>
              </div>
              <button
                id="btn-close-product-form"
                onClick={() => setIsFormOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* IMAGE UPLOAD SECTION */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-950 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>Foto / Gambar Produk:</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2 py-1 rounded-md transition ${
                        imageInputMode === 'upload'
                          ? 'bg-white text-slate-950 shadow-sm font-black'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Upload Berkas
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2 py-1 rounded-md transition ${
                        imageInputMode === 'url'
                          ? 'bg-white text-slate-950 shadow-sm font-black'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Tautan URL
                    </button>
                  </div>
                </div>

                {/* Upload or URL input */}
                {imageInputMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="product-file-upload-input"
                    />

                    {formImageUrl ? (
                      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-300">
                        <img
                          src={formImageUrl}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-600 shadow-md bg-slate-100"
                        />
                        <div className="flex-1 space-y-1.5">
                          <p className="font-black text-slate-950 text-xs">
                            Foto produk siap disimpan
                          </p>
                          <p className="text-[11px] text-slate-600 font-bold">
                            Gambar ini akan tampil di menu Kasir/Penjualan dan Master Barang.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <RefreshCw className="w-3 h-3 text-slate-700" />
                              <span>Ganti Foto</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                          isDragging
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-slate-300 hover:border-emerald-600 bg-white hover:bg-slate-50'
                        } ${isUploadingImage ? 'opacity-75 cursor-wait' : ''}`}
                      >
                        {isUploadingImage ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                            </div>
                            <p className="font-black text-slate-950 text-xs">
                              Mengupload & memproses foto ke Supabase...
                            </p>
                            <p className="text-[10px] text-slate-600 font-bold">
                              Mohon tunggu sebentar
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <p className="font-black text-slate-950 text-xs">
                              Tarik & Lepas gambar di sini, atau <span className="text-emerald-700 underline">Pilih Berkas</span>
                            </p>
                            <p className="text-[10px] text-slate-600 font-bold">
                              Mendukung file JPG, PNG, WEBP (Maksimal 5MB)
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="https://contoh.com/foto-produk.jpg"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:border-emerald-600 outline-none"
                        />
                      </div>
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {formImageUrl && (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                        <img
                          src={formImageUrl}
                          alt="Pratinjau URL"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-[11px] font-bold text-slate-700">
                          Pratinjau gambar tautan URL
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Kode Barang */}
                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Kode Barang (Otomatis):
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => {
                      setFormCode(e.target.value);
                      if (!editingProduct) setFormBarcode(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black text-emerald-800 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                {/* Barcode String */}
                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Nilai Barcode:
                  </label>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-black text-slate-950 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Barcode Live Preview */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-600 font-bold block mb-1">
                  Pratinjau Label Barcode:
                </span>
                <div className="flex justify-center">
                  <BarcodeRenderer value={formBarcode || 'BRG00000'} height={38} width={1.3} />
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block font-black text-slate-950 mb-1">
                  Nama Barang / Judul Produk:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Air Mineral 600 ml, Kopi Kapal Api Panas, dll."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              {/* Kategori & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
                  >
                    <option value="Kopi & Minuman Warkop">Kopi & Minuman Warkop</option>
                    <option value="Jajanan Warung">Jajanan Warung</option>
                    <option value="Makanan Ringan">Makanan Ringan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kesehatan & Medis">Kesehatan & Medis</option>
                    <option value="Perlengkapan Pasien">Perlengkapan Pasien</option>
                    <option value="Perlengkapan Mandi">Perlengkapan Mandi</option>
                    <option value="Alat Tulis Kantor">Alat Tulis Kantor</option>
                    <option value="Kebutuhan Sehari-hari">Kebutuhan Sehari-hari</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Satuan:
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Pcs, Botol, Kotak, Gelas..."
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Harga Beli & Harga Jual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Harga Beli / HPP (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-black text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-black text-emerald-800 focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Stok & Stok Minimum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Stok Saat Ini:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-black text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-950 mb-1">
                    Batas Stok Minimum:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-black text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block font-black text-slate-950 mb-1">
                  Pemasok / Supplier:
                </label>
                <input
                  type="text"
                  placeholder="Nama distributor atau pemasok..."
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t-2 border-slate-200 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-product-submit"
                  className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md transition active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Barang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Barcode Preview Modal */}
      {previewBarcodeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Barcode className="w-5 h-5 text-emerald-700" />
                <h4 className="font-black text-sm text-slate-950">
                  Label Barcode Produk
                </h4>
              </div>
              <button
                onClick={() => setPreviewBarcodeProduct(null)}
                className="text-slate-500 hover:text-slate-950 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Label Card */}
            <div className="p-4 bg-white border-2 border-dashed border-slate-400 rounded-xl text-center space-y-1.5">
              {previewBarcodeProduct.imageUrl && (
                <img
                  src={previewBarcodeProduct.imageUrl}
                  alt={previewBarcodeProduct.name}
                  className="w-14 h-14 object-cover rounded-xl mx-auto border border-slate-300 shadow-sm"
                />
              )}
              <div className="text-[9px] font-black uppercase tracking-tight text-slate-800">
                {coopConfig?.name || 'KOPERASI AMANAH BARAYA'}
              </div>
              <div className="text-[13px] font-black text-slate-950 line-clamp-2">
                {previewBarcodeProduct.name}
              </div>
              <div className="py-2 flex justify-center">
                <BarcodeRenderer
                  value={previewBarcodeProduct.barcode}
                  height={45}
                  width={1.4}
                  displayValue={true}
                  fontSize={11}
                />
              </div>
              <div className="pt-1.5 border-t border-slate-300 flex justify-between px-2 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-700">Harga:</span>
                <span className="text-sm font-black text-emerald-800">
                  {formatRupiah(previewBarcodeProduct.sellPrice)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  const pId = previewBarcodeProduct.id;
                  setPreviewBarcodeProduct(null);
                  if (onOpenBarcodeStudio) onOpenBarcodeStudio(pId);
                }}
                className="py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar</span>
              </button>
              <button
                onClick={() => setPreviewBarcodeProduct(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

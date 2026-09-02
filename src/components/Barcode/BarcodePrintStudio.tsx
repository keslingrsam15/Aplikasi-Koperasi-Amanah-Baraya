import React, { useState } from 'react';
import { Product, CoopConfig } from '../../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatRupiah } from '../../utils/formatters';
import { Printer, CheckSquare, Square, Sliders, Layers, Tag, Eye, ArrowLeft } from 'lucide-react';

interface BarcodePrintStudioProps {
  products: Product[];
  coopConfig: CoopConfig;
  initialSelectedProductId?: string;
  onBack?: () => void;
}

export const BarcodePrintStudio: React.FC<BarcodePrintStudioProps> = ({
  products,
  coopConfig,
  initialSelectedProductId,
  onBack,
}) => {
  // Map of productId -> quantity of barcode labels to print
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (initialSelectedProductId) {
      map[initialSelectedProductId] = 6;
    } else {
      // By default select first 4 items with 4 copies each
      products.slice(0, 4).forEach((p) => {
        map[p.id] = 4;
      });
    }
    return map;
  });

  const [labelFormat, setLabelFormat] = useState<'grid3' | 'grid2' | 'thermalSingle' | 'priceTag'>('grid3');
  const [showCoopName, setShowCoopName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showProductCode, setShowProductCode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleProduct = (pId: string) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[pId]) {
        delete next[pId];
      } else {
        next[pId] = 4;
      }
      return next;
    });
  };

  const updateQuantity = (pId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => {
        const next = { ...prev };
        delete next[pId];
        return next;
      });
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [pId]: Math.min(qty, 200),
      }));
    }
  };

  const selectAll = () => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = selectedItems[p.id] || 4;
    });
    setSelectedItems(map);
  };

  const unselectAll = () => {
    setSelectedItems({});
  };

  // Compile full array of labels to render
  const labelQueue: { product: Product; index: number }[] = [];
  products.forEach((prod) => {
    const count = selectedItems[prod.id] || 0;
    for (let i = 0; i < count; i++) {
      labelQueue.push({ product: prod, index: i });
    }
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls (Hidden on Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)]">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                Cetak Label Barcode Barang
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih barang, atur jumlah stiker, dan cetak label barcode untuk rak atau kemasan produk
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold">
              Total Label: {labelQueue.length} stiker
            </div>
            <button
              id="btn-trigger-print-barcode-studio"
              disabled={labelQueue.length === 0}
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace: Sidebar Product Picker + Customizer + Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Selection List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih Barang ({Object.keys(selectedItems).length} dipilih)
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={selectAll}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={unselectAll}
                  className="text-slate-500 hover:underline font-medium"
                >
                  Reset
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Cari nama barang atau kode barcode..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map((prod) => {
                const isSelected = !!selectedItems[prod.id];
                const qty = selectedItems[prod.id] || 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => toggleProduct(prod.id)}
                    >
                      <button className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-300 shrink-0"
                        />
                      ) : null}

                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {prod.name}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                            {prod.barcode}
                          </span>
                          <span>&bull;</span>
                          <span>{formatRupiah(prod.sellPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <span className="text-[11px] text-slate-500 mr-1">Jml:</span>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={qty}
                          onChange={(e) => updateQuantity(prod.id, parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-center text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Style Options + Interactive Sheet Preview */}
          <div className="lg:col-span-7 space-y-4">
            {/* Customization bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Format & Konten Label Barcode:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelFormat('grid3')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    labelFormat === 'grid3'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Stiker 3 Kolom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('grid2')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    labelFormat === 'grid2'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Stiker 2 Kolom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('thermalSingle')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    labelFormat === 'thermalSingle'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Roll Thermal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelFormat('priceTag')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    labelFormat === 'priceTag'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Price Tag Rak</span>
                </button>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCoopName}
                    onChange={(e) => setShowCoopName(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Kop Koperasi RSUD</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProductName}
                    onChange={(e) => setShowProductName(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Nama Barang</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Harga Jual</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProductCode}
                    onChange={(e) => setShowProductCode(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Teks Barcode</span>
                </label>
              </div>
            </div>

            {/* Live Sheet Preview Header */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Pratinjau Lembar Cetak
              </span>
              <span>Kertas A4 / Ukuran Label Standar</span>
            </div>

            {/* Preview Sheet Container */}
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-2xl overflow-y-auto max-h-[500px] border border-slate-300 dark:border-slate-800 flex justify-center">
              {labelQueue.length === 0 ? (
                <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Tag className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="font-semibold text-sm">Belum ada label barang yang dipilih</p>
                  <p className="text-xs">Centang barang di kolom kiri untuk menampilkan stiker barcode</p>
                </div>
              ) : (
                <div className="w-full max-w-[700px] bg-white text-slate-950 p-6 rounded-xl shadow-lg border border-slate-200 font-sans">
                  <div
                    className={`grid gap-3 ${
                      labelFormat === 'grid3'
                        ? 'grid-cols-3'
                        : labelFormat === 'grid2'
                        ? 'grid-cols-2'
                        : labelFormat === 'thermalSingle'
                        ? 'grid-cols-1 max-w-[280px] mx-auto'
                        : 'grid-cols-2'
                    }`}
                  >
                    {labelQueue.map((item, idx) => (
                      <div
                        key={idx}
                        className={`border border-dashed border-slate-300 rounded-lg p-2.5 text-center flex flex-col items-center justify-between bg-white ${
                          labelFormat === 'priceTag' ? 'bg-amber-50/40 border-amber-300' : ''
                        }`}
                      >
                        {showCoopName && (
                          <div className="text-[8px] font-extrabold uppercase tracking-tight text-slate-800 line-clamp-1">
                            KOP. AMANAH BARAYA RSUD AL-MULK
                          </div>
                        )}

                        {showProductName && (
                          <div className="text-[11px] font-bold text-slate-900 line-clamp-2 my-0.5 leading-tight">
                            {item.product.name}
                          </div>
                        )}

                        <div className="py-0.5 max-w-full flex justify-center">
                          <BarcodeRenderer
                            value={item.product.barcode}
                            height={labelFormat === 'priceTag' ? 35 : 40}
                            width={1.2}
                            displayValue={showProductCode}
                            fontSize={10}
                            margin={1}
                          />
                        </div>

                        {showPrice && (
                          <div className="mt-1 pt-0.5 border-t border-slate-200 w-full flex items-center justify-between px-1">
                            <span className="text-[8px] text-slate-500 uppercase font-semibold">Harga:</span>
                            <span className="text-[12px] font-extrabold text-emerald-800">
                              {formatRupiah(item.product.sellPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet (Active during window.print()) */}
      <div className="hidden print:block font-sans text-slate-950 p-2">
        <div
          className={`grid gap-2 ${
            labelFormat === 'grid3'
              ? 'grid-cols-3'
              : labelFormat === 'grid2'
              ? 'grid-cols-2'
              : labelFormat === 'thermalSingle'
              ? 'grid-cols-1'
              : 'grid-cols-2'
          }`}
        >
          {labelQueue.map((item, idx) => (
            <div
              key={idx}
              className="border border-dashed border-slate-400 rounded p-2 text-center flex flex-col items-center justify-between break-inside-avoid bg-white"
            >
              {showCoopName && (
                <div className="text-[8px] font-extrabold uppercase tracking-tight text-slate-900">
                  KOP. AMANAH BARAYA RSUD AL-MULK
                </div>
              )}
              {showProductName && (
                <div className="text-[10px] font-bold text-slate-900 line-clamp-2 leading-tight">
                  {item.product.name}
                </div>
              )}
              <div className="py-0.5 max-w-full flex justify-center">
                <BarcodeRenderer
                  value={item.product.barcode}
                  height={38}
                  width={1.2}
                  displayValue={showProductCode}
                  fontSize={9}
                  margin={1}
                />
              </div>
              {showPrice && (
                <div className="pt-0.5 border-t border-slate-300 w-full flex items-center justify-between px-1">
                  <span className="text-[8px] text-slate-600 uppercase font-semibold">Harga:</span>
                  <span className="text-[11px] font-extrabold text-slate-950">
                    {formatRupiah(item.product.sellPrice)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

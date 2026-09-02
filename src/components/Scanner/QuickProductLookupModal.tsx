import React, { useState } from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { BarcodeRenderer } from '../Barcode/BarcodeRenderer';
import {
  Barcode,
  Search,
  ShoppingCart,
  Printer,
  ArrowDownLeft,
  X,
  CheckCircle,
  Package,
} from 'lucide-react';

interface QuickProductLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onPrintBarcode: (product: Product) => void;
  onRestock: (product: Product) => void;
}

export const QuickProductLookupModal: React.FC<QuickProductLookupModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  onPrintBarcode,
  onRestock,
}) => {
  const [query, setQuery] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);

  if (!isOpen) return null;

  const handleSearch = (q: string) => {
    setQuery(q);
    const clean = q.trim().toLowerCase();
    if (!clean) {
      setMatchedProduct(null);
      return;
    }

    // Exact barcode / code match first
    const exact = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.code.toLowerCase() === clean
    );

    if (exact) {
      setMatchedProduct(exact);
      return;
    }

    // Partial search match
    const partial = products.find(
      (p) =>
        p.name.toLowerCase().includes(clean) ||
        p.category.toLowerCase().includes(clean)
    );
    setMatchedProduct(partial || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Barcode className="w-5 h-5" />
            <h3 className="font-bold text-base">Pemeriksaan Cepat Barcode Barang</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Scanner */}
        <div className="p-6 space-y-5">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Scan barcode USB atau ketik kode/nama barang..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none ring-4 ring-emerald-500/20"
            />
          </div>

          {/* Result Card */}
          {matchedProduct ? (
            <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {matchedProduct.code} &bull; {matchedProduct.category}
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {matchedProduct.name}
                  </h4>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    matchedProduct.stock <= matchedProduct.minStock
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  Stok: {matchedProduct.stock} {matchedProduct.unit}
                </span>
              </div>

              {/* Barcode representation */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                <BarcodeRenderer value={matchedProduct.barcode} height={42} width={1.6} fontSize={11} />
              </div>

              {/* Price comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Harga Beli (Modal):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatRupiah(matchedProduct.buyPrice)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300 text-[10px] block font-bold">
                    Harga Jual Kasir:
                  </span>
                  <span className="font-black text-emerald-800 dark:text-emerald-300 text-base">
                    {formatRupiah(matchedProduct.sellPrice)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    onAddToCart(matchedProduct);
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Jual di Kasir</span>
                </button>

                <button
                  onClick={() => {
                    onPrintBarcode(matchedProduct);
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Label</span>
                </button>

                <button
                  onClick={() => {
                    onRestock(matchedProduct);
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Restock</span>
                </button>
              </div>
            </div>
          ) : query ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-600 dark:text-slate-300">
                Barang dengan barcode/nama "{query}" tidak ditemukan.
              </p>
              <p>Pastikan kode sudah terdaftar di Master Barang.</p>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-medium">Arahkan scanner USB ke barcode atau ketik kata kunci pencarian.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

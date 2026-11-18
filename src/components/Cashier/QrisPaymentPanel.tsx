import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { CoopConfig } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  DEFAULT_QRIS_IMAGE_URL,
  generateDynamicQris,
  resolveCoopQrisConfig,
} from '../../utils/qrisDynamic';
import {
  QrCode,
  Image as ImageIcon,
  Maximize2,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface QrisPaymentPanelProps {
  grandTotal: number;
  coopConfig: CoopConfig;
}

export const QrisPaymentPanel: React.FC<QrisPaymentPanelProps> = ({
  grandTotal,
  coopConfig,
}) => {
  const qrisConfig = useMemo(() => resolveCoopQrisConfig(coopConfig), [coopConfig]);
  const [viewMode, setViewMode] = useState<'dynamic' | 'static'>(qrisConfig.defaultMode);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string | null>(null);
  const [qrRenderError, setQrRenderError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [posterLoadFailed, setPosterLoadFailed] = useState<boolean>(false);

  // Sync preferred mode when config changes
  useEffect(() => {
    setViewMode(qrisConfig.defaultMode);
  }, [qrisConfig.defaultMode, qrisConfig.hasValidPayload]);

  // Reset image fallback state when URL changes
  useEffect(() => {
    setPosterLoadFailed(false);
  }, [qrisConfig.imageUrl]);

  // Compute dynamic EMVCo QRIS payload whenever amount or static payload changes
  const dynamicPayload = useMemo(() => {
    if (!qrisConfig.hasValidPayload) return '';
    return generateDynamicQris(qrisConfig.staticPayload, grandTotal);
  }, [qrisConfig.hasValidPayload, qrisConfig.staticPayload, grandTotal]);

  // Render crisp QR PNG dataURL for dynamic QRIS
  useEffect(() => {
    let active = true;
    if (!dynamicPayload) {
      setDynamicQrDataUrl(null);
      return;
    }
    setQrRenderError(null);
    QRCode.toDataURL(dynamicPayload, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setDynamicQrDataUrl(url);
      })
      .catch(() => {
        if (active) {
          setQrRenderError('Gagal merender QR Dinamis. Gunakan tampilan Poster QRIS Resmi.');
          setDynamicQrDataUrl(null);
        }
      });

    return () => {
      active = false;
    };
  }, [dynamicPayload]);

  // Escape key closes zoom overlay
  useEffect(() => {
    if (!isZoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isZoomOpen]);

  const effectivePosterSrc = posterLoadFailed ? DEFAULT_QRIS_IMAGE_URL : qrisConfig.imageUrl;
  const showingDynamic = viewMode === 'dynamic' && qrisConfig.hasValidPayload && !qrRenderError;

  return (
    <>
      <div
        data-testid="qris-payment-panel"
        className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-3"
      >
        {/* Mode Switcher (Dynamic with exact amount vs Official Static Poster) */}
        {qrisConfig.hasValidPayload && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              id="btn-qris-mode-dynamic"
              type="button"
              onClick={() => setViewMode('dynamic')}
              className={`py-1.5 px-2.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                showingDynamic
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-800 hover:bg-white/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>QRIS Dinamis</span>
            </button>
            <button
              id="btn-qris-mode-static"
              type="button"
              onClick={() => setViewMode('static')}
              className={`py-1.5 px-2.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                !showingDynamic
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-800 hover:bg-white/70'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Poster QRIS Resmi</span>
            </button>
          </div>
        )}

        {/* QR Code / Official Poster Card */}
        {showingDynamic ? (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden">
            {/* Official-style QRIS Header Strip */}
            <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between gap-2">
              <div className="text-left min-w-0">
                <p className="text-[11px] font-black tracking-wide truncate">
                  {qrisConfig.merchantName}
                </p>
                <p className="text-[10px] font-semibold text-emerald-100 truncate">
                  NMID: {qrisConfig.nmid}
                </p>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-white text-emerald-900 font-black text-[10px] tracking-wider">
                QRIS
              </span>
            </div>

            {/* Scannable Dynamic QR Code — clean quiet zone with ZERO overlapping elements */}
            <div className="p-3 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                aria-label="Perbesar QRIS Dinamis untuk pelanggan"
                className="bg-white p-2 rounded-xl border border-slate-200 hover:border-emerald-500 transition cursor-pointer"
              >
                {dynamicQrDataUrl ? (
                  <img
                    data-testid="qris-dynamic-img"
                    src={dynamicQrDataUrl}
                    alt={`QRIS Dinamis ${qrisConfig.merchantName} sebesar ${formatRupiah(grandTotal)}`}
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <QrCode className="w-10 h-10 text-emerald-700" />
                    <span className="text-[11px] font-bold">Menyiapkan QRIS...</span>
                  </div>
                )}
              </button>

              {/* Embedded Automatic Nominal Bar */}
              <div className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Nominal Otomatis Terisi:</span>
                </span>
                <span className="text-sm font-black text-emerald-950">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-3 flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              aria-label="Perbesar Poster QRIS Resmi untuk pelanggan"
              className="w-full max-w-[240px] bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition cursor-pointer"
            >
              <img
                data-testid="qris-poster-img"
                src={effectivePosterSrc}
                alt={`Poster QRIS Resmi ${qrisConfig.merchantName}`}
                decoding="sync"
                onError={() => {
                  if (!posterLoadFailed && effectivePosterSrc !== DEFAULT_QRIS_IMAGE_URL) {
                    setPosterLoadFailed(true);
                  }
                }}
                className="w-full max-h-[260px] object-contain mx-auto bg-white"
              />
            </button>

            <div className="w-full px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-[11px] font-bold text-amber-950">
                Pelanggan memasukkan nominal manual:{' '}
                <span className="font-black">{formatRupiah(grandTotal)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Cashier Confirmation Guidance & Enlarge Action */}
        <div className="flex items-start justify-between gap-2 pt-0.5 text-left">
          <div className="space-y-0.5">
            <p className="text-[11px] font-black text-slate-900 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Konfirmasi Pembayaran QRIS</span>
            </p>
            <p className="text-[11px] font-medium text-slate-700 leading-snug">
              Pastikan notifikasi masuk ke merchant <strong>{qrisConfig.merchantName}</strong>, lalu klik{' '}
              <strong>Selesai &amp; Cetak Struk</strong>.
            </p>
          </div>
          <button
            id="btn-enlarge-qris"
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="shrink-0 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 rounded-xl text-[11px] font-black flex items-center gap-1 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Customer-facing Enlarged QRIS Modal */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan QRIS Diperbesar"
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-2 border-slate-200"
          >
            <div className="px-5 py-3.5 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black tracking-wide">
                  Scan QRIS — {qrisConfig.merchantName}
                </h4>
                <p className="text-[11px] text-emerald-100 font-semibold">
                  NMID: {qrisConfig.nmid}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup tampilan QRIS diperbesar"
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center space-y-3 bg-slate-50">
              <div className="w-full px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Pembayaran
                </span>
                <span className="text-2xl font-black text-slate-950">
                  {formatRupiah(grandTotal)}
                </span>
              </div>

              {showingDynamic && dynamicQrDataUrl ? (
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
                  <img
                    src={dynamicQrDataUrl}
                    alt={`QRIS Dinamis ${qrisConfig.merchantName}`}
                    className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
                  />
                </div>
              ) : (
                <div className="bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-xs w-full flex justify-center">
                  <img
                    src={effectivePosterSrc}
                    alt={`Poster QRIS Resmi ${qrisConfig.merchantName}`}
                    className="max-h-[60vh] w-auto object-contain rounded-xl"
                  />
                </div>
              )}

              <p className="text-xs font-bold text-slate-700 text-center">
                Mendukung GoPay, OVO, Dana, ShopeePay, LinkAja, BSI Mobile, BCA, Mandiri, BRI, BNI &amp; seluruh aplikasi QRIS.
              </p>

              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Tutup Tampilan Perbesar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

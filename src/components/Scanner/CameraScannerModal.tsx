import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { Product } from '../../types';
import { playScanSound, playErrorSound } from '../../utils/formatters';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  products: Product[];
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  products,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraList, setCameraList] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'reader-qr-camera-element';

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      return;
    }

    let isMounted = true;
    setIsStarting(true);
    setScannerError(null);
    setLastScanned(null);

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameraList(devices);
          // Prefer back camera if available
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('belakang') || d.label.toLowerCase().includes('environment'));
          const camId = backCamera ? backCamera.id : devices[0].id;
          setSelectedCameraId(camId);
          startScanning(camId);
        } else {
          setScannerError('Kamera tidak terdeteksi pada perangkat ini.');
          setIsStarting(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Camera detection issue:', msg);
        setScannerError('Izin akses kamera diperlukan untuk memindai barcode secara langsung.');
        setIsStarting(false);
      }
    };

    const timer = setTimeout(initScanner, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          scannerInstanceRef.current.stop().then(() => {
            scannerInstanceRef.current?.clear();
            scannerInstanceRef.current = null;
          }).catch(() => {
            scannerInstanceRef.current = null;
          });
        } else {
          scannerInstanceRef.current.clear();
          scannerInstanceRef.current = null;
        }
      } catch {
        scannerInstanceRef.current = null;
      }
    }
  };

  const startScanning = async (cameraId: string) => {
    cleanupScanner();
    setIsStarting(true);
    setScannerError(null);

    try {
      const html5QrCode = new Html5Qrcode(elementId);
      scannerInstanceRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777,
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );
      setIsStarting(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Failed to start camera scanner:', msg);
      setScannerError('Tidak dapat membuka stream video kamera: ' + msg);
      setIsStarting(false);
    }
  };

  const handleSuccessfulScan = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    
    playScanSound();
    setLastScanned(cleanCode);
    onScan(cleanCode);
    
    // Quick flash feedback
    setTimeout(() => {
      setLastScanned(null);
    }, 1500);
  };

  const handleQuickSimulate = (code: string) => {
    handleSuccessfulScan(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Camera className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Pemindai Barcode Kamera</h3>
              <p className="text-xs text-emerald-100/80">Arahkan barcode barang ke dalam kotak pemindai</p>
            </div>
          </div>
          <button
            id="close-camera-scanner-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Camera Selector */}
          {cameraList.length > 1 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium whitespace-nowrap">Pilih Kamera:</span>
              <select
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanning(e.target.value);
                }}
              >
                {cameraList.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${cam.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Viewport */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[240px] flex items-center justify-center border-2 border-dashed border-emerald-500/40">
            <div id={elementId} className="w-full h-full" />
            
            {/* Guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-64 h-36 border-2 border-emerald-400 rounded-lg relative shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                {/* Red Laser Scanning line */}
                <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                {/* Corner reticles */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
              </div>
              <p className="mt-3 text-xs text-white/80 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                Posisikan garis merah melintang di atas kode barcode
              </p>
            </div>

            {/* Loading / Error States */}
            {isStarting && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-2">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs font-medium">Menghubungkan ke kamera...</p>
              </div>
            )}

            {scannerError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-sm font-semibold text-amber-200">{scannerError}</p>
                <p className="text-xs text-slate-300">
                  Gunakan tombol simulasi di bawah untuk menguji pembacaan barcode tanpa kamera.
                </p>
              </div>
            )}

            {lastScanned && (
              <div className="absolute inset-x-4 top-4 bg-emerald-500 text-white py-2 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 animate-bounce">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold text-sm">Terpindai: {lastScanned}</span>
              </div>
            )}
          </div>

          {/* Quick Simulation Barcode Testing Buttons */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Simulasi Scan Cepat (Klik untuk Uji):
              </span>
              <span className="text-[10px] text-slate-500">Contoh Barcode Barang</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  id={`btn-sim-scan-${p.code}`}
                  onClick={() => handleQuickSimulate(p.barcode)}
                  className="flex flex-col items-start p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition group"
                >
                  <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 group-hover:underline">
                    {p.barcode}
                  </span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-200 line-clamp-1">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Stok: {p.stock} {p.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Tip: Gunakan Barcode Scanner USB untuk transaksi kasir tercepat</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

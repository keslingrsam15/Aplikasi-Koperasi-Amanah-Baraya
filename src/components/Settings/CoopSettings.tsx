import React, { useState, useEffect } from 'react';
import { CoopConfig, Product, Transaction, StockMutation, UserProfile, PrinterConfig, BannerSlide } from '../../types';
import {
  Settings,
  Store,
  Printer,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  Bluetooth,
  FileText,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Cloud,
  RefreshCw,
  Copy,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  Key,
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  X,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { defaultBannerSlides } from '../Dashboard/BannerSlider';
import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  getActiveBluetoothPrinter,
  isBluetoothSupported,
  generateEscPosTest,
  printViaBluetooth,
  printViaBrowserNative,
} from '../../utils/escPosPrinter';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncAllToSupabase,
  fetchProductsFromSupabase,
  fetchTransactionsFromSupabase,
  fetchMutationsFromSupabase,
  fetchUsersFromSupabase,
  fetchConfigFromSupabase,
  saveConfigToSupabase,
  uploadCoopLogo,
  uploadBannerImage,
  uploadWelcomeWallpaper,
  SUPABASE_SQL_SCHEMA,
  getMissingTables,
} from '../../services/supabase';

interface CoopSettingsProps {
  config: CoopConfig;
  products: Product[];
  transactions: Transaction[];
  mutations: StockMutation[];
  users: UserProfile[];
  onSaveConfig: (newConfig: CoopConfig) => void;
  onRestoreAllData: (data: {
    config?: CoopConfig;
    products?: Product[];
    transactions?: Transaction[];
    mutations?: StockMutation[];
    users?: UserProfile[];
  }) => void;
  onResetToDefault: () => void;
  onPreviewWelcome?: () => void;
}

export const CoopSettings: React.FC<CoopSettingsProps> = ({
  config,
  products,
  transactions,
  mutations,
  users,
  onSaveConfig,
  onRestoreAllData,
  onResetToDefault,
  onPreviewWelcome,
}) => {
  const [formConfig, setFormConfig] = useState<CoopConfig>(() => ({
    ...config,
    name: (config.name || 'KOPERASI AMANAH BARAYA').replace(/karyawan\s*/gi, '').replace(/\s+/g, ' ').trim(),
    paperWidth: config.paperWidth || '58mm',
    printerConfig: config.printerConfig || {
      connectionType: 'browser',
      paperWidth: config.paperWidth || '58mm',
      autoPrintOnPayment: true,
      printCopies: 1,
      showLogoOrKop: true,
      showBarcodeOnReceipt: true,
      charPerLine: config.paperWidth === '80mm' ? 48 : 32,
    },
  }));

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [bluetoothState, setBluetoothState] = useState(() => getActiveBluetoothPrinter());
  const [isConnectingBt, setIsConnectingBt] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Supabase state
  const [supabaseConfig, setSupabaseConfigState] = useState(() => getSupabaseConfig());
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [isPullingSupabase, setIsPullingSupabase] = useState<boolean>(false);
  const [isCopiedSql, setIsCopiedSql] = useState<boolean>(false);
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);

  // Banner Slider Management State
  const [isEditingSlideModal, setIsEditingSlideModal] = useState<boolean>(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState<Omit<BannerSlide, 'id'>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    badge: 'PROMO KOPERASI',
    linkTab: 'pos',
    linkText: 'Mulai Transaksi Kasir',
    isActive: true,
  });
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseConfig);
    showToast('Kredensial Supabase berhasil disimpan!', 'success');
    handleTestSupabase();
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseStatus(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'Gagal mengetes koneksi Supabase';
      setSupabaseStatus({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncAllToSupabase = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      showToast('Konfigurasi URL dan Anon Key Supabase terlebih dahulu.', 'error');
      return;
    }
    setIsSyncingSupabase(true);
    try {
      const res = await syncAllToSupabase({
        products,
        transactions,
        mutations,
        users,
        config: formConfig,
      });
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal sinkronisasi ke Supabase', 'error');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      showToast('Konfigurasi URL dan Anon Key Supabase terlebih dahulu.', 'error');
      return;
    }
    if (!window.confirm('Tarik seluruh data dari Supabase Cloud dan perbarui data di aplikasi kasir?')) {
      return;
    }

    setIsPullingSupabase(true);
    try {
      const [p, t, m, u, c] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchTransactionsFromSupabase(),
        fetchMutationsFromSupabase(),
        fetchUsersFromSupabase(),
        fetchConfigFromSupabase(),
      ]);

      const restored: any = {};
      if (p) restored.products = p;
      if (t) restored.transactions = t;
      if (m) restored.mutations = m;
      if (u) restored.users = u;
      if (c) {
        restored.config = c;
        setFormConfig(c);
      }

      onRestoreAllData(restored);
      showToast('Berhasil mengambil dan menyinkronkan data terbaru dari Supabase!', 'success');
    } catch (err: any) {
      showToast('Gagal menarik data dari Supabase: ' + (err?.message || String(err)), 'error');
    } finally {
      setIsPullingSupabase(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopiedSql(true);
    showToast('Skrip SQL Schema Supabase berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopiedSql(false), 3000);
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const url = await uploadCoopLogo(file);
      const updatedConfig = { ...formConfig, logoUrl: url };
      setFormConfig(updatedConfig);
      onSaveConfig(updatedConfig);
      await saveConfigToSupabase(updatedConfig);
      showToast('Logo koperasi berhasil diunggah & tersimpan di Supabase Cloud!', 'success');
    } catch (err: any) {
      showToast('Gagal mengunggah logo: ' + (err?.message || String(err)), 'error');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    const updatedConfig = { ...formConfig, logoUrl: undefined };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
    showToast('Logo koperasi berhasil dihapus.', 'info');
  };

  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState<boolean>(false);
  const [newSliderUrlInput, setNewSliderUrlInput] = useState<string>('');

  const currentSliderUrls = React.useMemo(() => {
    if (formConfig.welcomeSliderUrls && formConfig.welcomeSliderUrls.length > 0) {
      return formConfig.welcomeSliderUrls;
    }
    return formConfig.welcomeWallpaperUrl ? [formConfig.welcomeWallpaperUrl] : [];
  }, [formConfig.welcomeSliderUrls, formConfig.welcomeWallpaperUrl]);

  const handleAddSliderFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentSliderUrls.length >= 5) {
      showToast('Maksimal 5 gambar slider untuk Welcome Screen.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 10MB', 'error');
      return;
    }

    setIsUploadingWallpaper(true);
    try {
      const url = await uploadWelcomeWallpaper(file);
      const newUrls = [...currentSliderUrls, url].slice(0, 5);
      const updatedConfig = {
        ...formConfig,
        welcomeSliderUrls: newUrls,
        welcomeWallpaperUrl: newUrls[0],
      };
      setFormConfig(updatedConfig);
      onSaveConfig(updatedConfig);
      await saveConfigToSupabase(updatedConfig);
      showToast('Gambar slider Welcome Page berhasil ditambahkan!', 'success');
    } catch (err: any) {
      showToast('Gagal mengunggah gambar: ' + (err?.message || String(err)), 'error');
    } finally {
      setIsUploadingWallpaper(false);
      e.target.value = '';
    }
  };

  const handleAddSliderUrl = async () => {
    if (!newSliderUrlInput.trim()) return;
    if (currentSliderUrls.length >= 5) {
      showToast('Maksimal 5 gambar slider untuk Welcome Screen.', 'error');
      return;
    }
    const newUrls = [...currentSliderUrls, newSliderUrlInput.trim()].slice(0, 5);
    const updatedConfig = {
      ...formConfig,
      welcomeSliderUrls: newUrls,
      welcomeWallpaperUrl: newUrls[0],
    };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
    setNewSliderUrlInput('');
    showToast('Tautan gambar slider berhasil ditambahkan!', 'success');
  };

  const handleRemoveSliderImage = async (index: number) => {
    const newUrls = currentSliderUrls.filter((_, idx) => idx !== index);
    const updatedConfig = {
      ...formConfig,
      welcomeSliderUrls: newUrls.length > 0 ? newUrls : undefined,
      welcomeWallpaperUrl: newUrls.length > 0 ? newUrls[0] : undefined,
    };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
    showToast('Gambar slider berhasil dihapus.', 'info');
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleAddSliderFile(e);
  };

  const handleRemoveWallpaper = async () => {
    const updatedConfig = {
      ...formConfig,
      welcomeWallpaperUrl: undefined,
      welcomeSliderUrls: undefined,
    };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
    showToast('Semua gambar slider dihapus. Welcome Page kembali menggunakan gambar bawaan.', 'info');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formConfig);
    await saveConfigToSupabase(formConfig);
    setSavedSuccess(true);
    showToast('Pengaturan identitas, logo, dan printer berhasil disimpan ke Supabase!', 'success');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Banner Slider Management Handlers
  const handleToggleBannerSlider = async (show: boolean) => {
    const updated = { ...formConfig, showBannerSlider: show };
    setFormConfig(updated);
    onSaveConfig(updated);
    await saveConfigToSupabase(updated);
    showToast(`Banner slider dashboard ${show ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
  };

  const handleChangeAutoPlayInterval = async (interval: number) => {
    const updated = { ...formConfig, bannerAutoPlayInterval: interval };
    setFormConfig(updated);
    onSaveConfig(updated);
    await saveConfigToSupabase(updated);
  };

  const handleOpenAddSlide = () => {
    setEditingSlideId(null);
    setSlideForm({
      imageUrl: '',
      title: '',
      subtitle: '',
      badge: 'PROMO KOPERASI',
      linkTab: 'pos',
      linkText: 'Mulai Transaksi Kasir',
      isActive: true,
    });
    setIsEditingSlideModal(true);
  };

  const handleOpenEditSlide = (slide: BannerSlide) => {
    setEditingSlideId(slide.id);
    setSlideForm({
      imageUrl: slide.imageUrl,
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      badge: slide.badge || '',
      linkTab: slide.linkTab || 'pos',
      linkText: slide.linkText || 'Buka Halaman',
      isActive: slide.isActive !== false,
    });
    setIsEditingSlideModal(true);
  };

  const handleSaveSlideForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.imageUrl.trim()) {
      showToast('Harap unggah gambar banner atau masukkan URL gambar.', 'error');
      return;
    }

    const slides = [...(formConfig.bannerSlides || defaultBannerSlides)];
    if (editingSlideId) {
      // Update existing
      const idx = slides.findIndex((s) => s.id === editingSlideId);
      if (idx !== -1) {
        slides[idx] = {
          id: editingSlideId,
          ...slideForm,
        };
      }
    } else {
      // Add new
      slides.push({
        id: `banner-${Date.now()}`,
        ...slideForm,
      });
    }

    const updatedConfig = { ...formConfig, bannerSlides: slides, showBannerSlider: true };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
    setIsEditingSlideModal(false);
    showToast('Slide banner berhasil disimpan ke Supabase Cloud!', 'success');
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (window.confirm('Hapus slide banner ini dari slider dashboard?')) {
      const slides = (formConfig.bannerSlides || defaultBannerSlides).filter((s) => s.id !== slideId);
      const updatedConfig = { ...formConfig, bannerSlides: slides };
      setFormConfig(updatedConfig);
      onSaveConfig(updatedConfig);
      await saveConfigToSupabase(updatedConfig);
      showToast('Slide banner berhasil dihapus dari Supabase.', 'info');
    }
  };

  const handleToggleSlideActive = async (slideId: string) => {
    const slides = (formConfig.bannerSlides || defaultBannerSlides).map((s) =>
      s.id === slideId ? { ...s, isActive: !s.isActive } : s
    );
    const updatedConfig = { ...formConfig, bannerSlides: slides };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const slides = [...(formConfig.bannerSlides || defaultBannerSlides)];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;

    const updatedConfig = { ...formConfig, bannerSlides: slides };
    setFormConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    await saveConfigToSupabase(updatedConfig);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran berkas gambar banner maksimal 5MB.', 'error');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const url = await uploadBannerImage(file);
      setSlideForm((prev) => ({ ...prev, imageUrl: url }));
      showToast('Gambar banner berhasil diunggah ke Supabase Cloud!', 'success');
    } catch (err: any) {
      showToast('Gagal mengunggah banner: ' + (err?.message || String(err)), 'error');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleResetBannerSlides = async () => {
    if (window.confirm('Reset daftar banner slider ke contoh promosi bawaan?')) {
      const updatedConfig = { ...formConfig, bannerSlides: defaultBannerSlides, showBannerSlider: true };
      setFormConfig(updatedConfig);
      onSaveConfig(updatedConfig);
      await saveConfigToSupabase(updatedConfig);
      showToast('Banner slider direset ke konfigurasi bawaan.', 'success');
    }
  };

  const handleConnectBluetooth = async () => {
    setIsConnectingBt(true);
    try {
      const result = await connectBluetoothPrinter();
      setBluetoothState(getActiveBluetoothPrinter());
      if (result.success) {
        setFormConfig((prev) => ({
          ...prev,
          printerConfig: {
            ...(prev.printerConfig || {
              connectionType: 'bluetooth',
              paperWidth: prev.paperWidth || '58mm',
              autoPrintOnPayment: true,
              printCopies: 1,
              showLogoOrKop: true,
              showBarcodeOnReceipt: true,
              charPerLine: 32,
            }),
            connectionType: 'bluetooth',
            bluetoothDeviceName: result.name,
          },
        }));
        showToast(`Printer Bluetooth "${result.name}" berhasil terhubung!`, 'success');
      } else {
        showToast(result.error || 'Gagal koneksi Bluetooth.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyambungkan printer Bluetooth.', 'error');
    } finally {
      setIsConnectingBt(false);
    }
  };

  const handleDisconnectBluetooth = () => {
    disconnectBluetoothPrinter();
    setBluetoothState(getActiveBluetoothPrinter());
    setFormConfig((prev) => ({
      ...prev,
      printerConfig: {
        ...(prev.printerConfig || {
          connectionType: 'browser',
          paperWidth: prev.paperWidth || '58mm',
          autoPrintOnPayment: true,
          printCopies: 1,
          showLogoOrKop: true,
          showBarcodeOnReceipt: true,
          charPerLine: 32,
        }),
        connectionType: 'browser',
        bluetoothDeviceName: undefined,
      },
    }));
    showToast('Printer Bluetooth diputuskan.', 'info');
  };

  const handleTestPrint = async () => {
    if (bluetoothState.connected) {
      const testData = generateEscPosTest(formConfig, formConfig.paperWidth || '58mm');
      const result = await printViaBluetooth(testData, 1);
      if (result.success) {
        showToast('Cetak uji coba ESC/POS via Bluetooth berhasil!', 'success');
      } else {
        showToast(result.error || 'Gagal cetak uji coba.', 'error');
      }
    } else {
      // Test print via browser native thermal dialog
      const testDiv = document.createElement('div');
      testDiv.id = 'temp-test-receipt';
      testDiv.style.display = 'none';
      testDiv.innerHTML = `
        <div style="font-family: monospace; text-align: center; padding: 10px; width: 100%; max-width: 300px; margin: auto;">
          <h3 style="margin:0; text-transform:uppercase;">${formConfig.name}</h3>
          <p style="margin:2px 0; font-size:12px; font-weight:bold;">${formConfig.hospitalName}</p>
          <p style="margin:2px 0; font-size:10px;">${formConfig.address}</p>
          <hr style="border-top:1px dashed #000; margin:8px 0;" />
          <p style="font-weight:bold; font-size:12px; margin:4px 0;">TES CETAK PRINTER THERMAL</p>
          <p style="font-size:11px; margin:2px 0;">Lebar Kertas: ${formConfig.paperWidth}</p>
          <p style="font-size:11px; margin:2px 0;">Waktu: ${new Date().toLocaleString('id-ID')}</p>
          <hr style="border-top:1px dashed #000; margin:8px 0;" />
          <p style="font-size:10px; margin:4px 0;">Koneksi Printer Siap Digunakan untuk Transaksi Kasir</p>
        </div>
      `;
      document.body.appendChild(testDiv);
      printViaBrowserNative('temp-test-receipt');
      setTimeout(() => {
        if (testDiv.parentNode) testDiv.parentNode.removeChild(testDiv);
      }, 3000);
      showToast('Kotak dialog uji coba cetak printer dibuka.', 'info');
    }
  };

  // Download JSON Backup
  const handleDownloadBackup = () => {
    const fullBackup = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      app: 'Kasir Koperasi Amanah Baraya RSUD Al-Mulk',
      config: formConfig,
      products,
      transactions,
      mutations,
      users,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `Backup_Koperasi_RSUD_Al_Mulk_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
  };

  // Restore JSON Backup
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products && Array.isArray(json.products)) {
          if (window.confirm('File backup valid ditemukan. Restore data sekarang?')) {
            onRestoreAllData(json);
            if (json.config) setFormConfig(json.config);
            showToast('Data sistem berhasil dipulihkan dari file backup!', 'success');
          }
        } else {
          showToast('Format file JSON tidak sesuai dengan struktur database koperasi.', 'error');
        }
      } catch (err) {
        showToast('Gagal membaca file JSON: ' + String(err), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Pengaturan Profil, Printer & Struk Kasir
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sesuaikan identitas RSUD Al-Mulk, integrasi printer thermal Bluetooth / USB, format kertas 58mm/80mm, dan ekspor PDF
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-2 font-bold text-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
              : 'bg-teal-50 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Koperasi */}
        <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Store className="w-4 h-4 text-emerald-600" />
            Identitas Koperasi & Rumah Sakit (Kop Struk & Laporan)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Koperasi:
              </label>
              <input
                type="text"
                required
                value={formConfig.name}
                onChange={(e) => setFormConfig({ ...formConfig, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Instansi / Rumah Sakit:
              </label>
              <input
                type="text"
                required
                value={formConfig.hospitalName}
                onChange={(e) => setFormConfig({ ...formConfig, hospitalName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Lengkap Unit Koperasi:
            </label>
            <input
              type="text"
              required
              value={formConfig.address}
              onChange={(e) => setFormConfig({ ...formConfig, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Pengaturan Logo Koperasi & Sidebar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Logo Koperasi (Tampil di Sidebar Header & Kop Struk)</span>
              </label>
              {formConfig.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Logo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Box */}
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center p-2 shrink-0 shadow-inner overflow-hidden relative">
                {formConfig.logoUrl ? (
                  <img
                    src={formConfig.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-600 dark:text-slate-500">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] block leading-tight font-medium">Belum ada logo</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-xs">
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah ke Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Pilih & Unggah File Logo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mendukung PNG, JPG, SVG, WebP (Maks 5MB)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Atau masukkan tautan URL gambar online (https://...)"
                    value={formConfig.logoUrl || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, logoUrl: e.target.value || undefined })}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Logo akan otomatis disinkronkan ke Supabase Cloud dan tampil di Header Sidebar & Kop Struk Transaksi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kota & Kode Pos:
              </label>
              <input
                type="text"
                value={formConfig.city}
                onChange={(e) => setFormConfig({ ...formConfig, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Telepon / WhatsApp:
              </label>
              <input
                type="text"
                value={formConfig.phone}
                onChange={(e) => setFormConfig({ ...formConfig, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Pengaturan Wallpaper Layar Pembuka (Welcome Page) */}
        <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Wallpaper Layar Pembuka (Welcome Page)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kustomisasi latar belakang layar awal aplikasi saat dibuka. Terintegrasi & tersimpan otomatis di Supabase Cloud.
                </p>
              </div>
            </div>

            {onPreviewWelcome && (
              <button
                type="button"
                onClick={onPreviewWelcome}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lihat Layar Welcome</span>
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Gambar Slider Welcome Screen (Maksimal 5 Gambar)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Gambar slider di Welcome Screen berganti otomatis setiap 5 detik secara bersih tanpa badge/teks yang menghalangi.
                </p>
              </div>
              {currentSliderUrls.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveWallpaper}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua Slider
                </button>
              )}
            </div>

            {/* List of active slider images */}
            {currentSliderUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                {currentSliderUrls.map((url, index) => (
                  <div key={index} className="relative group p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="w-full h-24 rounded-lg bg-slate-900 overflow-hidden relative">
                      <img
                        src={url}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute top-1 left-1 bg-emerald-700 text-white font-black text-[9px] px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSliderImage(index)}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md opacity-90 group-hover:opacity-100 transition cursor-pointer"
                        title="Hapus Slide Ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...currentSliderUrls];
                        newUrls[index] = e.target.value;
                        const updated = {
                          ...formConfig,
                          welcomeSliderUrls: newUrls,
                          welcomeWallpaperUrl: newUrls[0],
                        };
                        setFormConfig(updated);
                        onSaveConfig(updated);
                        saveConfigToSupabase(updated);
                      }}
                      className="w-full px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                      placeholder="URL Gambar..."
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add New Slide controls (if < 5) */}
            {currentSliderUrls.length < 5 ? (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  + Tambah Gambar Slider Baru ({currentSliderUrls.length}/5)
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow-xs active:scale-95 shrink-0">
                    {isUploadingWallpaper ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Gambar (JPG/PNG)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddSliderFile}
                      disabled={isUploadingWallpaper}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2 flex-1 w-full">
                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar online (https://...)"
                      value={newSliderUrlInput}
                      onChange={(e) => setNewSliderUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSliderUrl();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSliderUrl}
                      disabled={!newSliderUrlInput.trim()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition cursor-pointer shrink-0"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Batas maksimal 5 gambar slider sudah tercapai. Hapus salah satu gambar untuk menambahkan gambar baru.
              </p>
            )}
          </div>
        </div>

        {/* Pengaturan Banner Slider Dashboard */}
        <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Banner Slider Dashboard (Promosi & Pengumuman)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Gambar slider di atas ringkasan penjualan Dashboard. Terhubung langsung & tersimpan di Supabase Cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formConfig.showBannerSlider !== false}
                  onChange={(e) => handleToggleBannerSlider(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formConfig.showBannerSlider !== false ? 'Slider Aktif' : 'Slider Dinonaktifkan'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleOpenAddSlide}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Slide Banner</span>
              </button>
            </div>
          </div>

          {/* Slider Options: Interval Auto-Play */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Kecepatan Geser Otomatis (Auto-Play):
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[3, 5, 7, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleChangeAutoPlayInterval(sec)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    (formConfig.bannerAutoPlayInterval || 5) === sec
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sec} Detik
                </button>
              ))}
            </div>
          </div>

          {/* List of Banner Slides */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              <span>DAFTAR GAMBAR SLIDER ({(formConfig.bannerSlides || defaultBannerSlides).length} SLIDE)</span>
              <button
                type="button"
                onClick={handleResetBannerSlides}
                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset ke Contoh Bawaan
              </button>
            </div>

            {(formConfig.bannerSlides || defaultBannerSlides).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Belum ada slide banner yang ditambahkan</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Klik tombol "Tambah Slide Banner" untuk mengunggah foto promosi atau informasi koperasi.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddSlide}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition text-xs"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Slide Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(formConfig.bannerSlides || defaultBannerSlides).map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={`p-3 bg-white dark:bg-slate-800 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                      slide.isActive !== false
                        ? 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || 'Slide Banner'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/60 text-white text-[9px] font-bold">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {slide.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              {slide.badge}
                            </span>
                          )}
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {slide.title || '(Tanpa Judul)'}
                          </h4>
                        </div>

                        {slide.subtitle && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {slide.subtitle}
                          </p>
                        )}

                        {slide.linkTab && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Menu Tujuan: {slide.linkTab.toUpperCase()}
                            </span>
                            {slide.linkText && (
                              <span className="text-slate-400">&bull; Tombol: "{slide.linkText}"</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Controls (Reorder, Active Toggle, Edit, Delete) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Reorder Up/Down */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, 'up')}
                          aria-label="Geser ke Atas"
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (formConfig.bannerSlides || defaultBannerSlides).length - 1}
                          onClick={() => handleMoveSlide(idx, 'down')}
                          aria-label="Geser ke Bawah"
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 border-l border-slate-200 dark:border-slate-700"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Active / Inactive Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSlideActive(slide.id)}
                        title={slide.isActive !== false ? 'Nonaktifkan Slide' : 'Aktifkan Slide'}
                        className={`p-1.5 rounded-xl border transition ${
                          slide.isActive !== false
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {slide.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditSlide(slide)}
                        title="Edit Slide Banner"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        title="Hapus Slide Banner"
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pengaturan Koneksi Printer Thermal & Format Struk */}
        <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-teal-600" />
              Integrasi Printer Thermal Kasir (Bluetooth, USB & Browser)
            </h3>
            {bluetoothState.connected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                <Bluetooth className="w-3 h-3" />
                {bluetoothState.name}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Mode Printer Browser / Standar
              </span>
            )}
          </div>

          {/* Bluetooth Device Management Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bluetooth className="w-4 h-4 text-blue-600" />
                  Koneksi Langsung Web Bluetooth (POS Thermal ESC/POS)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hubungkan printer Bluetooth (POS-58, POS-80, Panda, RPP02, ZJ-5802, dsb.) langsung tanpa perlu install driver tambahan.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {bluetoothState.connected ? (
                  <>
                    <button
                      type="button"
                      onClick={handleTestPrint}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Tes Cetak</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectBluetooth}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-lg font-semibold border border-red-300 dark:border-red-800 transition"
                    >
                      Putuskan
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectBluetooth}
                    disabled={isConnectingBt}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {isConnectingBt ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bluetooth className="w-4 h-4" />
                    )}
                    <span>Sambungkan Printer Bluetooth</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paper Size, Copies, and Auto Print Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ukuran Kertas Thermal Standar:
              </label>
              <select
                value={formConfig.paperWidth}
                onChange={(e) => {
                  const width = e.target.value as '58mm' | '80mm';
                  setFormConfig({
                    ...formConfig,
                    paperWidth: width,
                    printerConfig: {
                      ...(formConfig.printerConfig || {
                        connectionType: 'browser',
                        paperWidth: width,
                        autoPrintOnPayment: true,
                        printCopies: 1,
                        showLogoOrKop: true,
                        showBarcodeOnReceipt: true,
                        charPerLine: width === '80mm' ? 48 : 32,
                      }),
                      paperWidth: width,
                      charPerLine: width === '80mm' ? 48 : 32,
                    },
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="58mm">58mm (Roll Kecil Kasir / Warkop Standar)</option>
                <option value="80mm">80mm (Roll Lebar Supermarket / POS)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Lembar Cetak per Transaksi:
              </label>
              <select
                value={formConfig.printerConfig?.printCopies || 1}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    printerConfig: {
                      ...(formConfig.printerConfig || {
                        connectionType: 'browser',
                        paperWidth: formConfig.paperWidth || '58mm',
                        autoPrintOnPayment: true,
                        printCopies: 1,
                        showLogoOrKop: true,
                        showBarcodeOnReceipt: true,
                        charPerLine: 32,
                      }),
                      printCopies: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value={1}>1 Lembar (Untuk Pembeli)</option>
                <option value={2}>2 Lembar (Pembeli + Arsip Kasir)</option>
                <option value={3}>3 Lembar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cetak Otomatis saat Bayar Selesai:
              </label>
              <div className="flex items-center mt-2 space-x-2">
                <input
                  type="checkbox"
                  id="autoPrintCheckbox"
                  checked={formConfig.printerConfig?.autoPrintOnPayment ?? true}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      printerConfig: {
                        ...(formConfig.printerConfig || {
                          connectionType: 'browser',
                          paperWidth: formConfig.paperWidth || '58mm',
                          autoPrintOnPayment: true,
                          printCopies: 1,
                          showLogoOrKop: true,
                          showBarcodeOnReceipt: true,
                          charPerLine: 32,
                        }),
                        autoPrintOnPayment: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="autoPrintCheckbox" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Langsung Cetak Otomatis
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Kaki Struk (Receipt Footer):
            </label>
            <textarea
              rows={3}
              value={formConfig.receiptFooter}
              onChange={(e) => setFormConfig({ ...formConfig, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              id="btn-save-settings"
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition active:scale-95"
            >
              Simpan Perubahan Pengaturan
            </button>

            <button
              type="button"
              onClick={handleTestPrint}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Tes Cetak Struk Uji Coba</span>
            </button>
          </div>
        </div>
      </form>

      {/* Supabase Cloud Database Integration Box */}
      <div className="bg-white p-6 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.15),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black shadow-sm">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Integrasi Database Cloud Supabase
              </h3>
              <p className="text-[11px] text-slate-600 font-bold">
                Sinkronisasi online realtime data kasir, produk, mutasi stok, transaksi, & foto produk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {supabaseStatus?.success ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-black text-[11px] flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Terhubung ke Supabase Cloud
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-[11px] flex items-center gap-1.5 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                Belum Terhubung
              </span>
            )}
          </div>
        </div>

        {/* Missing Tables Notice Banner (PGRST205 / 42P01) */}
        {getMissingTables().length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-black text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                <span>Skema Database Supabase Belum Dibuat ({getMissingTables().length} Tabel Belum Ditemukan)</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                {isCopiedSql ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedSql ? 'Tersalin!' : 'Salin Skrip SQL Pembuatan Tabel'}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-900 dark:text-amber-300 font-medium leading-relaxed">
              Tabel <code className="font-mono font-bold bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-amber-950 dark:text-amber-100">{getMissingTables().map(t => `public.${t}`).join(', ')}</code> belum dibuat di project Supabase Anda (Error PGRST205).
              Aplikasi kasir tetap berjalan lancar menggunakan simpanan lokal. Untuk mengaktifkan sinkronisasi cloud penuh:
              <br />
              <span className="font-bold">Solusi 1-Klik:</span> Klik tombol <strong>&quot;Salin Skrip SQL Pembuatan Tabel&quot;</strong> di atas &rarr; Buka <strong>Dashboard Supabase &gt; SQL Editor &gt; New Query &gt; Paste &gt; Run</strong>.
            </p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-slate-900 mb-1">
                Supabase Project URL:
              </label>
              <input
                type="text"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfigState({ ...supabaseConfig, url: e.target.value.trim() })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-950 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-xs shadow-2xs"
              />
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                Ditemukan di Dashboard Supabase &gt; Project Settings &gt; API &gt; Project URL
              </p>
            </div>

            <div>
              <label className="block font-black text-slate-900 mb-1">
                Supabase Anon / Public Key:
              </label>
              <input
                type="password"
                value={supabaseConfig.anonKey}
                onChange={(e) => setSupabaseConfigState({ ...supabaseConfig, anonKey: e.target.value.trim() })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-950 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-xs shadow-2xs"
              />
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                Ditemukan di Dashboard Supabase &gt; Project Settings &gt; API &gt; Project API keys (anon public)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-xs active:scale-95"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Simpan Kredensial Supabase</span>
            </button>

            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold border border-slate-300 rounded-xl transition flex items-center gap-2 shadow-2xs disabled:opacity-50"
            >
              {isTestingSupabase ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
              )}
              <span>Tes Koneksi</span>
            </button>
          </div>

          {supabaseStatus?.message && (
            <div className={`p-3 rounded-xl border text-xs font-bold ${
              supabaseStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {supabaseStatus.message}
            </div>
          )}
        </form>

        {/* Sync Actions & SQL Schema */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSyncAllToSupabase}
              disabled={isSyncingSupabase}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isSyncingSupabase ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload & Sinkronkan Semua Data Lokal ke Supabase</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromSupabase}
              disabled={isPullingSupabase}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isPullingSupabase ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Tarik Data Terbaru dari Supabase Cloud</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSqlSchema(!showSqlSchema)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-slate-700" />
            <span>{showSqlSchema ? 'Tutup Skema SQL' : 'Lihat Skema SQL Supabase'}</span>
          </button>
        </div>

        {/* SQL Schema Viewer Drawer */}
        {showSqlSchema && (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-xs">Skrip DDL Pembuatan Tabel & Storage Supabase</p>
                <p className="text-[10px] text-slate-400">Salin skrip di bawah lalu jalankan di Supabase Dashboard &gt; SQL Editor &gt; Run</p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
              >
                {isCopiedSql ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedSql ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
              </button>
            </div>
            <pre className="text-[10px] font-mono bg-slate-950 p-3 rounded-xl overflow-x-auto max-h-60 text-emerald-400 border border-slate-800 leading-relaxed select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}
      </div>

      {/* Backup & Restore Database Box */}
      <div className="bg-white p-5 rounded-3xl border border-white shadow-[10px_10px_30px_rgba(0,0,0,0.2),-10px_-10px_30px_rgba(255,255,255,0.8)] space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
          <Database className="w-4 h-4 text-teal-600" />
          Pencadangan & Pemulihan Data (Backup / Restore)
        </h3>

        <p className="text-slate-500">
          Unduh seluruh data produk, riwayat transaksi, mutasi stok, dan akun kasir ke dalam file JSON aman di perangkat Anda.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup Database (.json)</span>
          </button>

          <label className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer transition">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Restore Data dari JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('PERINGATAN: Seluruh data akan direset kembali ke data awal contoh Koperasi RSUD Al-Mulk. Lanjutkan?')) {
                onResetToDefault();
                showToast('Data berhasil direset ke konfigurasi standar!', 'info');
              }
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Contoh Awal</span>
          </button>
        </div>
      </div>

      {/* Modal Add / Edit Slide Banner */}
      {isEditingSlideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingSlideId ? 'Edit Slide Banner' : 'Tambah Slide Banner Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gambar & teks akan disinkronkan ke Supabase Cloud
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingSlideModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlideForm} className="space-y-4 text-xs">
              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Gambar Banner Slide <span className="text-rose-500">*</span>:
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {/* Thumbnail Preview */}
                  <div className="w-full sm:w-36 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                    {slideForm.imageUrl ? (
                      <img
                        src={slideForm.imageUrl}
                        alt="Preview Slide"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block">Belum ada gambar</span>
                      </div>
                    )}
                  </div>

                  {/* Upload button & Input URL */}
                  <div className="flex-1 w-full space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-xs">
                      {isUploadingBanner ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengunggah ke Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Unggah File Gambar</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBanner}
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500 block">
                      Rekomendasi rasio landscape lebar (misal 1200x500 px, maks 5MB)
                    </span>

                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar web (https://...)"
                      value={slideForm.imageUrl}
                      onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label / Badge (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PROMO SPESIAL, ANGGOTA RSUD, WARKOP"
                    value={slideForm.badge || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Utama Slide:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Diskon Karyawan RSUD Al-Mulk"
                    value={slideForm.title || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat / Subjudul:
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Nikmati potongan harga dan fasilitas potong payroll otomatis setiap pembelian kebutuhan harian."
                  value={slideForm.subtitle || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Button & Link Tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Menu Navigasi Tombol:
                  </label>
                  <select
                    value={slideForm.linkTab || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, linkTab: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">(Tanpa Tombol Aksi)</option>
                    <option value="pos">Kasir POS (Mulai Belanja)</option>
                    <option value="products">Katalog & Manajemen Produk</option>
                    <option value="stock">Mutasi & Stok Opname</option>
                    <option value="reports">Laporan Penjualan</option>
                    <option value="coop">Profil Koperasi & Simpan Pinjam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Label Tombol:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mulai Transaksi Kasir"
                    value={slideForm.linkText || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, linkText: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slideActiveCheck"
                  checked={slideForm.isActive !== false}
                  onChange={(e) => setSlideForm({ ...slideForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="slideActiveCheck" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Aktifkan & Tampilkan Slide Ini di Dashboard
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditingSlideModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingBanner || !slideForm.imageUrl.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan ke Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

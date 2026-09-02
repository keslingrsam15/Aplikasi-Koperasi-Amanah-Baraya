import React, { useState, useEffect, useRef } from 'react';
import { BannerSlide } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  ArrowRight,
  Image as ImageIcon,
  Play,
  Pause,
  ShoppingBag,
  Gift,
  Building2,
} from 'lucide-react';

interface BannerSliderProps {
  slides?: BannerSlide[];
  autoPlayInterval?: number; // In seconds
  onNavigate: (tab: string) => void;
  onManageBanners?: () => void;
  canManage?: boolean;
}

export const defaultBannerSlides: BannerSlide[] = [
  {
    id: 'default-slide-1',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    title: 'Layanan Kasir & Pertokoan Terpadu',
    subtitle: 'Koperasi Amanah Baraya RSUD Al-Mulk melayani kebutuhan harian seluruh karyawan & pasien.',
    badge: 'KOPERASI AMANAH BARAYA',
    linkTab: 'pos',
    linkText: 'Mulai Transaksi Kasir',
    isActive: true,
  },
  {
    id: 'default-slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    title: 'Diskon & Potong Gaji Anggota Koperasi',
    subtitle: 'Kemudahan belanja kebutuhan pokok dengan fasilitas potongan payroll otomatis setiap bulan.',
    badge: 'PROGRAM ANGGOTA RSUD',
    linkTab: 'products',
    linkText: 'Lihat Katalog Produk',
    isActive: true,
  },
  {
    id: 'default-slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    title: 'Warkop & Aneka Minuman Segar',
    subtitle: 'Nikmati kopi seduh, aneka snack, dan hidangan warkop koperasi dengan harga bersahabat.',
    badge: 'UNIT WARKOP KOPERASI',
    linkTab: 'pos',
    linkText: 'Pesan Minuman & Snack',
    isActive: true,
  },
];

export const BannerSlider: React.FC<BannerSliderProps> = ({
  slides,
  autoPlayInterval = 5,
  onNavigate,
  onManageBanners,
  canManage = false,
}) => {
  const activeSlides = (slides && slides.length > 0
    ? slides.filter((s) => s.isActive)
    : defaultBannerSlides
  );

  const displaySlides = activeSlides.length > 0 ? activeSlides : defaultBannerSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe Handlers
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    if (displaySlides.length <= 1 || isPaused) return;

    const intervalMs = Math.max(3, autoPlayInterval) * 1000;
    timerRef.current = setInterval(() => {
      handleNext();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, displaySlides.length, autoPlayInterval, isPaused]);

  if (displaySlides.length === 0) return null;

  const currentSlide = displaySlides[currentIndex] || displaySlides[0];

  return (
    <div
      id="dashboard-banner-slider"
      className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-700/80 group select-none bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Image Background with Aspect Ratio */}
      <div className="relative w-full h-44 sm:h-52 md:h-60 lg:h-64 overflow-hidden bg-slate-950">
        {displaySlides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title || `Slide ${idx + 1}`}
              className="w-full h-full object-cover object-center transform transition-transform duration-1000 scale-100 group-hover:scale-105"
              onError={(e) => {
                // Fallback placeholder image
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {/* Gradient Overlays for High Contrast & Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content Box Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 md:p-8 text-white">
          {/* Top Row: Admin Manage Shortcut */}
          <div className="flex items-center justify-end">
            {canManage && onManageBanners && (
              <button
                onClick={onManageBanners}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-md"
                title="Buka Pengaturan untuk menambah/mengubah gambar slider"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Atur Slider</span>
              </button>
            )}
          </div>

          {/* Bottom Row: Title & Subtitle Only */}
          <div className="max-w-2xl space-y-1 sm:space-y-2">
            {currentSlide.title && (
              <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md tracking-tight">
                {currentSlide.title}
              </h3>
            )}

            {currentSlide.subtitle && (
              <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 max-w-xl font-medium drop-shadow-sm">
                {currentSlide.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Previous Button */}
        {displaySlides.length > 1 && (
          <button
            onClick={handlePrev}
            aria-label="Slide Sebelumnya"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition opacity-0 group-hover:opacity-100 active:scale-90"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Next Button */}
        {displaySlides.length > 1 && (
          <button
            onClick={handleNext}
            aria-label="Slide Selanjutnya"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition opacity-0 group-hover:opacity-100 active:scale-90"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Bottom Pagination Dots & Play/Pause State */}
        {displaySlides.length > 1 && (
          <div className="absolute bottom-3 right-4 sm:right-6 z-30 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {displaySlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Pilih slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-5 h-1.5 bg-emerald-400 shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CoopConfig } from '../../types';
import { ArrowRight, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import defaultStorefrontImg from '../../assets/images/koperasi_storefront_1788350379104.jpg';

interface WelcomeScreenProps {
  coopConfig: CoopConfig;
  onStartShopping: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  coopConfig,
  onStartShopping,
}) => {
  // Real-time clock and date state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Welcome Screen Image Slider (up to 5 images, defaults to wallpaperUrl or default image)
  const sliderImages = React.useMemo(() => {
    if (coopConfig.welcomeSliderUrls && coopConfig.welcomeSliderUrls.length > 0) {
      return coopConfig.welcomeSliderUrls.filter((url) => Boolean(url && url.trim())).slice(0, 5);
    }
    if (coopConfig.welcomeWallpaperUrl) {
      return [coopConfig.welcomeWallpaperUrl];
    }
    return [defaultStorefrontImg];
  }, [coopConfig.welcomeSliderUrls, coopConfig.welcomeWallpaperUrl]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Auto-play slider every 5 seconds (5000ms), paused on hover
  useEffect(() => {
    if (sliderImages.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderImages.length, isHovered]);

  // Adjust current slide if images list shrinks
  useEffect(() => {
    if (currentSlide >= sliderImages.length) {
      setCurrentSlide(0);
    }
  }, [sliderImages.length, currentSlide]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    setTouchStartX(null);
  };

  return (
    <div
      id="welcome-page-container"
      className="relative w-full h-screen h-[100svh] h-[100dvh] bg-gradient-to-br from-[#EBF5EF] via-[#F4F9F6] to-[#E5F2EA] text-[#18352A] overflow-hidden flex flex-col justify-between select-none"
    >
      {/* CSS Animations & Custom Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInSlow {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes arrowBounceRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes floatButton {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-fade-in {
          animation: fadeInSlow 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-soft {
          animation: floatSoft 4s ease-in-out infinite;
        }
        .animate-float-button {
          animation: floatButton 3s ease-in-out infinite;
        }
        .animate-arrow-bounce {
          animation: arrowBounceRight 1.5s ease-in-out infinite;
        }
      ` }} />

      {/* Background Decorative Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full max-w-3xl bg-gradient-to-bl from-[#D5EFE0]/60 via-[#DDF3E6]/30 to-transparent rounded-bl-[140px] pointer-events-none -z-0" />
      <div className="absolute top-0 left-0 w-1/2 h-full max-w-3xl bg-gradient-to-br from-[#D5EFE0]/60 via-[#DDF3E6]/30 to-transparent rounded-br-[140px] pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#DFF3E8]/50 rounded-full blur-3xl pointer-events-none -z-0" />
      
      {/* Dot Pattern Graphic on Bottom-Left */}
      <div className="absolute bottom-6 left-8 hidden lg:grid grid-cols-8 gap-2.5 opacity-20 pointer-events-none -z-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#075B3A]" />
        ))}
      </div>

      {/* Main Full-Screen Layout Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between h-full">
        
        {/* HEADER BAR */}
        <header className="w-full flex items-center justify-between gap-4 animate-fade-in shrink-0">
          
          {/* TOP LEFT: ENLARGED LOGO WITHOUT CARD OR BORDER */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 flex items-center justify-center transition-transform hover:scale-105 drop-shadow-md">
            {coopConfig.logoUrl ? (
              <img src={coopConfig.logoUrl} alt="Logo Koperasi" className="w-full h-full object-contain" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Outer Circular Ring with 3 stylized people holding hands / heart */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="#DFF3E8" strokeWidth="6" />
                {/* Green segment */}
                <path d="M 50 10 A 40 40 0 0 1 85 30" fill="none" stroke="#075B3A" strokeWidth="9" strokeLinecap="round" />
                {/* Orange segment */}
                <path d="M 88 38 A 40 40 0 0 1 75 80" fill="none" stroke="#E96A1A" strokeWidth="9" strokeLinecap="round" />
                {/* Blue segment */}
                <path d="M 68 85 A 40 40 0 0 1 18 68" fill="none" stroke="#0284C7" strokeWidth="9" strokeLinecap="round" />
                {/* Light Green segment */}
                <path d="M 12 60 A 40 40 0 0 1 35 15" fill="none" stroke="#10B981" strokeWidth="9" strokeLinecap="round" />
                {/* Center Heart/Cross emblem */}
                <path d="M 50 32 C 40 22, 28 35, 50 64 C 72 35, 60 22, 50 32 Z" fill="#075B3A" />
                <path d="M 45 42 L 55 42 M 50 37 L 50 47" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </div>

          {/* TOP RIGHT: MODERN REAL-TIME DATE & TIME WIDGET */}
          <div className="bg-white/95 backdrop-blur-md border border-emerald-100 shadow-md rounded-2xl px-4 py-2.5 flex items-center gap-3.5 text-[#075B3A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 border-r border-slate-200 pr-3.5 hidden sm:flex">
              <Calendar className="w-4 h-4 text-[#075B3A]" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#075B3A] tracking-wide">
              <Clock className="w-4 h-4 text-[#E96A1A] animate-pulse" />
              <span className="font-mono">{formattedTime}</span>
              <span className="text-[10px] font-bold bg-[#DFF3E8] text-[#075B3A] px-1.5 py-0.5 rounded-md uppercase">WIB</span>
            </div>
          </div>
        </header>

        {/* HERO SECTION (2 COLUMNS - FITS ENTIRE SCREEN HEIGHT) */}
        <main className="my-auto py-2 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center flex-1">
          
          {/* LEFT COLUMN: BRANDING & HEADLINE CONTENT */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[1.08]">
                <span className="text-emerald-700 block text-[60px] leading-[1.08]">Koperasi</span>
                <span className="text-[#E96A1A] block text-[60px] leading-[1.08]">Amanah Baraya</span>
              </h1>
              <p className="text-[20px] font-bold text-emerald-800 tracking-widest uppercase pt-0 mt-0 mb-0">
                RSUD AL-MULK • KOTA SUKABUMI
              </p>
            </div>

            {/* Tapered Gold Accent Bar (Positioned in the middle, no dark shadow) */}
            <div className="w-[394px] max-w-full py-1">
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-amber-500 via-amber-400 via-yellow-200 via-amber-400 via-amber-500 to-transparent rounded-full" />
            </div>

            {/* Tagline */}
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold not-italic text-[#18352A] tracking-tight">
                Belanja Hemat, Kualitas Terjamin
              </h2>
            </div>

            {/* Description Paragraf */}
            <p className="text-[13px] text-slate-600 font-normal leading-relaxed max-w-lg">
              Koperasi untuk kita, oleh kita, dan bersama kita. Melayani dengan amanah, memberikan yang terbaik untuk keluarga besar RSUD Al-Mulk.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 sm:pt-4">
              <button
                id="btn-masuk-aplikasi"
                data-testid="btn-ayo-belanja"
                onClick={onStartShopping}
                className="animate-float-button group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base sm:text-lg tracking-wide shadow-lg shadow-emerald-700/25 hover:shadow-xl hover:shadow-emerald-700/35 active:scale-98 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Subtle Hover Glow */}
                <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <span className="relative z-10 font-black">Masuk ke Aplikasi</span>
                <ArrowRight className="w-5 h-5 text-white animate-arrow-bounce relative z-10" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STOREFRONT IMAGE SLIDER (SMOOTH STACKED CARDS DECK) */}
          <div
            className="lg:col-span-6 relative flex justify-center lg:justify-end items-center animate-fade-in"
            style={{ animationDelay: '0.2s' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Background Decorative Soft Blur Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-amber-100/30 rounded-[40px] blur-xl -z-20 pointer-events-none" />

            {/* Stacked Cards Container Stage - Enlarged slightly for better prominence */}
            <div className="relative w-full max-w-[460px] sm:max-w-[520px] md:max-w-[560px] lg:max-w-[590px] h-[285px] sm:h-[330px] md:h-[365px] lg:h-[395px] select-none">
              
              {/* Stacked Cards Render */}
              {sliderImages.length === 1 ? (
                // Single Image with 2 Decorative Layered Backdrops for 3D Depth
                <>
                  {/* Layer 3 - Back */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl bg-emerald-800/10 border-2 border-white/60 shadow-md transform scale-[0.88] translate-x-8 -translate-y-5 rotate-4 pointer-events-none z-10 transition-transform" />
                  
                  {/* Layer 2 - Middle */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl bg-emerald-700/20 border-2 border-white/80 shadow-lg transform scale-[0.94] translate-x-4 -translate-y-2.5 rotate-2 pointer-events-none z-20 transition-transform" />
                  
                  {/* Layer 1 - Front Active Card */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden border-2 border-white bg-slate-900 shadow-2xl shadow-emerald-950/20 z-30 transition-transform duration-500">
                    <img
                      src={sliderImages[0]}
                      alt="Storefront Koperasi Amanah Baraya"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultStorefrontImg;
                      }}
                    />
                  </div>
                </>
              ) : (
                // Multiple Images: Dynamic 3D Stacked Cards Deck with Smooth Transitions
                sliderImages.map((imgUrl, idx) => {
                  const offset = (idx - currentSlide + sliderImages.length) % sliderImages.length;
                  const isFront = offset === 0;
                  const isSecond = offset === 1;
                  const isThird = offset === 2;
                  const isExiting = offset === sliderImages.length - 1;

                  // Compute dynamic 3D transform, z-index, and opacity for stacked layers
                  let cardTransform = 'scale(0.8) translate3d(60px, -30px, 0) rotate(7deg)';
                  let cardZIndex = 0;
                  let cardOpacity = 0;
                  let isClickable = false;

                  if (isFront) {
                    cardTransform = 'scale(1) translate3d(0, 0, 0) rotate(0deg)';
                    cardZIndex = 30;
                    cardOpacity = 1;
                    isClickable = false;
                  } else if (isSecond) {
                    cardTransform = 'scale(0.93) translate3d(24px, -12px, 0) rotate(3deg)';
                    cardZIndex = 20;
                    cardOpacity = 0.88;
                    isClickable = true;
                  } else if (isThird) {
                    cardTransform = 'scale(0.86) translate3d(46px, -22px, 0) rotate(6deg)';
                    cardZIndex = 10;
                    cardOpacity = 0.65;
                    isClickable = true;
                  } else if (isExiting) {
                    cardTransform = 'scale(0.85) translate3d(-36px, 12px, 0) rotate(-4deg)';
                    cardZIndex = 5;
                    cardOpacity = 0;
                    isClickable = false;
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isClickable) setCurrentSlide(idx);
                      }}
                      style={{
                        transform: cardTransform,
                        zIndex: cardZIndex,
                        opacity: cardOpacity,
                        transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), filter 0.7s ease',
                        filter: isFront ? 'brightness(1)' : isSecond ? 'brightness(0.95)' : 'brightness(0.9)',
                      }}
                      className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden border-2 border-white/95 bg-slate-900 group shadow-xl ${
                        isFront
                          ? 'shadow-2xl shadow-emerald-950/20 cursor-default'
                          : isClickable
                          ? 'cursor-pointer hover:border-emerald-300'
                          : 'pointer-events-none'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Storefront Koperasi Amanah Baraya ${idx + 1}`}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultStorefrontImg;
                        }}
                      />

                      {/* Gentle bottom shade only on front card for indicator contrast */}
                      {isFront && (
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      )}
                    </div>
                  );
                })
              )}

              {/* Slider Navigation Controls (Dots & Arrows) when multiple images exist */}
              {sliderImages.length > 1 && (
                <>
                  {/* Arrow Controls on Hover */}
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg border border-white/20"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg border border-white/20"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Clean Minimalist Indicator Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 shadow-md">
                    {sliderImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentSlide
                            ? 'w-6 bg-emerald-400 shadow-xs'
                            : 'w-2 bg-white/50 hover:bg-white/90'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>

        </main>

        {/* FOOTER - CLEAN WITHOUT TEXT */}
        <footer className="w-full text-center py-1 text-xs animate-fade-in shrink-0" style={{ animationDelay: '0.3s' }} />

      </div>
    </div>
  );
};

export default WelcomeScreen;



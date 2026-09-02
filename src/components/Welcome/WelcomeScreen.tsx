import React, { useState, useEffect } from 'react';
import { CoopConfig } from '../../types';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import defaultStorefrontImg from '../../assets/images/koperasi_storefront_1788350379104.jpg';

interface WelcomeScreenProps {
  coopConfig: CoopConfig;
  onStartShopping: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  coopConfig,
  onStartShopping,
}) => {
  const wallpaperUrl = coopConfig.welcomeWallpaperUrl || defaultStorefrontImg;

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
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#DFF3E8]/50 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
      
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
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12]">
                <span className="text-[#075B3A] block">Koperasi</span>
                <span className="text-[#E96A1A] block">Amanah Baraya</span>
              </h1>
              <p className="text-sm font-bold text-[#0B7A4B] tracking-widest uppercase pt-1">
                RSUD AL-MULK • KOTA SUKABUMI
              </p>
            </div>

            {/* Tagline with Tapered Gold Accent Bar */}
            <div className="inline-flex flex-col space-y-2 pt-1 max-w-full">
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-amber-600/40 via-amber-400 via-yellow-200 via-amber-400 via-amber-600/40 to-transparent rounded-full shadow-2xs opacity-95" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#18352A] tracking-tight">
                Belanja Hemat, Kualitas Terjamin
              </h2>
            </div>

            {/* Description Paragraf */}
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
              Koperasi untuk kita, oleh kita, dan bersama kita. Melayani dengan amanah, memberikan yang terbaik untuk keluarga besar RSUD Al-Mulk.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 sm:pt-4">
              <button
                id="btn-masuk-aplikasi"
                data-testid="btn-ayo-belanja"
                onClick={onStartShopping}
                className="animate-float-button group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#075B3A] hover:bg-[#0B7A4B] text-white font-bold text-base sm:text-lg tracking-wide shadow-lg shadow-[#075B3A]/25 hover:shadow-xl hover:shadow-[#075B3A]/35 active:scale-98 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Subtle Hover Glow */}
                <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <span className="relative z-10 font-black">Masuk ke Aplikasi</span>
                <ArrowRight className="w-5 h-5 text-white animate-arrow-bounce relative z-10" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STOREFRONT IMAGE (CLEAN WITHOUT OBSTRUCTING BADGES) */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            
            {/* Background Decorative Shape behind Image */}
            <div className="absolute -inset-2 sm:-inset-4 bg-[#DFF3E8]/80 rounded-[36px] -z-10 transform rotate-1 scale-[0.98] transition-transform" />

            {/* Storefront Image Frame - CLEAN & UNOBSTRUCTED */}
            <div className="relative w-full max-w-lg lg:max-w-none rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/15 border border-emerald-100/90 bg-white group">
              
              {/* Main Store Image */}
              <img
                src={wallpaperUrl}
                alt="Storefront Koperasi Amanah Baraya RSUD Al-Mulk"
                className="w-full h-auto max-h-[52vh] sm:max-h-[58vh] object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />

            </div>
          </div>

        </main>

        {/* FOOTER */}
        <footer className="w-full text-center py-2 text-xs text-slate-500 font-medium animate-fade-in shrink-0" style={{ animationDelay: '0.3s' }}>
          <p>© 2026 Koperasi Amanah Baraya • RSUD Al-Mulk Kota Sukabumi</p>
        </footer>

      </div>
    </div>
  );
};

export default WelcomeScreen;



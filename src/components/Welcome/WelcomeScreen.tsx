import React from 'react';
import { CoopConfig } from '../../types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  coopConfig: CoopConfig;
  onStartShopping: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  coopConfig,
  onStartShopping,
}) => {
  const wallpaperUrl = coopConfig.welcomeWallpaperUrl;
  const hasWallpaper = Boolean(wallpaperUrl);

  return (
    <div
      id="welcome-page-container"
      className="relative w-screen h-screen min-h-[100dvh] overflow-hidden select-none bg-slate-950"
    >
      {/* Self-contained CSS animations to avoid React 19 Framer Motion context conflicts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatUpAndDown {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes arrowMoveLeftRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }
        .animate-welcome-float {
          animation: floatUpAndDown 3s ease-in-out infinite;
        }
        .animate-welcome-arrow {
          animation: arrowMoveLeftRight 1.5s ease-in-out infinite;
        }
      `}} />

      {/* Background Image / Ambient Presentation */}
      {hasWallpaper ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
          {/* Layer 1: Ambient Blurred Background (ensures no empty borders on any aspect ratio) */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scale-110 blur-2xl opacity-50 pointer-events-none"
            style={{
              backgroundImage: `url("${wallpaperUrl}")`,
            }}
          />

          {/* Layer 2: Subtle gradient vignette overlay to unify the background color and depth */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

          {/* Layer 3: Main sharp image that scales proportionally without cropping */}
          <img
            src={wallpaperUrl}
            alt="Welcome Wallpaper"
            className="relative z-10 w-full h-full max-w-full max-h-full object-contain transition-all duration-300 pointer-events-none drop-shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
          />
        </div>
      ) : (
        /* Plain background without any text or images as requested */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      )}

      {/* "Ayo Belanja" Button - Positioned in the bottom-left corner, shifted slightly to the right, raised proportionally to bottom-24 s.d. bottom-44 */}
      <div className="fixed left-12 bottom-24 sm:left-16 sm:bottom-32 md:left-20 md:bottom-40 lg:bottom-44 z-30">
        <button
          id="btn-ayo-belanja"
          onClick={onStartShopping}
          className="animate-welcome-float group relative inline-flex items-center gap-3 sm:gap-3.5 px-6 sm:px-8 md:px-9 py-3 sm:py-3.5 md:py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base md:text-lg tracking-wide shadow-[0_10px_30px_rgba(5,150,105,0.45)] hover:shadow-[0_15px_35px_rgba(5,150,105,0.6)] active:scale-95 transition-all duration-200 border border-emerald-400/40 cursor-pointer overflow-hidden backdrop-blur-md"
        >
          {/* Subtle shine effect on hover */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>

          <span className="relative z-10 whitespace-nowrap">Ayo Belanja</span>

          <span className="animate-welcome-arrow shrink-0 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;

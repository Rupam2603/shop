import React from "react";

export interface ModernLoadingScreenProps {
  /**
   * Primary title or brand name. Defaults to "SubhOne".
   */
  title?: string;
  /**
   * Subtitle text. Defaults to "Health Group".
   */
  subtitle?: string;
  /**
   * Optional custom status text. Defaults to "Loading...".
   */
  statusText?: string;
  /**
   * Optional progress value (0 to 100).
   */
  progress?: number;
  /**
   * If true, renders as fixed full-screen overlay. Defaults to true.
   */
  fullScreen?: boolean;
  /**
   * Additional custom CSS classes.
   */
  className?: string;
}

export default function ModernLoadingScreen({
  title = "SubhOne",
  subtitle = "Health Group",
  statusText = "Loading...",
  progress,
  fullScreen = true,
  className = "",
}: ModernLoadingScreenProps) {
  const content = (
    <div
      className={`relative flex flex-col items-center justify-center select-none text-slate-800 ${className}`}
    >
      {/* ── Keyframes for Minimalist Motion ── */}
      <style>{`
        @keyframes minimal-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes minimal-pulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        @keyframes dot-blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        .anim-minimal-spin {
          animation: minimal-spin 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .anim-minimal-pulse {
          animation: minimal-pulse 2.2s ease-in-out infinite;
        }
        .anim-dot-1 { animation: dot-blink 1.4s infinite ease-in-out 0s; }
        .anim-dot-2 { animation: dot-blink 1.4s infinite ease-in-out 0.2s; }
        .anim-dot-3 { animation: dot-blink 1.4s infinite ease-in-out 0.4s; }
      `}</style>

      {/* ── Minimalist Spinner & Logo Core ── */}
      <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4">
        {/* Outer Minimalist Smooth Spinner Ring */}
        <svg
          className="absolute inset-0 w-full h-full anim-minimal-spin"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Background Track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#e2e8f0"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Active Emerald / Mint Arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#minimal-gradient)"
            strokeWidth="3.5"
            strokeDasharray="75 190"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="minimal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#006a39" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Brand Emblem with Gentle Breathing Scale */}
        <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100 flex items-center justify-center anim-minimal-pulse">
          <img
            src="/logo.png"
            alt="SubhOne"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* ── Minimalist Brand Title ── */}
      <div className="text-center flex flex-col items-center">
        <div className="flex items-center gap-1 leading-tight">
          <span className="font-['Manrope',sans-serif] font-black text-slate-900 text-base sm:text-lg tracking-wide">
            {title}
          </span>
          <span className="font-['Manrope',sans-serif] font-black text-rose-500 text-base sm:text-lg">
            +
          </span>
        </div>
        {subtitle && (
          <span className="text-[10px] font-bold text-[#006a39] tracking-widest uppercase mt-0.5">
            {subtitle}
          </span>
        )}
      </div>

      {/* ── Minimalist Status & Progress Indicator ── */}
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span>{statusText}</span>
        <div className="flex items-center gap-1 ml-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-dot-3" />
        </div>
      </div>

      {/* Optional Hairline Progress Bar if progress prop passed */}
      {typeof progress === "number" && (
        <div className="w-36 h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fbfcfd] transition-opacity duration-200">
        {content}
      </div>
    );
  }

  return content;
}

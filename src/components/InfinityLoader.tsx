import React from "react";

export interface InfinityLoaderProps {
  /**
   * Visual variant:
   * - "neon": Luminous violet, electric cyan, and royal blue comet beam.
   * - "brand": High-end healthcare emerald, mint, and cyan glowing beam.
   */
  variant?: "neon" | "brand";
  /**
   * Predefined or custom pixel width for the infinity loop.
   * "sm" = 72px, "md" = 110px, "lg" = 160px, or a numeric width.
   */
  size?: "sm" | "md" | "lg" | number;
  /**
   * Label displayed below the animation. Defaults to "Loading...".
   * Pass empty string "" or null to hide text.
   */
  text?: string | null;
  /**
   * If true, renders a full-page modal overlay with a light glassmorphic backdrop (never black).
   */
  fullScreen?: boolean;
  /**
   * Additional container CSS classes.
   */
  className?: string;
}

export default function InfinityLoader({
  variant = "brand",
  size = "md",
  text = "Loading...",
  fullScreen = false,
  className = "",
}: InfinityLoaderProps) {
  // Dimensions
  const width =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 72
      : size === "lg"
      ? 160
      : 110;

  const height = Math.round(width * 0.5);
  const isBrand = variant === "brand";

  const textColor = isBrand ? "#006a39" : "#4f46e5";
  const trackColor = isBrand ? "rgba(0, 106, 57, 0.12)" : "rgba(99, 102, 241, 0.14)";

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center gap-3.5 select-none ${className}`}>
      {/* High-Performance Smooth Animation Keyframes */}
      <style>{`
        @keyframes inf-dash-glide {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -100;
          }
        }
        @keyframes inf-halo-pulse {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.08);
          }
        }
        @keyframes inf-text-glow {
          0%, 100% {
            opacity: 0.7;
            letter-spacing: 0.05em;
          }
          50% {
            opacity: 1;
            letter-spacing: 0.08em;
          }
        }
        .anim-inf-dash {
          animation: inf-dash-glide 1.9s linear infinite;
        }
        .anim-inf-halo {
          animation: inf-halo-pulse 2.6s ease-in-out infinite;
        }
        .anim-inf-text {
          animation: inf-text-glow 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* SVG Infinity Loop Stage */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Multi-Stop Diffuse Backlight */}
        <div
          className="absolute rounded-full pointer-events-none blur-2xl anim-inf-halo"
          style={{
            width: `${Math.round(width * 1.1)}px`,
            height: `${Math.round(height * 1.3)}px`,
            background: isBrand
              ? "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(6,182,212,0.15) 60%, transparent 80%)"
              : "radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(59,130,246,0.18) 60%, transparent 80%)",
          }}
        />

        <svg
          width={width}
          height={height}
          viewBox="0 0 200 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 overflow-visible"
        >
          <defs>
            {/* Multi-layered Gaussian Bloom Filter */}
            <filter id={`inf-glow-bloom-${variant}`} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blurSmall" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blurLarge" />
              <feMerge>
                <feMergeNode in="blurLarge" />
                <feMergeNode in="blurSmall" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* High-Luminance Multi-Tone Linear Gradients */}
            {isBrand ? (
              <linearGradient id={`inf-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.05" />
                <stop offset="45%" stopColor="#10b981" stopOpacity="0.75" />
                <stop offset="85%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="96%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            ) : (
              <linearGradient id={`inf-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.05" />
                <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.75" />
                <stop offset="85%" stopColor="#c084fc" stopOpacity="1" />
                <stop offset="96%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            )}
          </defs>

          {/* 1. Base Subtle Geometric Track */}
          <path
            d="M 100,50 C 125,20 175,20 175,50 C 175,80 125,80 100,50 C 75,20 25,20 25,50 C 25,80 75,80 100,50 Z"
            stroke={trackColor}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 2. Outer Glowing Laser Bloom Beam */}
          <path
            d="M 100,50 C 125,20 175,20 175,50 C 175,80 125,80 100,50 C 75,20 25,20 25,50 C 25,80 75,80 100,50 Z"
            stroke={`url(#inf-grad-${variant})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="28 72"
            pathLength="100"
            filter={`url(#inf-glow-bloom-${variant})`}
            fill="none"
            className="anim-inf-dash opacity-90"
          />

          {/* 3. Core Sharp Ion Beam */}
          <path
            d="M 100,50 C 125,20 175,20 175,50 C 175,80 125,80 100,50 C 75,20 25,20 25,50 C 25,80 75,80 100,50 Z"
            stroke={`url(#inf-grad-${variant})`}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="28 72"
            pathLength="100"
            fill="none"
            className="anim-inf-dash"
          />
        </svg>
      </div>

      {/* Modern High-End Typography */}
      {text && (
        <div className="flex flex-col items-center gap-1">
          <p
            className="font-['Manrope',sans-serif] text-xs sm:text-sm font-bold tracking-wider anim-inf-text text-center px-3"
            style={{ color: textColor }}
          >
            {text}
          </p>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Live Secure Sync
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-2xl transition-all duration-300">
        <div className="p-8 sm:p-10 rounded-3xl bg-white/80 border border-white/90 shadow-[0_20px_50px_-15px_rgba(0,106,57,0.15)] flex flex-col items-center">
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
}

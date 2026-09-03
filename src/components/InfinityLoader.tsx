import React from "react";

export interface InfinityLoaderProps {
  /**
   * Visual variant:
   * - "neon": The luminous violet/purple/blue glowing beam as shown in the preview GIF.
   * - "brand": The healthcare emerald/mint glowing beam.
   */
  variant?: "neon" | "brand";
  /**
   * Predefined or custom pixel width for the infinity loop.
   * "sm" = 70px, "md" = 110px, "lg" = 160px, or a numeric width.
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
  variant = "neon",
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

  // Gradient & color palette based on variant
  const glowColor = isBrand ? "rgba(16, 185, 129, 0.85)" : "rgba(168, 85, 247, 0.85)";
  const trackColor = isBrand ? "rgba(0, 106, 57, 0.12)" : "rgba(139, 92, 246, 0.15)";
  const textColor = isBrand ? "#006a39" : "#6b7280";

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center gap-3 select-none ${className}`}>
      {/* Inline styles for the loop animation */}
      <style>{`
        @keyframes infinity-dash {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -100;
          }
        }
        @keyframes infinity-pulse-glow {
          0%, 100% {
            opacity: 0.75;
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
        @keyframes infinity-text-pulse {
          0%, 100% {
            opacity: 0.65;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-infinity-loop {
          animation: infinity-dash 1.8s linear infinite;
        }
        .animate-infinity-glow {
          animation: infinity-dash 1.8s linear infinite, infinity-pulse-glow 2.4s ease-in-out infinite;
        }
        .animate-infinity-text {
          animation: infinity-text-pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* SVG Infinity Loop (Lemniscate) */}
      <div className="relative flex items-center justify-center">
        {/* Ambient radial blur behind the loop */}
        <div
          className="absolute rounded-full pointer-events-none blur-2xl transition-all"
          style={{
            width: `${Math.round(width * 0.9)}px`,
            height: `${Math.round(height * 1.1)}px`,
            backgroundColor: isBrand ? "rgba(16, 185, 129, 0.2)" : "rgba(168, 85, 247, 0.22)",
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
            {/* Filter for bloom / glow */}
            <filter id={`inf-glow-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear gradient along the loop */}
            {isBrand ? (
              <linearGradient id={`inf-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="95%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            ) : (
              <linearGradient id={`inf-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="88%" stopColor="#c084fc" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            )}
          </defs>

          {/* Background Infinity Track */}
          <path
            d="M 100,50 C 125,20 175,20 175,50 C 175,80 125,80 100,50 C 75,20 25,20 25,50 C 25,80 75,80 100,50 Z"
            stroke={trackColor}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Outer Glowing Comet Beam */}
          <path
            d="M 100,50 C 125,20 175,20 175,50 C 175,80 125,80 100,50 C 75,20 25,20 25,50 C 25,80 75,80 100,50 Z"
            stroke={`url(#inf-grad-${variant})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="26 74"
            pathLength="100"
            filter={`url(#inf-glow-${variant})`}
            fill="none"
            className="animate-infinity-glow"
          />

          {/* Inner Sharp Luminous Beam */}
          <path
            d="M 100,50 C 125,20 175,20 175,50 C 175,80 125,80 100,50 C 75,20 25,20 25,50 C 25,80 75,80 100,50 Z"
            stroke={`url(#inf-grad-${variant})`}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="26 74"
            pathLength="100"
            fill="none"
            className="animate-infinity-loop"
          />
        </svg>
      </div>

      {/* Loading Text */}
      {text && (
        <p
          className="text-xs sm:text-sm font-semibold tracking-wide animate-infinity-text"
          style={{ color: textColor }}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xl transition-all duration-300">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}

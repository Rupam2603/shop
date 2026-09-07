import React, { useEffect, useState } from "react";

export interface ModernLoadingScreenProps {
  /**
   * Primary title or brand name. Defaults to "SubhOne".
   */
  title?: string;
  /**
   * Subtitle or category text. Defaults to "Health Group • Pharmacy & Diagnostic".
   */
  subtitle?: string;
  /**
   * Optional custom status text. If not provided, dynamic status messages cycle smoothly.
   */
  statusText?: string;
  /**
   * Optional controlled progress value (0 to 100). If omitted, an organic loading ramp plays.
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

const STATUS_STEPS = [
  "Connecting to secure health cloud…",
  "Verifying certified pharmaceutical catalog…",
  "Calibrating real-time delivery network…",
  "Preparing your personalized wellness experience…",
  "SubhOne Health Group • Ready",
];

export default function ModernLoadingScreen({
  title = "SubhOne",
  subtitle = "Health Group • Pharmacy & Diagnostic",
  statusText,
  progress: externalProgress,
  fullScreen = true,
  className = "",
}: ModernLoadingScreenProps) {
  // Simulated dynamic progress for organic animated website feel
  const [internalProgress, setInternalProgress] = useState(12);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    if (typeof externalProgress === "number") return;

    // Organic ramp: fast start, thoughtful pause at 75-88%, then smooth progression
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 96) return prev; // Hold at 96% until real page data resolves
        const remaining = 96 - prev;
        const increment = Math.max(1, Math.floor(remaining * 0.12) + (Math.random() > 0.5 ? 2 : 1));
        return Math.min(96, prev + increment);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [externalProgress]);

  // Rotate status message every 1.8 seconds
  useEffect(() => {
    if (statusText) return;

    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % STATUS_STEPS.length);
    }, 1900);

    return () => clearInterval(stepInterval);
  }, [statusText]);

  const displayProgress =
    typeof externalProgress === "number"
      ? Math.min(100, Math.max(0, Math.round(externalProgress)))
      : internalProgress;

  const activeStatus = statusText || STATUS_STEPS[currentStepIdx];

  const content = (
    <div
      className={`relative flex flex-col items-center justify-center w-full min-h-[100dvh] overflow-hidden select-none bg-[#f8fafc] text-slate-900 px-4 py-8 ${className}`}
    >
      {/* ── High-End Animated Keyframes & Inline CSS ── */}
      <style>{`
        @keyframes aura-drift-1 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(35px, -25px) scale(1.12);
          }
        }
        @keyframes aura-drift-2 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(-30px, 30px) scale(1.15);
          }
        }
        @keyframes aura-drift-3 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(25px, 20px) scale(1.08);
          }
        }
        @keyframes orbit-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes orbit-spin-reverse {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        @keyframes comet-dash {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -283;
          }
        }
        @keyframes comet-dash-reverse {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 283;
          }
        }
        @keyframes specular-sweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          40% {
            transform: translateX(250%) skewX(-25deg);
            opacity: 0;
          }
          100% {
            transform: translateX(250%) skewX(-25deg);
            opacity: 0;
          }
        }
        @keyframes ecg-pulse {
          0% {
            stroke-dashoffset: 200;
            opacity: 0.2;
          }
          40% {
            opacity: 1;
          }
          80%, 100% {
            stroke-dashoffset: 0;
            opacity: 0.3;
          }
        }
        @keyframes float-mote {
          0% {
            transform: translateY(20px) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-80px) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes laser-sweep {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
        .anim-aura-1 {
          animation: aura-drift-1 12s ease-in-out infinite;
        }
        .anim-aura-2 {
          animation: aura-drift-2 15s ease-in-out infinite;
        }
        .anim-aura-3 {
          animation: aura-drift-3 18s ease-in-out infinite;
        }
        .anim-orbit-spin {
          animation: orbit-spin 22s linear infinite;
        }
        .anim-orbit-reverse {
          animation: orbit-spin-reverse 14s linear infinite;
        }
        .anim-comet-fast {
          animation: comet-dash 2.4s linear infinite;
        }
        .anim-comet-slow {
          animation: comet-dash-reverse 3.6s linear infinite;
        }
        .anim-specular {
          animation: specular-sweep 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .anim-ecg {
          animation: ecg-pulse 2.2s ease-in-out infinite;
        }
        .anim-laser {
          animation: laser-sweep 2s ease-in-out infinite;
        }
      `}</style>

      {/* ── Layer 1: Ambient Living Canvas Auroras (Modern Studio Glow) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Emerald Glow */}
        <div
          className="absolute -top-24 -left-24 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full blur-3xl opacity-35 bg-gradient-to-br from-emerald-400 via-teal-300 to-transparent anim-aura-1"
        />
        {/* Luminous Royal Electric Blue Glow */}
        <div
          className="absolute top-1/4 -right-24 w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] rounded-full blur-3xl opacity-30 bg-gradient-to-bl from-blue-500 via-indigo-400 to-transparent anim-aura-2"
        />
        {/* Warm Coral / Rose Accent Glow */}
        <div
          className="absolute -bottom-20 left-1/3 w-[320px] sm:w-[440px] h-[320px] sm:h-[440px] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-rose-400 via-pink-300 to-transparent anim-aura-3"
        />

        {/* Delicate Modern Dot Matrix Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
          }}
        />

        {/* Ambient Rising Micro Motifs (Floating Crosses & Sparkles) */}
        <div
          className="absolute top-[28%] left-[18%] text-emerald-500/40 text-lg font-light pointer-events-none select-none"
          style={{ animation: "float-mote 5s ease-in-out infinite 0.2s" }}
        >
          ✦
        </div>
        <div
          className="absolute top-[62%] left-[15%] text-blue-500/35 text-xl font-thin pointer-events-none select-none"
          style={{ animation: "float-mote 6s ease-in-out infinite 1.5s" }}
        >
          +
        </div>
        <div
          className="absolute top-[35%] right-[20%] text-teal-600/30 text-2xl font-light pointer-events-none select-none"
          style={{ animation: "float-mote 5.5s ease-in-out infinite 0.8s" }}
        >
          +
        </div>
        <div
          className="absolute top-[68%] right-[16%] text-rose-500/30 text-sm font-bold pointer-events-none select-none"
          style={{ animation: "float-mote 4.8s ease-in-out infinite 2.2s" }}
        >
          ✦
        </div>
      </div>

      {/* ── Layer 2: Main Glassmorphic Showcase Stage ── */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Top Status Capsule Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-sm shadow-slate-200/50 backdrop-blur-md mb-8 transition-transform hover:scale-105">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-700 uppercase">
            SubhOne 24/7 Health Cloud
          </span>
        </div>

        {/* ── Centerpiece: The Animated Orbital Gyroscope Core ── */}
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 mb-6">
          {/* Radial Ambient Backlight */}
          <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-400/20 to-blue-500/20 blur-2xl pointer-events-none" />

          {/* SVG Complex Orbital System */}
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Vibrant Multi-Stop Laser Gradients */}
              <linearGradient id="laser-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
                <stop offset="60%" stopColor="#059669" stopOpacity="0.7" />
                <stop offset="90%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="laser-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.05" />
                <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.6" />
                <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>

              {/* Luminous Glow Filters */}
              <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Outer Compass Geometry (Fine Dashed Guide) */}
            <circle
              cx="100"
              cy="100"
              r="92"
              stroke="#cbd5e1"
              strokeWidth="1.2"
              strokeDasharray="4 8"
              opacity="0.55"
              className="anim-orbit-spin origin-center"
            />

            {/* 2. Concentric Orbit Accent Ticks */}
            <circle
              cx="100"
              cy="100"
              r="84"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="1 18"
              strokeLinecap="round"
              opacity="0.7"
              className="anim-orbit-reverse origin-center"
            />

            {/* 3. Outer Laser Comet Ring (Clockwise) */}
            <circle
              cx="100"
              cy="100"
              r="76"
              stroke="url(#laser-grad-1)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="70 213"
              filter="url(#laser-glow)"
              className="anim-comet-fast origin-center"
            />

            {/* 4. Counter-Rotating Inner Laser Comet Ring */}
            <circle
              cx="100"
              cy="100"
              r="66"
              stroke="url(#laser-grad-2)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="50 233"
              filter="url(#laser-glow)"
              className="anim-comet-slow origin-center"
            />

            {/* 5. Minimal Heartbeat / ECG Wave Track at Core Base */}
            <path
              d="M 64 136 L 82 136 L 88 126 L 94 146 L 102 120 L 108 142 L 114 136 L 136 136"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="120"
              className="anim-ecg opacity-80"
              filter="url(#laser-glow)"
            />
          </svg>

          {/* Center Floating Glassmorphic Shield & Logo */}
          <div className="relative z-20 flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/90 border border-white/95 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.22)] backdrop-blur-xl p-3 overflow-hidden group">
            {/* Specular Diagonal Reflection Sweep */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-[45%] h-[200%] bg-gradient-to-r from-transparent via-white/80 to-transparent anim-specular -top-1/2" />
            </div>

            {/* SubhOne Official Brand Logo */}
            <img
              src="/logo.png"
              alt="SubhOne Health Group"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-sm transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        {/* ── Brand Typography & Identity ── */}
        <div className="text-center flex flex-col items-center mb-6">
          <div className="flex items-center gap-1.5">
            <h1 className="font-['Manrope',sans-serif] text-2xl sm:text-3xl font-black tracking-[0.18em] text-slate-900 uppercase">
              {title}
            </h1>
            <span className="font-['Manrope',sans-serif] text-2xl sm:text-3xl font-black text-rose-600">
              +
            </span>
          </div>

          <p className="text-[11px] sm:text-xs font-bold tracking-[0.22em] text-[#006a39] uppercase mt-1">
            {subtitle}
          </p>
        </div>

        {/* ── Modern Telemetry Progress Track ── */}
        <div className="w-full max-w-[280px] sm:max-w-xs flex flex-col gap-2.5">
          {/* Progress Numbers & Percentage */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              System Boot
            </span>
            <div className="flex items-baseline font-mono text-sm font-bold text-slate-800">
              <span>{displayProgress}</span>
              <span className="text-xs text-emerald-600 font-semibold ml-0.5">%</span>
            </div>
          </div>

          {/* Laser Progress Bar */}
          <div className="relative w-full h-2.5 bg-slate-200/70 border border-white/80 rounded-full p-0.5 overflow-hidden shadow-inner">
            {/* Ambient track glow */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-full"
              style={{ width: `${displayProgress}%` }}
            />

            {/* Active Filled Gradient Bar */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#006a39] via-[#10b981] via-[#06b6d4] to-[#2563eb] transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              style={{ width: `${displayProgress}%` }}
            >
              {/* Traveling Laser Gleam */}
              <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/80 to-transparent anim-laser" />
              {/* Leading Tip Glow Dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
            </div>
          </div>

          {/* Dynamic Animated Status Ticker */}
          <div className="h-5 flex items-center justify-center overflow-hidden">
            <p
              key={activeStatus}
              className="text-xs font-medium text-slate-600 text-center animate-fade-in truncate px-2"
              style={{
                animation: "slide-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {activeStatus}
            </p>
          </div>
        </div>

        {/* ── Footer Trust & Security Badges (Awwwards Style Micro-pills) ── */}
        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-2 max-w-sm">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-slate-200/60 shadow-xs text-[10px] font-semibold text-slate-600">
            <span className="text-emerald-600 text-xs">🔒</span>
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-slate-200/60 shadow-xs text-[10px] font-semibold text-slate-600">
            <span className="text-blue-600 text-xs">⚡</span>
            <span>10–15 Min Express</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-slate-200/60 shadow-xs text-[10px] font-semibold text-slate-600">
            <span className="text-rose-600 text-xs">✓</span>
            <span>100% Genuine Care</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8fafc] animate-fade-in transition-opacity duration-300">
        {content}
      </div>
    );
  }

  return content;
}

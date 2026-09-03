import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * ShimmerButton — Magic UI–style CTA button with a looping light sweep.
 * Re-implemented without `framer-motion`: a masked ::after-less sweep layer
 * animated with CSS `transform: translateX(...)`.
 * https://magicui.design/docs/components/shimmer-button (design reference)
 */
interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** CSS background (gradient/solid) for the button surface. */
  background?: string;
  /** CSS box-shadow value (glow). */
  glow?: string;
  children: ReactNode;
}

export function ShimmerButton({
  background,
  glow,
  className = "",
  style,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      {...props}
      className={`shimmer-btn relative overflow-hidden ${className}`}
      style={{
        background,
        boxShadow: glow,
        ...style,
      }}
    >
      <span className="shimmer-btn-sweep" aria-hidden="true" />
      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {children}
      </span>
    </button>
  );
}

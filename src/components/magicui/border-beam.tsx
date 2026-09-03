import type { CSSProperties } from "react";

/**
 * BorderBeam — Magic UI–style rotating gradient border beam.
 * Re-implemented without `framer-motion`: a CSS `@property`-animated conic
 * gradient masked to a thin ring around the parent's border-radius.
 * https://magicui.design/docs/components/border-beam (design reference)
 *
 * Usage: place as the FIRST child of a `relative` container that already
 * has a border-radius set — the beam inherits it via `rounded-[inherit]`.
 */
interface BorderBeamProps {
  className?: string;
  /** Ring thickness in px. */
  thickness?: number;
  /** Full rotation duration in seconds. */
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className = "",
  thickness = 1.5,
  duration = 9,
  colorFrom = "#10b981",
  colorTo = "#22d3ee",
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={`border-beam pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
      style={
        {
          "--beam-thickness": `${thickness}px`,
          "--beam-duration": `${duration}s`,
          "--beam-color-from": colorFrom,
          "--beam-color-to": colorTo,
        } as CSSProperties
      }
    />
  );
}

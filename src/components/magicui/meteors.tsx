import { useMemo } from "react";

/**
 * Meteors — Magic UI–style animated meteor shower background.
 * Re-implemented without `framer-motion` (not a project dependency):
 * pure CSS keyframe animation driving randomized position/timing per meteor.
 * https://magicui.design/docs/components/meteors (design reference)
 */
interface MeteorsProps {
  /** How many meteors to render. */
  number?: number;
  className?: string;
}

export function Meteors({ number = 24, className = "" }: MeteorsProps) {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * -40}%`,
        delay: `${(Math.random() * 8).toFixed(2)}s`,
        duration: `${(5 + Math.random() * 6).toFixed(2)}s`,
      })),
    [number],
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {meteors.map((m) => (
        <span
          key={m.id}
          className="meteor absolute h-0.5 w-0.5 rounded-full bg-white"
          style={{
            left: m.left,
            top: m.top,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </div>
  );
}

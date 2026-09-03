import { useMemo } from "react";

/**
 * AnimatedGridPattern — Magic UI–style faint grid with softly pulsing
 * squares. Re-implemented without `framer-motion`: SVG grid + randomized
 * per-square CSS fade animation.
 * https://magicui.design/docs/components/animated-grid-pattern (design reference)
 */
interface AnimatedGridPatternProps {
  className?: string;
  numSquares?: number;
  id?: string;
}

export function AnimatedGridPattern({
  className = "",
  numSquares = 18,
  id = "agp-grid",
}: AnimatedGridPatternProps) {
  const squares = useMemo(
    () =>
      Array.from({ length: numSquares }, (_, i) => ({
        id: i,
        x: Math.floor(Math.random() * 9) * 40,
        y: Math.floor(Math.random() * 9) * 40,
        delay: `${(Math.random() * 6).toFixed(2)}s`,
        duration: `${(3 + Math.random() * 3).toFixed(2)}s`,
      })),
    [numSquares],
  );

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.12"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {squares.map((sq) => (
        <rect
          key={sq.id}
          x={sq.x}
          y={sq.y}
          width="38"
          height="38"
          rx="4"
          className="agp-square"
          style={{ animationDelay: sq.delay, animationDuration: sq.duration }}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

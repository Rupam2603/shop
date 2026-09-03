import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * SmoothTabs — smooth-ui–inspired segmented control with a sliding active
 * pill that glides between tabs using a spring-like cubic-bezier transition,
 * instead of an instant class swap.
 * https://smoothui.dev (design reference)
 */
interface SmoothTab {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface SmoothTabsProps {
  tabs: SmoothTab[];
  active: string;
  onChange: (key: string) => void;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
}

export function SmoothTabs({
  tabs,
  active,
  onChange,
  activeTextClassName = "text-[#073b4c]",
  inactiveTextClassName = "text-[#657969] hover:text-[#073b4c]",
}: SmoothTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = () => {
    const el = btnRefs.current[active];
    const container = containerRef.current;
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicator({ left: elRect.left - containerRect.left, width: elRect.width });
    }
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tabs.length]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex p-1.5 rounded-2xl bg-[#f0f5f2] border border-[#d6e4d8] shadow-inner"
    >
      {indicator && (
        <span
          className="smooth-tab-indicator absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-md shadow-[#073b4c]/10 border border-white"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {tabs.map((tab) => (
        <button
          key={tab.key}
          ref={(el) => {
            btnRefs.current[tab.key] = el;
          }}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`relative z-10 flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-['Manrope',sans-serif] flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 ${
            active === tab.key ? activeTextClassName : inactiveTextClassName
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

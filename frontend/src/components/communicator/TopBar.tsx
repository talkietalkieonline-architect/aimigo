"use client";
import { useRef, useEffect } from "react";

/** Верхняя панель — лого + ЭФИР */
export default function TopBar({ tickerActive, onHeightChange }: { tickerActive: boolean; onHeightChange?: (h: number) => void }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current || !onHeightChange) return;
    const ro = new ResizeObserver(() => {
      if (barRef.current) onHeightChange(barRef.current.offsetHeight);
    });
    ro.observe(barRef.current);
    onHeightChange(barRef.current.offsetHeight);
    return () => ro.disconnect();
  }, [onHeightChange]);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 px-4 pt-3 pb-2"
      style={{ zIndex: 50, background: "var(--bar-bg)" }}
    >
      {/* Лого */}
      <div className="flex items-baseline gap-3 mb-1">
        <span
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: "var(--text-muted)" }}
        >
          Aimigo
        </span>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          AI-First
        </h1>
      </div>

      {/* Бегущая строка ЭФИР */}
      {tickerActive && (
        <div
          className="flex items-center gap-2 rounded-lg overflow-hidden px-3 py-1.5"
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--bg-glass-border)",
          }}
        >
          <span
            className="text-[10px] uppercase tracking-widest font-semibold shrink-0"
            style={{ color: "var(--accent)" }}
          >
            Эфир
          </span>
          <div className="overflow-hidden flex-1 relative">
            <div
              className="whitespace-nowrap ticker-scroll"
              style={{ color: "var(--text-secondary)", fontSize: "13px" }}
            >
              Пробки: КАД у Мурино — задержка до 18 мин &nbsp;•&nbsp; Погода: до +6°, к вечеру слабый снег &nbsp;•&nbsp; МЧС: учения на набережной завершены, проезд свободен &nbsp;•&nbsp; Спортмастер: -20% на термобельё &nbsp;•&nbsp; Aimigo: новые агенты в Городе!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

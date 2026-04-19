"use client";

/** Верхняя панель — лого + ЭФИР */
export default function TopBar({ tickerActive }: { tickerActive: boolean }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 px-4 pt-3 pb-2"
      style={{ zIndex: 50 }}
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
          <div className="overflow-hidden flex-1">
            <div
              className="whitespace-nowrap animate-marquee"
              style={{ color: "var(--text-secondary)", fontSize: "13px" }}
            >
              Пробки: КАД у Мурино — задержка до 18 мин &bull; Погода: до +6°, к вечеру слабый снег &bull; МЧС: учения на набережной завершены, проезд свободен &bull; Спортмастер: -20% на термобельё
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

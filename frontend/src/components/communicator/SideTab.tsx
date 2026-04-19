"use client";

/** Золотой язычок для открытия боковой панели */
export default function SideTab({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed top-1/2 -translate-y-1/2 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{
        [side]: 0,
        width: "14px",
        height: "60px",
        background: "linear-gradient(to bottom, var(--accent), var(--accent-bright))",
        borderRadius: side === "left" ? "0 8px 8px 0" : "8px 0 0 8px",
        boxShadow: "0 0 15px var(--accent-glow)",
        zIndex: 40,
        cursor: "pointer",
      }}
    >
      <span
        className="text-[10px] font-bold"
        style={{ color: "var(--bg-deep)" }}
      >
        {side === "left" ? "→" : "←"}
      </span>
    </button>
  );
}

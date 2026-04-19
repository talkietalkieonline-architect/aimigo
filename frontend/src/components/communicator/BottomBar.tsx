"use client";
import { useState } from "react";

/** Нижняя панель — 5 кнопок */
export default function BottomBar({
  onSettingsClick,
  onContactsClick,
  onAgentsClick,
}: {
  onSettingsClick: () => void;
  onContactsClick: () => void;
  onAgentsClick: () => void;
}) {
  const [micOn, setMicOn] = useState(false);
  const [muteOn, setMuteOn] = useState(false);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-4 py-3"
      style={{
        background: "var(--bar-bg)",
        borderTop: "1px solid var(--bar-border)",
        zIndex: 50,
      }}
    >
      {/* Настройки */}
      <button
        onClick={onSettingsClick}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all hover:scale-105"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider">Настройки</span>
      </button>

      {/* Mute */}
      <button
        onClick={() => setMuteOn(!muteOn)}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all hover:scale-105"
        style={{ color: muteOn ? "var(--danger)" : "var(--text-secondary)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {muteOn ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          ) : (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          )}
        </svg>
        <span className="text-[10px] uppercase tracking-wider">
          {muteOn ? "Тишина" : "Звук"}
        </span>
      </button>

      {/* Микрофон — центральная большая кнопка */}
      <button
        onClick={() => setMicOn(!micOn)}
        className="flex flex-col items-center gap-1 rounded-full w-16 h-16 flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: micOn
            ? "var(--accent)"
            : "var(--bg-glass)",
          border: `2px solid ${micOn ? "var(--accent-bright)" : "var(--bg-glass-border)"}`,
          boxShadow: micOn ? "0 0 25px var(--accent-glow-strong)" : "none",
          color: micOn ? "var(--bg-deep)" : "var(--accent)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Мои контакты */}
      <button
        onClick={onContactsClick}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all hover:scale-105"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider">Контакты</span>
      </button>

      {/* Мои агенты */}
      <button
        onClick={onAgentsClick}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all hover:scale-105"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="5" />
          <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
          <circle cx="12" cy="8" r="2" fill="currentColor" opacity="0.3" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider">Агенты</span>
      </button>
    </div>
  );
}

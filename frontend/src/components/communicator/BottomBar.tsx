"use client";
import { useState, useRef } from "react";

/** Нижняя панель — поле ввода + 5 кнопок */
export default function BottomBar({
  onSettingsClick,
  onContactsClick,
  onAgentsClick,
  onSendMessage,
}: {
  onSettingsClick: () => void;
  onContactsClick: () => void;
  onAgentsClick: () => void;
  onSendMessage: (text: string) => void;
}) {
  const [micOn, setMicOn] = useState(false);
  const [muteOn, setMuteOn] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex flex-col"
      style={{
        background: "var(--bar-bg)",
        borderTop: "1px solid var(--bar-border)",
        zIndex: 50,
      }}
    >
      {/* Поле ввода сообщения */}
      <div className="px-4 pt-2.5 pb-1.5">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2 max-w-2xl mx-auto"
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--bg-glass-border)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95"
            style={{
              background: inputText.trim() ? "var(--accent)" : "var(--bg-glass-border)",
              color: inputText.trim() ? "var(--bg-deep)" : "var(--text-muted)",
              cursor: inputText.trim() ? "pointer" : "default",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 5 кнопок управления */}
      <div className="flex items-center justify-center gap-2 px-3 py-2">
        {/* Настройки */}
        <button
          onClick={onSettingsClick}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all hover:scale-105"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[9px] uppercase tracking-wider">Настройки</span>
        </button>

        {/* Mute */}
        <button
          onClick={() => setMuteOn(!muteOn)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all hover:scale-105"
          style={{ color: muteOn ? "var(--danger)" : "var(--text-secondary)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          <span className="text-[9px] uppercase tracking-wider">
            {muteOn ? "Тишина" : "Звук"}
          </span>
        </button>

        {/* Микрофон — центральная кнопка */}
        <button
          onClick={() => setMicOn(!micOn)}
          className="rounded-full w-14 h-14 flex items-center justify-center transition-all hover:scale-110 mx-1"
          style={{
            background: micOn ? "var(--accent)" : "var(--bg-glass)",
            border: `2px solid ${micOn ? "var(--accent-bright)" : "var(--bg-glass-border)"}`,
            boxShadow: micOn ? "0 0 25px var(--accent-glow-strong)" : "none",
            color: micOn ? "var(--bg-deep)" : "var(--accent)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* Мои контакты */}
        <button
          onClick={onContactsClick}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all hover:scale-105"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-[9px] uppercase tracking-wider">Контакты</span>
        </button>

        {/* Мои агенты */}
        <button
          onClick={onAgentsClick}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all hover:scale-105"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="5" />
            <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
            <circle cx="12" cy="8" r="2" fill="currentColor" opacity="0.3" />
          </svg>
          <span className="text-[9px] uppercase tracking-wider">Агенты</span>
        </button>
      </div>
    </div>
  );
}

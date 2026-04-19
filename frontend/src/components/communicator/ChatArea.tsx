"use client";
import { useRef, useEffect, useState } from "react";

export interface ChatMessage {
  id: string;
  sender: "user" | "butler" | "agent";
  name: string;
  text: string;
  color: string;
  timestamp: Date;
  /** Если true — сообщение было надиктовано голосом */
  isVoice?: boolean;
  /** URL медиа (картинка/видео) */
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

/** Кнопка прослушивания голосового сообщения */
function VoiceWave({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (playing) return;
    setPlaying(true);
    // MVP: используем Web Speech API
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "ru-RU";
      utt.rate = 1;
      utt.onend = () => setPlaying(false);
      utt.onerror = () => setPlaying(false);
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => setPlaying(false), 2000);
    }
  };

  return (
    <button
      onClick={handlePlay}
      className="flex items-center gap-2 mt-1.5"
      style={{ color: "var(--accent)" }}
    >
      {/* Play / волна */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        {playing ? (
          <rect x="6" y="4" width="4" height="16" rx="1" />
        ) : (
          <polygon points="5 3 19 12 5 21 5 3" />
        )}
        {playing && <rect x="14" y="4" width="4" height="16" rx="1" />}
      </svg>
      {/* Волновая дорожка */}
      <div className="flex items-center gap-[2px] h-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "2px",
              height: `${4 + Math.sin(i * 0.8) * 8 + Math.random() * 4}px`,
              background: playing ? "var(--accent)" : "var(--text-muted)",
              opacity: playing ? 1 : 0.5,
              transition: "all 0.15s",
            }}
          />
        ))}
      </div>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {playing ? "▶" : "♪"}
      </span>
    </button>
  );
}

/** Центральная область чата */
export default function ChatArea({
  messages,
  isTyping,
  topPad = 80,
  bottomPad = 130,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  topPad?: number;
  bottomPad?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const isUser = (s: string) => s === "user";

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ zIndex: 10, paddingTop: topPad + "px", paddingBottom: bottomPad + "px" }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ paddingLeft: "52px", paddingRight: "52px" }}
      >
        {/* Сообщения прижаты к низу (как Telegram) */}
        <div className="flex flex-col justify-end min-h-full">
          <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${isUser(msg.sender) ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                {/* Аватар агента (слева) */}
                {!isUser(msg.sender) && (
                  <div
                    className="w-7 h-7 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: "rgba(212, 168, 67, 0.12)",
                      border: "1.5px solid rgba(212, 168, 67, 0.3)",
                      color: "var(--accent)",
                    }}
                  >
                    {msg.name[0]}
                  </div>
                )}

                <div className={`flex flex-col ${isUser(msg.sender) ? "items-end" : "items-start"}`} style={{ maxWidth: "70%" }}>
                  {/* Имя агента */}
                  {!isUser(msg.sender) && (
                    <span className="text-[10px] mb-0.5 ml-1" style={{ color: "var(--accent)" }}>
                      {msg.name}
                    </span>
                  )}

                  {/* Пузырь */}
                  <div
                    className="rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed"
                    style={{
                      background: isUser(msg.sender) ? "var(--bubble-user)" : "var(--bubble-agent)",
                      border: "1px solid var(--bubble-border)",
                      color: "var(--text-primary)",
                      borderBottomRightRadius: isUser(msg.sender) ? "6px" : undefined,
                      borderBottomLeftRadius: !isUser(msg.sender) ? "6px" : undefined,
                    }}
                  >
                    {/* Медиа (картинка / видео) */}
                    {msg.mediaUrl && msg.mediaType === "image" && (
                      <img
                        src={msg.mediaUrl}
                        alt=""
                        className="rounded-lg mb-2 max-w-full"
                        style={{ maxHeight: "240px", objectFit: "cover" }}
                      />
                    )}
                    {msg.mediaUrl && msg.mediaType === "video" && (
                      <video
                        src={msg.mediaUrl}
                        controls
                        className="rounded-lg mb-2 max-w-full"
                        style={{ maxHeight: "240px" }}
                      />
                    )}

                    {msg.text}

                    {/* Голосовая дорожка */}
                    {msg.isVoice && <VoiceWave text={msg.text} />}
                  </div>
                </div>
              </div>
          ))}

            {/* Индикатор «печатает...» */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className="w-7 h-7 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: "rgba(212, 168, 67, 0.12)",
                    border: "1.5px solid rgba(212, 168, 67, 0.3)",
                    color: "var(--accent)",
                  }}
                >
                  Д
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] mb-0.5 ml-1" style={{ color: "var(--accent)" }}>Дворецкий</span>
                  <div
                    className="rounded-2xl px-3.5 py-2 text-sm"
                    style={{
                      background: "var(--bubble-agent)",
                      border: "1px solid var(--bubble-border)",
                      color: "var(--text-muted)",
                      borderBottomLeftRadius: "6px",
                    }}
                  >
                    <span className="inline-flex gap-1 items-center">
                      <span className="typing-dot" style={{ animationDelay: "0ms" }}>•</span>
                      <span className="typing-dot" style={{ animationDelay: "150ms" }}>•</span>
                      <span className="typing-dot" style={{ animationDelay: "300ms" }}>•</span>
                    </span>
                  </div>
                </div>
              </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

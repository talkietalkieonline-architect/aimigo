"use client";
import { useRef, useEffect } from "react";

export interface ChatMessage {
  id: string;
  sender: "user" | "butler" | "agent";
  name: string;
  text: string;
  color: string;
  timestamp: Date;
}

/** Центральная область чата — только сообщения */
export default function ChatArea({
  messages,
  isTyping,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ zIndex: 10, paddingTop: "80px", paddingBottom: "130px" }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {/* Аватар собеседника (слева) */}
              {msg.sender !== "user" && (
                <div
                  className="w-8 h-8 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: `${msg.color}22`,
                    border: `1.5px solid ${msg.color}44`,
                    color: msg.color,
                  }}
                >
                  {msg.name[0]}
                </div>
              )}

              <div className="flex flex-col max-w-[75%]">
                {/* Имя собеседника */}
                {msg.sender !== "user" && (
                  <span
                    className="text-[11px] mb-1 ml-1"
                    style={{ color: msg.color }}
                  >
                    {msg.name}
                  </span>
                )}

                {/* Пузырь сообщения */}
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    background:
                      msg.sender === "user"
                        ? "var(--bubble-user)"
                        : "var(--bubble-agent)",
                    border: "1px solid var(--bubble-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {/* Индикатор «печатает...» */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div
                className="w-8 h-8 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: "var(--accent)22",
                  border: "1.5px solid var(--accent)44",
                  color: "var(--accent)",
                }}
              >
                Д
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] mb-1 ml-1" style={{ color: "var(--accent)" }}>
                  Дворецкий
                </span>
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background: "var(--bubble-agent)",
                    border: "1px solid var(--bubble-border)",
                    color: "var(--text-muted)",
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
  );
}

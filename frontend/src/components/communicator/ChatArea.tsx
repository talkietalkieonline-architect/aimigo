"use client";
import { useState, useRef, useEffect } from "react";

export interface ChatMessage {
  id: string;
  sender: "user" | "butler" | "agent";
  name: string;
  text: string;
  color: string;
  timestamp: Date;
}

// Ответы Дворецкого (демо — пока нет бэкенда)
const BUTLER_REPLIES = [
  "Отличный вопрос! Давайте разберёмся вместе.",
  "Я всегда рад помочь. Что именно вас интересует?",
  "Хороший выбор! Могу подсказать ещё несколько вариантов.",
  "Записал. Напомню когда потребуется!",
  "Сейчас посмотрю в Городе Агентов, есть ли подходящий специалист.",
  "Между прочим, сегодня в Эфире много интересного — обратите внимание на бегущую строку.",
  "Я рядом, если что — обращайтесь в любой момент.",
  "Могу найти агента-консультанта по этой теме. Хотите?",
  "Это интересно! Расскажите подробнее.",
  "Принято! Работаю над этим.",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "butler",
    name: "Дворецкий",
    text: "Добро пожаловать в Aimigo! Я ваш Дворецкий. Могу рассказать о сервисе, найти нужного агента или просто поболтать.",
    color: "var(--accent)",
    timestamp: new Date(),
  },
];

/** Центральная область чата с вводом сообщений */
export default function ChatArea() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgCounter = useRef(2);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: String(msgCounter.current++),
      sender: "user",
      name: "",
      text,
      color: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Имитация ответа Дворецкого
    setIsTyping(true);
    const delay = 800 + Math.random() * 1500;
    setTimeout(() => {
      const reply = BUTLER_REPLIES[Math.floor(Math.random() * BUTLER_REPLIES.length)];
      const butlerMsg: ChatMessage = {
        id: String(msgCounter.current++),
        sender: "butler",
        name: "Дворецкий",
        text: reply,
        color: "var(--accent)",
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, butlerMsg]);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col pt-20 pb-28"
      style={{ zIndex: 10 }}
    >
      {/* Область сообщений (скроллируемая) */}
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

      {/* Поле ввода сообщения */}
      <div className="px-4 max-w-2xl mx-auto w-full">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2"
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--bg-glass-border)",
            backdropFilter: "blur(20px)",
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
            onClick={sendMessage}
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95"
            style={{
              background: inputText.trim() ? "var(--accent)" : "var(--bg-glass-border)",
              color: inputText.trim() ? "var(--bg-deep)" : "var(--text-muted)",
              cursor: inputText.trim() ? "pointer" : "default",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

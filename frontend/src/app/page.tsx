"use client";
import { useState } from "react";
import Particles from "@/components/communicator/Particles";
import TopBar from "@/components/communicator/TopBar";
import BottomBar from "@/components/communicator/BottomBar";
import ChatArea from "@/components/communicator/ChatArea";
import SideTab from "@/components/communicator/SideTab";

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Фоновые частицы */}
      <Particles />

      {/* Верхняя панель */}
      <TopBar tickerActive={true} />

      {/* Левый язычок */}
      <SideTab side="left" onClick={() => setLeftOpen(!leftOpen)} />

      {/* Правый язычок */}
      <SideTab side="right" onClick={() => setRightOpen(!rightOpen)} />

      {/* Левая панель — Режимы + Комнаты */}
      {leftOpen && (
        <div
          className="fixed top-0 left-0 bottom-0 w-64 p-4 pt-20 overflow-y-auto transition-transform"
          style={{
            background: "var(--panel-bg)",
            borderRight: "1px solid var(--panel-border)",
            zIndex: 45,
            backdropFilter: "blur(20px)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Режимы
          </p>
          {["Общение", "Прогулка", "Обучение", "Покупки", "Работа"].map((mode, i) => (
            <button
              key={mode}
              className="w-full text-left px-3 py-2.5 rounded-lg mb-1.5 text-sm transition-all"
              style={{
                background: i === 0 ? "var(--bg-glass-hover)" : "transparent",
                border: i === 0 ? "1px solid var(--accent)" : "1px solid transparent",
                color: i === 0 ? "var(--accent-bright)" : "var(--text-secondary)",
              }}
            >
              {mode}
            </button>
          ))}

          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-3 mt-6"
            style={{ color: "var(--text-muted)" }}
          >
            Комнаты
          </p>
          {["Общая комната", "Приватная 1"].map((room, i) => (
            <button
              key={room}
              className="w-full text-left px-3 py-2.5 rounded-lg mb-1.5 text-sm transition-all"
              style={{
                background: i === 0 ? "var(--bg-glass-hover)" : "transparent",
                border: "1px solid var(--bg-glass-border)",
                color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              {room}
            </button>
          ))}
          <button
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm"
            style={{
              border: "1px dashed var(--bg-glass-border)",
              color: "var(--text-muted)",
            }}
          >
            + Создать комнату
          </button>
        </div>
      )}

      {/* Правая панель — Дворецкий + Участники */}
      {rightOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 w-56 p-4 pt-20 overflow-y-auto"
          style={{
            background: "var(--panel-bg)",
            borderLeft: "1px solid var(--panel-border)",
            zIndex: 45,
            backdropFilter: "blur(20px)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Команда эфира
          </p>

          {/* Дворецкий — закреплён */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-1.5"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-bright))",
                color: "var(--bg-deep)",
                boxShadow: "0 0 20px var(--accent-glow)",
              }}
            >
              Д
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              Дворецкий
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Помощник
            </span>
          </div>

          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Приглашённые
          </p>

          {/* Пример агента */}
          <div className="flex flex-col items-center mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-1"
              style={{
                background: "rgba(100, 180, 255, 0.15)",
                border: "1.5px solid rgba(100, 180, 255, 0.3)",
                color: "#64b4ff",
              }}
            >
              Н
            </div>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Новости
            </span>
          </div>
        </div>
      )}

      {/* Центральная область чата */}
      <ChatArea />

      {/* Нижняя панель */}
      <BottomBar
        onSettingsClick={() => alert("Центр Управления — в разработке")}
        onContactsClick={() => alert("Мои контакты — в разработке")}
        onAgentsClick={() => alert("Мои агенты — в разработке")}
      />
    </div>
  );
}

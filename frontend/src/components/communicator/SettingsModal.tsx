"use client";
import { useState } from "react";

const THEMES = [
  { id: "noir-gold", name: "Noir Gold", desc: "Тёмный + золото" },
  { id: "cyberpunk", name: "Cyberpunk", desc: "Тёмный + неон" },
  { id: "arctic", name: "Arctic", desc: "Светлый + лёд" },
  { id: "midnight", name: "Midnight", desc: "Глубокий синий" },
  { id: "sunset", name: "Sunset", desc: "Тёплые градиенты" },
];

const SECTIONS = [
  "Персональные данные",
  "Настройка персонажа",
  "Настройка интерфейса",
  "Интересы и Контент",
  "Система",
  "Настройки Помощника",
];

export default function SettingsModal({
  isOpen,
  onClose,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState("noir-gold");

  if (!isOpen) return null;

  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 100 }}
      onClick={onClose}
    >
      {/* Затемнение */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Модалка */}
      <div
        className="relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          backdropFilter: "blur(30px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Центр Управления
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--bg-glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Разделы */}
        {activeSection === null ? (
          <div className="flex flex-col gap-1">
            {SECTIONS.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-left text-sm transition-all"
                style={{
                  color: "var(--text-primary)",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-glass-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {section}
                <span style={{ color: "var(--text-muted)" }}>›</span>
              </button>
            ))}

            {/* Кнопка выхода */}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--bg-glass-border)" }}>
              <button
                onClick={() => {
                  onClose();
                  onLogout?.();
                }}
                className="flex items-center gap-2.5 w-full px-4 py-3.5 rounded-xl text-left text-sm transition-all"
                style={{ color: "var(--danger)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(231,76,60,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Выйти
              </button>
            </div>
          </div>
        ) : activeSection === "Настройка интерфейса" ? (
          <div>
            <button
              onClick={() => setActiveSection(null)}
              className="text-sm mb-4 flex items-center gap-1"
              style={{ color: "var(--accent)" }}
            >
              ‹ Назад
            </button>
            <h3
              className="text-sm font-medium mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Тема оформления
            </h3>
            <div className="flex flex-col gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => changeTheme(theme.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background:
                      theme.id === currentTheme
                        ? "var(--bg-glass-hover)"
                        : "transparent",
                    border:
                      theme.id === currentTheme
                        ? "1px solid var(--accent)"
                        : "1px solid transparent",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      background:
                        theme.id === currentTheme
                          ? "var(--accent)"
                          : "var(--bg-glass-border)",
                      boxShadow:
                        theme.id === currentTheme
                          ? "0 0 10px var(--accent-glow)"
                          : "none",
                    }}
                  />
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {theme.name}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {theme.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setActiveSection(null)}
              className="text-sm mb-4 flex items-center gap-1"
              style={{ color: "var(--accent)" }}
            >
              ‹ Назад
            </button>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {activeSection} — в разработке
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

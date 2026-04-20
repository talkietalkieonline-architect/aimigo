"use client";
import { useState, useEffect, useCallback } from "react";
import { getMyAgents, deleteAgent, type AgentOut } from "@/services/api";

/* ══════════════════════════════════════════════════════════════
   ЛК Бизнеса — управление своими агентами
   ══════════════════════════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: () => void;
}

export default function BusinessDashboardModal({ isOpen, onClose, onCreateAgent }: Props) {
  const [myAgents, setMyAgents] = useState<AgentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentOut | null>(null);

  const loadMyAgents = useCallback(async () => {
    setLoading(true);
    try {
      const agents = await getMyAgents();
      setMyAgents(agents);
    } catch {
      // API недоступен
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadMyAgents();
  }, [isOpen, loadMyAgents]);

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить агента? Это действие нельзя отменить.")) return;
    try {
      await deleteAgent(id);
      setMyAgents((prev) => prev.filter((a) => a.id !== id));
      setSelectedAgent(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 105 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          backdropFilter: "blur(30px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Для бизнеса
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Управление вашими AI-агентами
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--bg-glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Детали агента */}
          {selectedAgent ? (
            <div className="animate-fade-in">
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: "var(--accent)" }}
              >
                ‹ Назад
              </button>

              {/* Карточка */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{
                    background: `${selectedAgent.color}22`,
                    border: `2px solid ${selectedAgent.color}55`,
                    color: selectedAgent.color,
                  }}
                >
                  {selectedAgent.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedAgent.name}
                  </h3>
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {selectedAgent.profession} &bull; {selectedAgent.brand}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span style={{ color: "#FFD700", fontSize: "12px" }}>★</span>
                    <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {selectedAgent.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: "Диалогов", value: "—" },
                  { label: "Рейтинг", value: selectedAgent.rating.toFixed(1) },
                  { label: "Отзывов", value: String(selectedAgent.rating_count) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl px-3 py-3 text-center"
                    style={{
                      background: "var(--bg-glass)",
                      border: "1px solid var(--bg-glass-border)",
                    }}
                  >
                    <div className="text-lg font-semibold" style={{ color: "var(--accent)" }}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Описание */}
              {selectedAgent.description && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  {selectedAgent.description}
                </p>
              )}

              {/* Действия */}
              <div className="flex flex-col gap-1">
                {[
                  { action: "Редактировать агента", danger: false },
                  { action: "Посмотреть в каталоге", danger: false },
                  { action: "Удалить агента", danger: true },
                ].map(({ action, danger }) => (
                  <button
                    key={action}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{ color: danger ? "var(--danger)" : "var(--text-primary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => {
                      if (action === "Удалить агента") {
                        handleDelete(selectedAgent.id);
                      } else if (action === "Посмотреть в каталоге") {
                        setSelectedAgent(null);
                        onClose();
                      }
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Кнопка создания */}
              <button
                onClick={() => { onCreateAgent(); }}
                className="w-full py-3.5 rounded-xl text-sm font-semibold mb-5 transition-all hover:scale-[1.02]"
                style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
              >
                + Создать нового агента
              </button>

              {/* Список моих агентов */}
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Мои агенты ({myAgents.length})
              </p>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Загрузка...</p>
                </div>
              ) : myAgents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 opacity-30">🤖</div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    У вас пока нет агентов
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Создайте первого AI-агента для вашего бизнеса
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {myAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: `${agent.color}22`,
                          border: `1.5px solid ${agent.color}44`,
                          color: agent.color,
                        }}
                      >
                        {agent.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block" style={{ color: "var(--text-primary)" }}>
                          {agent.name}
                        </span>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                          {agent.profession} &bull; {agent.brand}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span style={{ color: "#FFD700", fontSize: "11px" }}>★</span>
                        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {agent.rating.toFixed(1)}
                        </span>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Инфо-блок */}
              <div
                className="rounded-xl px-4 py-3 mt-5"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--bg-glass-border)",
                }}
              >
                <p className="text-[11px] font-medium mb-1" style={{ color: "var(--accent)" }}>
                  Как это работает?
                </p>
                <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: "var(--text-muted)" }}>
                  <li>1. Создайте агента в Конструкторе</li>
                  <li>2. Настройте AI-промпт и приветствие</li>
                  <li>3. Агент появится в Городе Агентов</li>
                  <li>4. Пользователи начнут с ним общаться</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

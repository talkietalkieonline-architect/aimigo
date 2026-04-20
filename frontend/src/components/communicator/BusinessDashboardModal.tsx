"use client";
import { useState, useEffect, useCallback } from "react";
import { getMyAgents, updateAgent, type AgentOut, type AgentCreate } from "@/services/api";

/* ══════════════════════════════════════════════════════════════
   ЛК Бизнеса — настройка привязанных агентов
   Бизнес НЕ создаёт агентов — админ создаёт и привязывает.
   Бизнес настраивает: голос, внешность, одежду, манеры, знания, промпт.
   TODO Сессия 8: полный UI секций настройки персонажа.
   ══════════════════════════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessDashboardModal({ isOpen, onClose }: Props) {
  const [myAgents, setMyAgents] = useState<AgentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentOut | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Редактируемые поля
  const [editDesc, setEditDesc] = useState("");
  const [editGreeting, setEditGreeting] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editModel, setEditModel] = useState("gpt-4o-mini");
  const [saving, setSaving] = useState(false);

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

  const openEdit = (agent: AgentOut) => {
    setEditDesc(agent.description || "");
    setEditGreeting(agent.greeting || "");
    setEditPrompt("");
    setEditModel("gpt-4o-mini");
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      const data: Partial<AgentCreate> = {};
      if (editDesc !== (selectedAgent.description || "")) data.description = editDesc;
      if (editGreeting !== (selectedAgent.greeting || "")) data.greeting = editGreeting;
      if (editPrompt.trim()) data.system_prompt = editPrompt;
      if (editModel) data.llm_model = editModel;
      await updateAgent(selectedAgent.id, data);
      setEditMode(false);
      loadMyAgents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
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

          {/* Редактирование агента */}
          {selectedAgent && editMode ? (
            <div className="animate-fade-in">
              <button onClick={() => setEditMode(false)} className="text-sm mb-4" style={{ color: "var(--accent)" }}>‹ Назад</button>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Настройка: {selectedAgent.name}</h3>
              {/* Описание */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Описание</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none"
                  style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
              </div>
              {/* Приветствие */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Приветствие</label>
                <textarea value={editGreeting} onChange={(e) => setEditGreeting(e.target.value)} rows={2}
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none"
                  style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
              </div>
              {/* Промпт */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>AI инструкция</label>
                <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={4} placeholder="Как агент должен отвечать..."
                  className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none font-mono"
                  style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
              </div>
              {/* Модель */}
              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>AI модель</label>
                <div className="flex gap-2">
                  {[{ id: "gpt-4o-mini", label: "GPT-4o Mini" }, { id: "gpt-4o", label: "GPT-4o" }].map((m) => (
                    <button key={m.id} onClick={() => setEditModel(m.id)} className="flex-1 px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                      style={{ background: editModel === m.id ? "var(--accent)" : "var(--bg-glass)", color: editModel === m.id ? "var(--bg-deep)" : "var(--text-secondary)", border: editModel === m.id ? "1px solid var(--accent)" : "1px solid var(--bg-glass-border)" }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Плейсхолдеры будущих секций */}
              {["Голос", "Внешность", "Одежда", "Манеры", "Знания и данные"].map((section) => (
                <div key={section} className="rounded-xl px-4 py-3 mb-2" style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{section}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,168,67,0.1)", color: "var(--accent)" }}>Скоро</span>
                  </div>
                </div>
              ))}
              <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl text-sm font-semibold mt-3 transition-all"
                style={{ background: saving ? "var(--bg-glass-border)" : "var(--accent)", color: saving ? "var(--text-muted)" : "var(--bg-deep)" }}>
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          ) : selectedAgent ? (
            /* Детали агента */
            <div className="animate-fade-in">
              <button onClick={() => setSelectedAgent(null)} className="text-sm mb-4" style={{ color: "var(--accent)" }}>‹ Назад</button>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: `${selectedAgent.color}22`, border: `2px solid ${selectedAgent.color}55`, color: selectedAgent.color }}>{selectedAgent.name[0]}</div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{selectedAgent.name}</h3>
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{selectedAgent.profession} &bull; {selectedAgent.brand}</p>
                  <div className="flex items-center gap-1 mt-1"><span style={{ color: "#FFD700", fontSize: "12px" }}>★</span><span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{selectedAgent.rating.toFixed(1)}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[{ label: "Диалогов", value: "—" }, { label: "Рейтинг", value: selectedAgent.rating.toFixed(1) }, { label: "Отзывов", value: String(selectedAgent.rating_count) }].map((s) => (
                  <div key={s.label} className="rounded-xl px-3 py-3 text-center" style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)" }}>
                    <div className="text-lg font-semibold" style={{ color: "var(--accent)" }}>{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {selectedAgent.description && <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{selectedAgent.description}</p>}
              <button onClick={() => openEdit(selectedAgent)} className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: "var(--accent)", color: "var(--bg-deep)" }}>Настроить агента</button>
            </div>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Ваши агенты ({myAgents.length})
              </p>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Загрузка...</p>
                </div>
              ) : myAgents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 opacity-30">🤖</div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>У вас пока нет привязанных агентов</p>
                  <p className="text-[12px] mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>Свяжитесь с нами для создания<br />AI-агента для вашего бизнеса</p>
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

              <div className="rounded-xl px-4 py-3 mt-5" style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)" }}>
                <p className="text-[11px] font-medium mb-1" style={{ color: "var(--accent)" }}>Как это работает?</p>
                <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: "var(--text-muted)" }}>
                  <li>1. Мы создаём AI-агента для вашего бизнеса</li>
                  <li>2. Вы настраиваете его голос, внешность, манеры и знания</li>
                  <li>3. Агент появляется в Городе Агентов</li>
                  <li>4. Пользователи общаются с ним</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

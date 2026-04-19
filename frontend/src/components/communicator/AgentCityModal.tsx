"use client";
import { useState, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════
   Город Агентов — каталог агентов с поиском, фильтрами и меню
   ══════════════════════════════════════════════════════════════ */

interface CityAgent {
  id: string;
  name: string;
  profession: string;
  brand: string;
  color: string;
  type: "business" | "citizen" | "system";
  added: boolean;
  rating: number;
  description: string;
}

const PROFESSIONS = [
  "Все",
  "Консультант",
  "Продавец",
  "Психолог",
  "Тренер",
  "Аналитик",
  "Ассистент",
  "Собеседник",
  "Информатор",
  "Юрист",
  "Стилист",
  "Лектор",
];

const TYPES = [
  { id: "all", label: "Все" },
  { id: "citizen", label: "Жители" },
  { id: "business", label: "Бизнес" },
  { id: "system", label: "Системные" },
];

const CITY_AGENTS: CityAgent[] = [
  {
    id: "c1",
    name: "Тим",
    profession: "Консультант",
    brand: "Adidas",
    color: "#4CAF50",
    type: "business",
    added: true,
    rating: 4.7,
    description: "Эксперт по спортивной одежде и обуви Adidas. Подберу размер, расскажу о новинках, помогу оформить заказ.",
  },
  {
    id: "c2",
    name: "Алиса",
    profession: "Продавец",
    brand: "Zara",
    color: "#E91E63",
    type: "business",
    added: true,
    rating: 4.5,
    description: "Стилист-консультант Zara. Помогу собрать образ, подскажу что сейчас в тренде.",
  },
  {
    id: "c3",
    name: "Дворецкий",
    profession: "Ассистент",
    brand: "Aimigo",
    color: "#FFD700",
    type: "system",
    added: true,
    rating: 5.0,
    description: "Ваш персональный помощник. Всегда рядом, всё знаю о сервисе.",
  },
  {
    id: "c4",
    name: "Новости СПб",
    profession: "Информатор",
    brand: "Aimigo",
    color: "#2196F3",
    type: "system",
    added: true,
    rating: 4.8,
    description: "Оперативные новости города: пробки, погода, МЧС, события.",
  },
  {
    id: "c5",
    name: "Макс",
    profession: "Юрист",
    brand: "Aimigo",
    color: "#FF9800",
    type: "system",
    added: true,
    rating: 4.6,
    description: "Юрист-консультант по ПДД. Объясню штрафы, права и обязанности водителя.",
  },
  {
    id: "c6",
    name: "Доктор Вера",
    profession: "Психолог",
    brand: "Aimigo",
    color: "#9C27B0",
    type: "system",
    added: false,
    rating: 4.9,
    description: "Психолог-консультант. Поговорим о том, что беспокоит. Помогу справиться со стрессом.",
  },
  {
    id: "c7",
    name: "Лена",
    profession: "Стилист",
    brand: "H&M",
    color: "#F44336",
    type: "business",
    added: false,
    rating: 4.3,
    description: "Стилист H&M. Помогу подобрать гардероб на любой бюджет.",
  },
  {
    id: "c8",
    name: "Артём",
    profession: "Тренер",
    brand: "FitLife",
    color: "#00BCD4",
    type: "business",
    added: false,
    rating: 4.4,
    description: "Персональный фитнес-тренер. Составлю программу тренировок и питания.",
  },
  {
    id: "c9",
    name: "София",
    profession: "Аналитик",
    brand: "DataPro",
    color: "#607D8B",
    type: "business",
    added: false,
    rating: 4.2,
    description: "Бизнес-аналитик. Помогу разобраться с данными, построю отчёты.",
  },
  {
    id: "c10",
    name: "Борис",
    profession: "Собеседник",
    brand: "Aimigo",
    color: "#795548",
    type: "citizen",
    added: false,
    rating: 4.0,
    description: "Просто хороший собеседник. Поговорим о жизни, книгах, кино.",
  },
  {
    id: "c11",
    name: "Мария",
    profession: "Лектор",
    brand: "EduTech",
    color: "#3F51B5",
    type: "business",
    added: false,
    rating: 4.8,
    description: "Лектор по программированию. Python, JavaScript, Data Science — понятно и по делу.",
  },
  {
    id: "c12",
    name: "Игорь",
    profession: "Консультант",
    brand: "Nike",
    color: "#FF5722",
    type: "business",
    added: false,
    rating: 4.5,
    description: "Консультант Nike. Кроссовки, экипировка, лимитированные коллекции.",
  },
  {
    id: "c13",
    name: "Олег",
    profession: "Собеседник",
    brand: "Aimigo",
    color: "#8BC34A",
    type: "citizen",
    added: false,
    rating: 3.9,
    description: "Разбираюсь в музыке, путешествиях, гастрономии. Давай поболтаем!",
  },
  {
    id: "c14",
    name: "Почтальон",
    profession: "Ассистент",
    brand: "Aimigo",
    color: "#CDDC39",
    type: "system",
    added: false,
    rating: 4.7,
    description: "Агент-почтальон. Проверю почту, уведомлю о важных письмах.",
  },
];

export default function AgentCityModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("Все");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agents, setAgents] = useState(CITY_AGENTS);

  // Фильтрация
  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProfession =
        selectedProfession === "Все" || a.profession === selectedProfession;
      const matchType =
        selectedType === "all" || a.type === selectedType;
      return matchSearch && matchProfession && matchType;
    });
  }, [agents, searchQuery, selectedProfession, selectedType]);

  // Счётчики
  const counts = useMemo(() => ({
    total: agents.length,
    business: agents.filter((a) => a.type === "business").length,
    citizen: agents.filter((a) => a.type === "citizen").length,
    system: agents.filter((a) => a.type === "system").length,
  }), [agents]);

  if (!isOpen) return null;

  const agentDetails = selectedAgent
    ? agents.find((a) => a.id === selectedAgent)
    : null;

  const toggleAdd = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, added: !a.added } : a))
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 100 }}
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
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Город Агентов
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Всего {counts.total} &bull; Бизнес {counts.business} &bull; Жители {counts.citizen}
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

          {/* Поиск */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--bg-glass-border)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, профессии, бренду..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Фильтры по типу */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: selectedType === t.id ? "var(--accent)" : "var(--bg-glass)",
                  color: selectedType === t.id ? "var(--bg-deep)" : "var(--text-secondary)",
                  border:
                    selectedType === t.id
                      ? "1px solid var(--accent)"
                      : "1px solid var(--bg-glass-border)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Фильтры по профессии — горизонтальный скролл */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {PROFESSIONS.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProfession(p)}
                className="px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all shrink-0"
                style={{
                  background: selectedProfession === p ? "var(--bg-glass-hover)" : "transparent",
                  color: selectedProfession === p ? "var(--accent)" : "var(--text-muted)",
                  border:
                    selectedProfession === p
                      ? "1px solid var(--accent)"
                      : "1px solid transparent",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Контент — скроллируемый */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Экран деталей агента */}
          {agentDetails ? (
            <div className="animate-fade-in">
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: "var(--accent)" }}
              >
                ‹ Назад к списку
              </button>

              {/* Карточка агента */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{
                    background: `${agentDetails.color}22`,
                    border: `2px solid ${agentDetails.color}55`,
                    color: agentDetails.color,
                  }}
                >
                  {agentDetails.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                      {agentDetails.name}
                    </h3>
                    {agentDetails.added && (
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--success)",
                          color: "#fff",
                        }}
                      >
                        у тебя
                      </span>
                    )}
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {agentDetails.profession} &bull; {agentDetails.brand}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span style={{ color: "#FFD700", fontSize: "12px" }}>★</span>
                    <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {agentDetails.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Описание */}
              <p
                className="text-sm leading-relaxed mb-5 px-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {agentDetails.description}
              </p>

              {/* Действия */}
              <div className="flex flex-col gap-1">
                {[
                  "Смотреть презентацию",
                  agentDetails.added ? "Уже у тебя в избранном" : "Добавить в Мои агенты",
                  "Начать чат",
                  "Оценить агента",
                  "Пожаловаться",
                ].map((action) => {
                  const isDisabled = action === "Уже у тебя в избранном";
                  const isDanger = action === "Пожаловаться";
                  const isAdd = action === "Добавить в Мои агенты";

                  return (
                    <button
                      key={action}
                      disabled={isDisabled}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        color: isDanger
                          ? "var(--danger)"
                          : isDisabled
                            ? "var(--text-muted)"
                            : isAdd
                              ? "var(--accent)"
                              : "var(--text-primary)",
                        cursor: isDisabled ? "default" : "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) e.currentTarget.style.background = "var(--bg-glass-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => {
                        if (isAdd) {
                          toggleAdd(agentDetails.id);
                        }
                        if (action === "Начать чат") {
                          setSelectedAgent(null);
                          onClose();
                        }
                      }}
                    >
                      {action}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Список агентов */}
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Агенты не найдены
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedProfession("Все");
                      setSelectedType("all");
                    }}
                    className="text-sm mt-2"
                    style={{ color: "var(--accent)" }}
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filtered.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-glass-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {/* Аватар */}
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

                      {/* Инфо */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {agent.name}
                          </span>
                          {agent.added && (
                            <span
                              className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0"
                              style={{
                                background: "var(--success)",
                                color: "#fff",
                              }}
                            >
                              у тебя
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {agent.profession} &bull; {agent.brand}
                        </p>
                      </div>

                      {/* Рейтинг */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span style={{ color: "#FFD700", fontSize: "11px" }}>★</span>
                        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {agent.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Стрелка */}
                      <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>›</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

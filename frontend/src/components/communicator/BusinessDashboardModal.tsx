"use client";
import { useState, useEffect, useCallback } from "react";
import { getMyAgents, updateAgent, type AgentFullOut, type AgentPersonaUpdate } from "@/services/api";

/* ══════════════════════════════════════════════════════════════
   ЛК Бизнеса — настройка привязанных агентов
   Полный UI: Описание, AI, Манеры, Знания, Голос, Внешность, Одежда
   ══════════════════════════════════════════════════════════════ */

// ── Справочники пресетов ──
const VOICE_PRESETS = [
  { id: "male-deep", label: "Мужской низкий", icon: "🗣" },
  { id: "male-medium", label: "Мужской средний", icon: "🗣" },
  { id: "female-warm", label: "Женский тёплый", icon: "👩" },
  { id: "female-bright", label: "Женский яркий", icon: "👩" },
  { id: "neutral", label: "Нейтральный", icon: "🤖" },
];

const MANNER_STYLES = [
  { id: "friendly", label: "Дружелюбный" },
  { id: "formal", label: "Формальный" },
  { id: "playful", label: "Игривый" },
  { id: "strict", label: "Строгий" },
];

const TEMPERAMENTS = [
  { id: "calm", label: "Спокойный" },
  { id: "balanced", label: "Сбалансированный" },
  { id: "energetic", label: "Энергичный" },
  { id: "reserved", label: "Сдержанный" },
];

const FACE_PRESETS = [
  { id: "round", label: "Круглое" },
  { id: "oval", label: "Овальное" },
  { id: "angular", label: "Угловатое" },
  { id: "soft", label: "Мягкое" },
];

const HAIR_PRESETS = [
  { id: "short-dark", label: "Короткие тёмные" },
  { id: "short-light", label: "Короткие светлые" },
  { id: "long-dark", label: "Длинные тёмные" },
  { id: "long-light", label: "Длинные светлые" },
  { id: "bald", label: "Без волос" },
];

const SKIN_PRESETS = [
  { id: "light", label: "Светлая" },
  { id: "medium", label: "Средняя" },
  { id: "tan", label: "Загорелая" },
  { id: "dark", label: "Тёмная" },
];

const BODY_PRESETS = [
  { id: "slim", label: "Стройное" },
  { id: "average", label: "Среднее" },
  { id: "athletic", label: "Атлетичное" },
  { id: "large", label: "Крупное" },
];

const OUTFIT_STYLES = [
  { id: "formal", label: "Деловой" },
  { id: "casual", label: "Повседневный" },
  { id: "sport", label: "Спортивный" },
  { id: "creative", label: "Креативный" },
];

type EditSection = "main" | "manners" | "knowledge" | "voice" | "appearance" | "outfit";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessDashboardModal({ isOpen, onClose }: Props) {
  const [myAgents, setMyAgents] = useState<AgentFullOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentFullOut | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<EditSection>("main");

  // ── Редактируемые поля (все секции) ──
  const [editDesc, setEditDesc] = useState("");
  const [editGreeting, setEditGreeting] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editModel, setEditModel] = useState("gpt-4o-mini");
  // Манеры
  const [mannerStyle, setMannerStyle] = useState("friendly");
  const [mannerTemperament, setMannerTemperament] = useState("balanced");
  const [mannerHumor, setMannerHumor] = useState(true);
  const [mannerEmoji, setMannerEmoji] = useState(true);
  // Знания
  const [knowledgeText, setKnowledgeText] = useState("");
  // Голос
  const [voiceId, setVoiceId] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  // Внешность
  const [appFace, setAppFace] = useState("");
  const [appHair, setAppHair] = useState("");
  const [appSkin, setAppSkin] = useState("");
  const [appBody, setAppBody] = useState("");
  // Одежда
  const [outfitStyle, setOutfitStyle] = useState("");
  const [outfitTop, setOutfitTop] = useState("");
  const [outfitBottom, setOutfitBottom] = useState("");
  const [outfitShoes, setOutfitShoes] = useState("");
  const [outfitAccessory, setOutfitAccessory] = useState("");

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

  /** Инициализация всех полей из агента */
  const openEdit = (agent: AgentFullOut) => {
    setEditDesc(agent.description || "");
    setEditGreeting(agent.greeting || "");
    setEditPrompt(agent.system_prompt || "");
    setEditModel(agent.llm_model || "gpt-4o-mini");
    // Манеры
    setMannerStyle(agent.manner_style || "friendly");
    setMannerTemperament(agent.manner_temperament || "balanced");
    setMannerHumor(agent.manner_humor ?? true);
    setMannerEmoji(agent.manner_emoji_use ?? true);
    // Знания
    setKnowledgeText(agent.knowledge_text || "");
    // Голос
    setVoiceId(agent.voice_id || "");
    setVoiceSpeed(agent.voice_speed ?? 1.0);
    setVoicePitch(agent.voice_pitch ?? 1.0);
    // Внешность
    setAppFace(agent.appearance_face || "");
    setAppHair(agent.appearance_hair || "");
    setAppSkin(agent.appearance_skin || "");
    setAppBody(agent.appearance_body || "");
    // Одежда
    setOutfitStyle(agent.outfit_style || "");
    setOutfitTop(agent.outfit_top || "");
    setOutfitBottom(agent.outfit_bottom || "");
    setOutfitShoes(agent.outfit_shoes || "");
    setOutfitAccessory(agent.outfit_accessory || "");

    setActiveSection("main");
    setEditMode(true);
  };

  /** Сохранение всех секций разом */
  const handleSave = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    try {
      const data: AgentPersonaUpdate = {
        description: editDesc,
        greeting: editGreeting,
        system_prompt: editPrompt,
        llm_model: editModel,
        // Манеры
        manner_style: mannerStyle,
        manner_temperament: mannerTemperament,
        manner_humor: mannerHumor,
        manner_emoji_use: mannerEmoji,
        // Знания
        knowledge_text: knowledgeText || undefined,
        // Голос
        voice_id: voiceId || undefined,
        voice_speed: voiceSpeed,
        voice_pitch: voicePitch,
        // Внешность
        appearance_face: appFace || undefined,
        appearance_hair: appHair || undefined,
        appearance_skin: appSkin || undefined,
        appearance_body: appBody || undefined,
        // Одежда
        outfit_style: outfitStyle || undefined,
        outfit_top: outfitTop || undefined,
        outfit_bottom: outfitBottom || undefined,
        outfit_shoes: outfitShoes || undefined,
        outfit_accessory: outfitAccessory || undefined,
      };
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

          {/* Редактирование агента — полный UI настройки персонажа */}
          {selectedAgent && editMode ? (
            <div className="animate-fade-in">
              <button onClick={() => setEditMode(false)} className="text-sm mb-3" style={{ color: "var(--accent)" }}>‹ Назад</button>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{selectedAgent.name}</h3>

              {/* ── Табы секций ── */}
              <div className="flex gap-1 flex-wrap mb-4">
                {([
                  { id: "main" as const, label: "AI" },
                  { id: "manners" as const, label: "Манеры" },
                  { id: "knowledge" as const, label: "Знания" },
                  { id: "voice" as const, label: "Голос" },
                  { id: "appearance" as const, label: "Внешность" },
                  { id: "outfit" as const, label: "Одежда" },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      background: activeSection === tab.id ? "var(--accent)" : "var(--bg-glass)",
                      color: activeSection === tab.id ? "var(--bg-deep)" : "var(--text-secondary)",
                      border: `1px solid ${activeSection === tab.id ? "var(--accent)" : "var(--bg-glass-border)"}`,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ═══ Секция: AI (описание + промпт + модель) ═══ */}
              {activeSection === "main" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Описание</label>
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Приветствие</label>
                    <textarea value={editGreeting} onChange={(e) => setEditGreeting(e.target.value)} rows={2}
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>AI инструкция</label>
                    <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={4} placeholder="Как агент должен отвечать..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none font-mono"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
                  </div>
                  <div>
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
                </div>
              )}

              {/* ═══ Секция: Манеры ═══ */}
              {activeSection === "manners" && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Стиль общения</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MANNER_STYLES.map((s) => (
                        <button key={s.id} onClick={() => setMannerStyle(s.id)} className="px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                          style={{ background: mannerStyle === s.id ? "var(--accent)" : "var(--bg-glass)", color: mannerStyle === s.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${mannerStyle === s.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Темперамент</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TEMPERAMENTS.map((t) => (
                        <button key={t.id} onClick={() => setMannerTemperament(t.id)} className="px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                          style={{ background: mannerTemperament === t.id ? "var(--accent)" : "var(--bg-glass)", color: mannerTemperament === t.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${mannerTemperament === t.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setMannerHumor(!mannerHumor)} className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                      style={{ background: "var(--bg-glass)", border: `1px solid ${mannerHumor ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Юмор</span>
                      <span className="text-[12px] font-medium" style={{ color: mannerHumor ? "var(--accent)" : "var(--text-muted)" }}>{mannerHumor ? "ВКЛ" : "ВЫКЛ"}</span>
                    </button>
                    <button onClick={() => setMannerEmoji(!mannerEmoji)} className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                      style={{ background: "var(--bg-glass)", border: `1px solid ${mannerEmoji ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Эмодзи</span>
                      <span className="text-[12px] font-medium" style={{ color: mannerEmoji ? "var(--accent)" : "var(--text-muted)" }}>{mannerEmoji ? "ВКЛ" : "ВЫКЛ"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ Секция: Знания ═══ */}
              {activeSection === "knowledge" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>База знаний</label>
                    <p className="text-[11px] mb-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      FAQ, описания товаров, прайс-лист, правила — всё, что агент должен знать.
                    </p>
                    <textarea value={knowledgeText} onChange={(e) => setKnowledgeText(e.target.value)} rows={8}
                      placeholder="Наш магазин работает с 9:00 до 21:00...\nДоставка бесплатная от 3000₽...\nВозврат 14 дней..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none resize-none"
                      style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
                    <p className="text-[10px] mt-1.5 text-right" style={{ color: "var(--text-muted)" }}>
                      {knowledgeText.length} / 50 000 символов
                    </p>
                  </div>
                  {/* Плейсхолдеры будущих фич */}
                  <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Загрузка файлов (PDF, DOCX)</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,168,67,0.1)", color: "var(--accent)" }}>Скоро</span>
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Парсинг сайтов (URL)</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,168,67,0.1)", color: "var(--accent)" }}>Скоро</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Секция: Голос ═══ */}
              {activeSection === "voice" && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Тип голоса</label>
                    <div className="flex flex-col gap-1.5">
                      {VOICE_PRESETS.map((v) => (
                        <button key={v.id} onClick={() => setVoiceId(v.id)} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                          style={{ background: voiceId === v.id ? "rgba(212,168,67,0.12)" : "var(--bg-glass)", border: `1px solid ${voiceId === v.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          <span className="text-base">{v.icon}</span>
                          <span className="text-[12px]" style={{ color: voiceId === v.id ? "var(--accent)" : "var(--text-secondary)" }}>{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Скорость: {voiceSpeed.toFixed(1)}x</label>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                      className="w-full accent-[var(--accent)]" style={{ accentColor: "var(--accent)" }} />
                    <div className="flex justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
                      <span>Медленно</span><span>Быстро</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Тон: {voicePitch.toFixed(1)}</label>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={voicePitch} onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                      className="w-full" style={{ accentColor: "var(--accent)" }} />
                    <div className="flex justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
                      <span>Низкий</span><span>Высокий</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Секция: Внешность ═══ */}
              {activeSection === "appearance" && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Лицо</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FACE_PRESETS.map((f) => (
                        <button key={f.id} onClick={() => setAppFace(f.id)} className="px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                          style={{ background: appFace === f.id ? "var(--accent)" : "var(--bg-glass)", color: appFace === f.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${appFace === f.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Волосы</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {HAIR_PRESETS.map((h) => (
                        <button key={h.id} onClick={() => setAppHair(h.id)} className="px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                          style={{ background: appHair === h.id ? "var(--accent)" : "var(--bg-glass)", color: appHair === h.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${appHair === h.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Кожа</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SKIN_PRESETS.map((s) => (
                        <button key={s.id} onClick={() => setAppSkin(s.id)} className="px-2 py-2.5 rounded-xl text-[11px] transition-all text-center"
                          style={{ background: appSkin === s.id ? "var(--accent)" : "var(--bg-glass)", color: appSkin === s.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${appSkin === s.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Телосложение</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {BODY_PRESETS.map((b) => (
                        <button key={b.id} onClick={() => setAppBody(b.id)} className="px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                          style={{ background: appBody === b.id ? "var(--accent)" : "var(--bg-glass)", color: appBody === b.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${appBody === b.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Секция: Одежда ═══ */}
              {activeSection === "outfit" && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Стиль</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {OUTFIT_STYLES.map((s) => (
                        <button key={s.id} onClick={() => setOutfitStyle(s.id)} className="px-3 py-2.5 rounded-xl text-[12px] transition-all text-center"
                          style={{ background: outfitStyle === s.id ? "var(--accent)" : "var(--bg-glass)", color: outfitStyle === s.id ? "var(--bg-deep)" : "var(--text-secondary)", border: `1px solid ${outfitStyle === s.id ? "var(--accent)" : "var(--bg-glass-border)"}` }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {([{ label: "Верх", val: outfitTop, set: setOutfitTop, ph: "Рубашка, пиджак, поло..." },
                    { label: "Низ", val: outfitBottom, set: setOutfitBottom, ph: "Брюки, джинсы, юбка..." },
                    { label: "Обувь", val: outfitShoes, set: setOutfitShoes, ph: "Кроссовки, туфли, ботинки..." },
                    { label: "Аксессуар", val: outfitAccessory, set: setOutfitAccessory, ph: "Часы, очки, сумка..." },
                  ] as const).map((item) => (
                    <div key={item.label}>
                      <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>{item.label}</label>
                      <input type="text" value={item.val} onChange={(e) => item.set(e.target.value)} placeholder={item.ph}
                        className="w-full rounded-xl px-4 py-2.5 text-sm bg-transparent outline-none"
                        style={{ background: "var(--bg-glass)", border: "1px solid var(--bg-glass-border)", color: "var(--text-primary)" }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Кнопка сохранения */}
              <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl text-sm font-semibold mt-5 transition-all"
                style={{ background: saving ? "var(--bg-glass-border)" : "var(--accent)", color: saving ? "var(--text-muted)" : "var(--bg-deep)" }}>
                {saving ? "Сохраняю..." : "Сохранить все изменения"}
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

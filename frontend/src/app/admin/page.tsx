"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  adminGetAgents,
  adminGetStats,
  adminGetUsers,
  adminCreateAgent,
  adminUpdateAgent,
  adminDeleteAgent,
  adminAssignAgent,
  adminRestoreAgent,
  type AgentDetailOut,
  type AgentCreate,
  type AdminStats,
  type AdminUser,
} from "@/services/api";

/* ══════════════════════════════════════════════════════════════
   Админ-панель Aimigo
   Управление агентами, пользователями, статистика
   ══════════════════════════════════════════════════════════════ */

type Tab = "agents" | "users" | "stats";

const AGENT_TYPES = [
  { id: "", label: "Все" },
  { id: "system", label: "Системные" },
  { id: "business", label: "Бизнес" },
  { id: "citizen", label: "Жители" },
];

const PRESET_COLORS = [
  "#FFD700", "#4CAF50", "#E91E63", "#2196F3", "#FF9800",
  "#9C27B0", "#00BCD4", "#FF5722", "#607D8B", "#8BC34A",
  "#3F51B5", "#F44336", "#795548", "#CDDC39",
];

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>("agents");

  // Agents state
  const [agents, setAgents] = useState<AgentDetailOut[]>([]);
  const [agentSearch, setAgentSearch] = useState("");
  const [agentTypeFilter, setAgentTypeFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetailOut | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Create/Edit form
  const [form, setForm] = useState<AgentCreate>({
    name: "", profession: "", brand: "", description: "",
    color: "#FFD700", agent_type: "system", system_prompt: "",
    llm_model: "gpt-4o-mini", greeting: "",
  });
  const [assignOwnerId, setAssignOwnerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (isLoggedIn === false) {
      router.push("/");
    } else if (isLoggedIn === true && !isAdmin) {
      router.push("/");
    }
  }, [isLoggedIn, isAdmin, router]);

  // Load data
  const loadAgents = useCallback(async () => {
    try {
      const data = await adminGetAgents({
        search: agentSearch,
        agent_type: agentTypeFilter,
        include_inactive: showInactive,
      });
      setAgents(data);
    } catch {}
  }, [agentSearch, agentTypeFilter, showInactive]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminGetUsers(userSearch);
      setUsers(data);
    } catch {}
  }, [userSearch]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminGetStats();
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "agents") loadAgents();
    if (tab === "users") loadUsers();
    if (tab === "stats") loadStats();
  }, [tab, isAdmin, loadAgents, loadUsers, loadStats]);

  // Actions
  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const ownerId = assignOwnerId ? parseInt(assignOwnerId) : undefined;
      await adminCreateAgent(form, ownerId);
      setCreateMode(false);
      setForm({ name: "", profession: "", brand: "", description: "", color: "#FFD700", agent_type: "system", system_prompt: "", llm_model: "gpt-4o-mini", greeting: "" });
      setAssignOwnerId("");
      loadAgents();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAgent) return;
    setSaving(true);
    setError("");
    try {
      const updated = await adminUpdateAgent(selectedAgent.id, form);
      setSelectedAgent(updated);
      setEditMode(false);
      loadAgents();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, hard = false) => {
    const msg = hard ? "УДАЛИТЬ НАВСЕГДА? Это нельзя отменить!" : "Деактивировать агента?";
    if (!confirm(msg)) return;
    try {
      await adminDeleteAgent(id, hard);
      setSelectedAgent(null);
      loadAgents();
    } catch {}
  };

  const handleRestore = async (id: number) => {
    try {
      await adminRestoreAgent(id);
      loadAgents();
    } catch {}
  };

  const handleAssign = async (agentId: number) => {
    const input = prompt("ID пользователя (бизнеса) для привязки (пусто = отвязать):");
    if (input === null) return;
    try {
      const ownerId = input.trim() ? parseInt(input.trim()) : null;
      const updated = await adminAssignAgent(agentId, ownerId);
      setSelectedAgent(updated);
      loadAgents();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const openEdit = (agent: AgentDetailOut) => {
    setForm({
      name: agent.name,
      profession: agent.profession,
      brand: agent.brand,
      description: agent.description,
      color: agent.color,
      agent_type: agent.agent_type,
      system_prompt: agent.system_prompt || "",
      llm_model: agent.llm_model,
      greeting: agent.greeting || "",
    });
    setEditMode(true);
    setError("");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Проверка доступа...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-amber-400">AIMIGO Admin</h1>
          <span className="text-xs text-gray-500">
            {user?.display_name} ({user?.phone})
          </span>
        </div>
        <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← К коммуникатору
        </a>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-52 border-r border-gray-800 min-h-[calc(100vh-65px)] p-4">
          {([
            { id: "agents" as Tab, label: "Агенты", icon: "🤖" },
            { id: "users" as Tab, label: "Пользователи", icon: "👥" },
            { id: "stats" as Tab, label: "Статистика", icon: "📊" },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSelectedAgent(null); setCreateMode(false); setEditMode(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 text-sm transition-all flex items-center gap-2 ${
                tab === item.id ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto max-h-[calc(100vh-65px)]">

          {/* ═══ AGENTS TAB ═══ */}
          {tab === "agents" && !selectedAgent && !createMode && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Агенты</h2>
                <button
                  onClick={() => {
                    setCreateMode(true);
                    setForm({ name: "", profession: "", brand: "", description: "", color: "#FFD700", agent_type: "system", system_prompt: "", llm_model: "gpt-4o-mini", greeting: "" });
                    setAssignOwnerId("");
                    setError("");
                  }}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
                >
                  + Создать агента
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <input
                  type="text"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500 w-60"
                />
                <div className="flex gap-1">
                  {AGENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAgentTypeFilter(t.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        agentTypeFilter === t.id
                          ? "bg-amber-500 text-black"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Показать удалённых
                </label>
              </div>

              {/* Table */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                      <th className="text-left px-4 py-3">Агент</th>
                      <th className="text-left px-4 py-3">Тип</th>
                      <th className="text-left px-4 py-3">Профессия</th>
                      <th className="text-left px-4 py-3">Бренд</th>
                      <th className="text-left px-4 py-3">Владелец</th>
                      <th className="text-left px-4 py-3">Рейтинг</th>
                      <th className="text-left px-4 py-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`border-b border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-800/50 ${
                          !agent.is_active ? "opacity-40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: `${agent.color}22`, border: `1.5px solid ${agent.color}55`, color: agent.color }}
                          >
                            {agent.name[0]}
                          </div>
                          <span className="font-medium">{agent.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            agent.agent_type === "system" ? "bg-purple-900/50 text-purple-300" :
                            agent.agent_type === "business" ? "bg-blue-900/50 text-blue-300" :
                            "bg-green-900/50 text-green-300"
                          }`}>
                            {agent.agent_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{agent.profession}</td>
                        <td className="px-4 py-3 text-gray-400">{agent.brand}</td>
                        <td className="px-4 py-3 text-gray-500">{agent.owner_id ? `#${agent.owner_id}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-amber-400">★</span> {agent.rating.toFixed(1)}
                        </td>
                        <td className="px-4 py-3">
                          {agent.is_active ? (
                            <span className="text-green-400 text-xs">Активен</span>
                          ) : (
                            <span className="text-red-400 text-xs">Удалён</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {agents.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">Нет агентов</div>
                )}
              </div>
            </div>
          )}

          {/* ═══ AGENT DETAIL ═══ */}
          {tab === "agents" && selectedAgent && !editMode && (
            <div>
              <button onClick={() => setSelectedAgent(null)} className="text-sm text-amber-400 mb-4 hover:underline">
                ← Назад к списку
              </button>

              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                  style={{ background: `${selectedAgent.color}22`, border: `2.5px solid ${selectedAgent.color}55`, color: selectedAgent.color }}
                >
                  {selectedAgent.name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedAgent.profession} • {selectedAgent.brand}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedAgent.agent_type === "system" ? "bg-purple-900/50 text-purple-300" :
                      selectedAgent.agent_type === "business" ? "bg-blue-900/50 text-blue-300" :
                      "bg-green-900/50 text-green-300"
                    }`}>
                      {selectedAgent.agent_type}
                    </span>
                    <span className="text-gray-500 text-xs">ID: {selectedAgent.id}</span>
                    <span className="text-gray-500 text-xs">
                      Владелец: {selectedAgent.owner_id ? `#${selectedAgent.owner_id}` : "нет"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info blocks */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Описание</p>
                  <p className="text-sm text-gray-300">{selectedAgent.description || "—"}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Приветствие</p>
                  <p className="text-sm text-gray-300">{selectedAgent.greeting || "—"}</p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Системный промпт</p>
                  <span className="text-xs text-gray-500">Модель: {selectedAgent.llm_model}</span>
                </div>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {selectedAgent.system_prompt || "Не задан (используется автогенерация)"}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => openEdit(selectedAgent)}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleAssign(selectedAgent.id)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
                >
                  Привязать к бизнесу
                </button>
                {selectedAgent.is_active ? (
                  <button
                    onClick={() => handleDelete(selectedAgent.id)}
                    className="px-4 py-2 bg-gray-800 text-red-400 rounded-lg text-sm hover:bg-gray-700"
                  >
                    Деактивировать
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestore(selectedAgent.id)}
                    className="px-4 py-2 bg-gray-800 text-green-400 rounded-lg text-sm hover:bg-gray-700"
                  >
                    Восстановить
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedAgent.id, true)}
                  className="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg text-sm hover:bg-red-900"
                >
                  Удалить навсегда
                </button>
              </div>
            </div>
          )}

          {/* ═══ AGENT CREATE / EDIT FORM ═══ */}
          {tab === "agents" && (createMode || editMode) && (
            <div>
              <button
                onClick={() => { setCreateMode(false); setEditMode(false); setError(""); }}
                className="text-sm text-amber-400 mb-4 hover:underline"
              >
                ← Назад
              </button>

              <h2 className="text-lg font-semibold mb-6">
                {createMode ? "Создать агента" : `Редактировать: ${selectedAgent?.name}`}
              </h2>

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-2 mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 max-w-3xl">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Имя *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Профессия *</label>
                    <input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Бренд</label>
                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Тип</label>
                    <div className="flex gap-2">
                      {["system", "business", "citizen"].map((t) => (
                        <button key={t}
                          onClick={() => setForm({ ...form, agent_type: t })}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            form.agent_type === t ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-400"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Цвет</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, color: c })}
                          className="w-7 h-7 rounded-full transition-all hover:scale-110"
                          style={{ background: c, border: form.color === c ? "3px solid white" : "2px solid transparent" }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">AI Модель</label>
                    <select value={form.llm_model} onChange={(e) => setForm({ ...form, llm_model: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500">
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4o">GPT-4o</option>
                    </select>
                  </div>
                  {createMode && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                        Привязать к бизнесу (ID пользователя)
                      </label>
                      <input value={assignOwnerId} onChange={(e) => setAssignOwnerId(e.target.value)}
                        placeholder="Пусто = без привязки"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500" />
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Описание</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Приветствие</label>
                    <textarea value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500 resize-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Системный промпт</label>
                    <textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                      rows={8} placeholder="Инструкция для AI. Пусто = автогенерация из описания."
                      className="w-full h-full min-h-[200px] px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-amber-500 resize-none font-mono" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={createMode ? handleCreate : handleUpdate}
                  disabled={saving || !form.name || !form.profession}
                  className="px-6 py-2.5 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-default"
                >
                  {saving ? "Сохраняю..." : createMode ? "Создать" : "Сохранить"}
                </button>
                <button
                  onClick={() => { setCreateMode(false); setEditMode(false); setError(""); }}
                  className="px-6 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* ═══ USERS TAB ═══ */}
          {tab === "users" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Пользователи</h2>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Поиск по телефону или имени..."
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500 w-72 mb-4"
              />
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                      <th className="text-left px-4 py-3">ID</th>
                      <th className="text-left px-4 py-3">Телефон</th>
                      <th className="text-left px-4 py-3">Имя</th>
                      <th className="text-left px-4 py-3">Роль</th>
                      <th className="text-left px-4 py-3">Статус</th>
                      <th className="text-left px-4 py-3">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-800/50">
                        <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                        <td className="px-4 py-3 font-mono text-gray-300">{u.phone}</td>
                        <td className="px-4 py-3">{u.display_name}</td>
                        <td className="px-4 py-3">
                          {u.is_admin ? (
                            <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">admin</span>
                          ) : (
                            <span className="text-xs text-gray-500">user</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`w-2 h-2 rounded-full inline-block mr-1 ${u.is_online ? "bg-green-400" : "bg-gray-600"}`} />
                          <span className="text-xs text-gray-400">{u.is_online ? "Online" : "Offline"}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("ru") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">Нет пользователей</div>
                )}
              </div>
            </div>
          )}

          {/* ═══ STATS TAB ═══ */}
          {tab === "stats" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Статистика</h2>
              {stats ? (
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: "Агентов всего", value: stats.agents.total, color: "text-white" },
                    { label: "Системных", value: stats.agents.system, color: "text-purple-300" },
                    { label: "Бизнес", value: stats.agents.business, color: "text-blue-300" },
                    { label: "Жителей", value: stats.agents.citizen, color: "text-green-300" },
                    { label: "Пользователей", value: stats.users.total, color: "text-amber-300" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
                      <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Загрузка...</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

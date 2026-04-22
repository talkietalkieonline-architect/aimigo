/**
 * Aimigo API Client
 * Единая точка взаимодействия фронтенда с бэкендом
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Хранение JWT токена */
let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("aimigo_token", token);
  } else {
    localStorage.removeItem("aimigo_token");
  }
}

export function getToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("aimigo_token");
  }
  return authToken;
}

/** Базовый fetch с авторизацией */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || "Ошибка сервера");
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ═══════════════════════════════════════════════
//  AUTH — SMS-only
// ═══════════════════════════════════════════════

export interface SendSMSResponse {
  message: string;
  debug_code?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  display_name: string;
  is_admin: boolean;
}

/** Отправить SMS-код */
export function sendSMS(phone: string): Promise<SendSMSResponse> {
  return apiFetch("/api/auth/send-sms", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

/** Проверить SMS-код → получить JWT */
export async function verifySMS(phone: string, code: string): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>("/api/auth/verify-sms", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  // Сохраняем токен
  setToken(data.access_token);
  // Сохраняем сессию (30 дней)
  localStorage.setItem("aimigo_session", JSON.stringify({
    loggedIn: true,
    userId: data.user_id,
    displayName: data.display_name,
    isAdmin: data.is_admin,
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
  }));
  return data;
}

// ═══════════════════════════════════════════════
//  AGENTS — Город Агентов
// ═══════════════════════════════════════════════

export interface AgentOut {
  id: number;
  name: string;
  profession: string;
  brand: string;
  agent_type: string;
  description: string;
  color: string;
  aimigo_link?: string;
  rating: number;
  rating_count: number;
  greeting?: string;
  owner_id?: number;
}

export interface AgentCreate {
  name: string;
  profession: string;
  brand?: string;
  description?: string;
  color?: string;
  agent_type?: string;
  system_prompt?: string;
  llm_model?: string;
  greeting?: string;
}

/** Полные данные агента для настройки (ЛК бизнеса + личный агент) */
export interface AgentFullOut extends AgentOut {
  // AI
  system_prompt?: string;
  llm_model: string;
  is_active: boolean;
  created_at?: string;
  // Голос
  voice_id?: string;
  voice_speed: number;
  voice_pitch: number;
  // Внешность
  appearance_preset?: string;
  appearance_face?: string;
  appearance_hair?: string;
  appearance_skin?: string;
  appearance_body?: string;
  // Одежда
  outfit_style?: string;
  outfit_top?: string;
  outfit_bottom?: string;
  outfit_shoes?: string;
  outfit_accessory?: string;
  // Манеры
  manner_style: string;
  manner_temperament: string;
  manner_humor: boolean;
  manner_emoji_use: boolean;
  // Знания
  knowledge_text?: string;
  knowledge_urls?: string;
  knowledge_files?: string;
}

/** Обновление настроек персонажа агента */
export interface AgentPersonaUpdate {
  // AI / текст
  description?: string;
  greeting?: string;
  system_prompt?: string;
  llm_model?: string;
  // Голос
  voice_id?: string;
  voice_speed?: number;
  voice_pitch?: number;
  // Внешность
  appearance_preset?: string;
  appearance_face?: string;
  appearance_hair?: string;
  appearance_skin?: string;
  appearance_body?: string;
  // Одежда
  outfit_style?: string;
  outfit_top?: string;
  outfit_bottom?: string;
  outfit_shoes?: string;
  outfit_accessory?: string;
  // Манеры
  manner_style?: string;
  manner_temperament?: string;
  manner_humor?: boolean;
  manner_emoji_use?: boolean;
  // Знания
  knowledge_text?: string;
  knowledge_urls?: string;
  knowledge_files?: string;
}

export interface AgentListResponse {
  agents: AgentOut[];
  total: number;
  business_count: number;
  citizen_count: number;
  system_count: number;
}

/** Каталог агентов */
export function getAgents(params?: {
  search?: string;
  profession?: string;
  agent_type?: string;
}): Promise<AgentListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.profession) query.set("profession", params.profession);
  if (params?.agent_type) query.set("agent_type", params.agent_type);
  const qs = query.toString();
  return apiFetch(`/api/agents${qs ? `?${qs}` : ""}`);
}

/** Карточка агента */
export function getAgent(id: number): Promise<AgentOut> {
  return apiFetch(`/api/agents/${id}`);
}

/** Мои агенты (созданные мной) — полные данные для настройки */
export function getMyAgents(): Promise<AgentFullOut[]> {
  return apiFetch("/api/agents/my");
}

/** Обновить настройки агента (бизнес / личный) */
export function updateAgent(id: number, data: AgentPersonaUpdate): Promise<AgentFullOut> {
  return apiFetch(`/api/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════
//  ADMIN API
// ═══════════════════════════════════════════════

export interface AgentDetailOut extends AgentOut {
  system_prompt?: string;
  llm_model: string;
  is_active: boolean;
  created_at?: string;
}

export interface AdminStats {
  agents: { total: number; system: number; business: number; citizen: number };
  users: { total: number };
}

export interface AdminUser {
  id: number;
  phone: string;
  display_name: string;
  is_admin: boolean;
  is_online: boolean;
  created_at?: string;
}

/** Админ: все агенты */
export function adminGetAgents(params?: { search?: string; agent_type?: string; include_inactive?: boolean }): Promise<AgentDetailOut[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.agent_type) q.set("agent_type", params.agent_type);
  if (params?.include_inactive) q.set("include_inactive", "true");
  const qs = q.toString();
  return apiFetch(`/api/admin/agents${qs ? `?${qs}` : ""}`);
}

/** Админ: карточка агента */
export function adminGetAgent(id: number): Promise<AgentDetailOut> {
  return apiFetch(`/api/admin/agents/${id}`);
}

/** Админ: создать агента */
export function adminCreateAgent(data: AgentCreate, ownerId?: number): Promise<AgentDetailOut> {
  const q = ownerId ? `?owner_id=${ownerId}` : "";
  return apiFetch(`/api/admin/agents${q}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Админ: обновить агента */
export function adminUpdateAgent(id: number, data: Partial<AgentCreate>): Promise<AgentDetailOut> {
  return apiFetch(`/api/admin/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Админ: привязать агента к бизнесу */
export function adminAssignAgent(id: number, ownerId: number | null): Promise<AgentDetailOut> {
  const q = ownerId !== null ? `?owner_id=${ownerId}` : "";
  return apiFetch(`/api/admin/agents/${id}/assign${q}`, { method: "PATCH" });
}

/** Админ: удалить агента */
export function adminDeleteAgent(id: number, hard = false): Promise<void> {
  return apiFetch(`/api/admin/agents/${id}?hard=${hard}`, { method: "DELETE" });
}

/** Админ: восстановить агента */
export function adminRestoreAgent(id: number): Promise<AgentDetailOut> {
  return apiFetch(`/api/admin/agents/${id}/restore`, { method: "PATCH" });
}

/** Админ: пользователи */
export function adminGetUsers(search?: string): Promise<AdminUser[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/admin/users${q}`);
}

/** Админ: статистика */
export function adminGetStats(): Promise<AdminStats> {
  return apiFetch("/api/admin/stats");
}

/** LLM статус */
export interface LLMProviderInfo {
  connected: boolean;
  key: string;
  model: string;
}
export interface LLMStatus {
  active_provider: string;
  active_model: string;
  default_provider: string;
  providers: {
    openai: LLMProviderInfo;
    gemini: LLMProviderInfo;
    groq: LLMProviderInfo;
  };
}
export function adminGetLLMStatus(): Promise<LLMStatus> {
  return apiFetch("/api/admin/llm-status");
}

// ═══════════════════════════════════════════════
//  CHAT — История + отправка
// ═══════════════════════════════════════════════

export interface MessageOut {
  id: number;
  room: string;
  sender_type: string;
  sender_user_id?: number;
  sender_agent_id?: number;
  sender_name: string;
  text: string;
  created_at: string;
}

/** История сообщений */
export function getChatHistory(room: string = "general", limit: number = 50): Promise<MessageOut[]> {
  return apiFetch(`/api/chat/history?room=${room}&limit=${limit}`);
}

/** Отправить сообщение (HTTP fallback) */
export function sendMessage(room: string, text: string): Promise<MessageOut> {
  return apiFetch("/api/chat/send", {
    method: "POST",
    body: JSON.stringify({ room, text }),
  });
}

// ═══════════════════════════════════════════════
//  USER — Профиль
// ═══════════════════════════════════════════════

export interface UserProfile {
  id: number;
  phone: string;
  display_name: string;
  aimigo_link?: string;
  theme: string;
  avatar_color: string;
  is_online: boolean;
  is_admin: boolean;
  bio?: string;
}

/** Профиль текущего пользователя */
export function getMe(): Promise<UserProfile> {
  return apiFetch("/api/users/me");
}

/** Обновить профиль */
export function updateMe(data: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetch("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════
//  WEBSOCKET — Реалтайм чат
// ═══════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function connectChat(room: string, onMessage: (msg: any) => void): WebSocket | null {
  const token = getToken();
  if (!token) return null;

  const wsBase = API_BASE.replace("http", "ws");
  const ws = new WebSocket(`${wsBase}/ws/chat/${room}?token=${token}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {}
  };

  return ws;
}

// ═══════════════════════════════════════════════
//  HEALTH
// ═══════════════════════════════════════════════

export function healthCheck(): Promise<{ status: string; service: string; version: string }> {
  return apiFetch("/api/health");
}

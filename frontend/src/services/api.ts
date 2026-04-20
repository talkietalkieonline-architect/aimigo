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
  greeting: string;
  avatar_emoji: string;
  avatar_color: string;
  rating: number;
  is_active: boolean;
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

/** Подключение к WebSocket чату */
export function connectChat(room: string, onMessage: (msg: MessageOut) => void): WebSocket | null {
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

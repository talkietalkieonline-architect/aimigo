"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getToken,
  setToken,
  getMe,
  type UserProfile,
} from "@/services/api";

/* ═══════════════════════════════════════════════
   AuthContext — единый контекст авторизации
   Управляет сессией, профилем, онлайн-статусом
   ═══════════════════════════════════════════════ */

interface AuthState {
  /** null = ещё не определён, false = не залогинен */
  isLoggedIn: boolean | null;
  /** Профиль пользователя из API (или из localStorage) */
  user: UserProfile | null;
  /** Залогиниться (вызывается из LoginScreen после верификации SMS) */
  login: (user: Partial<UserProfile>) => void;
  /** Выйти */
  logout: () => void;
  /** Бэкенд доступен? */
  isOnline: boolean;
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: null,
  user: null,
  login: () => {},
  logout: () => {},
  isOnline: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Читаем сессию из localStorage */
function getSavedSession(): { loggedIn: boolean; user: Partial<UserProfile> } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("aimigo_session");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.loggedIn) return null;
    if (data.expires && data.expires < Date.now()) {
      localStorage.removeItem("aimigo_session");
      localStorage.removeItem("aimigo_token");
      return null;
    }
    return { loggedIn: true, user: data };
  } catch {
    return null;
  }
}

/** Сохраняем сессию в localStorage (30 дней) */
function saveSession(user: Partial<UserProfile>) {
  localStorage.setItem(
    "aimigo_session",
    JSON.stringify({
      loggedIn: true,
      userId: user.id,
      displayName: user.display_name || "Пользователь",
      phone: user.phone,
      theme: user.theme,
      avatarColor: user.avatar_color,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // При монтировании — проверяем сессию
  useEffect(() => {
    const session = getSavedSession();
    const token = getToken();

    if (!session || !session.loggedIn) {
      setIsLoggedIn(false);
      return;
    }

    // Есть сессия. Пробуем подтянуть профиль из API
    if (token) {
      getMe()
        .then((profile) => {
          setUser(profile);
          setIsOnline(true);
          setIsLoggedIn(true);
          // Обновляем локальную сессию свежими данными
          saveSession(profile);
        })
        .catch(() => {
          // API недоступен — используем данные из localStorage
          setUser({
            id: session.user.id ?? 0,
            phone: (session.user as Record<string, unknown>).phone as string ?? "",
            display_name: session.user.display_name ?? "Пользователь",
            theme: session.user.theme ?? "noir-gold",
            avatar_color: session.user.avatar_color ?? "#d4a843",
            is_online: true,
          } as UserProfile);
          setIsOnline(false);
          setIsLoggedIn(true);
        });
    } else {
      // Нет токена, но есть сессия (offline-вход)
      setUser({
        id: 0,
        phone: "",
        display_name: "Пользователь",
        theme: "noir-gold",
        avatar_color: "#d4a843",
        is_online: true,
      } as UserProfile);
      setIsOnline(false);
      setIsLoggedIn(true);
    }
  }, []);

  const login = useCallback((userData: Partial<UserProfile>) => {
    const profile: UserProfile = {
      id: userData.id ?? 0,
      phone: userData.phone ?? "",
      display_name: userData.display_name ?? "Пользователь",
      theme: userData.theme ?? "noir-gold",
      avatar_color: userData.avatar_color ?? "#d4a843",
      is_online: true,
    };
    setUser(profile);
    saveSession(profile);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("aimigo_session");
    localStorage.removeItem("aimigo_token");
    localStorage.removeItem("aimigo_phone");
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, isOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

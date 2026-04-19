"use client";
import { useState } from "react";

type AuthStep = "phone" | "sms" | "password-create" | "login";

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const handlePhoneSubmit = () => {
    if (phone.length < 10) return;
    // TODO: проверка на сервере — новый или существующий пользователь
    // Пока имитируем: если номер начинается с +7999 — новый, иначе — существующий
    if (phone.startsWith("+7999") || phone.startsWith("7999") || phone.startsWith("8999")) {
      setIsNewUser(true);
      setStep("sms");
    } else {
      setIsNewUser(false);
      setStep("login");
    }
  };

  const handleSmsSubmit = () => {
    if (smsCode.length < 4) return;
    setStep("password-create");
  };

  const handleCreatePassword = () => {
    if (password.length < 4) return;
    // TODO: отправка на сервер
    onLogin();
  };

  const handleLogin = () => {
    if (password.length < 4) return;
    // TODO: проверка на сервере
    onLogin();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{
        background: "var(--bg-deep)",
        zIndex: 150,
      }}
    >
      {/* Свечение */}
      <div
        className="absolute rounded-full"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.3,
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Логотип */}
        <div className="flex flex-col items-center mb-10">
          <span
            className="text-4xl font-bold tracking-tight mb-1"
            style={{ color: "var(--accent-bright)" }}
          >
            Aimigo
          </span>
          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--text-muted)" }}
          >
            AI-First
          </span>
        </div>

        {/* Шаг 1: Ввод телефона */}
        {step === "phone" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Введите номер телефона
            </p>
            <input
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-center text-lg outline-none transition-all"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--bg-glass-border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bg-glass-border)")}
              autoFocus
            />
            <button
              onClick={handlePhoneSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--accent)",
                color: "var(--bg-deep)",
              }}
            >
              Продолжить
            </button>
          </div>
        )}

        {/* Шаг 2: SMS-код (только для новых) */}
        {step === "sms" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Код из SMS отправлен на {phone}
            </p>
            <input
              type="text"
              placeholder="Код из SMS"
              maxLength={6}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-center text-2xl tracking-[0.5em] outline-none transition-all"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--bg-glass-border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bg-glass-border)")}
              autoFocus
            />
            <button
              onClick={handleSmsSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: "var(--accent)",
                color: "var(--bg-deep)",
              }}
            >
              Подтвердить
            </button>
            <button
              onClick={() => setStep("phone")}
              className="text-xs text-center"
              style={{ color: "var(--text-muted)" }}
            >
              ← Изменить номер
            </button>
          </div>
        )}

        {/* Шаг 3: Создание пароля (новый пользователь) */}
        {step === "password-create" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Создайте пароль для входа
            </p>
            <input
              type="password"
              placeholder="Придумайте пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-center outline-none transition-all"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--bg-glass-border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bg-glass-border)")}
              autoFocus
            />
            <button
              onClick={handleCreatePassword}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: "var(--accent)",
                color: "var(--bg-deep)",
              }}
            >
              Войти в Aimigo
            </button>
          </div>
        )}

        {/* Шаг 4: Вход (существующий пользователь) */}
        {step === "login" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              С возвращением! Введите пароль
            </p>
            <div
              className="text-center text-sm py-2 rounded-lg"
              style={{ color: "var(--accent)", background: "var(--bg-glass)" }}
            >
              {phone}
            </div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-center outline-none transition-all"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--bg-glass-border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--bg-glass-border)")}
              autoFocus
            />
            <button
              onClick={handleLogin}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: "var(--accent)",
                color: "var(--bg-deep)",
              }}
            >
              Войти
            </button>
            <button
              onClick={() => setStep("phone")}
              className="text-xs text-center"
              style={{ color: "var(--text-muted)" }}
            >
              ← Другой номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

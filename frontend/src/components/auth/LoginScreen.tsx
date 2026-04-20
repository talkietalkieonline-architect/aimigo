"use client";
import { useState, useEffect, useRef } from "react";
import { sendSMS, verifySMS, type SendSMSResponse } from "@/services/api";

type AuthStep = "phone" | "sms";

/**
 * Форматирование 10 цифр в маску: (999) 123-45-67
 */
function formatPhone(digits: string): string {
  const d = digits.slice(0, 10);
  let result = "";
  if (d.length > 0) result += "(" + d.slice(0, 3);
  if (d.length >= 3) result += ") ";
  if (d.length > 3) result += d.slice(3, 6);
  if (d.length > 6) result += "-" + d.slice(6, 8);
  if (d.length > 8) result += "-" + d.slice(8, 10);
  return result;
}

/**
 * Извлечь только цифры из строки
 */
function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<AuthStep>("phone");
  const [digits, setDigits] = useState(""); // 10 цифр без +7
  const [smsCode, setSmsCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const smsInputRef = useRef<HTMLInputElement>(null);

  // Подтягиваем сохранённый номер при открытии
  useEffect(() => {
    const saved = localStorage.getItem("aimigo_phone");
    if (saved) {
      setDigits(onlyDigits(saved).slice(0, 10));
    }
  }, []);

  // Таймер обратного отсчёта для повторной отправки
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Автофокус на поле SMS
  useEffect(() => {
    if (step === "sms") {
      setTimeout(() => smsInputRef.current?.focus(), 100);
    }
  }, [step]);

  const fullPhone = "+7" + digits;
  const isPhoneComplete = digits.length === 10;

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Извлекаем только цифры, макс 10
    const raw = onlyDigits(e.target.value);
    setDigits(raw.slice(0, 10));
    setError("");
  };

  const handleSendSMS = async () => {
    if (!isPhoneComplete) return;
    setError("");
    setSending(true);
    localStorage.setItem("aimigo_phone", digits);

    try {
      // Пытаемся через реальный API
      const res: SendSMSResponse = await sendSMS(fullPhone);
      const code = res.debug_code || "";
      setGeneratedCode(code);
      setSmsCode(code); // Автоподстановка (MVP)
      setStep("sms");
      setCountdown(60);
    } catch {
      // Fallback — локальный режим (бэкенд не доступен)
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedCode(code);
      setSmsCode(code);
      setStep("sms");
      setCountdown(60);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyAndLogin = async () => {
    if (smsCode.length < 4) {
      setError("Введите 4-значный код");
      return;
    }

    setError("");
    setSending(true);

    try {
      // Пытаемся через реальный API → JWT
      await verifySMS(fullPhone, smsCode);
      localStorage.setItem("aimigo_phone", digits);
      onLogin();
    } catch (err: unknown) {
      // Fallback — локальная проверка
      if (smsCode !== generatedCode) {
        setError("Неверный код");
        setSending(false);
        return;
      }
      // Сохраняем сессию локально (offline режим)
      localStorage.setItem("aimigo_session", JSON.stringify({
        phone: fullPhone,
        loggedIn: true,
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }));
      localStorage.setItem("aimigo_phone", digits);
      onLogin();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: "var(--bg-deep)", zIndex: 150 }}
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

        {/* === Шаг 1: Номер телефона === */}
        {step === "phone" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Войдите по номеру телефона
            </p>

            {/* Поле телефона с зашитым +7 */}
            <div
              className="flex items-center rounded-xl overflow-hidden transition-all"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--bg-glass-border)",
              }}
              onClick={() => phoneInputRef.current?.focus()}
            >
              {/* Флаг + код страны */}
              <div
                className="flex items-center gap-1.5 pl-4 pr-2 py-3.5 shrink-0"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="text-lg">🇷🇺</span>
                <span className="text-base font-medium">+7</span>
              </div>

              {/* Поле ввода — только цифры */}
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                placeholder="(___) ___-__-__"
                value={formatPhone(digits)}
                onChange={handlePhoneInput}
                onKeyDown={(e) => handleKeyDown(e, handleSendSMS)}
                className="flex-1 py-3.5 pr-4 bg-transparent outline-none text-base"
                style={{
                  color: "var(--text-primary)",
                  caretColor: "var(--accent)",
                }}
                autoFocus
              />
            </div>

            <button
              onClick={handleSendSMS}
              disabled={!isPhoneComplete || sending}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: isPhoneComplete ? "var(--accent)" : "var(--bg-glass-border)",
                color: isPhoneComplete ? "var(--bg-deep)" : "var(--text-muted)",
                cursor: isPhoneComplete ? "pointer" : "default",
              }}
            >
              {sending ? "Отправка..." : "Получить код"}
            </button>
          </div>
        )}

        {/* === Шаг 2: SMS-код === */}
        {step === "sms" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Код отправлен на
            </p>
            <div
              className="text-center text-sm py-1.5 rounded-lg"
              style={{ color: "var(--accent)" }}
            >
              +7 {formatPhone(digits)}
            </div>

            {/* 4 цифры кода */}
            <input
              ref={smsInputRef}
              type="text"
              inputMode="numeric"
              placeholder="• • • •"
              maxLength={4}
              value={smsCode}
              onChange={(e) => {
                setSmsCode(onlyDigits(e.target.value).slice(0, 4));
                setError("");
              }}
              onKeyDown={(e) => handleKeyDown(e, handleVerifyAndLogin)}
              className="w-full px-4 py-3.5 rounded-xl text-center text-2xl tracking-[0.5em] outline-none transition-all"
              style={{
                background: "var(--bg-glass)",
                border: error
                  ? "1px solid var(--danger)"
                  : "1px solid var(--bg-glass-border)",
                color: "var(--text-primary)",
              }}
            />

            {/* Ошибка */}
            {error && (
              <p className="text-center text-xs" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}

            {/* Подсказка для MVP */}
            <p
              className="text-center text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              MVP: код подставлен автоматически
            </p>

            <button
              onClick={handleVerifyAndLogin}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: smsCode.length === 4 ? "var(--accent)" : "var(--bg-glass-border)",
                color: smsCode.length === 4 ? "var(--bg-deep)" : "var(--text-muted)",
                cursor: smsCode.length === 4 ? "pointer" : "default",
              }}
            >
              Войти
            </button>

            {/* Повторная отправка */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setStep("phone"); setSmsCode(""); setError(""); }}
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                ← Другой номер
              </button>
              {countdown > 0 ? (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Повтор через {countdown}с
                </span>
              ) : (
                <button
                  onClick={handleSendSMS}
                  className="text-xs"
                  style={{ color: "var(--accent)" }}
                >
                  Отправить снова
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

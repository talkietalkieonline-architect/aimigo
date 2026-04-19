"use client";

/** Центральная область чата */
export default function ChatArea() {
  // Демо-сообщения для визуализации
  const messages = [
    {
      id: "1",
      sender: "butler",
      name: "Дворецкий",
      text: "Добро пожаловать в Aimigo! Я ваш Дворецкий. Могу рассказать о сервисе, найти нужного агента или просто поболтать.",
      color: "var(--accent)",
    },
    {
      id: "2",
      sender: "user",
      name: "",
      text: "Привет! Расскажи как тут всё работает",
      color: "",
    },
    {
      id: "3",
      sender: "butler",
      name: "Дворецкий",
      text: "С удовольствием! Вы находитесь в Общей комнате. Слева — переключатель режимов, справа — участники беседы. Внизу — кнопки управления. Хотите, проведу мини-тур?",
      color: "var(--accent)",
    },
  ];

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end px-4 pb-36 pt-20 overflow-y-auto"
      style={{ zIndex: 10 }}
    >
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Аватар собеседника (слева) */}
            {msg.sender !== "user" && (
              <div
                className="w-8 h-8 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: `${msg.color}22`,
                  border: `1.5px solid ${msg.color}44`,
                  color: msg.color,
                }}
              >
                {msg.name[0]}
              </div>
            )}

            <div className="flex flex-col max-w-[75%]">
              {/* Имя собеседника */}
              {msg.sender !== "user" && (
                <span
                  className="text-[11px] mb-1 ml-1"
                  style={{ color: msg.color }}
                >
                  {msg.name}
                </span>
              )}

              {/* Пузырь сообщения */}
              <div
                className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background:
                    msg.sender === "user"
                      ? "var(--bubble-user)"
                      : "var(--bubble-agent)",
                  border: "1px solid var(--bubble-border)",
                  color: "var(--text-primary)",
                }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

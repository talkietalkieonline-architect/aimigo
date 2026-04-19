"use client";
import { useState, useCallback, useRef } from "react";
import SplashScreen from "@/components/auth/SplashScreen";
import LoginScreen from "@/components/auth/LoginScreen";
import Particles from "@/components/communicator/Particles";
import TopBar from "@/components/communicator/TopBar";
import BottomBar from "@/components/communicator/BottomBar";
import ChatArea from "@/components/communicator/ChatArea";
import type { ChatMessage } from "@/components/communicator/ChatArea";
import SideTab from "@/components/communicator/SideTab";
import LeftPanel from "@/components/communicator/LeftPanel";
import RightPanel from "@/components/communicator/RightPanel";
import SettingsModal from "@/components/communicator/SettingsModal";
import MyAgentsModal from "@/components/communicator/MyAgentsModal";
import AgentCityModal from "@/components/communicator/AgentCityModal";
import ContactsModal from "@/components/communicator/ContactsModal";

type AppScreen = "splash" | "login" | "communicator";

// Ответы Дворецкого (демо)
const BUTLER_REPLIES = [
  "Отличный вопрос! Давайте разберёмся вместе.",
  "Я всегда рад помочь. Что именно вас интересует?",
  "Хороший выбор! Могу подсказать ещё несколько вариантов.",
  "Записал. Напомню когда потребуется!",
  "Сейчас посмотрю в Городе Агентов, есть ли подходящий специалист.",
  "Между прочим, сегодня в Эфире много интересного — обратите внимание на бегущую строку.",
  "Я рядом, если что — обращайтесь в любой момент.",
  "Могу найти агента-консультанта по этой теме. Хотите?",
  "Это интересно! Расскажите подробнее.",
  "Принято! Работаю над этим.",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "butler",
    name: "Дворецкий",
    text: "Добро пожаловать в Aimigo! Я ваш Дворецкий. Могу рассказать о сервисе, найти нужного агента или просто поболтать.",
    color: "var(--accent)",
    timestamp: new Date(),
  },
];

/** Проверка сохранённой сессии */
function hasValidSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("aimigo_session");
    if (raw) {
      const session = JSON.parse(raw);
      return session.loggedIn && session.expires > Date.now();
    }
  } catch {}
  return false;
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("Общение");
  const [activeRoom, setActiveRoom] = useState("Общая комната");
  const [topBarH, setTopBarH] = useState(80);
  const [bottomBarH, setBottomBarH] = useState(130);

  // Чат — стейт и логика
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const msgCounter = useRef(2);

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);

  const butlerReply = useCallback(() => {
    setIsTyping(true);
    const delay = 800 + Math.random() * 1500;
    setTimeout(() => {
      const reply = BUTLER_REPLIES[Math.floor(Math.random() * BUTLER_REPLIES.length)];
      const butlerMsg: ChatMessage = {
        id: String(msgCounter.current++),
        sender: "butler",
        name: "Дворецкий",
        text: reply,
        color: "var(--accent)",
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, butlerMsg]);
    }, delay);
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: String(msgCounter.current++),
      sender: "user",
      name: "",
      text,
      color: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    butlerReply();
  }, [butlerReply]);

  const handleAttachMedia = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    const mediaMsg: ChatMessage = {
      id: String(msgCounter.current++),
      sender: "user",
      name: "",
      text: "",
      color: "",
      timestamp: new Date(),
      mediaUrl: url,
      mediaType: isVideo ? "video" : "image",
    };
    setMessages((prev) => [...prev, mediaMsg]);
    butlerReply();
  }, [butlerReply]);

  // Заставка — после неё проверяем сессию
  // Если сессия есть — сразу в коммуникатор (как ChatGPT)
  if (screen === "splash") {
    return <SplashScreen onFinish={() => {
      setScreen(hasValidSession() ? "communicator" : "login");
    }} />;
  }

  // Экран входа
  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("communicator")} />;
  }

  // Коммуникатор
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Фоновые частицы */}
      <Particles />

      {/* Верхняя панель */}
      <TopBar tickerActive={true} onHeightChange={setTopBarH} />

      {/* Боковые язычки */}
      <SideTab side="left" onClick={() => setLeftOpen(!leftOpen)} />
      <SideTab side="right" onClick={() => setRightOpen(!rightOpen)} />

      {/* Левая панель — Режимы + Комнаты */}
      <LeftPanel
        isOpen={leftOpen}
        onClose={closeLeft}
        activeMode={activeMode}
        activeRoom={activeRoom}
        onModeChange={setActiveMode}
        onRoomChange={setActiveRoom}
      />

      {/* Правая панель — Дворецкий + Участники */}
      <RightPanel isOpen={rightOpen} onClose={closeRight} />

      {/* Центральная область чата */}
      <ChatArea messages={messages} isTyping={isTyping} topPad={topBarH} bottomPad={bottomBarH} />

      {/* Нижняя панель — ввод + кнопки */}
      <BottomBar
        onSettingsClick={() => setSettingsOpen(true)}
        onContactsClick={() => setContactsOpen(true)}
        onAgentsClick={() => setAgentsOpen(true)}
        onSendMessage={handleSendMessage}
        onAttachMedia={handleAttachMedia}
        onHeightChange={setBottomBarH}
      />

      {/* Центр Управления */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Мои агенты */}
      <MyAgentsModal
        isOpen={agentsOpen}
        onClose={() => setAgentsOpen(false)}
        onOpenCity={() => {
          setAgentsOpen(false);
          setCityOpen(true);
        }}
      />

      {/* Город Агентов */}
      <AgentCityModal
        isOpen={cityOpen}
        onClose={() => setCityOpen(false)}
      />

      {/* Мои контакты */}
      <ContactsModal
        isOpen={contactsOpen}
        onClose={() => setContactsOpen(false)}
      />
    </div>
  );
}

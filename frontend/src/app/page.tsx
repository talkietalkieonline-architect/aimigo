"use client";
import { useState, useCallback } from "react";
import SplashScreen from "@/components/auth/SplashScreen";
import LoginScreen from "@/components/auth/LoginScreen";
import Particles from "@/components/communicator/Particles";
import TopBar from "@/components/communicator/TopBar";
import BottomBar from "@/components/communicator/BottomBar";
import ChatArea from "@/components/communicator/ChatArea";
import SideTab from "@/components/communicator/SideTab";
import LeftPanel from "@/components/communicator/LeftPanel";
import RightPanel from "@/components/communicator/RightPanel";
import SettingsModal from "@/components/communicator/SettingsModal";
import MyAgentsModal from "@/components/communicator/MyAgentsModal";
import AgentCityModal from "@/components/communicator/AgentCityModal";
import ContactsModal from "@/components/communicator/ContactsModal";

type AppScreen = "splash" | "login" | "communicator";

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

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);

  // Заставка
  if (screen === "splash") {
    return <SplashScreen onFinish={() => setScreen("login")} />;
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
      <TopBar tickerActive={true} />

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
      <ChatArea />

      {/* Нижняя панель */}
      <BottomBar
        onSettingsClick={() => setSettingsOpen(true)}
        onContactsClick={() => setContactsOpen(true)}
        onAgentsClick={() => setAgentsOpen(true)}
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

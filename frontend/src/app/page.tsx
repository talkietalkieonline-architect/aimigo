"use client";
import { useState, useCallback } from "react";
import Particles from "@/components/communicator/Particles";
import TopBar from "@/components/communicator/TopBar";
import BottomBar from "@/components/communicator/BottomBar";
import ChatArea from "@/components/communicator/ChatArea";
import SideTab from "@/components/communicator/SideTab";
import LeftPanel from "@/components/communicator/LeftPanel";
import RightPanel from "@/components/communicator/RightPanel";
import SettingsModal from "@/components/communicator/SettingsModal";

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("Общение");
  const [activeRoom, setActiveRoom] = useState("Общая комната");

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);

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
        onContactsClick={() => alert("Мои контакты — в разработке")}
        onAgentsClick={() => alert("Мои агенты — в разработке")}
      />

      {/* Центр Управления */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

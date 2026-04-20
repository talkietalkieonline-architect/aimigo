"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  getToken,
  getChatHistory,
  connectChat,
  type MessageOut,
} from "@/services/api";
import type { ChatMessage } from "@/components/communicator/ChatArea";

/* ═══════════════════════════════════════════════
   useChat — реалтайм чат через WebSocket
   с fallback на локальные демо-ответы Дворецкого
   ═══════════════════════════════════════════════ */

/** Ответы Дворецкого для offline-режима */
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

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-1",
  sender: "butler",
  name: "Дворецкий",
  text: "Добро пожаловать в Aimigo! Я ваш Дворецкий. Могу рассказать о сервисе, найти нужного агента или просто поболтать.",
  color: "var(--accent)",
  timestamp: new Date(),
};

/** Конвертация сообщения API → ChatMessage */
function apiMsgToChat(msg: MessageOut): ChatMessage {
  return {
    id: String(msg.id),
    sender: msg.sender_type as "user" | "butler" | "agent",
    name: msg.sender_name,
    text: msg.text,
    color: msg.sender_type === "user" ? "" : "var(--accent)",
    timestamp: new Date(msg.created_at),
  };
}

interface UseChatResult {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  sendMessage: (text: string) => void;
  attachMedia: (file: File) => void;
  room: string;
  setRoom: (room: string) => void;
}

export function useChat(initialRoom: string = "general"): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(initialRoom);
  const wsRef = useRef<WebSocket | null>(null);
  const msgCounter = useRef(100);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  // Подключаемся к WebSocket при монтировании
  const connectWS = useCallback(() => {
    const token = getToken();
    if (!token) return;

    // Закрываем старый ws
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = connectChat(room, (data) => {
      // Обрабатываем разные типы сообщений
      if (data.type === "message") {
        const chatMsg: ChatMessage = {
          id: String(data.id),
          sender: data.sender_type as "user" | "butler" | "agent",
          name: data.sender_name,
          text: data.text,
          color: data.sender_type === "user" ? "" : "var(--accent)",
          timestamp: new Date(data.created_at),
        };
        setMessages((prev) => [...prev, chatMsg]);
        setIsTyping(false);
      } else if (data.type === "typing") {
        // Агент/Дворецкий печатает...
        setIsTyping(true);
      } else if (data.type === "typing_stop") {
        setIsTyping(false);
      }
      // Можно обработать user_joined, user_left
    });

    if (!ws) return;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("[ws] Подключён к комнате:", room);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("[ws] Отключён");
      // Автопереподключение через 3 сек
      reconnectTimer.current = setTimeout(() => {
        connectWS();
      }, 3000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [room]);

  // Загрузить историю из API
  const loadHistory = useCallback(async () => {
    try {
      const history = await getChatHistory(room);
      if (history.length > 0) {
        const chatMessages = history.map(apiMsgToChat);
        setMessages([WELCOME_MESSAGE, ...chatMessages]);
      }
    } catch {
      // API недоступен — оставляем welcome message
    }
  }, [room]);

  // Инициализация при смене комнаты
  useEffect(() => {
    loadHistory();
    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [room, loadHistory, connectWS]);

  // === Offline: ответ Дворецкого ===
  const offlineButlerReply = useCallback(() => {
    setIsTyping(true);
    const delay = 800 + Math.random() * 1500;
    setTimeout(() => {
      const reply = BUTLER_REPLIES[Math.floor(Math.random() * BUTLER_REPLIES.length)];
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: String(msgCounter.current++),
          sender: "butler" as const,
          name: "Дворецкий",
          text: reply,
          color: "var(--accent)",
          timestamp: new Date(),
        },
      ]);
    }, delay);
  }, []);

  // Отправить сообщение
  const sendMessage = useCallback(
    (text: string) => {
      // Локальное сообщение пользователя (показываем сразу)
      const userMsg: ChatMessage = {
        id: String(msgCounter.current++),
        sender: "user",
        name: "",
        text,
        color: "",
        timestamp: new Date(),
      };

      if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
        // Онлайн — отправляем через WebSocket
        // Не добавляем локально — придёт broadcast от сервера
        wsRef.current.send(JSON.stringify({ text }));
      } else {
        // Offline — локально
        setMessages((prev) => [...prev, userMsg]);
        offlineButlerReply();
      }
    },
    [isConnected, offlineButlerReply]
  );

  // Прикрепить медиа
  const attachMedia = useCallback(
    (file: File) => {
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

      if (!isConnected) {
        offlineButlerReply();
      }
      // TODO: загрузка файла на сервер через API
    },
    [isConnected, offlineButlerReply]
  );

  return {
    messages,
    isTyping,
    isConnected,
    sendMessage,
    attachMedia,
    room,
    setRoom,
  };
}

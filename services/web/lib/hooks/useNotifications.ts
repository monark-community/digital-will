"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { config } from "@/lib/config";
import type { AppNotification, HistoryNotification } from "@/lib/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const socket: Socket = io(config.api.baseUrl, {
      auth: { token },
    });

    socket.on("connect", () => {
      socket.emit("get_notifications", (history: HistoryNotification[]) => {
        setNotifications(
          history.map((n) => ({
            ...n,
            id: (n as any).id ?? "",
            role: (n as any).role ?? "",
            title: (n as any).title ?? n.type.replace(/_/g, " "),
            message: (n as any).message ?? n.willName,
          })),
        );
      });
    });

    socket.on("notification", (notif: Omit<AppNotification, "id" | "read">) => {
      setNotifications((prev) => [
        {
          ...notif,
          id: `${notif.createdAt}-${Math.random().toString(36).slice(2)}`,
          read: false,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  return { notifications, unreadCount, markAllRead, markRead };
}

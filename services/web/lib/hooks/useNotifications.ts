"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { config, API_ROUTES } from "@/lib/config";
import { apiClient } from "@/lib/api-client";
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

    socket.on("notification", (notif: Omit<AppNotification, "read"> & { id?: string }) => {
      setNotifications((prev) => [
        {
          ...notif,
          id: notif.id ?? `${notif.createdAt}-${Math.random().toString(36).slice(2)}`,
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

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ);
    } catch (err) {
      console.error("[useNotifications] Failed to mark all as read:", err);
    }
  }, []);

  const toggleRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
    try {
      await apiClient.patch(API_ROUTES.NOTIFICATIONS.TOGGLE_READ(id));
    } catch (err) {
      console.error("[useNotifications] Failed to toggle read:", err);
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
      );
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiClient.delete(API_ROUTES.NOTIFICATIONS.DELETE(id));
    } catch (err) {
      console.error("[useNotifications] Failed to delete notification:", err);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await apiClient.delete(API_ROUTES.NOTIFICATIONS.DELETE_ALL);
    } catch (err) {
      console.error("[useNotifications] Failed to delete all notifications:", err);
    }
  }, []);

  return { notifications, unreadCount, markAllRead, toggleRead, deleteNotification, deleteAllNotifications };
}

"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { AppNotification } from "@/lib/types";

interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  onClose: () => void;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAllRead,
  onToggleRead,
  onDelete,
  onDeleteAll,
  onNotificationClick,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const hasUnread = notifications.some((n) => !n.read);

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-16 right-4 z-[61] w-[420px] max-w-[90vw] min-h-[360px] max-h-[70vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-section)] shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[var(--accent)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Notifications
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-[var(--accent)] hover:opacity-75 transition-opacity font-medium"
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onDeleteAll}
                className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted-alt)] hover:text-red-500 transition-colors"
                title="Delete all notifications"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--text-muted-alt)] py-10">
              <svg
                className="w-14 h-14 opacity-25"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) onToggleRead(notif.id);
                  onNotificationClick?.(notif);
                }}
                className={`w-full text-left px-6 py-4 border-b border-[var(--border-section)] transition-colors hover:bg-[var(--bg-section)] cursor-pointer ${
                  !notif.read ? "bg-[var(--bg-section)]/50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot — click to mark as read only */}
                  {!notif.read ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRead(notif.id);
                      }}
                      className="mt-1.5 shrink-0 p-0.5 rounded-full hover:bg-[var(--border-section)] transition-colors"
                      title="Mark as read"
                    >
                      <span className="block w-2 h-2 rounded-full bg-[var(--accent)]" />
                    </button>
                  ) : (
                    <span className="mt-1.5 shrink-0 p-0.5">
                      <span className="block w-2 h-2 rounded-full bg-[var(--text-muted-alt)]/30" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      title={notif.title}
                      className={`text-sm font-medium truncate ${
                        !notif.read
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p
                      title={notif.message}
                      className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2"
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-[var(--text-muted-alt)] mt-1.5">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notif.id);
                    }}
                    className="mt-1 shrink-0 p-1 rounded hover:bg-red-500/10 text-[var(--text-muted-alt)] hover:text-red-500 transition-colors"
                    title="Delete notification"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default NotificationPanel;

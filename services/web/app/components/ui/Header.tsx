"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useLogout, useNotifications, useCurrentUser } from "@/lib/hooks";
import NotificationPanel from "./NotificationPanel";
import type { AppNotification, User } from "@/lib/types";

interface HeaderProps {
  isAuthenticated?: boolean;
  user?: User;
}

const Header: React.FC<HeaderProps> = ({
  isAuthenticated = false,
  user: userProp,
}) => {
  const { data: currentUser } = useCurrentUser();
  const user = userProp?.firstName ? userProp : currentUser;

  let avatarLetter = "U";
  if (user?.firstName) {
    avatarLetter = user.firstName.charAt(0).toUpperCase();
  } else if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.firstName)
          avatarLetter = parsed.firstName.charAt(0).toUpperCase();
      }
    } catch {}
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const {
    notifications,
    unreadCount,
    markAllRead,
    toggleRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    router.push("/profile");
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setIsNotifOpen(false);

    const normalizedRole = (notification.role || "").toLowerCase();
    const isSmRole = normalizedRole === "sm" || normalizedRole === "sm_target";
    const isPmRole = normalizedRole === "pm";

    let basePath = "/wills";
    if (isSmRole) {
      basePath = "/wills/associated";
    } else if (!isPmRole && notification.type === "SIGNATURE_REQUEST") {
      basePath = "/wills/associated";
    }

    if (!notification.willId) {
      if (pathname === basePath) {
        window.location.reload();
        return;
      }

      router.push(basePath);
      return;
    }

    const targetUrl = `${basePath}?targetWillId=${encodeURIComponent(notification.willId)}`;

    if (pathname === basePath) {
      window.location.assign(targetUrl);
      return;
    }

    router.push(targetUrl);
  };

  return (
    <nav className="bg-[var(--bg-section)]/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-[var(--border-section)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href={isAuthenticated ? "/dashboard" : "/landing"}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-[var(--accent)] rounded-md flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                WillChain
              </h1>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {!isAuthenticated ? (
                <>
                  <a
                    href="#home"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="#features"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#security"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Security
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href="/wills"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Wills
                  </Link>
                  <Link
                    href="/wills/associated"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Associated Wills
                  </Link>
                  <Link
                    href="/wallets"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Wallets
                  </Link>
                  <Link
                    href="/contacts"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Contacts
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="text-[var(--text-primary)] hover:text-[var(--accent)] px-4 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="bg-[var(--accent)] hover:opacity-90 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {/* Bell icon with badge */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                    className="relative text-[var(--text-primary)] hover:text-[var(--accent)] p-2 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <svg
                      className="w-6 h-6"
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
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 5 ? "5+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {isNotifOpen && (
                  <NotificationPanel
                    notifications={notifications}
                    onMarkAllRead={markAllRead}
                    onToggleRead={toggleRead}
                    onDelete={deleteNotification}
                    onDeleteAll={deleteAllNotifications}
                    onNotificationClick={handleNotificationClick}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center">
                      <span
                        className="text-white text-sm font-bold"
                        suppressHydrationWarning
                      >
                        {avatarLetter}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg shadow-lg py-1 z-50">
                      <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>View Profile</span>
                      </button>
                      <div className="border-t border-[var(--border-section)] my-1"></div>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[var(--bg-section)] transition-colors flex items-center space-x-2 disabled:opacity-50"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            <ThemeToggle />
            <button className="md:hidden text-[var(--text-muted)] hover:text-[var(--accent)] px-2 py-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;

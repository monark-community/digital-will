"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/services";

/**
 * Decode the JWT payload to extract `exp` and `iat` claims.
 */
function getTokenClaims(token: string): { exp: number; iat: number } | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp || !decoded.iat) return null;
    return { exp: decoded.exp, iat: decoded.iat };
  } catch {
    return null;
  }
}

/** How often we check the token state (ms). */
const TICK_INTERVAL = 1_000;

/** Seconds before expiry at which we show the inactivity modal. */
const INACTIVITY_WARNING_BEFORE_EXPIRY_S = 60; // 1 min before token expires

export default function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [showLoggedOutModal, setShowLoggedOutModal] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Track last user activity timestamp (ms)
  const lastActivityRef = useRef(Date.now());
  // Whether the user is considered "active" (made an action within the inactive window)
  const isActiveRef = useRef(true);
  // Prevent duplicate refresh calls
  const refreshingRef = useRef(false);

  // ────────────────────── Helpers ──────────────────────

  const doLogout = useCallback(
    (showConfirm = false) => {
      setShowModal(false);
      authService.removeToken();
      if (showConfirm) {
        sessionStorage.setItem("session_expired", "1");
      }
      router.push("/login");
    },
    [router],
  );

  const doRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const newToken = await authService.refreshToken();
      authService.setToken(newToken);
    } catch {
      // Refresh failed (token already expired) — force logout
      doLogout();
    } finally {
      refreshingRef.current = false;
    }
  }, [doLogout]);

  const handleStayConnected = useCallback(() => {
    setShowModal(false);
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;
    doRefresh();
  }, [doRefresh]);

  // ────────────────────── Show logged-out modal on /login if flag set ──────────────────────

  useEffect(() => {
    if (
      pathname === "/login" &&
      sessionStorage.getItem("session_expired") === "1"
    ) {
      sessionStorage.removeItem("session_expired");
      setShowLoggedOutModal(true);
    }
  }, [pathname]);

  // ────────────────────── Activity tracking ──────────────────────

  useEffect(() => {
    // Mark the session as managed so the 401 interceptor doesn't hard-redirect
    (window as any).__sessionManaged = true;

    const markActive = () => {
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) =>
      window.addEventListener(e, markActive, { passive: true }),
    );

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      (window as any).__sessionManaged = false;
    };
  }, []);

  // ────────────────────── Main timer ──────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      const token = authService.getToken();
      if (!token) return; // not logged in

      const claims = getTokenClaims(token);
      if (!claims) return;

      const { exp, iat } = claims;
      const nowS = Math.floor(Date.now() / 1000);
      const remainingS = exp - nowS;
      const tokenLifetimeS = exp - iat;

      // Token already expired — close modal & force logout
      if (remainingS <= 0) {
        doLogout(true);
        return;
      }

      // If modal is showing, tick countdown down by 1 each second
      if (showModal) {
        if (countdown <= 1) {
          doLogout(true);
        } else {
          setCountdown((prev) => prev - 1);
        }
        return;
      }

      const inactiveSinceS = (Date.now() - lastActivityRef.current) / 1000;
      const inactivityThresholdS =
        tokenLifetimeS - INACTIVITY_WARNING_BEFORE_EXPIRY_S;

      if (inactiveSinceS >= inactivityThresholdS) {
        // User inactive longer than threshold → show modal with fixed 60s countdown
        setCountdown(INACTIVITY_WARNING_BEFORE_EXPIRY_S);
        setShowModal(true);
      } else if (remainingS <= INACTIVITY_WARNING_BEFORE_EXPIRY_S) {
        // Token about to expire and user was active → silent refresh
        isActiveRef.current = false;
        doRefresh();
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [showModal, countdown, doLogout, doRefresh]);

  // ────────────────────── Modal UI ──────────────────────

  if (showLoggedOutModal) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
          <button
            onClick={() => setShowLoggedOutModal(false)}
            className="absolute top-4 right-4 text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">
            You&apos;ve been logged out
          </h2>
          <p className="text-[var(--text-muted-alt)] text-center mb-6">
            You were inactive for too long, so your session was automatically
            ended for security.
          </p>
        </div>
      </div>
    );
  }

  if (!showModal) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">
          Session Expiring
        </h2>
        <p className="text-[var(--text-muted-alt)] text-center mb-6">
          You&apos;ve been inactive for a while. Are you still there?
        </p>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg px-4 py-2">
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-mono text-lg font-bold text-[var(--text-primary)]">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={doLogout}
            className="flex-1 px-4 py-3 rounded-lg border border-[var(--border-section)] text-[var(--text-muted-alt)] hover:bg-[var(--bg-section)] transition-colors font-medium"
          >
            Log out
          </button>
          <button
            onClick={handleStayConnected}
            className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity font-medium"
          >
            Stay connected
          </button>
        </div>
      </div>
    </div>
  );
}

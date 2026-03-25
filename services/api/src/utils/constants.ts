/**
 * Application constants
 */

// Validation Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
} as const;

// Password constraints
export const PASSWORD = {
  MIN_LENGTH: 8,
  SALT_ROUNDS: 10,
} as const;

// API Routes
export const ROUTES = {
  BASE: "/api",
  AUTH: {
    BASE: "/auth",
    SIGNUP: "/signup",
    SIGNIN: "/signin",
    ME: "/me",
    LOGOUT: "/logout",
    WALLET_CHECK: "/wallet/check",
    WALLET_SIGNIN: "/wallet/signin",
    WALLET_CREATE: "/wallet/create",
  },
  // Future routes
  USERS: {
    BASE: "/users",
  },
  WILLS: {
    BASE: "/wills",
  },
  WALLETS: {
    BASE: "/wallets",
    BY_ID: "/wallets/:walletId",
    UPDATE_LABEL: "/wallets/:walletId/label",
  },
  CONTACTS: {
    BASE: "/contacts",
  },
  NOTIFICATIONS: {
    BASE: "/notifications",
    MARK_READ: "/:notifId/read",
    MARK_ALL_READ: "/read/all",
    DELETE_ONE: "/:notifId",
    DELETE_ALL: "/",
  },
} as const;

export const RETRY_DELAYS_MS = [
  500, 1000, 2000, 3000, 8000, 16000, 32000, 64000,
];

export const AWAIT_DELAYS_MS = [
  1000, 2000, 3000, 5000, 8000, 13000, 21000, 34000,
];

// Protection period poller: 1 minutes in local/dev, 1 hour in production
export const PROTECTION_PERIOD_POLLER_INTERVAL_MS =
  process.env.NODE_ENV === "production" ? 60 * 60 * 1_000 : 0.1 * 60 * 1_000;

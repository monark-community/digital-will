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
    RECEIVE_EMAILS: "/receive-emails",
    DELETE_ELIGIBILITY: "/delete-eligibility",
    DELETE: "/delete",
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

// Protection period poller: 1 minute in local/dev, 1 hour in production
export const PROTECTION_PERIOD_POLLER_INTERVAL_MS =
  process.env.NODE_ENV === "production" ? 60 * 60 * 1_000 : 0.1 * 60 * 1_000;

// Protection period reminder: each will gets reminded every 7 days (prod) / 1 minute (other)
export const PROTECTION_PERIOD_REMINDER_INTERVAL_MS =
  process.env.NODE_ENV === "production" ? 7 * 24 * 60 * 60 * 1_000 : 60 * 1_000;

// How often the reminder poller checks for wills that need a reminder
// Must be shorter than the reminder interval so each will gets notified on time
export const REMINDER_POLLER_CHECK_INTERVAL_MS =
  process.env.NODE_ENV === "production" ? 60 * 60 * 1_000 : 0.1 * 60 * 1_000;

// Delay before the first reminder run after server startup
export const REMINDER_POLLER_STARTUP_DELAY_MS = 5_000;

// On-chain SM state index for a secondary member who has declared death
export const SM_STATE_DECLARED_DEATH = 2;

// Time unit constants in milliseconds
export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

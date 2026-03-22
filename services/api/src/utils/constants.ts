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
} as const;

export const RETRY_DELAYS_MS = [500, 1000, 2000, 3000, 5000, 8000];

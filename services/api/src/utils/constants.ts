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
  },
  // Future routes
  USERS: {
    BASE: "/users",
  },
  WILLS: {
    BASE: "/wills",
  },
} as const;

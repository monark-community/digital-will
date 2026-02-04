/**
 * Application configuration from environment variables
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isLocal: (process.env.NODE_ENV as string) === "local",
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: {
    SIGNUP: "/api/auth/signup",
    SIGNIN: "/api/auth/signin",
    ME: "/api/auth/me",
    LOGOUT: "/api/auth/logout",
  },
} as const;

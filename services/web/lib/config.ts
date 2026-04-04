/**
 * Application configuration from environment variables
 */

// Use NEXT_PUBLIC_APP_ENV for environment detection (independent of NODE_ENV which can be overridden by platforms)
// Defaults to "production" if not specified
const _appEnv = (process.env.NEXT_PUBLIC_APP_ENV || "production") as
  | "production"
  | "development"
  | "local";
const _isNonProd = _appEnv !== "production";

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  },
  blockchain: {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
    willFactoryAddress:
      process.env.NEXT_PUBLIC_WILL_FACTORY_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  isProduction: _appEnv === "production",
  isDevelopment: _appEnv === "development",
  isLocal: _appEnv === "local",
  isLocalOrDev: _isNonProd,
  securityPeriod: {
    unit: _isNonProd ? ("minutes" as const) : ("days" as const),
    min: _isNonProd ? 1 : 28,
    max: _isNonProd ? 10000 : 154,
  },
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: {
    SIGNUP: "/api/auth/signup",
    SIGNIN: "/api/auth/signin",
    ME: "/api/auth/me",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    WALLET_CHECK: "/api/auth/wallet/check",
    WALLET_SIGNIN: "/api/auth/wallet/signin",
    WALLET_CREATE: "/api/auth/wallet/create",
  },
  USERS: {
    BASE: "/api/users",
    RECEIVE_EMAILS: "/api/users/receive-emails",
    DELETE_ELIGIBILITY: "/api/users/delete-eligibility",
    DELETE: "/api/users/delete",
  },
  WALLETS: {
    BASE: "/api/wallets",
    BY_ID: (walletId: string) => `/api/wallets/${walletId}`,
    UPDATE_LABEL: (walletId: string) => `/api/wallets/${walletId}/label`,
  },
  CONTACTS: {
    BASE: "/api/contacts",
    BY_ID: (contactId: string) => `/api/contacts/${contactId}`,
  },
  WILLS: {
    BASE: "/api/wills",
    DRAFT: "/api/wills/draft",
    ASSOCIATED: "/api/wills/associated",
    DEPLOY: (willId: string) => `/api/wills/${willId}/deploy`,
    CANCEL: (willId: string) => `/api/wills/${willId}/cancel`,
    UPDATE_MEMBERS: (willId: string) => `/api/wills/${willId}/members`,
    REMOVE_SECONDARY_MEMBER: (willId: string) =>
      `/api/wills/${willId}/secondary-member`,
    BY_WALLET: (walletAddress: string) => `/api/wills/${walletAddress}`,
    ENRICHED: (walletAddress: string) => `/api/wills/${walletAddress}/enriched`,
    VALIDATE: (willId: string) => `/api/wills/validate/${willId}`,
    BALANCE: (contractAddress: string) =>
      `/api/wills/balance/${contractAddress}`,
  },
  NOTIFICATIONS: {
    TOGGLE_READ: (notifId: string) => `/api/notifications/${notifId}/read`,
    MARK_ALL_READ: "/api/notifications/read/all",
    DELETE: (notifId: string) => `/api/notifications/${notifId}`,
    DELETE_ALL: "/api/notifications",
  },
} as const;

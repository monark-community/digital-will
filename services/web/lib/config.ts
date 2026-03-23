/**
 * Application configuration from environment variables
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  },
  blockchain: {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
    willFactoryAddress: process.env.NEXT_PUBLIC_WILL_FACTORY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
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
    WALLET_CHECK: "/api/auth/wallet/check",
    WALLET_SIGNIN: "/api/auth/wallet/signin",
    WALLET_CREATE: "/api/auth/wallet/create",
  },
  USERS:{
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
    REMOVE_SECONDARY_MEMBER: (willId: string) => `/api/wills/${willId}/secondary-member`,
    BY_WALLET: (walletAddress: string) => `/api/wills/${walletAddress}`,
    ENRICHED: (walletAddress: string) => `/api/wills/${walletAddress}/enriched`,
    VALIDATE: (willId: string) => `/api/wills/validate/${willId}`,
    BALANCE: (contractAddress: string) => `/api/wills/balance/${contractAddress}`,
  },
} as const;

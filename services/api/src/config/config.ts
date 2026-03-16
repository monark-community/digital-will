/**
 * Application configuration
 * Loads and provides type-safe access to environment variables
 */

import { loadEnvironment } from './env';

loadEnvironment();

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'local',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isLocal: process.env.NODE_ENV === 'local',

  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  hostname: process.env.HOSTNAME || '0.0.0.0',

  // Database
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'willchain_local',
    password: process.env.POSTGRES_PASSWORD || 'willchain_local_secret',
    database: process.env.POSTGRES_DB || 'willchain_local_db',
    url: process.env.DATABASE_URL || 'postgres://willchain_local:willchain_local_secret@localhost:5432/willchain_local_db',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // API
  api: {
    url: process.env.API_URL || 'http://localhost:4000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'XsEogUp84QjPoRlsj1d2AxJcHZBVYbW4PLRmszOiKvK',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // SMTP (optional)
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },

  blockchain: {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL || 'http://localhost:8545',
    chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : undefined,
  },
};

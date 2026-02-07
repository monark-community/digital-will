import dotenv from 'dotenv';
import path from 'path';

/**
 * Load environment variables from .env file
 */
function loadEnvironment() {
  // Resolve to project root (services/api/.env)
  const envPath = path.resolve(__dirname, '../../.env');

  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`Loaded .env file from ${envPath}`);
    } else {
      console.warn(`Could not load .env file from ${envPath}`);
    }
  } catch (error) {
    console.warn('Error loading .env file:', error);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'NODE_ENV',
    'PORT',
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

export { loadEnvironment, validateEnvironment };

import dotenv from 'dotenv';
import path from 'path';

let envLoaded = false;

/**
 * Load environment variables from .env file
 */
function loadEnvironment() {
  if (envLoaded) return;
  envLoaded = true;

  const envLocalPath = path.resolve(__dirname, '../../.env.local');
  const envPath = path.resolve(__dirname, '../../.env');
  const rootEnvPath = path.resolve(__dirname, '../../../.env');

  let loaded = false;
  try {
    const result = dotenv.config({ path: envLocalPath, override: false });
    if (!result.error) {
      console.log(`Loaded .env.local file from ${envLocalPath}`);
      loaded = true;
    }
  } catch (error) {
  }

  if (!loaded) {
    try {
      const result = dotenv.config({ path: envPath, override: false });
      if (!result.error) {
        console.log(`Loaded .env file from ${envPath}`);
        loaded = true;
      }
    } catch (error) {
    }
  }

  if (!loaded) {
    try {
      const result = dotenv.config({ path: rootEnvPath, override: false });
      if (!result.error) {
        console.log(`Loaded root .env file from ${rootEnvPath}`);
        loaded = true;
      }
    } catch (error) {
      console.warn('Error loading .env file:', error);
    }
  }

  if (!loaded) {
    console.warn('No .env or .env.local file found');
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

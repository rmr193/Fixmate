import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'fixmate',
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET || 'fixmate_super_secret_better_auth_key_2026_prod_ready',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'fixmate_jwt_hs256_signing_secret_key_2026_verified',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  TRUSTED_ORIGINS: (
    process.env.TRUSTED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || '',
};

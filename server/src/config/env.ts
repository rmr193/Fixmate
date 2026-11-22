import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireSecret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Configure it in .env or your hosting provider.`
    );
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'fixmate',
  get JWT_SECRET(): string {
    return requireSecret('JWT_SECRET');
  },
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL:
    process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')
      ? process.env.CLIENT_URL.replace(/\/$/, '')
      : process.env.NODE_ENV === 'production'
      ? 'https://fixmate-spmy.vercel.app'
      : process.env.CLIENT_URL || 'http://localhost:3000',
  TRUSTED_ORIGINS: (
    process.env.TRUSTED_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,https://fixmate-spmy.vercel.app'
  )
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || '',
};

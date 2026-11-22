import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

const mongoUri =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate';
const dbName = process.env.MONGODB_DB_NAME || 'fixmate';

const globalForMongo = globalThis as unknown as {
  _fixmateMongoClient?: MongoClient;
};

const client =
  globalForMongo._fixmateMongoClient || new MongoClient(mongoUri);
if (process.env.NODE_ENV !== 'production') {
  globalForMongo._fixmateMongoClient = client;
}

export const mongoDb = client.db(dbName);

const resolvedBaseUrl =
  process.env.BETTER_AUTH_URL &&
  !process.env.BETTER_AUTH_URL.includes('localhost')
    ? process.env.BETTER_AUTH_URL
    : process.env.NEXT_PUBLIC_APP_URL &&
      !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BETTER_AUTH_URL || 'http://localhost:3000';

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'fixmate_super_secret_better_auth_key_2026_prod_ready',
  baseURL: resolvedBaseUrl,
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    resolvedBaseUrl,
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://fixmate-spmy.vercel.app',
    'https://fixmate-app.vercel.app',
    'https://*.vercel.app',
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      prompt: 'select_account',
    },
  },
  user: {
    modelName: 'users',
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'customer',
        input: true,
      },
      phone: {
        type: 'string',
        required: false,
        defaultValue: '',
        input: true,
      },
      area: {
        type: 'string',
        required: false,
        defaultValue: '',
        input: true,
      },
      bio: {
        type: 'string',
        required: false,
        defaultValue: '',
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Enforce server-side rule: public sign-up can ONLY be 'customer' or 'technician'
          const requestedRole = (user as Record<string, unknown>).role;
          const safeRole =
            requestedRole === 'technician' ? 'technician' : 'customer';
          return {
            data: {
              ...user,
              email: user.email.toLowerCase(),
              role: safeRole,
              phone: ((user as Record<string, unknown>).phone as string) || '',
              area:
                ((user as Record<string, unknown>).area as string) ||
                'Dhaka, Bangladesh',
              bio: ((user as Record<string, unknown>).bio as string) || '',
              image:
                user.image ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                  user.name || 'FixMate'
                )}&backgroundColor=1e40af`,
            },
          };
        },
      },
    },
  },
});

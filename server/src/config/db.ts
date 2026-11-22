import { MongoClient, Db, Collection } from 'mongodb';
import { env } from './env';
import {
  UserDocument,
  ServiceDocument,
  BookingDocument,
  PaymentDocument,
} from '../types/models';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  dbInstance = client.db(env.MONGODB_DB_NAME);

  await ensureIndexes(dbInstance);
  return dbInstance;
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return dbInstance;
}

/**
 * The 4 strict application data collections:
 * 1. users
 * 2. services
 * 3. bookings
 * 4. payments
 */
export function getCollections() {
  const db = getDB();
  return {
    users: db.collection<UserDocument>('users'),
    services: db.collection<ServiceDocument>('services'),
    bookings: db.collection<BookingDocument>('bookings'),
    payments: db.collection<PaymentDocument>('payments'),
  };
}

async function ensureIndexes(db: Db): Promise<void> {
  const users: Collection<UserDocument> = db.collection('users');
  const services: Collection<ServiceDocument> = db.collection('services');
  const bookings: Collection<BookingDocument> = db.collection('bookings');
  const payments: Collection<PaymentDocument> = db.collection('payments');

  await Promise.all([
    // 1. users indexes
    users.createIndex({ email: 1 }, { unique: true }),
    users.createIndex({ role: 1 }),

    // 2. services indexes
    services.createIndex({ approvalStatus: 1, isAvailable: 1, createdAt: -1 }),
    services.createIndex({ category: 1, serviceMode: 1 }),
    services.createIndex({ basePrice: 1 }),
    services.createIndex({ technicianEmail: 1, createdAt: -1 }),

    // 3. bookings indexes
    bookings.createIndex({ customerEmail: 1, serviceId: 1, status: 1 }),
    bookings.createIndex({ customerEmail: 1, preferredDate: -1 }),
    bookings.createIndex({ technicianEmail: 1, status: 1 }),
    bookings.createIndex({ status: 1, paymentStatus: 1 }),

    // 4. payments indexes (unique stripeSessionId & bookingId prevent duplicate payments)
    payments.createIndex({ stripeSessionId: 1 }, { unique: true }),
    payments.createIndex({ bookingId: 1 }, { unique: true }),
    payments.createIndex({ customerEmail: 1, paidAt: -1 }),
    payments.createIndex({ technicianEmail: 1, paidAt: -1 }),
    payments.createIndex({ paidAt: -1 }),
  ]);
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
  }
}

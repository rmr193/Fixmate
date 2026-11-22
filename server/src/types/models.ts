import { ObjectId } from 'mongodb';

export type UserRole = 'customer' | 'technician' | 'admin';

export const SERVICE_CATEGORIES = [
  'Smartphone',
  'Laptop & PC',
  'AC',
  'Refrigerator',
  'TV',
  'Washing Machine',
  'Electrical',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_MODES = ['Home Visit', 'Shop Drop-off'] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export interface UserDocument {
  _id?: ObjectId;
  id?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  role: UserRole;
  phone?: string;
  area?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceDocument {
  _id?: ObjectId;
  title: string;
  category: ServiceCategory;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: ServiceMode;
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
  approvalStatus: ApprovalStatus;
  isAvailable: boolean;
  createdAt: Date;
}

export interface StatusHistoryEntry {
  status: BookingStatus | 'paid';
  changedAt: Date;
  note?: string;
}

export interface BookingDocument {
  _id?: ObjectId;
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  category: ServiceCategory | string;
  basePrice: number;
  technicianName: string;
  technicianEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  preferredDate: Date;
  problemDescription: string;
  status: BookingStatus;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  statusHistory?: StatusHistoryEntry[];
  rating?: number;
  review?: string;
  reviewedAt?: Date;
  createdAt?: Date;
}

export interface PaymentDocument {
  _id?: ObjectId;
  bookingId: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  technicianName: string;
  technicianEmail: string;
  amount: number;
  currency: 'usd';
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: 'paid';
  paidAt: Date;
}

export interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  phone?: string;
  area?: string;
  bio?: string;
}

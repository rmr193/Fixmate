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

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  phone?: string;
  area?: string;
  bio?: string;
  createdAt?: string;
}

export interface ServiceItem {
  _id: string;
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
  createdAt: string;
  technician?: {
    name: string;
    email: string;
    image?: string;
    area?: string;
    bio?: string;
    phone?: string;
  };
  reviews?: Array<{
    _id?: string;
    customerName: string;
    rating: number;
    review: string;
    reviewedAt: string;
  }>;
  ratingSummary?: {
    average: number | null;
    count: number;
  };
}

export interface StatusHistoryEntry {
  status: BookingStatus | 'paid';
  changedAt: string;
  note?: string;
}

export interface BookingItem {
  _id: string;
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
  preferredDate: string;
  problemDescription: string;
  status: BookingStatus;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  statusHistory?: StatusHistoryEntry[];
  rating?: number;
  review?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface PaymentItem {
  _id: string;
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
  paidAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

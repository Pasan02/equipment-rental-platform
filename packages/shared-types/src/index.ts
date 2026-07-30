// Shared Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
  WAREHOUSE = 'WAREHOUSE',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentType {
  RENTAL = 'RENTAL',
  DEPOSIT = 'DEPOSIT',
  REFUND = 'REFUND',
  DAMAGE = 'DAMAGE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum InventoryAction {
  RECEIVED = 'RECEIVED',
  RELEASED = 'RELEASED',
  DAMAGED = 'DAMAGED',
  MAINTENANCE = 'MAINTENANCE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum NotificationType {
  RESERVATION_APPROVED = 'RESERVATION_APPROVED',
  RESERVATION_REJECTED = 'RESERVATION_REJECTED',
  UPCOMING_RETURN = 'UPCOMING_RETURN',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
}

export enum UploadType {
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  RENTAL_AGREEMENT = 'RENTAL_AGREEMENT',
  EQUIPMENT_IMAGE = 'EQUIPMENT_IMAGE',
}

export enum ActivityAction {
  LOGIN = 'LOGIN',
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_UPDATED = 'RESERVATION_UPDATED',
  PAYMENT = 'PAYMENT',
  INVENTORY_CHANGE = 'INVENTORY_CHANGE',
}

// Shared Interfaces
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface IEquipment {
  id: string;
  name: string;
  description: string;
  rentalPricePerDay: number;
  depositAmount: number;
  stockQuantity: number;
  availableQuantity: number;
  specifications?: Record<string, any>;
  qrCode?: string;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservation {
  id: string;
  reservationNumber: string;
  customerId: string;
  approvedBy?: string;
  status: ReservationStatus;
  pickupDate: Date;
  returnDate: Date;
  actualReturnDate?: Date;
  totalAmount: number;
  depositTotal: number;
  notes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

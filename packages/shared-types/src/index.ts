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
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_UPDATED = 'RESERVATION_UPDATED',
  PAYMENT = 'PAYMENT',
  INVENTORY_CHANGE = 'INVENTORY_CHANGE',
  EQUIPMENT_CREATED = 'EQUIPMENT_CREATED',
  EQUIPMENT_UPDATED = 'EQUIPMENT_UPDATED',
  EQUIPMENT_DELETED = 'EQUIPMENT_DELETED',
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

export interface IPayment {
  id: string;
  reservationId: string;
  transactionId: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  paymentMethod?: string;
  metadata?: Record<string, any>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpload {
  id: string;
  userId: string;
  reservationId?: string;
  type: UploadType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
}

export interface IInventoryLog {
  id: string;
  equipmentId: string;
  userId: string;
  action: InventoryAction;
  quantityChange: number;
  notes?: string;
  createdAt: Date;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
}

export interface IActivityLog {
  id: string;
  userId?: string;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
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

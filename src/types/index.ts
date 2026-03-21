// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User & Auth Types
export interface User {
  id: number;
  shopId: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  contact?: string;
  gstNumber?: string;
  address?: string;
  gstRate: number;
  gstEnabled: boolean;
  stateCode?: string;
  placeOfSupply?: string;
  catalogToken?: string;
  catalogSlug?: string;
  whatsappNumber?: string;
  catalogEnabled: boolean;
  catalogTheme?: {
    primaryColor?: string;
    logo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  shop: Shop;
}

// Product Types
export interface Category {
  id: number;
  shopId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImages {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
}

export interface Product {
  id: number;
  shopId: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  hsnCode?: string;
  taxRate?: number;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  currentStock: number;
  minStockLevel: number;
  imageUrl?: string;
  images?: ProductImages;
  catalogVisible: boolean;
  catalogOrder?: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  hsnCode?: string;
  taxRate?: number;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  currentStock: number;
  minStockLevel: number;
  catalogVisible: boolean;
  catalogOrder?: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number;
  catalogProducts: number;
  lowStockProducts: number;
  totalCategories: number;
  pendingOrders: number;
  totalRevenue: number;
}

// WhatsApp Business API Types
export type WhatsAppSetupStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'FAILED';

export type BusinessCategory =
  | 'RETAIL'
  | 'GROCERY'
  | 'ELECTRONICS'
  | 'FASHION'
  | 'PHARMACY'
  | 'RESTAURANT'
  | 'SERVICES'
  | 'OTHER';

export interface WhatsAppSetupRequest {
  id: number;
  shopId: string;
  businessName: string;
  businessAddress: string;
  gstNumber?: string;
  panNumber?: string;
  phoneNumber: string;
  ownerName: string;
  ownerEmail: string;
  businessCategory: BusinessCategory;
  businessDescription?: string;
  gstCertificateUrl?: string;
  shopPhotoUrl?: string;
  status: WhatsAppSetupStatus;
  statusMessage?: string;
  submittedAt: string;
  processedAt?: string;
  approvedAt?: string;
  assignedToUser?: string;
  shop?: {
    id: string;
    name: string;
    catalogSlug?: string;
  };
}

export interface WhatsAppSetupFormData {
  businessName: string;
  businessAddress: string;
  gstNumber?: string;
  panNumber?: string;
  phoneNumber: string;
  ownerName: string;
  ownerEmail: string;
  businessCategory: BusinessCategory;
  businessDescription?: string;
  gstCertificateUrl?: string;
  shopPhotoUrl?: string;
}

export interface WhatsAppSetupStatusResponse {
  success: boolean;
  setupRequest: WhatsAppSetupRequest | null;
  shop: {
    whatsappEnabled: boolean;
    whatsappVerified: boolean;
    setupDate: string | null;
  };
}

export interface CompleteSetupRequest {
  metaBusinessId: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappBusinessAccountId: string;
  statusMessage?: string;
}

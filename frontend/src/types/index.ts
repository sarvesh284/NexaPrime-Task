export type UserRole = 'USER' | 'STORE_OWNER';

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  ownerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ratingCount: number;
  averageRating: number;
  myRating?: number | null;
}

export interface RatingItem {
  id: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
  };
}

export interface StoreStats {
  storeId: string;
  averageRating: number;
  ratingCount: number;
}

export interface OwnerDashboardData {
  totalStores: number;
  totalRatings: number;
  averageRating: number;
  distribution: Record<number, number>;
  stores: {
    id: string;
    name: string;
    address: string;
    createdAt: string;
    totalRatings: number;
    averageRating: number;
  }[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
  pagination?: Pagination;
}

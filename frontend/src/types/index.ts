export type UserRole = 'USER' | 'STORE_OWNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  isEmailVerified?: boolean;
  favoritesCount?: number;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  email?: string;
  address: string;
  category?: string;
  city?: string;
  ownerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ratingCount: number;
  averageRating: number;
  bayesianRating?: number;
  myRating?: number | null;
  isFavorite?: boolean;
}

export interface Review {
  id: string;
  value: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  helpfulCount: number;
  hasVotedHelpful?: boolean;
  user: {
    id: string;
    name: string;
  };
}

export interface RatingDistribution {
  [key: number]: {
    count: number;
    percentage: number;
  };
}

export interface RatingItem {
  id: string;
  rating: number;
  comment?: string;
  helpfulCount?: number;
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

export interface DailyTrend {
  date: string;
  count: number;
  averageRating: number;
}

export interface StoreComparison {
  storeId: string;
  storeName: string;
  ratingCount: number;
  averageRating: number;
}

export interface OwnerAnalyticsData {
  totalStores: number;
  totalRatings: number;
  averageRating: number;
  periodNewRatings: number;
  distribution: Record<number, number>;
  dailyTrends: DailyTrend[];
  storeComparisons: StoreComparison[];
}

export interface AdminKpis {
  totalUsers: number;
  totalStoreOwners: number;
  totalActiveStores: number;
  totalInactiveStores: number;
  totalStores: number;
  totalRatings: number;
  overallPlatformRating: number;
  pendingReportsCount: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStore {
  id: string;
  name: string;
  email?: string;
  address: string;
  category: string;
  city: string;
  isActive: boolean;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AdminReport {
  id: string;
  reason: 'INAPPROPRIATE' | 'SPAM' | 'OFFENSIVE' | 'SUSPICIOUS' | 'OTHER';
  details?: string;
  status: 'PENDING' | 'RESOLVED_HIDDEN' | 'RESOLVED_KEPT' | 'DISMISSED';
  createdAt: string;
  resolutionNotes?: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  review?: {
    id: string;
    value: number;
    comment?: string;
    status: string;
    authorName: string;
    authorEmail: string;
    storeName: string;
    storeId: string;
  } | null;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
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

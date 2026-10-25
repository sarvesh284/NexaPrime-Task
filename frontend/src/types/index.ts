export type UserRole = 'USER' | 'STORE_OWNER';

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
  description?: string;
  phone?: string;
  website?: string;
  coverImage?: string;
  coordinates?: { lat: number; lng: number };
  recentRatingsCount?: number;
}

export interface OwnerReply {
  text: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export interface Review {
  id: string;
  value: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  helpfulCount: number;
  hasVotedHelpful?: boolean;
  ownerReply?: OwnerReply;
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
  ownerReply?: OwnerReply;
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

export interface NotificationItem {
  id: string;
  type: 'REVIEW_REPLY' | 'NEW_RATING' | 'STATUS_CHANGE' | 'REPORT_RESOLVED' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserRatingHistoryItem {
  id: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeCategory: string;
  storeCity: string;
  storeAverageRating: number;
  storeRatingCount: number;
  value: number;
  comment?: string;
  status: string;
  helpfulCount: number;
  ownerReply?: OwnerReply | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginHistoryEntry {
  ip: string;
  userAgent: string;
  timestamp: string;
  status: string;
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
    category?: string;
    city?: string;
    email?: string;
    coverImage?: string;
    description?: string;
    phone?: string;
    website?: string;
    isActive?: boolean;
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

export interface PhotoReport {
  userId: { id?: string; _id?: string; name: string; email?: string } | string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface PhotoItem {
  id: string;
  storeId: string | { id?: string; _id?: string; name: string; address?: string; city?: string; coverImage?: string };
  userId: {
    id?: string;
    _id?: string;
    name: string;
    email?: string;
    role?: UserRole;
  } | string;
  url: string;
  storageKey?: string;
  storageProvider?: string;
  caption?: string;
  isCover: boolean;
  isOfficial: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPORTED';
  reports?: PhotoReport[];
  createdAt: string;
  updatedAt?: string;
}


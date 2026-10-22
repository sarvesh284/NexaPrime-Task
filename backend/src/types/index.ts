import { Request } from 'express';

export type UserRole = 'USER' | 'STORE_OWNER' | 'ADMIN';

export interface IUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: IUserPayload;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  pagination?: Pagination;
}

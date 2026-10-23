import { z } from 'zod';

export const storeQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  city: z.string().trim().optional(),
  minRating: z.string().optional().transform((val) => (val ? Math.max(1, Math.min(5, parseFloat(val) || 0)) : undefined)),
  minReviews: z.string().optional().transform((val) => (val ? Math.max(0, parseInt(val, 10) || 0) : undefined)),
  sort: z.enum(['name', 'averageRating', 'ratingCount', 'bayesianRating', 'createdAt']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const ownerRatingsQuerySchema = z.object({
  storeId: z.string().trim().optional(),
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  search: z.string().trim().optional(),
  rating: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'value', 'storeName']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const ownerAnalyticsQuerySchema = z.object({
  storeId: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rating: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

export type StoreQueryInput = z.infer<typeof storeQuerySchema>;
export type OwnerRatingsQueryInput = z.infer<typeof ownerRatingsQuerySchema>;
export type OwnerAnalyticsQueryInput = z.infer<typeof ownerAnalyticsQuerySchema>;

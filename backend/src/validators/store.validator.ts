import { z } from 'zod';

export const storeQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  search: z.string().trim().optional(),
  sort: z.enum(['name', 'averageRating', 'ratingCount', 'createdAt']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const ownerRatingsQuerySchema = z.object({
  storeId: z.string().trim().optional(),
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  search: z.string().trim().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'value', 'storeName']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

export type StoreQueryInput = z.infer<typeof storeQuerySchema>;
export type OwnerRatingsQueryInput = z.infer<typeof ownerRatingsQuerySchema>;

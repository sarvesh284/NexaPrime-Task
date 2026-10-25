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

export const createStoreSchema = z.object({
  name: z
    .string({ required_error: 'Store name is required' })
    .trim()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .or(z.literal(''))
    .optional(),
  address: z
    .string({ required_error: 'Physical address is required' })
    .trim()
    .min(5, 'Physical address must be at least 5 characters')
    .max(400, 'Physical address cannot exceed 400 characters'),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(2, 'Category is required')
    .max(50, 'Category cannot exceed 50 characters')
    .default('Retail'),
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(2, 'City is required')
    .max(60, 'City cannot exceed 60 characters')
    .default('Pune'),
  state: z
    .string()
    .trim()
    .max(60, 'State cannot exceed 60 characters')
    .optional()
    .default('Maharashtra'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .default(''),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone cannot exceed 30 characters')
    .optional()
    .default(''),
  website: z
    .string()
    .trim()
    .max(200, 'Website cannot exceed 200 characters')
    .optional()
    .default(''),
  coverImage: z
    .string()
    .trim()
    .max(500, 'Image URL cannot exceed 500 characters')
    .optional()
    .default(''),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const updateStoreSchema = createStoreSchema.partial();

export const ownerStoreQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  city: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'archived']).optional().default('active'),
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  sort: z.enum(['name', 'createdAt', 'averageRating', 'ratingCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type StoreQueryInput = z.infer<typeof storeQuerySchema>;
export type OwnerRatingsQueryInput = z.infer<typeof ownerRatingsQuerySchema>;
export type OwnerAnalyticsQueryInput = z.infer<typeof ownerAnalyticsQuerySchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type OwnerStoreQueryInput = z.infer<typeof ownerStoreQuerySchema>;


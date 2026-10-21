import { z } from 'zod';

export const adminCreateStoreSchema = z.object({
  name: z
    .string({ required_error: 'Store name is required' })
    .trim()
    .min(3, 'Store name must be between 3 and 100 characters')
    .max(100, 'Store name must be between 3 and 100 characters'),
  email: z
    .string({ required_error: 'Store email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  address: z
    .string({ required_error: 'Store address is required' })
    .trim()
    .min(5, 'Store address must be between 5 and 400 characters')
    .max(400, 'Store address must be between 5 and 400 characters'),
  category: z.string().trim().max(50).optional().default('Retail'),
  city: z.string().trim().max(100).optional().default('General'),
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Owner ID').optional().nullable(),
});

export const adminUpdateStoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Store name must be between 3 and 100 characters')
    .max(100, 'Store name must be between 3 and 100 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .optional(),
  address: z
    .string()
    .trim()
    .min(5, 'Store address must be between 5 and 400 characters')
    .max(400, 'Store address must be between 5 and 400 characters')
    .optional(),
  category: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  isActive: z.boolean().optional(),
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Owner ID').optional().nullable(),
});

export const adminAssignOwnerSchema = z.object({
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Owner ID').nullable(),
});

export const adminUserQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  search: z.string().trim().optional(),
  role: z.enum(['USER', 'STORE_OWNER', 'ADMIN']).optional(),
  status: z.enum(['active', 'deactivated', 'all']).default('all'),
  sort: z.enum(['name', 'email', 'createdAt', 'role']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const adminStoreQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  category: z.string().trim().optional(),
  sort: z.enum(['name', 'averageRating', 'ratingCount', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const adminModerateReportSchema = z.object({
  action: z.enum(['HIDE_REVIEW', 'DISMISS', 'RESTORE_REVIEW'], {
    required_error: 'Action is required',
  }),
  notes: z.string().trim().max(500).optional(),
});

export const adminReportQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED', 'ALL']).default('PENDING'),
});

export const adminAuditQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
  action: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
});

export type AdminCreateStoreInput = z.infer<typeof adminCreateStoreSchema>;
export type AdminUpdateStoreInput = z.infer<typeof adminUpdateStoreSchema>;
export type AdminAssignOwnerInput = z.infer<typeof adminAssignOwnerSchema>;
export type AdminModerateReportInput = z.infer<typeof adminModerateReportSchema>;

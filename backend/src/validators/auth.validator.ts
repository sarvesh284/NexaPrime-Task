import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(20, 'Name must be at least 20 characters')
    .max(60, 'Name must not exceed 60 characters')
    .refine((val) => val.length > 0, 'Name cannot be empty after trimming'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be between 8 and 16 characters')
    .max(16, 'Password must be between 8 and 16 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter and at least one special character'
    ),
  address: z
    .string({ required_error: 'Address is required' })
    .trim()
    .min(1, 'Address is required')
    .max(400, 'Address must not exceed 400 characters'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/store_rating_platform'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('dev_super_secret_jwt_key_store_rating_platform_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  COOKIE_NAME: z.string().default('auth_token'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),

  // Email & SMTP settings
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform((v) => v === 'true').default('false'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('NexaPrime Platform <noreply@nexaprime.com>'),

  // Bayesian Rating Weight
  BAYESIAN_MIN_RATINGS: z.string().transform(Number).default('5'),
  BAYESIAN_PRIOR_RATING: z.string().transform(Number).default('3.0'),

  // Cloudinary / Storage Settings (Optional - fallback to local storage if empty)
  CLOUDINARY_URL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5'),
  MAX_FILES_PER_UPLOAD: z.string().transform(Number).default('5'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

import { z } from 'zod';

export const ratingSchema = z.object({
  rating: z
    .number({
      required_error: 'Rating is required',
      invalid_type_error: 'Rating must be a valid number',
    })
    .int('Rating must be an integer from 1 to 5')
    .min(1, 'Rating must be an integer between 1 and 5')
    .max(5, 'Rating must be an integer between 1 and 5'),
  comment: z
    .string()
    .trim()
    .max(500, 'Comment must not exceed 500 characters')
    .optional()
    .nullable(),
});

export const reportReviewSchema = z.object({
  reason: z.enum(['INAPPROPRIATE', 'SPAM', 'OFFENSIVE', 'SUSPICIOUS', 'OTHER'], {
    required_error: 'Report reason is required',
  }),
  details: z
    .string()
    .trim()
    .max(500, 'Report details must not exceed 500 characters')
    .optional()
    .nullable(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).default('newest'),
});

export type RatingInput = z.infer<typeof ratingSchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;

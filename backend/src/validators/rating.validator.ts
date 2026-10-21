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
});

export type RatingInput = z.infer<typeof ratingSchema>;

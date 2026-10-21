import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';
import { RatingController } from '../controllers/rating.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { storeQuerySchema, objectIdParamSchema } from '../validators/store.validator';
import { ratingSchema, reportReviewSchema, reviewQuerySchema } from '../validators/rating.validator';

const router = Router();

// Store discovery & metadata
router.get('/filter-options', StoreController.getFilterOptions);
router.get('/favorites', requireAuth, StoreController.getUserFavorites);

// Store discovery & listings
router.get('/', optionalAuth, validateQuery(storeQuerySchema), StoreController.getStores);
router.get('/:id', optionalAuth, validateParams(objectIdParamSchema), StoreController.getStoreById);

// Favorites toggle
router.post(
  '/:id/favorite',
  requireAuth,
  validateParams(objectIdParamSchema),
  StoreController.toggleFavorite
);

// Personal rating for store
router.get(
  '/:id/my-rating',
  requireAuth,
  requireRole('USER'),
  validateParams(objectIdParamSchema),
  StoreController.getMyRating
);

// Submit or update rating & review comment (Normal User role only)
router.put(
  '/:id/rating',
  requireAuth,
  requireRole('USER'),
  validateParams(objectIdParamSchema),
  validateBody(ratingSchema),
  RatingController.updateRating
);

// Public reviews with distribution for a store
router.get(
  '/:id/reviews',
  optionalAuth,
  validateParams(objectIdParamSchema),
  validateQuery(reviewQuerySchema),
  RatingController.getStoreReviews
);

// Helpful vote toggle on a review
router.post(
  '/reviews/:reviewId/helpful',
  requireAuth,
  RatingController.toggleHelpful
);

// Report an inappropriate review
router.post(
  '/reviews/:reviewId/report',
  requireAuth,
  validateBody(reportReviewSchema),
  RatingController.reportReview
);

export default router;

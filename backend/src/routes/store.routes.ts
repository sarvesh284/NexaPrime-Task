import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';
import { RatingController } from '../controllers/rating.controller';
import { PhotoController } from '../controllers/photo.controller';
import { photoUploadMiddleware, validateImageContent } from '../middleware/upload.middleware';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { storeQuerySchema, objectIdParamSchema } from '../validators/store.validator';
import { ratingSchema, reportReviewSchema, reviewQuerySchema } from '../validators/rating.validator';

const router = Router();

// Store discovery & metadata
router.get('/filter-options', StoreController.getFilterOptions);
router.get('/trending', StoreController.getTrending);
router.get('/favorites', requireAuth, StoreController.getUserFavorites);
router.get('/recently-viewed', requireAuth, StoreController.getRecentlyViewed);
router.delete('/recently-viewed', requireAuth, StoreController.clearRecentlyViewed);
router.get('/my-ratings/history', requireAuth, RatingController.getMyRatingHistory);

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

// Record store view
router.post(
  '/:id/view',
  optionalAuth,
  validateParams(objectIdParamSchema),
  StoreController.recordView
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

// Store Photos (Upload, List, Set Cover)
router.post(
  '/:storeId/photos',
  requireAuth,
  photoUploadMiddleware,
  validateImageContent,
  PhotoController.uploadPhotos
);

router.get(
  '/:storeId/photos',
  PhotoController.getStorePhotos
);

router.patch(
  '/:storeId/photos/:photoId/cover',
  requireAuth,
  PhotoController.setCoverPhoto
);

export default router;

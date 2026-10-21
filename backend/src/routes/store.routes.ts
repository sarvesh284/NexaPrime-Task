import { Router } from 'express';
import { StoreController } from '../controllers/store.controller';
import { RatingController } from '../controllers/rating.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { storeQuerySchema, objectIdParamSchema } from '../validators/store.validator';
import { ratingSchema } from '../validators/rating.validator';

const router = Router();

// Store discovery & listings
router.get('/', optionalAuth, validateQuery(storeQuerySchema), StoreController.getStores);
router.get('/:id', optionalAuth, validateParams(objectIdParamSchema), StoreController.getStoreById);

// Personal rating for store
router.get(
  '/:id/my-rating',
  requireAuth,
  requireRole('USER'),
  validateParams(objectIdParamSchema),
  StoreController.getMyRating
);

// Submit or update rating (Normal User role only)
router.put(
  '/:id/rating',
  requireAuth,
  requireRole('USER'),
  validateParams(objectIdParamSchema),
  validateBody(ratingSchema),
  RatingController.updateRating
);

export default router;

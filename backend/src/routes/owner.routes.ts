import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
  ownerRatingsQuerySchema,
  ownerAnalyticsQuerySchema,
  createStoreSchema,
  updateStoreSchema,
  ownerStoreQuerySchema,
  objectIdParamSchema,
} from '../validators/store.validator';

const router = Router();

// Store Owner Dashboard Overview
router.get('/dashboard', requireAuth, requireRole('STORE_OWNER'), OwnerController.getDashboard);

// Advanced Owner Analytics with trends & comparisons
router.get(
  '/analytics',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateQuery(ownerAnalyticsQuerySchema),
  OwnerController.getAnalytics
);

// Store Owner Customer Ratings list
router.get(
  '/ratings',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateQuery(ownerRatingsQuerySchema),
  OwnerController.getRatings
);

// CSV Export with formula injection protection
router.get(
  '/ratings/export',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateQuery(ownerRatingsQuerySchema),
  OwnerController.exportCsv
);

// Reply to a customer rating (R5 / O3)
router.post(
  '/ratings/:id/reply',
  requireAuth,
  requireRole('STORE_OWNER'),
  OwnerController.replyToRating
);

// Delete reply to a customer rating (R5 / O3)
router.delete(
  '/ratings/:id/reply',
  requireAuth,
  requireRole('STORE_OWNER'),
  OwnerController.deleteReply
);

// Store Owner Store Management (Full CRUD)
router.post(
  '/stores',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateBody(createStoreSchema),
  OwnerController.createStore
);

router.get(
  '/stores',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateQuery(ownerStoreQuerySchema),
  OwnerController.getStores
);

router.get(
  '/stores/:id',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateParams(objectIdParamSchema),
  OwnerController.getStoreById
);

router.put(
  '/stores/:id',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateParams(objectIdParamSchema),
  validateBody(updateStoreSchema),
  OwnerController.updateStore
);

router.patch(
  '/stores/:id',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateParams(objectIdParamSchema),
  validateBody(updateStoreSchema),
  OwnerController.updateStore
);

router.delete(
  '/stores/:id',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateParams(objectIdParamSchema),
  OwnerController.deleteStore
);

export default router;


import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import { ownerRatingsQuerySchema, ownerAnalyticsQuerySchema } from '../validators/store.validator';

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

export default router;

import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import { ownerRatingsQuerySchema } from '../validators/store.validator';

const router = Router();

// Store Owner Dashboard
router.get('/dashboard', requireAuth, requireRole('STORE_OWNER'), OwnerController.getDashboard);

// Store Owner Customer Ratings list
router.get(
  '/ratings',
  requireAuth,
  requireRole('STORE_OWNER'),
  validateQuery(ownerRatingsQuerySchema),
  OwnerController.getRatings
);

export default router;

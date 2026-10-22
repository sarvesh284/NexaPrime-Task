import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { PhotoController } from '../controllers/photo.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import { objectIdParamSchema } from '../validators/store.validator';
import {
  adminCreateStoreSchema,
  adminUpdateStoreSchema,
  adminAssignOwnerSchema,
  adminUserQuerySchema,
  adminStoreQuerySchema,
  adminModerateReportSchema,
  adminReportQuerySchema,
  adminAuditQuerySchema,
} from '../validators/admin.validator';

const router = Router();

// Protect ALL admin routes with authentication and ADMIN role requirement
router.use(requireAuth, requireRole('ADMIN'));

// Platform KPIs & Analytics (A1 & A3)
router.get('/kpis', AdminController.getKpis);
router.get('/analytics', AdminController.getAnalytics);

// User Management
router.get('/users', validateQuery(adminUserQuerySchema), AdminController.getUsers);
router.patch('/users/:id/status', validateParams(objectIdParamSchema), AdminController.toggleUserStatus);

// Store Management
router.get('/stores', validateQuery(adminStoreQuerySchema), AdminController.getStores);
router.post('/stores', validateBody(adminCreateStoreSchema), AdminController.createStore);
router.patch(
  '/stores/:id',
  validateParams(objectIdParamSchema),
  validateBody(adminUpdateStoreSchema),
  AdminController.updateStore
);
router.post(
  '/stores/:id/assign-owner',
  validateParams(objectIdParamSchema),
  validateBody(adminAssignOwnerSchema),
  AdminController.assignOwner
);

// Review Moderation
router.get('/reports', validateQuery(adminReportQuerySchema), AdminController.getReports);
router.post(
  '/reports/:id/moderate',
  validateParams(objectIdParamSchema),
  validateBody(adminModerateReportSchema),
  AdminController.moderateReport
);

// Audit Logs
router.get('/audit-logs', validateQuery(adminAuditQuerySchema), AdminController.getAuditLogs);

// Photo Moderation (Admin Queue)
router.get('/photos', PhotoController.getReportedPhotos);
router.patch('/photos/:id/moderate', PhotoController.moderatePhoto);

export default router;

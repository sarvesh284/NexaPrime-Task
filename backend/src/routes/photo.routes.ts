import { Router } from 'express';
import { PhotoController } from '../controllers/photo.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Authenticated user's photos
router.get('/my-photos', requireAuth, PhotoController.getMyPhotos);

// Delete an authorized photo
router.delete('/:id', requireAuth, PhotoController.deletePhoto);

// Report photo
router.post('/:id/report', requireAuth, PhotoController.reportPhoto);

export default router;

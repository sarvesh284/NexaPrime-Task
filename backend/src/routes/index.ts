import { Router } from 'express';
import authRoutes from './auth.routes';
import storeRoutes from './store.routes';
import ownerRoutes from './owner.routes';
import healthRoutes from './health.routes';
import docsRoutes from './docs.routes';
import notificationRoutes from './notification.routes';
import photoRoutes from './photo.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/stores', storeRoutes);
apiRouter.use('/owner', ownerRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/photos', photoRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/docs', docsRoutes);

export default apiRouter;

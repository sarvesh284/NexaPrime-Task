import { Router } from 'express';
import authRoutes from './auth.routes';
import storeRoutes from './store.routes';
import ownerRoutes from './owner.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';
import docsRoutes from './docs.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/stores', storeRoutes);
apiRouter.use('/owner', ownerRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/docs', docsRoutes);

export default apiRouter;

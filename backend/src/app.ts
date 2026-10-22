import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRouter from './routes';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import { csrfProtection } from './middleware/csrf.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export const createApp = (): Application => {
  const app: Application = express();

  // Security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to load its assets
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration with explicit origin and credentials
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // Cookie parser
  app.use(cookieParser());

  // Body parsers with size limit
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // General rate limiting
  app.use('/api', generalRateLimiter);

  // CSRF protection for state-changing endpoints
  app.use('/api', csrfProtection);

  // Serve static uploaded assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Mount API v1
  app.use('/api/v1', apiRouter);

  // Root welcome / discovery
  app.get('/', (_req, res) => {
    res.json({
      name: 'Store Rating Platform API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      status: '/api/v1/health/ready',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

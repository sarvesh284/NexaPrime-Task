import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Store Rating Platform API',
    version: '2.0.0',
    description: 'Production-ready REST API for the Store Rating Web Application with role-based access control (USER, STORE_OWNER, ADMIN), review comments & moderation, email verification, password reset, advanced owner analytics, and Bayesian rating discovery.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'STORE_OWNER', 'ADMIN'] },
          isEmailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Store: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          category: { type: 'string' },
          city: { type: 'string' },
          averageRating: { type: 'number' },
          bayesianRating: { type: 'number' },
          ratingCount: { type: 'integer' },
          isFavorite: { type: 'boolean' },
          myRating: { type: 'integer', nullable: true },
        },
      },
      RatingInput: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', maxLength: 500, example: 'Outstanding quality and service!' },
        },
      },
      ReportInput: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string', enum: ['INAPPROPRIATE', 'SPAM', 'OFFENSIVE', 'SUSPICIOUS', 'OTHER'] },
          details: { type: 'string', maxLength: 500 },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with credentials',
        tags: ['Authentication'],
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Send password reset email link',
        tags: ['Authentication'],
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset password with token',
        tags: ['Authentication'],
      },
    },
    '/auth/verify-email': {
      post: {
        summary: 'Verify email address with token',
        tags: ['Authentication'],
      },
    },
    '/stores': {
      get: {
        summary: 'Get stores with category, city, minRating, and Bayesian sort',
        tags: ['Stores'],
      },
    },
    '/stores/filter-options': {
      get: {
        summary: 'Get unique categories and cities',
        tags: ['Stores'],
      },
    },
    '/stores/favorites': {
      get: {
        summary: 'Get user favorites list',
        tags: ['Stores'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/stores/{id}/reviews': {
      get: {
        summary: 'Get store reviews with star distribution breakdown',
        tags: ['Reviews'],
      },
    },
    '/stores/{id}/rating': {
      put: {
        summary: 'Submit or update rating with written comment',
        tags: ['Reviews'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/stores/reviews/{reviewId}/helpful': {
      post: {
        summary: 'Toggle helpful vote on a review',
        tags: ['Reviews'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/stores/reviews/{reviewId}/report': {
      post: {
        summary: 'Report an inappropriate review',
        tags: ['Reviews'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/owner/dashboard': {
      get: {
        summary: 'Store owner dashboard overview',
        tags: ['Store Owner'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/owner/analytics': {
      get: {
        summary: 'Advanced owner analytics with date ranges and trends',
        tags: ['Store Owner'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/owner/ratings/export': {
      get: {
        summary: 'Export owner ratings to CSV with formula injection defense',
        tags: ['Store Owner'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/kpis': {
      get: {
        summary: 'Platform-wide KPIs for Admin Dashboard',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/users': {
      get: {
        summary: 'Paginated user management list',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/users/{id}/status': {
      patch: {
        summary: 'Deactivate or reactivate user account',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/stores': {
      get: {
        summary: 'Paginated stores list for admin',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
      post: {
        summary: 'Create store and assign owner',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/stores/{id}/assign-owner': {
      post: {
        summary: 'Assign or reassign store owner',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/reports': {
      get: {
        summary: 'List reported reviews for moderation',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/reports/{id}/moderate': {
      post: {
        summary: 'Moderate report (HIDE_REVIEW, DISMISS, RESTORE_REVIEW)',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
    '/admin/audit-logs': {
      get: {
        summary: 'View platform administrative audit logs',
        tags: ['Admin'],
        security: [{ cookieAuth: [] }],
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;

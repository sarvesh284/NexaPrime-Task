import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Store Rating Platform API',
    version: '1.0.0',
    description: 'Production-ready REST API for the Store Rating Web Application with role-based access, rating discovery, and owner analytics.',
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
          name: { type: 'string', minLength: 20, maxLength: 60 },
          email: { type: 'string', format: 'email' },
          address: { type: 'string', maxLength: 400 },
          role: { type: 'string', enum: ['USER', 'STORE_OWNER'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Store: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          averageRating: { type: 'number', example: 4.5 },
          ratingCount: { type: 'integer', example: 12 },
          myRating: { type: 'integer', nullable: true, example: 5 },
        },
      },
      RatingInput: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user (always creates normal USER role)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'address'],
                properties: {
                  name: { type: 'string', minLength: 20, maxLength: 60, example: 'Christopher Columbus Explorer' },
                  email: { type: 'string', format: 'email', example: 'columbus@example.com' },
                  password: { type: 'string', minLength: 8, maxLength: 16, example: 'Pass@1234' },
                  address: { type: 'string', maxLength: 400, example: '123 Discovery Boulevard, Suite 400' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully and cookie set' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'sarvesh.user@example.com' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, sets HttpOnly auth cookie' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Log out user and clear auth cookie',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user session',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Current user session data' },
          401: { description: 'Unauthorized / expired session' },
        },
      },
    },
    '/stores': {
      get: {
        summary: 'Get paginated list of active stores with search and sorting',
        tags: ['Stores'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['name', 'averageRating', 'ratingCount', 'createdAt'], default: 'name' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
        ],
        responses: {
          200: { description: 'Stores retrieved successfully' },
        },
      },
    },
    '/stores/{id}': {
      get: {
        summary: 'Get store details by ID',
        tags: ['Stores'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Store details' },
          404: { description: 'Store not found' },
        },
      },
    },
    '/stores/{id}/my-rating': {
      get: {
        summary: 'Get authenticated user rating for store',
        tags: ['Stores'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User rating data' },
        },
      },
    },
    '/stores/{id}/rating': {
      put: {
        summary: 'Submit or update rating for a store (1-5 integer)',
        tags: ['Ratings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RatingInput' },
            },
          },
        },
        responses: {
          200: { description: 'Rating updated successfully' },
          400: { description: 'Invalid rating value' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/owner/dashboard': {
      get: {
        summary: 'Get store owner analytics dashboard',
        tags: ['Store Owner'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Owner dashboard analytics data' },
          403: { description: 'Forbidden: Requires STORE_OWNER role' },
        },
      },
    },
    '/owner/ratings': {
      get: {
        summary: 'Get paginated customer ratings for owner stores',
        tags: ['Store Owner'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'storeId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'value', 'storeName'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: { description: 'List of customer ratings' },
          403: { description: 'Forbidden: Store does not belong to owner' },
        },
      },
    },
    '/health/live': {
      get: {
        summary: 'Liveness check',
        tags: ['Health'],
        responses: {
          200: { description: 'Service is live' },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Readiness check with database connection status',
        tags: ['Health'],
        responses: {
          200: { description: 'Service is ready and database is connected' },
          503: { description: 'Database disconnected' },
        },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;

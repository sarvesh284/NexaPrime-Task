# Store Rating Platform — Production-Ready Full-Stack Web Application

A secure, scalable, and responsive full-stack Store Rating Web Application engineered for the developer internship challenge. The platform empowers regular users to discover registered stores and submit 1–5 star ratings, while providing store owners with real-time business analytics, score distributions, and customer feedback logs.

---

## 🌟 Key Features

### For Normal Users
- **Browse & Search:** Discover registered, active stores with debounced keyword search.
- **Dynamic Sorting:** Sort stores by Name (A–Z / Z–A), Average Rating (High/Low), and Total Rating Count.
- **Strict 1–5 Star Rating:** Submit integer ratings from 1 to 5 with real-time feedback and descriptive sentiment labels.
- **Atomic Rating Updates:** Easily modify an existing rating; updates preserve a single rating document per user per store.
- **Personalized Store State:** View your own rating on each store card and detail page alongside the community average score.

### For Store Owners
- **Owner Analytics Dashboard:** Monitor owned stores in a private, role-protected dashboard.
- **Summary Metrics:** Total stores managed, overall cumulative average rating, and total customer ratings received.
- **Rating Distribution Visualizer:** Visual distribution breakdown across 5-star, 4-star, 3-star, 2-star, and 1-star ratings.
- **Customer Ratings Table:** Paginated customer review logs displaying Customer Name, Email, Store Name, Rating Value, and Date.
- **Filter & Search:** Filter ratings by specific owned store or search by customer name/email.
- **Role Isolation:** Enforced authorization ensures owners cannot access analytics or ratings for stores they do not own.

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | Modern React server & client components with streaming and SEO optimization. |
| **Frontend Styling** | **Tailwind CSS** | Sleek dark-mode aesthetic with custom animations and responsive layouts. |
| **Form Management** | **React Hook Form + Zod** | Declarative form handling with client-side validation mirroring backend rules. |
| **Icons** | **Lucide React** | Lightweight, accessible, consistent modern icons. |
| **Backend Framework** | **Node.js + Express.js** | Fast, robust, unopinionated REST API. |
| **Language** | **TypeScript (Strict Mode)** | Full end-to-end type safety across both frontend and backend. |
| **Database** | **MongoDB Atlas + Mongoose** | Document database with compound indexing and aggregation pipelines. |
| **Security & Auth** | **JWT in HttpOnly Cookies** | Secure token storage in HttpOnly, SameSite cookies with bcrypt hashing (12 rounds). |
| **API Security** | **Helmet, CORS, Rate Limit** | Request body size limits, CORS origin protection, CSRF headers, and rate limiting. |
| **API Documentation** | **Swagger UI / OpenAPI 3.0** | Interactive API documentation accessible at `/api/v1/docs`. |
| **Automated Testing** | **Vitest + Supertest** | 29 integration and unit tests covering auth, stores, ratings, and owner permissions. |

---

## 📂 Project Structure

```text
nexaprime-project/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (lint, test, build)
├── backend/
│   ├── src/
│   │   ├── config/            # Environment validation (Zod) & MongoDB connection
│   │   │   ├── env.ts
│   │   │   └── db.ts
│   │   ├── controllers/       # HTTP controllers (auth, store, rating, owner, health)
│   │   ├── services/          # Business logic & MongoDB aggregation pipelines
│   │   ├── models/            # Mongoose schemas (User, Store, Rating)
│   │   ├── routes/            # Express routes mounted under /api/v1
│   │   ├── middleware/        # Auth, role check, Zod validator, rate limiter, CSRF, error handler
│   │   ├── validators/        # Zod input schemas (register, login, rating, query)
│   │   ├── utils/             # JWT, password hashing, standard API response
│   │   ├── types/             # Backend TypeScript interfaces
│   │   ├── scripts/           # Safe database seed script (seed.ts)
│   │   ├── app.ts             # Express application factory
│   │   └── server.ts          # Server entrypoint with graceful shutdown
│   ├── tests/                 # Supertest integration test suites
│   │   ├── setup.ts
│   │   ├── auth.test.ts
│   │   ├── store.test.ts
│   │   ├── rating.test.ts
│   │   └── owner.test.ts
│   ├── .env.example
│   ├── render.yaml            # Render deployment blueprint
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── page.tsx       # Landing page with hero & store showcase
│   │   │   ├── login/         # Sign-in page with 1-click demo login
│   │   │   ├── register/      # Registration page with live rule checklists
│   │   │   ├── stores/        # Store directory & [id] detail page
│   │   │   ├── owner/         # Store owner analytics dashboard
│   │   │   ├── layout.tsx     # Root layout with providers & navigation
│   │   │   └── not-found.tsx  # Custom 404 page
│   │   ├── components/        # Reusable UI components (Navbar, Footer, StarRating, Modal, Toast)
│   │   ├── context/           # Session-aware AuthContext
│   │   ├── lib/               # Reusable API fetch client with CSRF defense
│   │   └── types/             # Frontend TypeScript interfaces
│   ├── .env.example
│   ├── vercel.json            # Vercel deployment configuration
│   ├── tsconfig.json
│   └── package.json
├── .gitignore
├── package.json               # Monorepo root helper scripts
└── README.md
```

---

## 🔒 Security Architecture

1. **HttpOnly Cookie Authentication:** Authentication tokens are stored inside `HttpOnly`, `SameSite=Lax` cookies, preventing XSS access to tokens.
2. **Password Security:** Salted and hashed using `bcryptjs` with 12 rounds. Password hashes are excluded by default via Mongoose `{ select: false }` and `toJSON` transforms.
3. **Strict Privilege Separation:**
   - Public registration **always** creates a `USER` account. Client-supplied role or store IDs are strictly rejected.
   - Store Owner accounts can only be created via controlled provisioning or seed scripts.
   - Store owners cannot rate stores (`403 Forbidden`).
   - Normal users cannot access owner dashboard endpoints (`403 Forbidden`).
   - Store owners can only view ratings and analytics for stores they own (verified by session `ownerId`).
4. **NoSQL Injection Defense:** All queries sanitize inputs with typed Mongoose models and Zod schema validations.
5. **CSRF Protection:** State-changing requests enforce trusted origin checks and custom `X-Requested-With` headers.
6. **Rate Limiting:** Auth endpoints (`/auth/login`, `/auth/register`) are rate-limited to mitigate credential stuffing and brute-force attacks.
7. **Production Error Masking:** Centralized error handler catches duplicate keys (`E11000`), validation errors, and never exposes stack traces in production.

---

## 📋 Validation Rules Matrix

| Field | Rule | Backend Enforcement | Frontend Enforcement |
| :--- | :--- | :--- | :--- |
| **Name** | Required, 20–60 chars, trimmed, non-empty | Zod `.trim().min(20).max(60)` | React Hook Form + Zod + Live char counter |
| **Email** | Required, valid format, trimmed, lowercase, unique | Zod `.email()`, MongoDB unique index | React Hook Form + Zod |
| **Address** | Required, max 400 chars, trimmed | Zod `.trim().max(400)` | React Hook Form + Zod + Char counter |
| **Password** | 8–16 chars, 1+ uppercase letter, 1+ special character | Regex `^(?=.*[A-Z])(?=.*[!@#$%^&*...]).{8,16}$` | Interactive live visual checklist |
| **Rating** | Integer 1 to 5 only | Zod `.int().min(1).max(5)` | 5-star interactive picker |

---

## 🔑 Demo Accounts

The database includes pre-configured demo accounts for testing:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Normal User** | `sarvesh.user@example.com` | `Password@123` | Can browse stores, submit ratings (1–5), update ratings. |
| **Store Owner** | `sarvesh.owner@example.com` | `Password@123` | Owns 4 establishments; has access to the owner dashboard. |
| **Reviewer** | `reviewer@example.com` | `Password@123` | Independent community reviewer account. |

> **Tip:** The `/login` page includes **1-Click Demo Login** buttons for instant access without manual typing.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js:** v18.x or later (v20+ or v22+ recommended)
- **MongoDB:** Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI
- **Git**

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/sarvesh284/NexaPrime-Task.git
cd NexaPrime-Task
```

Configure backend environment:
```bash
cp backend/.env.example backend/.env
```

Configure frontend environment:
```bash
cp frontend/.env.example frontend/.env.local
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install --legacy-peer-deps
cd ..
```

### 3. Seed Database
Run the seed script to initialize stores, demo users, and realistic ratings:
```bash
npm run seed
# Or from backend directory:
cd backend && npm run seed
```

### 4. Start Development Servers
Run the backend and frontend simultaneously:

**Terminal 1 (Backend - Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend - Port 3000):**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:3000** in your browser.
API Swagger documentation is available at **http://localhost:5000/api/v1/docs**.

---

## 🧪 Automated Testing

The backend includes a comprehensive Vitest test suite using Supertest and an isolated MongoDB test database.

Run tests:
```bash
cd backend
npm test
```

### Test Coverage Summary:
- **Authentication:** Registration, password complexity, duplicate rejection, role tampering immunity, login, wrong password, inactive account rejection, logout.
- **Store Discovery:** Active filtering, inactive store exclusion, zero-rating states, personal rating attachment, search by name, dynamic sorting, single store lookup, 404/400 validation.
- **Ratings:** 1–5 integer validation, fractional/zero/string/overflow rejection, initial rating creation, concurrency-safe upsert without duplicate documents, owner rating denial.
- **Owner Analytics:** Dashboard aggregation restricted to owned stores, normal user 403 denial, customer rating logs with customer name/email, storeId isolation.

---

## 🌐 API Documentation

Base URL: `/api/v1`

### Authentication
- `POST /auth/register` — Register a new normal user account.
- `POST /auth/login` — Sign in and receive HttpOnly session cookie.
- `POST /auth/logout` — Invalidate session and clear auth cookie.
- `GET /auth/me` — Retrieve active authenticated session.

### Stores & Ratings
- `GET /stores` — Query stores with `search`, `page`, `limit`, `sort`, `order`.
- `GET /stores/:id` — Retrieve store details and rating statistics.
- `GET /stores/:id/my-rating` — Retrieve user's personal rating for the store.
- `PUT /stores/:id/rating` — Submit or update rating (`{ "rating": 5 }`).

### Store Owner Portal
- `GET /owner/dashboard` — Analytics KPIs, overall average, and 1–5 star distribution.
- `GET /owner/ratings` — Paginated customer rating logs for owned stores.

### Health & Monitoring
- `GET /health/live` — Liveness probe.
- `GET /health/ready` — Readiness probe (validates active MongoDB connection).
- `GET /docs` — Interactive Swagger UI.

---

## 🚢 Deployment Guide

### Frontend on Vercel
1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: URL of the deployed Render backend (e.g. `https://store-rating-api.onrender.com/api/v1`).
4. Deploy.

### Backend on Render
1. Create a new **Web Service** on Render connected to this repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm ci && npm run build`
4. Start Command: `npm start`
5. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: MongoDB Atlas connection string.
   - `JWT_SECRET`: High-entropy 32+ character random string.
   - `FRONTEND_URL`: URL of your deployed Vercel frontend.
   - `COOKIE_NAME`: `auth_token`
   - `COOKIE_SAME_SITE`: `none` (for cross-domain cookies between Render & Vercel)
   - `COOKIE_SECURE`: `true`
6. Set Health Check Path to `/api/v1/health/live`.

### Database on MongoDB Atlas
1. Create a free M0 cluster on MongoDB Atlas.
2. In **Network Access**, add `0.0.0.0/0` (allow Render backend IPs).
3. In **Database Access**, create a user with `readWriteAnyDatabase` permissions.
4. Copy the connection string to `MONGODB_URI`.
5. Run `npm run seed` once against the Atlas URI to initialize sample data.

---

## 📄 License
This project is developed for the NexaPrime Full-Stack Developer Internship Challenge.

# Store Rating Platform — Enterprise Full-Stack Web Application

A secure, high-performance, and responsive full-stack Store Rating Web Application engineered with enterprise-grade architecture. The platform empowers consumers to discover stores, submit 1–5 star ratings with written feedback, vote on helpful reviews, and manage personal wishlists. Store owners gain deep operational visibility through interactive daily trend analytics, rating distributions, and formula-injection-safe CSV exports. Platform administrators control system integrity via platform KPIs, user account management, store creation & owner assignment, review moderation, and tamper-resistant administrative audit logging.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC) & Platform Admin (Feature A)
- **Three-Tier Role Hierarchy:** Enforces strict role boundaries (`USER`, `STORE_OWNER`, `ADMIN`) across all API routes and frontend navigations.
- **Admin Control Console:**
  - **Platform-Wide KPIs:** Live metrics for Total Registered Users, Total Store Owners, Total Active Stores, Total Ratings Submitted, and Cumulative Platform Average.
  - **User Management:** Paginated user directory with search by name/email, filtering by role and account status, and account deactivation/reactivation toggles (with built-in self-deactivation protection).
  - **Store Management & Assignment:** Create new stores with category and city attributes, update store profiles, toggle active status, and assign/reassign store ownership to verified store owners.
  - **Content Moderation Queue:** Review reported ratings with reasons (`SPAM`, `OFFENSIVE`, `HARASSMENT`, `CONFLICT_OF_INTEREST`, `OTHER`), with one-click actions to Hide Review (auto-resolving reports and adjusting store rating aggregates), Dismiss Report, or Restore Review.
  - **Audit Logging:** Every administrative action is automatically logged with actor ID, email, role, action type, target entity, target ID, client IP, user agent, timestamp, and metadata. Secrets, passwords, and tokens are strictly excluded from audit logs.

### 2. Written Review Comments & Content Moderation (Feature B)
- **Written Feedback:** Optional written comments up to 500 characters accompanied by a live character counter and client/server validation.
- **Atomic Rating Updates:** Submitting an updated rating updates the existing record rather than creating a duplicate document, ensuring strict one-rating-per-user-per-store integrity.
- **Review Feed & Star Distribution:** Displays rating value, written comment, submission date, and user display name, alongside a visual 1–5 star rating distribution breakdown.
- **Review Reporting Workflow:** Authenticated users can report inappropriate reviews with a designated reason. Duplicate reports on the same review by the same user are rejected (`409 Conflict`).
- **Review Moderation Policy:** Moderated or hidden reviews are automatically excluded from public listings and store rating aggregate calculations.

### 3. Account Security, Email Verification & Password Recovery (Feature C)
- **Cryptographic Email Verification:** Accounts receive a SHA-256 hashed verification token valid for 24 hours. Accounts are marked verified only after clicking the link.
- **Self-Service Password Reset:**
  - Forgot password endpoint generates a 1-hour expiration SHA-256 hashed token.
  - Generic responses prevent email enumeration attacks (`200 OK` regardless of whether the email is registered).
  - Interactive password reset interface with real-time visual rule checklists.
- **Immediate Session Invalidation:** Resetting a password increments the user's `tokenVersion`, instantly invalidating all existing JWT cookies across all browsers and devices.
- **Configurable Email Delivery:** Backed by Nodemailer with configurable SMTP credentials. In local development or testing without SMTP credentials, verification and reset links are safely emitted to the console without crashing or failing account workflows.

### 4. Advanced Store Owner Analytics & Reporting (Feature D)
- **Scoped Store Owner Dashboard:** Restricts all metrics and ratings strictly to establishments owned by the authenticated user (`ownerId` verification).
- **Comprehensive KPI Overview:** Total stores managed, total visible customer ratings, overall average store score, and star breakdown (1 to 5 stars).
- **Interactive Daily Trend Charts:** Visual bar chart rendering rating volume and score progression over selectable date ranges (Last 7 Days, Last 30 Days, Last 90 Days, or All Time).
- **Multi-Store & Star Filters:** Filter analytics and rating tables by specific owned stores and rating star values.
- **Formula-Injection-Safe CSV Export:** One-click CSV export of customer rating logs applying all active filters. Protects against spreadsheet formula injection by sanitizing cells starting with `=`, `+`, `-`, `@`, or `\t`.

### 5. Rating Quality & Store Discovery Enhancements (Features E & F)
- **Bayesian Adjusted Rating Score:** Optional Bayesian-weighted rating score calculated to prevent newly registered stores with one 5-star rating from outranking established favorites:
  $$\text{Adjusted Rating} = \left(\frac{v}{v + m}\right) \times R + \left(\frac{m}{v + m}\right) \times C$$
  Where $R$ is the store average, $v$ is the eligible rating count, $C$ is the platform average (defaults to 3.0), and $m$ is the minimum confidence threshold ($m = 5$).
- **Helpful Review Voting:** Authenticated users can upvote helpful reviews with an atomic toggle (vote/unvote). Users are prevented from voting on their own reviews.
- **Multi-Attribute Store Discovery:** Filter stores by Category (e.g., Grocery, Electronics, Cafe, Books, Health), City (e.g., San Francisco, New York, Seattle, Austin), and Minimum Rating (1+ to 5 stars).
- **Personal Wishlist / Favorites:** Authenticated users can favorite stores with instant toggle from store cards and manage them on a dedicated `/favorites` page.
- **Search & Sorting:** Debounced search by store name and dynamic sorting by Name, Average Rating, Rating Count, or Bayesian Recommended Score.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern React 19 server & client components with Turbopack, static prerendering, and partial prerendering. |
| **Frontend Styling** | **Tailwind CSS v4** | Sleek dark-mode aesthetic with responsive layouts, accessible color contrast, and custom CSS variables. |
| **Icons & UI** | **Lucide React** | Accessible, lightweight icon system. |
| **Forms & Validation** | **React Hook Form + Zod** | Client-side validation mirroring backend schema rules with live character counters and visual checklists. |
| **Backend Framework** | **Node.js + Express.js** | Modular architecture with strict controller-service-model separation. |
| **Language** | **TypeScript (Strict Mode)** | 100% type safety across frontend and backend codebases. |
| **Database & ODM** | **MongoDB + Mongoose** | Schema validation, compound indexing, aggregation pipelines, and atomic updates. |
| **Authentication** | **JWT in HttpOnly Cookies** | Secure token storage in `HttpOnly`, `SameSite=Lax`, and `Secure` cookies with 12-round `bcryptjs` hashing. |
| **Session Control** | **Token Version Invalidation** | Integer `tokenVersion` stored in user records; incrementing revokes all issued tokens across devices. |
| **Email Service** | **Nodemailer** | SMTP transporter with development console fallback for headless local verification and password recovery. |
| **API Documentation** | **Swagger UI / OpenAPI 3.0** | Interactive API documentation accessible at `/api/v1/docs`. |
| **Automated Testing** | **Vitest + Supertest** | 52 automated tests in 9 test suites covering auth, discovery, ratings, reviews, owner, admin, and email recovery. |
| **Deployment** | **Vercel + Render + Atlas** | Configured for Vercel (Frontend), Render (Backend), and MongoDB Atlas (Database). |

---

## 📂 Project Architecture

```text
nexaprime-project/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (lint, test, build)
├── backend/
│   ├── src/
│   │   ├── config/            # Zod environment validation & MongoDB connection
│   │   │   ├── env.ts
│   │   │   └── db.ts
│   │   ├── controllers/       # HTTP controllers (auth, store, rating, owner, admin, health)
│   │   ├── services/          # Business logic, aggregation pipelines, email, audit logging
│   │   │   ├── admin.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── owner.service.ts
│   │   │   ├── rating.service.ts
│   │   │   └── store.service.ts
│   │   ├── models/            # Mongoose models (User, Store, Rating, Report, AuditLog)
│   │   │   ├── user.model.ts
│   │   │   ├── store.model.ts
│   │   │   ├── rating.model.ts
│   │   │   ├── report.model.ts
│   │   │   └── auditLog.model.ts
│   │   ├── routes/            # Express routers mounted under /api/v1
│   │   │   ├── admin.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── docs.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   ├── owner.routes.ts
│   │   │   ├── rating.routes.ts
│   │   │   └── store.routes.ts
│   │   ├── middleware/        # Auth, role check, rate limiting, csrf, error handler
│   │   ├── validators/        # Zod input validation schemas
│   │   ├── utils/             # JWT, password hashing, standard responses
│   │   ├── types/             # TypeScript definitions
│   │   ├── scripts/           # Seed script (seed.ts)
│   │   ├── app.ts             # Express application factory
│   │   └── server.ts          # Server entrypoint with graceful shutdown
│   ├── tests/                 # Supertest integration test suites
│   │   ├── setup.ts
│   │   ├── admin.test.ts
│   │   ├── auth.test.ts
│   │   ├── discovery.test.ts
│   │   ├── e2e.workflow.test.ts
│   │   ├── email.test.ts
│   │   ├── owner.test.ts
│   │   ├── rating.test.ts
│   │   ├── review.test.ts
│   │   └── store.test.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── page.tsx       # Landing page with hero & store showcase
│   │   │   ├── login/         # Sign-in page with 1-click demo login & forgot password link
│   │   │   ├── register/      # Registration page with live rule checklist
│   │   │   ├── forgot-password/# Password recovery request page
│   │   │   ├── reset-password/ # Password reset confirmation page with live checklist
│   │   │   ├── verify-email/  # Account email verification confirmation page
│   │   │   ├── favorites/     # User store favorites/wishlist page
│   │   │   ├── stores/        # Store discovery directory & [id] detail page
│   │   │   ├── owner/dashboard/# Store owner analytics, charts & CSV export
│   │   │   └── admin/         # Admin portal (dashboard, users, stores, reports, audit logs)
│   │   ├── components/        # UI components (Navbar, Footer, RatingModal, StoreCard, Toast, StarRating)
│   │   ├── context/           # Session-aware AuthContext
│   │   ├── lib/               # Reusable API fetch client with CSRF defense
│   │   └── types/             # Frontend TypeScript interfaces
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
├── .gitignore
├── package.json               # Monorepo root helper scripts
└── README.md
```

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Feature / Action | `USER` | `STORE_OWNER` | `ADMIN` |
| :--- | :---: | :---: | :---: |
| Browse Active Stores & View Details | ✅ | ✅ | ✅ |
| Filter by Category, City, & Rating | ✅ | ✅ | ✅ |
| Toggle Store Favorites / Wishlist | ✅ | ✅ | ✅ |
| Submit / Modify Store Rating (1–5) | ✅ | ❌ (*Forbidden*) | ❌ (*Forbidden*) |
| Add Written Review Comment (500 chars) | ✅ | ❌ (*Forbidden*) | ❌ (*Forbidden*) |
| Vote Helpful on Customer Reviews | ✅ | ✅ | ✅ |
| Report Inappropriate Reviews | ✅ | ✅ | ✅ |
| Verify Email & Reset Password | ✅ | ✅ | ✅ |
| Access Store Owner Dashboard | ❌ (*Forbidden*) | ✅ | ❌ (*Forbidden*) |
| View Rating Trends & Distributions | ❌ (*Forbidden*) | ✅ | ❌ (*Forbidden*) |
| Export Owner Ratings as CSV | ❌ (*Forbidden*) | ✅ | ❌ (*Forbidden*) |
| Access Admin Management Portal | ❌ (*Forbidden*) | ❌ (*Forbidden*) | ✅ |
| View Platform-Wide KPIs & Audit Logs | ❌ (*Forbidden*) | ❌ (*Forbidden*) | ✅ |
| Activate / Deactivate User Accounts | ❌ (*Forbidden*) | ❌ (*Forbidden*) | ✅ |
| Create Stores & Assign Store Owners | ❌ (*Forbidden*) | ❌ (*Forbidden*) | ✅ |
| Moderate Reports (Hide / Restore Reviews) | ❌ (*Forbidden*) | ❌ (*Forbidden*) | ✅ |

---

## 📋 Input Validation Matrix

| Field | Rule | Backend Enforcement | Frontend Enforcement |
| :--- | :--- | :--- | :--- |
| **Name** | Required, 20–60 chars, trimmed | Zod `.trim().min(20).max(60)` | React Hook Form + live char counter |
| **Email** | Required, valid email format, trimmed, lowercase, unique | Zod `.email()`, MongoDB unique index | React Hook Form + email validation |
| **Address** | Required, max 400 chars, trimmed | Zod `.trim().max(400)` | React Hook Form + char counter |
| **Password** | 8–16 chars, 1+ uppercase letter, 1+ special character | Regex `^(?=.*[A-Z])(?=.*[!@#$%^&*...]).{8,16}$` | Interactive live checklist |
| **Rating** | Integer 1 to 5 only | Zod `.int().min(1).max(5)` | 5-star interactive picker |
| **Comment** | Optional, max 500 chars, trimmed, sanitized | Zod `.trim().max(500).optional()` | Textarea with live 500-char counter |
| **Report Reason** | Enum (`SPAM`, `OFFENSIVE`, `HARASSMENT`, `CONFLICT_OF_INTEREST`, `OTHER`) | Zod `.enum(...)` | Selection dropdown with reason options |
| **Category** | Optional store category (e.g., Grocery, Cafe, Books) | Zod `.trim().max(50).optional()` | Dropdown filter & modal input |
| **City** | Optional store city (e.g., San Francisco, New York) | Zod `.trim().max(100).optional()` | Dropdown filter & modal input |

---

## 🔑 Pre-Configured Demo Accounts

The database includes ready-to-test accounts for every role:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `sarvesh.admin@example.com` | `Password@123` | Full administrative control, KPI dashboard, moderation queue, audit logs. |
| **Store Owner** | `sarvesh.owner@example.com` | `Password@123` | Owns 4 establishments; has access to owner analytics, trends, and CSV export. |
| **Normal User** | `sarvesh.user@example.com` | `Password@123` | Normal consumer; can browse stores, rate 1–5, write comments, upvote reviews. |
| **Reviewer** | `reviewer@example.com` | `Password@123` | Independent community reviewer account with sample ratings and comments. |

> **Tip:** The `/login` page includes **1-Click Demo Login** buttons for instant access to Admin, Store Owner, or User accounts without typing!

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
Run the seed script to initialize stores, demo users across all roles, categories, cities, realistic ratings, review comments, and moderation reports:
```bash
npm run seed
# Or from backend directory:
cd backend && npm run seed
```

### 4. Start Development Servers
Run backend and frontend concurrently:

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

- Web Application: **http://localhost:3000**
- Interactive Swagger API Documentation: **http://localhost:5000/api/v1/docs**

---

## 🧪 Automated Testing

The backend includes a comprehensive Vitest test suite using Supertest and an isolated MongoDB test database.

Run tests:
```bash
cd backend
npm test
```

### Test Coverage (62 Tests Across 10 Suites):
1. **`auth.test.ts` (11 tests):** Registration, password complexity, duplicate rejection, role tampering immunity, login, wrong password rejection, inactive account rejection, session retrieval (`/auth/me`), and logout.
2. **`store.test.ts` (8 tests):** Active store filtering, inactive store exclusion, zero-rating states, personal rating attachment, search by name, dynamic sorting, single store lookup, 404/400 validation.
3. **`rating.test.ts` (6 tests):** 1–5 integer validation, fractional/zero/string/overflow rejection, initial rating creation, concurrency-safe upsert without duplicate documents, owner rating denial (`403 Forbidden`).
4. **`review.test.ts` (4 tests):** Rating submission with comments up to 500 characters, rejection of comments > 500 chars, self-voting prevention on helpful votes, review reporting and duplicate report rejection (`409 Conflict`).
5. **`owner.test.ts` (4 tests):** Dashboard aggregation restricted to owned stores, normal user 403 denial, customer rating logs with customer name/email, storeId isolation.
6. **`admin.test.ts` (7 tests):** Access restrictions (non-admins get 403), platform KPI calculations, user search and filtering, user status toggle and self-deactivation protection, store creation and audit log recording, review moderation (Hide Review and store aggregate adjustment).
7. **`email.test.ts` (3 tests):** Anti-enumeration generic forgot-password response, password reset with token validation and session revocation (`tokenVersion`), email verification with token validation and rejection of invalid/expired tokens.
8. **`discovery.test.ts` (8 tests):** Multi-filter discovery (category, city, min-rating), Bayesian adjusted rating calculation and sorting, store favorites toggle and retrieval, owner daily trend analytics, spreadsheet formula-injection-safe CSV export.
9. **`e2e.workflow.test.ts` (1 integration test):** Full-stack end-to-end integration test spanning registration, store creation, rating with comment, helpful voting, review reporting, admin moderation, and aggregate recalculation.
10. **`extended.features.test.ts` (10 tests):** Owner replies to reviews (R5 / O3), unauthorized owner reply rejection, reply deletion ($unset), store profile management (O2), user rating history (`/my-ratings/history`), recently viewed tracking (N5), trending stores ranking (N4), notification center reading/marking all read (N1), login history tracking (SEC4), and platform-wide growth analytics (A3).

---

## 🌐 API Endpoint Reference

Base URL: `/api/v1`

### Authentication & Account Recovery
- `POST /auth/register` — Register a new normal user account.
- `POST /auth/login` — Sign in, record login history, and receive HttpOnly session cookie.
- `POST /auth/logout` — Invalidate session and clear auth cookie.
- `GET /auth/me` — Retrieve active authenticated session.
- `GET /auth/login-history` — Retrieve recent device/IP login sessions (SEC4).
- `POST /auth/revoke-sessions` — Invalidate all active user sessions by incrementing `tokenVersion` (SEC3 / SEC4).
- `POST /auth/verify-email` — Verify account using token (`{ "token": "..." }`).
- `POST /auth/resend-verification` — Resend verification email (rate-limited).
- `POST /auth/forgot-password` — Request password reset email (anti-enumeration).
- `POST /auth/reset-password` — Reset password using token (`{ "token": "...", "password": "..." }`).

### Stores, Ratings & Reviews
- `GET /stores` — Query stores with `search`, `category`, `city`, `minRating`, `sort`, `order`, `page`, `limit`.
- `GET /stores/trending` — Top 6 trending stores ranked by recent community reviews (N4).
- `GET /stores/recently-viewed` — Authenticated user's recently viewed stores (N5).
- `DELETE /stores/recently-viewed` — Clear user's recently viewed store history.
- `GET /stores/my-ratings/history` — Paginated history of authenticated user's submitted reviews with store metadata (R4).
- `GET /stores/:id` — Retrieve store details with GPS coordinates, phone, website, description, and statistics.
- `POST /stores/:id/view` — Record store page view for authenticated user.
- `GET /stores/:id/reviews` — Paginated reviews with comments, helpful votes, owner replies, and author names.
- `GET /stores/:id/my-rating` — Retrieve user's personal rating and comment.
- `PUT /stores/:id/rating` — Submit or update rating with optional 500-char comment (`{ "rating": 5, "comment": "..." }`).
- `POST /stores/:id/favorite` — Toggle store favorite status.
- `GET /stores/favorites/my-favorites` — Retrieve authenticated user's favorite stores.
- `POST /ratings/:ratingId/helpful` — Toggle helpful vote on a review.
- `POST /ratings/:ratingId/report` — Report an inappropriate review (`{ "reason": "SPAM", "details": "..." }`).

### In-App Notification Center
- `GET /notifications` — Paginated in-app notifications with unread count.
- `PATCH /notifications/:id/read` — Mark an individual notification as read.
- `POST /notifications/mark-all-read` — Mark all unread notifications as read.

### Store Owner Portal
- `GET /owner/dashboard` — Summary KPIs, owned stores list, and 1–5 star distribution.
- `GET /owner/analytics` — Advanced analytics with daily trends and date range filtering (`7d`, `30d`, `90d`, custom).
- `GET /owner/ratings` — Paginated customer rating logs with customer name, email, and owner reply status.
- `POST /owner/ratings/:id/reply` — Submit or update owner reply to customer review (O3 / R5).
- `DELETE /owner/ratings/:id/reply` — Delete owner reply from a customer review.
- `PATCH /owner/stores/:id` — Update store profile details (name, description, phone, website, address) (O2).
- `GET /owner/export` — Download spreadsheet formula-injection-safe CSV export.

### Platform Administration (Admin Only)
- `GET /admin/kpis` — Platform-wide statistics (users, owners, stores, ratings, average).
- `GET /admin/analytics` — 30-day user growth, store creation trends, rating volume, leaderboards, and distribution (A3).
- `GET /admin/users` — Paginated user directory with search, role, and status filters.
- `PATCH /admin/users/:userId/status` — Toggle user active/deactivated status.
- `GET /admin/stores` — View all stores with rating metrics and owner details.
- `POST /admin/stores` — Create a new store with coordinates, category, and city.
- `PATCH /admin/stores/:storeId` — Update store details or toggle active status.
- `PATCH /admin/stores/:storeId/assign` — Assign store ownership to a verified store owner.
- `GET /admin/reports` — Review reported reviews moderation queue.
- `PATCH /admin/reports/:reportId/moderate` — Moderate review (`HIDE_REVIEW`, `RESTORE_REVIEW`, `DISMISS`).
- `GET /admin/audit-logs` — Administrative audit logs with pagination and filters.

### Health & Monitoring
- `GET /health/live` — Liveness probe.
- `GET /health/ready` — Readiness probe (validates active MongoDB connection).
- `GET /docs` — Interactive OpenAPI / Swagger UI.

---

## 🔒 Security Architecture

1. **HttpOnly Cookie Authentication:** JWT tokens are stored in `HttpOnly`, `SameSite=Lax`, and `Secure` cookies, eliminating script access to authentication tokens.
2. **Session Invalidation via `tokenVersion`:** Passwords and account revocations increment `tokenVersion`, instantly invalidating existing tokens across all devices.
3. **Privilege Tampering Immunity:**
   - Public registration strictly enforces `role: USER`. Any client-supplied `role`, `isEmailVerified`, or privileged fields are ignored.
   - Profile updates cannot modify roles or ownership assignments.
   - Store owners cannot rate stores (`403 Forbidden`).
   - Normal users cannot access store owner or admin endpoints (`403 Forbidden`).
   - Admins cannot deactivate their own account, preventing lockout.
4. **Spreadsheet Formula Injection Defense:** CSV exports prefix cells starting with `=`, `+`, `-`, `@`, or `\t` with `'` to neutralize formula injection in Excel/Sheets.
5. **Anti-Enumeration Responses:** Password recovery requests return identical `200 OK` responses regardless of whether the submitted email address exists.
6. **NoSQL Injection Defense:** All queries sanitize inputs with typed Mongoose models and Zod schema validations.
7. **CSRF & Origin Protection:** State-changing requests enforce trusted origin checks and custom `X-Requested-With` headers.
8. **Rate Limiting:** Dedicated rate limiters protect `/auth/login`, `/auth/register`, `/auth/forgot-password`, and `/ratings/:id/report`.
9. **Production Error Masking:** Centralized error handling catches duplicate keys (`E11000`), Zod validation issues, and never exposes stack traces in production.

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
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: SMTP credentials for verification & recovery.
6. Set Health Check Path to `/api/v1/health/live`.

### Database on MongoDB Atlas
1. Create a free M0 cluster on MongoDB Atlas.
2. In **Network Access**, add `0.0.0.0/0` (allow Render backend IPs).
3. In **Database Access**, create a user with `readWriteAnyDatabase` permissions.
4. Copy the connection string to `MONGODB_URI`.
5. Run `npm run seed` once against the Atlas URI to initialize sample data.

---

## 💾 Database Backup & Disaster Recovery (T7)

### 1. MongoDB Database Backup (`mongodump`)
For self-hosted or dedicated staging MongoDB instances:
```bash
# Automated archive dump with gzip compression
mongodump --uri="mongodb://127.0.0.1:27017/store_rating_platform" --archive="backup-$(date +%Y%m%d_%H%M%S).gz" --gzip
```

For MongoDB Atlas deployments:
- **Continuous Cloud Backups:** Enable Atlas automated Point-In-Time Restore (PITR) snapshots configured at 6-hour intervals with 7-day retention.
- **Snapshot Verification:** Periodically trigger an on-demand snapshot in the Atlas console to confirm consistency before large migrations.

### 2. Database Restoration (`mongorestore`)
```bash
# Verify archive integrity and dry-run restore
mongorestore --uri="mongodb://127.0.0.1:27017/store_rating_platform_restore" --archive="backup-20261022.gz" --gzip --drop

# Verify restored indexes:
# - Rating: { user: 1, store: 1 } (Unique)
# - Store:  { name: 1, address: 1 } (Unique)
# - Notification: { userId: 1, isRead: 1, createdAt: -1 }
```

### 3. Recovery Objectives
- **RPO (Recovery Point Objective):** <= 6 hours (backed by Atlas PITR or automated daily dumps).
- **RTO (Recovery Time Objective):** <= 30 minutes to restore dump archive and redeploy container.

---

## 📱 Progressive Web App (PWA) & Accessibility (T5 & T6)
- **Web App Manifest:** Available at `/manifest.json`, providing standalone display mode, amber branding (`#f59e0b`), and dark background (`#09090b`).
- **WCAG 2.1 AA Compliance:**
  - High-contrast typography across dark-mode Tailwind color tokens.
  - Visible focus rings (`focus:outline-none focus:border-amber-400`).
  - Screen-reader aria attributes and semantic table headers (`<th>`, `<td>`).
  - Keyboard-navigable dialogs, dropdowns, and rating inputs.

---

## 📄 License
This project is developed for the NexaPrime Full-Stack Developer Internship Challenge.


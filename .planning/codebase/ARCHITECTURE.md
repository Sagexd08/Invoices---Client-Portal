# Architecture

**Analysis Date:** 2026-02-27

## Pattern Overview

**Overall:** Next.js App Router with server-side rendering and API routes

**Key Characteristics:**
- Role-based access control (RBAC) with dual authentication paths
- Server-side session management via NextAuth.js
- Prisma ORM with PostgreSQL (Neon serverless)
- Dual-tenant architecture: Company admins and Clients with different access patterns
- API-driven backend with REST endpoints handling business logic

## Layers

**Presentation Layer:**
- Purpose: Server-rendered React pages and client components
- Location: `app/` (Next.js App Router)
- Contains: Page components, layouts, and interactive components
- Depends on: API routes, authentication, Prisma queries
- Used by: End users via browser

**API Layer:**
- Purpose: RESTful endpoints for all business operations (invoices, clients, payments, requests)
- Location: `app/api/`
- Contains: Route handlers for POST/GET/PUT/DELETE operations
- Depends on: Prisma ORM, authentication middleware, business logic utilities
- Used by: Frontend pages, external webhooks (Razorpay)

**Business Logic Layer:**
- Purpose: Encapsulates domain operations and calculations
- Location: `lib/` (billing.ts, auth.ts, auth-helpers.ts, rbac.ts)
- Contains: Invoice generation, payment processing, role hierarchy, audit logging
- Depends on: Prisma ORM, external services (Razorpay)
- Used by: API routes and page components

**Data Access Layer:**
- Purpose: Database interaction and connection pooling
- Location: `lib/prisma.ts`
- Contains: Prisma client initialization with Neon serverless adapter
- Depends on: PostgreSQL (Neon), environment configuration
- Used by: All API routes and server components

**Authentication Layer:**
- Purpose: Session management and user authorization
- Location: `middleware.ts`, `lib/auth.ts`, `lib/auth-helpers.ts`
- Contains: NextAuth.js configuration, JWT callbacks, role enforcement
- Depends on: NextAuth.js, Prisma ORM, external providers (Google OAuth)
- Used by: All protected routes and API endpoints

## Data Flow

**Login Flow:**
1. User visits `/login` or protected route
2. NextAuth.js redirects to login page
3. Two authentication paths:
   - **Company Admin**: Google OAuth (oxifylabs.app domain only) via `GoogleProvider`
   - **Client**: Client ID credential lookup via `CredentialsProvider`
4. `callbacks.signIn()` validates credentials and creates/updates DB user record
5. `callbacks.jwt()` encodes role and clientId into JWT token
6. `callbacks.session()` exposes user metadata to session
7. User redirected to dashboard or requested resource

**Invoice View/Create Flow (Company):**
1. Request hits `GET /api/invoices` or `POST /api/invoices`
2. `getAuthUser()` validates session
3. Role check: `isCompanyRole()` verifies company_admin/project_manager/accountant
4. For GET: Query invoices with optional status filter, apply pagination
5. For POST: Validate client exists, calculate totals, generate invoice number, create invoice + lines
6. Audit log created via `audit()` function
7. Response returned with 201 status for POST

**Invoice Payment Flow:**
1. Client initiates payment via `POST /api/invoices/[id]/pay`
2. Invoice ownership verified (clientId matching)
3. Invoice status checked (not already paid)
4. Razorpay order created with amount in paise
5. Invoice updated with razorpayOrderId
6. Audit log recorded
7. Client receives order details to initiate payment UI
8. Webhook endpoint `POST /api/webhooks/razorpay` receives payment confirmation
9. Payment status updated in database

**Protected Route Access:**
1. Middleware (`middleware.ts`) intercepts requests to `/dashboard/*` and `/admin/*`
2. NextAuth middleware validates JWT token
3. If invalid/expired, redirects to `/login`
4. If valid, continues to page handler
5. Page-level checks use `getServerSession()` to verify role permissions
6. Client-only pages use `clientId` check; company pages check role hierarchy

**State Management:**
- Session state: JWT-based, stored in httpOnly cookies
- Database state: Prisma queries pull fresh data on each server render
- No client-side Redux or Zustand - server-side rendering handles data fetching
- Real-time updates: WebSocket support available (ws package included) but not yet implemented

## Key Abstractions

**Authentication User:**
- Purpose: Unified user representation across auth providers
- Examples: `lib/auth.ts` - `NextAuthOptions` configuration, `lib/auth-helpers.ts` - `AuthUser` type
- Pattern: NextAuth.js session callbacks normalize Google OAuth and Credentials provider users into consistent shape with `role`, `clientId`, `dbUserId`

**Role-Based Access Control (RBAC):**
- Purpose: Enforce user permissions based on hierarchy
- Examples: `lib/rbac.ts` defines role hierarchy and helper functions
- Pattern: `ROLE_HIERARCHY` object maps roles to numeric levels; `hasRole()` compares levels; `isCompanyUser()` and `isClientUser()` categorize user types

**Invoice Management:**
- Purpose: Generate and manage invoice lifecycle
- Examples: `lib/billing.ts` - invoice number generation, total calculation, audit logging
- Pattern: Utility functions handle formatting (INV-YYYY-00001), line item aggregation, and tax calculation

**Request Context:**
- Purpose: Represents user state during API request
- Examples: `lib/auth-helpers.ts` - `getAuthUser()`, `requireAuth()`
- Pattern: Async helpers extract and validate session, return typed user or error response

**Database Models:**
- Purpose: Define entity relationships and constraints
- Examples: `prisma/schema.prisma` - Client, User, Invoice, InvoiceLine, Payment, Request, Message, Attachment, AuditLog, Service
- Pattern: Prisma schema enforces relationships (Invoice → Client, User → Client, InvoiceLine → Invoice)

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: All requests to the application
- Responsibilities: Sets up HTML structure, configures metadata, wraps content

**Home Page (Router):**
- Location: `app/page.tsx`
- Triggers: Request to `/`
- Responsibilities: Checks authentication status; redirects authenticated users to `/dashboard` or unauthenticated to `/login`

**Login Page:**
- Location: `app/login/page.tsx`
- Triggers: Request to `/login` or auth redirect
- Responsibilities: Renders login form with Google OAuth and Client ID options

**Dashboard Layout (Protected):**
- Location: `app/dashboard/layout.tsx`
- Triggers: Request to `/dashboard/*` (middleware protected)
- Responsibilities: Validates session, loads user from database, renders sidebar with user context

**Dashboard Home:**
- Location: `app/dashboard/page.tsx`
- Triggers: Request to `/dashboard`
- Responsibilities: Loads appropriate dashboard based on role (company overview vs. client invoices/requests)

**Admin Interface:**
- Location: `app/admin/page.tsx`
- Triggers: Request to `/admin` (admin-only, protected by middleware)
- Responsibilities: Admin client management interface

**API Routes (Request Handlers):**
- Location: `app/api/[resource]/route.ts` (invoices, clients, requests, payments, etc.)
- Triggers: HTTP requests to `/api/*`
- Responsibilities: CRUD operations, validation, authorization, database mutations

## Error Handling

**Strategy:** Client/server error separation with consistent JSON responses

**Patterns:**
- **401 Unauthorized:** User not authenticated; return `{ error: 'Unauthorized' }` with 401 status
- **403 Forbidden:** User lacks permission (role/clientId check fails); return `{ error: 'Forbidden' }` with 403 status
- **404 Not Found:** Resource doesn't exist; return `{ error: '[Resource] not found' }` with 404 status
- **400 Bad Request:** Invalid input (missing required fields, invalid status); return `{ error: '[Validation message]' }` with 400 status
- **500 Server Error:** Unhandled exceptions (implicit - Next.js handles); database/external service failures

**Authentication Errors:**
- `getAuthUser()` returns `null` if session invalid → endpoint returns 401
- `requireAuth()` returns `{ user: null, error: Response }` tuple for optional auth checks

**Validation:**
- Manual checks in route handlers (e.g., `if (!clientId || !lines?.length)`)
- No schema validation library detected; raw type coercion used

## Cross-Cutting Concerns

**Logging:**
- Approach: Audit log via `audit()` function in `lib/billing.ts`
- Captured: User ID, action name, entity type/ID, changes JSON
- Used for: Compliance tracking, activity history, debugging
- Stored in: `AuditLog` table

**Validation:**
- Approach: Manual checks in API route handlers
- Pattern: Type coercion from request JSON, null/length checks, database uniqueness via Prisma constraints
- Error responses: 400 status with descriptive message

**Authentication:**
- Approach: NextAuth.js with JWT strategy + optional email/credentials fallback
- Patterns:
  - Middleware redirects unauthenticated requests to `/login`
  - Session stored in httpOnly cookie (default NextAuth behavior)
  - Role and clientId injected into JWT and session object
  - Per-endpoint role/client checks via `getAuthUser()` and `isCompanyRole()`

**Authorization:**
- Approach: Role-based checks + client ownership checks
- Patterns:
  - Company users see all data (invoices, clients)
  - Client users see only their own data (filtered by clientId)
  - Admin operations require company_admin role or higher

---

*Architecture analysis: 2026-02-27*

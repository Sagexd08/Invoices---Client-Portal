# External Integrations

**Analysis Date:** 2026-02-27

## APIs & External Services

**Payment Processing:**
- Razorpay - Primary payment gateway for invoice payment collection
  - SDK/Client: `razorpay` 2.9.6
  - Auth: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
  - Webhook verification: `RAZORPAY_WEBHOOK_SECRET` (HMAC-SHA256)
  - Usage: Order creation at `app/api/invoices/[id]/pay/route.ts`

- Stripe - Payment processor (SDK included but not yet actively integrated)
  - SDK/Client: `stripe` 20.4.0
  - Usage: Reserved for future implementation

**Authentication & Identity:**
- Google OAuth 2.0 - Admin/company user authentication
  - OAuth Provider: `next-auth` GoogleProvider
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Workspace Domain: `oxifylabs.app` (restricted to company domain)
  - Scope: Google Workspace domain hinting via `hd` parameter

## Data Storage

**Databases:**
- PostgreSQL (hosted on Neon serverless)
  - Connection: `DATABASE_URL` (pooled connection via Neon)
  - Direct connection: `DIRECT_URL` (for migrations)
  - Client: Prisma 5.22.0 with `@prisma/adapter-neon`
  - Adapter: `PrismaNeon` with connection pooling via `@neondatabase/serverless`

**File Storage:**
- Local filesystem only (indicated by `Attachment` model with `storagePath` field)
- Virus scanning status tracked in `virusStatus` field (pending implementation)

**Caching:**
- None detected in current implementation
- Next.js built-in caching used for static pages

## Authentication & Identity

**Auth Provider:**
- Dual-provider strategy via next-auth:
  1. **Google OAuth** - Admin/company users (restricted to `@oxifylabs.app` domain)
  2. **Credentials Provider** - Client authentication via Client ID lookup
- Session Strategy: JWT (server-side validation with token encoding)
- Session Secret: `NEXTAUTH_SECRET`
- Session routes: `/api/auth/[...nextauth]/route.ts`

**Protected Routes:**
- `/dashboard/*` - Requires authentication (middleware at `middleware.ts`)
- `/admin/*` - Requires authentication and company_admin role

## Monitoring & Observability

**Error Tracking:**
- None detected
- Console logging available (configured in Prisma at `lib/prisma.ts`)

**Logs:**
- Prisma logs configured for development only: `['error', 'warn']`
- Audit trail via `AuditLog` model for compliance tracking
- Audit function at `lib/billing.ts` - logs actions, entity changes, and actors

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase
- Typical deployment: Vercel (native Next.js support) or Node.js server

**CI Pipeline:**
- Not detected
- ESLint configured for code quality

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database URL for migrations
- `NEXTAUTH_SECRET` - JWT signing secret (minimum 32 characters recommended)
- `GOOGLE_CLIENT_ID` - OAuth application ID
- `GOOGLE_CLIENT_SECRET` - OAuth application secret
- `RAZORPAY_KEY_ID` - Razorpay public key (safe for client exposure via NEXT_PUBLIC prefix)
- `RAZORPAY_KEY_SECRET` - Razorpay private key (server-only)
- `RAZORPAY_WEBHOOK_SECRET` - Webhook signature verification key
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Client-side accessible public key

**Secrets location:**
- `.env` file (local development)
- Environment variable injection in production (Vercel/Docker/CI)

## Webhooks & Callbacks

**Incoming:**
- Razorpay webhooks at `app/api/webhooks/razorpay/route.ts`
  - Events handled:
    - `payment.captured` - Payment successful, updates invoice status to `paid`
    - `payment.failed` - Payment declined, resets invoice status to `pending`
    - `refund.created` - Refund issued, updates invoice status to `refunded`
  - Signature verification: HMAC-SHA256 validation
  - Idempotency check: Duplicate payment records detected and skipped

**Outgoing:**
- None detected in current implementation

## Integration Points in Codebase

**Payment Flow:**
1. Client initiates payment via `app/api/invoices/[id]/pay/route.ts`
2. Creates Razorpay order with invoice details as notes
3. Returns order ID and public key to frontend for Razorpay Checkout
4. Razorpay webhook at `/api/webhooks/razorpay/` confirms payment
5. Invoice status updated and audit logged

**Authentication Flow:**
1. Admin login via Google OAuth → creates company_admin User record
2. Client login via Client ID credential → verifies Client exists, creates client_admin User if needed
3. JWT token encodes role and clientId for authorization checks
4. Middleware enforces authentication on `/dashboard` and `/admin` routes

**Database Operations:**
- Neon serverless adapter handles connection pooling and scaling
- WebSocket support (via `ws` package) enables serverless database connections
- Hot reload in development with prisma client singleton (global singleton pattern)

---

*Integration audit: 2026-02-27*

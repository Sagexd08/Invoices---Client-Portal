# Codebase Structure

**Analysis Date:** 2026-02-27

## Directory Layout

```
client-portal/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # REST API endpoints
│   │   ├── admin/          # Admin-only operations
│   │   ├── auth/           # NextAuth.js configuration
│   │   ├── dashboard/      # Dashboard data endpoint
│   │   ├── invoices/       # Invoice CRUD and payment initiation
│   │   ├── messages/       # Message operations
│   │   ├── notifications/  # Notification endpoints
│   │   ├── requests/       # Client request operations
│   │   ├── services/       # Service catalog operations
│   │   └── webhooks/       # External service webhooks (Razorpay)
│   ├── admin/              # Admin panel pages
│   ├── dashboard/          # Protected dashboard pages
│   │   ├── invoices/       # Invoice listing and detail pages
│   │   └── requests/       # Client request pages
│   ├── login/              # Authentication pages
│   ├── unauthorized/       # Error page for insufficient permissions
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (redirects based on auth)
│   └── globals.css         # Global styles
├── components/             # Reusable React components
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── AdminSidebar.tsx    # Admin-specific sidebar
│   └── MessageThread.tsx   # Message/thread component
├── lib/                    # Business logic and utilities
│   ├── auth.ts             # NextAuth.js configuration
│   ├── auth-helpers.ts     # Auth utility functions
│   ├── auth.d.ts           # NextAuth type extensions
│   ├── billing.ts          # Invoice generation, calculations, audit
│   ├── prisma.ts           # Prisma client initialization
│   ├── razorpay.ts         # Razorpay client configuration
│   └── rbac.ts             # Role-based access control
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma data model
│   └── migrations/         # Database migrations (implicit)
├── types/                  # TypeScript type definitions
│   └── next-auth.d.ts      # NextAuth session type extensions
├── public/                 # Static assets
├── middleware.ts           # Next.js middleware for route protection
├── migrate.js              # Database migration script
├── next.config.mjs         # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables (not versioned)
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router - all pages and API routes
- Contains: Server components, page layouts, API route handlers
- Key files: `layout.tsx` (root), `page.tsx` (home), `middleware.ts` (auth protection)

**`app/api/`:**
- Purpose: RESTful API endpoints for backend operations
- Contains: Route handlers (GET, POST, PUT, DELETE) for all resources
- Key files: `invoices/route.ts`, `clients/route.ts`, `webhooks/razorpay/route.ts`

**`app/dashboard/`:**
- Purpose: Protected user-facing pages (authenticated users only)
- Contains: Invoice management, request management, overview dashboards
- Key files: `layout.tsx` (auth + sidebar), `page.tsx` (role-specific dashboard)

**`app/admin/`:**
- Purpose: Admin-only management interface
- Contains: Client management, system configuration
- Key files: `page.tsx` (admin dashboard)

**`lib/`:**
- Purpose: Shared business logic, utilities, and service clients
- Contains: Authentication setup, RBAC, invoice calculations, database access, payment integration
- Key files: `auth.ts` (NextAuth config), `prisma.ts` (DB client), `billing.ts` (invoice logic), `rbac.ts` (role helpers)

**`components/`:**
- Purpose: Reusable React components
- Contains: Layout components (Sidebar), UI components (MessageThread)
- Key files: `Sidebar.tsx` (navigation for authenticated users), `AdminSidebar.tsx` (admin nav)

**`prisma/`:**
- Purpose: Database schema and migrations
- Contains: Data model definition, migration files
- Key files: `schema.prisma` (complete data model), `migrations/` (applied migrations)

**`types/`:**
- Purpose: TypeScript type extensions
- Contains: NextAuth session type extensions
- Key files: `next-auth.d.ts` (extends Session with custom fields)

**`public/`:**
- Purpose: Static assets served without processing
- Contains: Favicons, images, documents (if any)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML structure and metadata
- `app/page.tsx`: Home route (redirects authenticated users to `/dashboard`)
- `app/login/page.tsx`: Login/authentication page
- `middleware.ts`: Protects `/dashboard/*` and `/admin/*` routes

**Configuration:**
- `lib/auth.ts`: NextAuth.js setup with Google OAuth and Credentials providers
- `prisma/schema.prisma`: Complete database schema (8 models)
- `tsconfig.json`: TypeScript compiler options with path alias `@/*`
- `next.config.mjs`: Next.js configuration

**Core Logic:**
- `lib/auth-helpers.ts`: `getAuthUser()`, `requireAuth()` for authentication checks
- `lib/rbac.ts`: Role hierarchy, `hasRole()`, `isCompanyUser()`, `isClientUser()`
- `lib/billing.ts`: `generateInvoiceNumber()`, `calcInvoiceTotals()`, `audit()`
- `lib/prisma.ts`: Singleton Prisma client with Neon serverless adapter

**API Endpoints:**
- `app/api/invoices/route.ts`: GET (list with pagination) and POST (create invoices)
- `app/api/invoices/[id]/pay/route.ts`: POST (initiate Razorpay payment)
- `app/api/admin/clients/route.ts`: GET/POST clients
- `app/api/auth/[...nextauth]/route.ts`: NextAuth.js route handler
- `app/api/webhooks/razorpay/route.ts`: Razorpay payment confirmation webhook

**Pages:**
- `app/dashboard/page.tsx`: Main dashboard (company overview or client overview)
- `app/dashboard/invoices/page.tsx`: Invoice list page
- `app/dashboard/invoices/[id]/page.tsx`: Invoice detail page
- `app/admin/page.tsx`: Admin dashboard

**Components:**
- `components/Sidebar.tsx`: Navigation sidebar for authenticated users
- `components/AdminSidebar.tsx`: Navigation for admin users

## Naming Conventions

**Files:**
- Page files: kebab-case (e.g., `login-form.tsx`, `invoice-page.tsx`) OR descriptive name matching component
- Route files: always `route.ts` or `route.js` (Next.js convention)
- API routes: match resource pattern `/api/[resource]/route.ts`
- Types: `[name].d.ts` for type definition files

**Directories:**
- lowercase with hyphens: `admin`, `dashboard`, `login`, `api`
- Nested resource routes: `/api/[resource]/[id]/[action]/route.ts`
- Segment folders: `[id]` for dynamic segments, `[...nextauth]` for catch-all

**Functions:**
- camelCase: `getAuthUser()`, `isCompanyRole()`, `generateInvoiceNumber()`
- Action descriptions: verb-first pattern (get, create, update, delete, generate, calculate)

**Variables:**
- camelCase: `clientId`, `invoiceNumber`, `totalAmount`, `dueDate`
- Boolean prefixes: `isCompanyUser`, `hasRole`, `isActive`
- Constants: UPPER_SNAKE_CASE in config files (e.g., `ADMIN_DOMAIN`, `CURRENT_YEAR`)

**Types:**
- PascalCase: `AuthUser`, `Role`, `Invoice`, `Client`
- Type imports: `import type { Session } from 'next-auth'`

## Where to Add New Code

**New Feature (e.g., expense tracking):**
- Primary code:
  - Data model: Add to `prisma/schema.prisma`
  - API endpoints: `app/api/expenses/route.ts`
  - API detail/action: `app/api/expenses/[id]/route.ts`
  - Business logic: `lib/expenses.ts` (new utility file)
  - Pages: `app/dashboard/expenses/page.tsx` and `app/dashboard/expenses/[id]/page.tsx`
- Tests: Co-located with logic files (when testing framework added)

**New Component/Module:**
- Implementation: `components/[ComponentName].tsx`
- Usage: Import with alias path: `import ComponentName from '@/components/ComponentName'`
- If shared across pages, place in `components/`; if page-specific, place in the page directory

**Utilities/Helpers:**
- Shared across API routes: `lib/[domain].ts` (e.g., `lib/expenses.ts`)
- Type extensions: `types/[domain].d.ts`
- Configuration: Top-level config files or environment-based settings

**API Endpoint Pattern:**
```
app/api/[resource]/route.ts          # Collection: GET (list), POST (create)
app/api/[resource]/[id]/route.ts     # Item: GET (detail), PUT (update), DELETE (delete)
app/api/[resource]/[id]/[action]/route.ts  # Action: POST (invoke action)
```

**Page Pattern:**
```
app/dashboard/[resource]/page.tsx          # List page
app/dashboard/[resource]/[id]/page.tsx     # Detail page
app/dashboard/[resource]/[id]/[Component].tsx  # Page-specific components
```

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (created by `npm run build`)
- Committed: No (included in `.gitignore`)

**`node_modules/`:**
- Purpose: npm/yarn dependencies
- Generated: Yes (by package manager)
- Committed: No (included in `.gitignore`)

**`prisma/migrations/`:**
- Purpose: Incremental database schema changes
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes (tracks schema evolution)

**`.env`:**
- Purpose: Environment variables (secrets, API keys, database URL)
- Generated: No (manually created per environment)
- Committed: No (included in `.gitignore`)
- Required vars: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

**`.claude/`:**
- Purpose: Claude-specific configuration and settings
- Generated: Yes (by Claude Code)
- Committed: Partially (some files excluded)

---

*Structure analysis: 2026-02-27*

# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript 5.x - All application code, API routes, and utilities
- JavaScript - Build configuration and tooling

**Secondary:**
- SQL - PostgreSQL queries via Prisma ORM

## Runtime

**Environment:**
- Node.js (version unspecified in manifest, inferred from Next.js 14.2.5 requirements)

**Package Manager:**
- npm (inferred, no lock file type specified, `yarn.lock` present in directory)
- Lockfile: `yarn.lock`

## Frameworks

**Core:**
- Next.js 14.2.5 - Full-stack React framework with App Router
- React 18 - UI library and component framework

**Authentication:**
- next-auth 4.24.13 - Session and OAuth provider management

**Database:**
- Prisma ORM 5.22.0 - Schema definition and database access layer
- @prisma/adapter-neon 5.22.0 - Serverless PostgreSQL adapter for Neon
- @neondatabase/serverless 1.0.2 - Neon serverless client

**Payment Processing:**
- razorpay 2.9.6 - Payment gateway integration
- stripe 20.4.0 - Payment processor (SDK included, usage TBD)

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- PostCSS 8.x - CSS processing

**Testing/Linting:**
- ESLint 8.x - Code linting
- eslint-config-next 14.2.5 - Next.js specific ESLint rules

## Key Dependencies

**Critical:**
- @prisma/client 5.22.0 - Database client for queries and mutations
- next-auth 4.24.13 - Authentication and session management
- razorpay 2.9.6 - Payment order creation and status handling
- @neondatabase/serverless 1.0.2 - Provides serverless database connection pooling

**Infrastructure:**
- ws 8.19.0 - WebSocket support (required for Neon serverless in Node.js)
- @types/ws 8.18.1 - TypeScript types for WebSocket
- @types/node 20.x - Node.js type definitions
- @types/react 18.x - React type definitions
- @types/react-dom 18.x - React DOM type definitions

## Configuration

**Environment:**
- `.env` file present (standard Node.js/Next.js pattern)
- Environment variables for secrets and configuration:
  - `DATABASE_URL` - PostgreSQL connection string (Neon)
  - `DIRECT_URL` - Direct database access for Prisma migrations
  - `NEXTAUTH_SECRET` - JWT signing secret
  - `GOOGLE_CLIENT_ID` - Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
  - `RAZORPAY_KEY_ID` - Public key for Razorpay integration
  - `RAZORPAY_KEY_SECRET` - Secret key for Razorpay API calls
  - `RAZORPAY_WEBHOOK_SECRET` - HMAC signature verification for webhooks
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public key exposed to client-side code

**Build:**
- `next.config.mjs` - Minimal Next.js configuration
- `tsconfig.json` - TypeScript compiler options (strict mode enabled, path alias `@/*`)
- `tailwind.config.ts` - Tailwind configuration with content paths
- `postcss.config.mjs` - PostCSS configuration for CSS processing
- `eslint.config.mjs` - ESLint configuration at root level
- `prisma/schema.prisma` - Prisma ORM schema with PostgreSQL datasource

## Platform Requirements

**Development:**
- Node.js runtime with TypeScript support
- Environment variables configured in `.env` file
- PostgreSQL database (via Neon serverless)

**Production:**
- Node.js 16+ (typical for Next.js 14)
- PostgreSQL database endpoint (Neon supports serverless scaling)
- HTTPS/TLS for OAuth and payment processing

---

*Stack analysis: 2026-02-27*

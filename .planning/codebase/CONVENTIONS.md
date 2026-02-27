# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- PascalCase for React components: `Sidebar.tsx`, `MessageThread.tsx`, `AdminSidebar.tsx`
- camelCase for utility/helper files: `auth-helpers.ts`, `billing.ts`, `prisma.ts`, `rbac.ts`
- route.ts for API endpoints following Next.js App Router convention
- page.tsx for page components following Next.js App Router convention
- layout.tsx for layout components

**Functions:**
- camelCase for all function names: `getAuthUser()`, `generateInvoiceNumber()`, `calcInvoiceTotals()`, `isCompanyRole()`
- Prefixes for utility functions: `generate*` for creation, `calc*` for calculations, `is*` for boolean checks
- Private/internal functions use lowercase: `createPrismaClient()`, `initials()`, `fmtCurrency()`
- Exported functions are explicit exports with `export` keyword

**Variables:**
- camelCase for all variables: `totalClients`, `pendingAgg`, `paidAgg`, `overdueCount`, `recentInvoices`
- Single letters for loop variables in short scopes: `l` for line items in map functions
- Constant-style names for configuration objects: `COMPANY_NAV`, `CLIENT_NAV`, `STATUSES`, `ADMIN_DOMAIN`, `CURRENT_YEAR`
- Abbreviations in specific contexts: `n` for number formatting, `agg` for aggregation, `msg` for message

**Types:**
- PascalCase for all type names: `AuthUser`, `Session`, `Message`, `Props`, `Role`
- Generic type names match pattern conventions
- Inline type definitions in component files using `type` keyword
- Exported types from helper files with explicit `export type` statement

## Code Style

**Formatting:**
- Configured via Next.js and ESLint (see `eslint.config.mjs`)
- Single quotes for strings throughout codebase
- Trailing commas in multiline objects/arrays
- Semicolons at end of statements
- 4-space indentation for JSX/HTML content

**Linting:**
- ESLint with Next.js core-web-vitals and TypeScript config: `eslint.config.mjs`
- ESLint version: ^8
- Uses flat config format with `defineConfig` and `globalIgnores`
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`
- Applied: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

**TypeScript Configuration:**
- `strict: true` - enforces strict type checking
- `skipLibCheck: true` - speeds up compilation
- `noEmit: true` - no emit, Next.js handles transpilation
- `esModuleInterop: true` - CommonJS/ES module compatibility
- `moduleResolution: bundler` - uses bundler resolution
- `isolatedModules: true` - each file can be transpiled independently
- Path aliases: `@/*` maps to project root for imports

## Import Organization

**Order:**
1. External dependencies: `import { NextResponse } from 'next/server'`, `import NextAuth from 'next-auth'`, `import Link from 'next/link'`
2. Library utilities: `import { prisma } from '@/lib/prisma'`, `import { authOptions } from '@/lib/auth'`
3. Helper functions: `import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'`
4. Types and interfaces: `import type { Metadata } from 'next'`, `import type { Session } from 'next-auth'`, `import type { NextAuthOptions } from 'next-auth'`
5. Local components/utilities (if applicable)

Blank lines separate groups.

**Path Aliases:**
- `@/*` - resolves to project root for absolute imports (e.g., `@/lib/prisma`, `@/lib/auth`, `@/lib/billing`)
- Used consistently throughout API routes and pages for import clarity

## Error Handling

**Patterns:**
- API routes return `NextResponse.json()` with appropriate status codes for error conditions
- 401 for unauthorized: `return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`
- 403 for forbidden: `return NextResponse.json({ error: 'Forbidden' }, { status: 403 })`
- 400 for bad request: `return NextResponse.json({ error: 'clientId and lines are required' }, { status: 400 })`
- 404 for not found: `return NextResponse.json({ error: 'Client not found' }, { status: 404 })`
- 201 for successful creation: `return NextResponse.json(invoice, { status: 201 })`
- No try-catch blocks observed in main routes; async errors propagate
- Console.error used for webhook errors: `console.error('Webhook: invoice not found for order', orderId)`

**Authentication Pattern:**
- Early return pattern for auth checks: if no user, return error immediately
- Uses `getAuthUser()` helper which returns `AuthUser | null`
- Null coalescing for optional fields: `user.dbUserId!`, `user.clientId!`

## Logging

**Framework:** console methods (console.error)

**Patterns:**
- Error logging in webhook handlers: `console.error('Webhook: invoice not found for order', orderId)`
- Logging is minimal; errors logged to console for debugging
- Prisma client configured with log levels: `log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']`

## Comments

**When to Comment:**
- Provider configuration sections use section separators: `// ── Admin: Google OAuth ──` and `// ── Client: Client ID only ──`
- Callback comments explain purpose: `// Block non-@oxifylabs.app Google sign-ins`, `// Encode role + clientId into JWT`
- Private function docstrings: `/** Returns the session user, or null if not authenticated */`, `/** Throws a 401 JSON response if not authenticated */`
- Inline comments only for non-obvious logic (rarely used)

**JSDoc/TSDoc:**
- Block comments on exported functions using `/** */` format
- Used for public API functions like `getAuthUser()`, `requireAuth()`, `generateInvoiceNumber()`, `calcInvoiceTotals()`, `audit()`
- Used for exported constants and helper patterns

## Function Design

**Size:**
- Functions are kept small and focused
- Helper functions like `fmtCurrency()` are single-purpose (3 lines)
- API handlers range from 10-40 lines
- Component functions range from 20-100+ lines for page components

**Parameters:**
- Named destructuring for component props: `{ searchParams }`, `{ threadId, initialMessages, currentUserId }`
- Object parameters for complex functions: `{ clientId, lines, dueDate, currency, notes }`
- Type annotations on all parameters
- Optional parameters marked with `?` in types

**Return Values:**
- Explicit return types on functions: `Promise<AuthUser | null>`, `Promise<string>`
- API routes return `NextResponse` objects
- React components implicitly return JSX
- Utility functions return typed values or objects

## Module Design

**Exports:**
- Named exports for utility functions: `export async function getAuthUser()`, `export function isCompanyRole()`
- Default exports for page/layout components: `export default function DashboardPage()`, `export default function Sidebar()`
- Type exports: `export type AuthUser = ...`
- Constants exported as named exports: `export const authOptions`

**Barrel Files:**
- Not used in this codebase
- Each utility file is imported directly by path (e.g., `@/lib/auth`, `@/lib/billing`)

**File Organization:**
- API routes are isolated in `app/api/*` directory with clear endpoint structure
- Shared utilities in `lib/` directory
- Components in `components/` directory
- Pages in `app/` directory following Next.js App Router structure

---

*Convention analysis: 2026-02-27*

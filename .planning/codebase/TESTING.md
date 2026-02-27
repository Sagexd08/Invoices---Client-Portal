# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Runner:**
- Not detected - No test framework installed

**Assertion Library:**
- Not detected - No test assertion library configured

**Dev Dependencies:**
No testing dependencies found in `package.json`. The project has:
- `eslint` (^8) for linting
- `typescript` (^5) for type checking
- No Jest, Vitest, Mocha, Jasmine, or similar test runners

**Run Commands:**
```bash
npm run lint              # Run ESLint validation
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server
```

## Test File Organization

**Location:**
- Not applicable - No test files found in application code
- Test files exist only in `node_modules/` (from dependencies like Next.js, NextAuth, etc.)
- No dedicated test directory structure

**Naming:**
- Not established - No application-level tests

**Structure:**
```
client-portal/
├── app/                 # Routes and pages (no .test or .spec files)
├── components/          # UI components (no .test or .spec files)
├── lib/                 # Utilities (no .test or .spec files)
└── node_modules/        # Contains dependency tests only
```

## Test Structure

**Suite Organization:**
- Not applicable - No tests to examine
- Codebase appears to use type checking via TypeScript (`strict: true`) as primary quality gate

**Patterns:**
- No test setup/teardown patterns observed
- No assertion patterns established
- No test utilities created

## Mocking

**Framework:**
- Not detected - No mocking library installed

**Patterns:**
- Database calls use real Prisma client in development/production
- API routes make real database queries
- No mock data fixtures created
- No test doubles for external services

**What to Mock (if tests were added):**
- Prisma client operations (database)
- NextAuth session/authentication
- Next.js request/response objects
- External payment services (Razorpay, Stripe)
- Environment variables

**What NOT to Mock:**
- Business logic functions like `calcInvoiceTotals()`, `generateInvoiceNumber()` (test these with real inputs)
- Type checking and validation logic
- Authentication helpers (complex integration with session)

## Fixtures and Factories

**Test Data:**
- Not applicable - No test fixtures exist

**Location:**
- Not established
- Would need: `__tests__/fixtures/` or `tests/factories/` directory if tests are added

**Recommendation:**
For future tests, establish fixture patterns like:
```
tests/
├── fixtures/
│  ├── users.ts       # Sample user objects
│  ├── invoices.ts    # Sample invoice data
│  └── clients.ts     # Sample client data
└── factories/
   ├── user.factory.ts
   ├── invoice.factory.ts
   └── client.factory.ts
```

## Coverage

**Requirements:**
- Not enforced - No coverage configuration or targets set

**View Coverage:**
- Not applicable - No test runner configured

**Missing from codebase:**
- `jest.config.js` or `vitest.config.ts`
- `.nyc_config` or similar coverage configuration
- GitHub Actions or CI/CD test workflows
- `--coverage` flag support

## Test Types

**Unit Tests:**
- Not implemented
- Should test utility functions like:
  - `calcInvoiceTotals()` in `lib/billing.ts` with various tax rates
  - `generateInvoiceNumber()` in `lib/billing.ts` for numbering sequence
  - `isCompanyRole()` in `lib/auth-helpers.ts` with different role values
  - `initials()` helper in components for abbreviation logic

**Integration Tests:**
- Not implemented
- Should test:
  - API routes with database calls (e.g., GET/POST `/api/invoices`)
  - Authentication flow with NextAuth and Prisma
  - Invoice creation with line items and calculations
  - Request lifecycle with attachments

**E2E Tests:**
- Not implemented
- Framework: None installed
- Would recommend: Playwright or Cypress for future testing
- Should cover:
  - User login flow (both Google OAuth and Client ID)
  - Invoice creation and payment workflow
  - Dashboard data display and filtering
  - Message thread communication

## Common Patterns (if implementing tests)

**Async Testing:**
```typescript
// Pattern observed in codebase for async operations:
const user = await getAuthUser()
const invoices = await prisma.invoice.findMany({ where, include })

// Test pattern would follow:
test('should fetch invoices for user', async () => {
  // setup
  // execute
  // assert
})
```

**Error Testing:**
```typescript
// Current pattern in API routes:
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (!clientId || !lines?.length) return NextResponse.json({ error: 'clientId and lines are required' }, { status: 400 })

// Test pattern would verify:
test('should return 401 when user not authenticated', async () => {
  // assert status and error message
})
```

**API Testing Pattern:**
```typescript
// Current pattern in app/api/invoices/route.ts:
const { clientId, lines, dueDate, currency = 'INR', notes } = await req.json()
const invoice = await prisma.invoice.create({ data: { ... } })
return NextResponse.json(invoice, { status: 201 })

// Test would verify request/response cycle
```

## Current Quality Measures

**Type Safety:**
- TypeScript with `strict: true` ensures compile-time type checking
- All functions have explicit type annotations
- Import paths validated via `@/*` alias

**Code Quality:**
- ESLint configuration enforces Next.js and TypeScript best practices
- Web Vitals rules enforced for performance
- Linting runs on development (`npm run lint`)

**Missing Test Infrastructure:**
- No runtime testing framework
- No test data seeding strategy
- No CI/CD test automation
- No test coverage metrics

## Recommendations for Adding Tests

**Priority 1 - Add test framework:**
```bash
npm install --save-dev vitest @vitest/ui
# or
npm install --save-dev jest @types/jest ts-jest
```

**Priority 2 - Set up test config:**
Create `vitest.config.ts` or `jest.config.js` with TypeScript support

**Priority 3 - Test critical paths:**
- Authentication: `getAuthUser()`, `requireAuth()` in `lib/auth-helpers.ts`
- Billing calculations: `calcInvoiceTotals()`, `generateInvoiceNumber()` in `lib/billing.ts`
- API endpoints: All routes in `app/api/` directory

**Priority 4 - Mock external dependencies:**
- Prisma Client (for database tests)
- NextAuth session (for auth tests)
- Environment variables (for config tests)

---

*Testing analysis: 2026-02-27*

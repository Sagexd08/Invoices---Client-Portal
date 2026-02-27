# Codebase Concerns

**Analysis Date:** 2026-02-27

## Tech Debt

**Mixed Authentication Systems:**
- Issue: The codebase has inconsistent authentication implementation. Most routes use NextAuth with `getAuthUser()` from `lib/auth-helpers.ts`, but `app/api/admin/clients/[clientId]/route.ts` uses Supabase authentication with `createClient()` and `supabaseUserId` fields that don't exist in the User model.
- Files:
  - `lib/auth-helpers.ts` (NextAuth-based)
  - `app/api/admin/clients/[clientId]/route.ts` (Supabase-based)
  - `prisma/schema.prisma` (no supabaseUserId field defined)
- Impact: The admin client detail route will crash when trying to access `supabaseUserId` since it's not defined in the schema. This creates a broken API endpoint.
- Fix approach: Remove Supabase references and migrate the `/api/admin/clients/[clientId]` route to use NextAuth's `getAuthUser()` helper, matching the pattern in `app/api/admin/clients/route.ts`.

**Inconsistent Authorization Checks:**
- Issue: Authorization logic is duplicated across files. The RBAC helpers exist in both `lib/rbac.ts` and `lib/auth-helpers.ts`, with `isCompanyRole()` defined differently in each place.
- Files:
  - `lib/rbac.ts` - defines `isCompanyUser()` using ROLE_HIERARCHY
  - `lib/auth-helpers.ts` - defines `isCompanyRole()` with hard-coded role list
  - `app/api/services/route.ts` - imports both modules (line 4)
- Impact: Maintenance burden; changes to role definitions must be made in two places, risking drift between implementations.
- Fix approach: Consolidate all RBAC logic into a single `lib/rbac.ts` file and export both functions from there.

**Weak Type Safety on Third-Party Integrations:**
- Issue: The Razorpay client declaration in `app/dashboard/invoices/[id]/PayButton.tsx` uses `any` type for `window.Razorpay` (line 5), and the Razorpay options in lines 39-53 lack proper typing.
- Files: `app/dashboard/invoices/[id]/PayButton.tsx`
- Impact: No compile-time checking of Razorpay SDK API. Silent failures if SDK API changes.
- Fix approach: Create a proper TypeScript interface for Razorpay SDK types or use `@types/razorpay-checkout` if available.

**ID Generation Race Conditions:**
- Issue: The invoice and client ID generation in `lib/billing.ts` uses a simple max + 1 pattern without row-level locking.
- Files: `lib/billing.ts` - `generateInvoiceNumber()` (lines 5-15) and `generateClientId()` (lines 17-27)
- Impact: Under concurrent requests, multiple invoices/clients could receive the same ID, violating uniqueness constraints.
- Fix approach: Implement proper database-level sequencing using `SERIAL` or `GENERATED ALWAYS AS IDENTITY` in Prisma schema, or use Prisma's atomic increment with exclusive locks.

## Known Bugs

**Broken Admin Client Detail Endpoint:**
- Symptoms: GET `/api/admin/clients/[clientId]` returns 500 error when accessed
- Files: `app/api/admin/clients/[clientId]/route.ts` (lines 8-15)
- Trigger: Any authenticated request to the endpoint
- Root cause: Code references `supabaseUserId` which doesn't exist in the User model; it expects NextAuth's session but uses Supabase API
- Workaround: Use GET `/api/admin/clients` to list all clients instead

**Missing Virus Scanning Implementation:**
- Symptoms: Attachments are uploaded with `virusStatus: 'pending'` but nothing ever changes this status
- Files:
  - `prisma/schema.prisma` (line 122)
  - `app/api/requests/[id]/attachments/route.ts` (line 20)
- Impact: Security risk - no actual virus scanning occurs despite schema suggesting it does
- Trigger: Any file upload to a request
- Workaround: None - all uploaded files remain unscanned

## Security Considerations

**Insufficient Input Validation:**
- Risk: Several API endpoints accept user input with minimal validation. The `/api/invoices/[id]` PATCH endpoint (line 27-32) accepts arbitrary status strings without whitelist validation.
- Files:
  - `app/api/invoices/[id]/route.ts` (line 27)
  - `app/api/requests/[id]/route.ts` (line 29-32 validates status, but others don't)
- Current mitigation: Status field is stored directly; if invalid values are set, they'll corrupt data
- Recommendations:
  1. Create a whitelist of valid statuses and validate against it before updating
  2. Use Zod or TypeScript narrowing types for all request bodies
  3. Validate before database operations, not after

**Webhook Signature Validation Only on Razorpay:**
- Risk: The codebase only validates Razorpay webhook signatures. If more webhooks are added, they may lack signature verification.
- Files: `app/api/webhooks/razorpay/route.ts` (lines 6-12)
- Current mitigation: Limited - only Razorpay is protected
- Recommendations:
  1. Create a generic webhook validation middleware
  2. Ensure all future webhooks require signed payloads
  3. Document webhook security requirements

**Client Data Access Control Gaps:**
- Risk: Attachment retrieval in `app/api/requests/[id]/attachments/route.ts` (GET, lines 25-34) doesn't verify the requesting user owns the request before returning attachments.
- Files: `app/api/requests/[id]/attachments/route.ts`
- Current mitigation: POST creates attachments with ownership check (line 13), but GET doesn't
- Recommendations:
  1. Load the request and verify `request.clientId === user.clientId`
  2. Apply same pattern to all data retrieval endpoints

**Razorpay Keys Exposed in Client JavaScript:**
- Risk: `NEXT_PUBLIC_RAZORPAY_KEY_ID` is intentionally public (for Razorpay SDK), but it's sent to every client unnecessarily on every payment init.
- Files: `app/api/invoices/[id]/pay/route.ts` (line 38)
- Impact: Minor - key_id is public by design, but the pattern could expose other secrets if someone adds `NEXT_PUBLIC_` prefixes by mistake
- Recommendations:
  1. Code review process to prevent accidental `NEXT_PUBLIC_` prefixes on secret values
  2. Consider only returning key_id after server-side validation succeeds

## Performance Bottlenecks

**N+1 Query in Messages Endpoint:**
- Problem: `/api/messages` fetches all messages, then does a separate query to load authors (lines 13-15)
- Files: `app/api/messages/route.ts`
- Cause: `prisma.message.findMany()` doesn't include author data; separate `prisma.user.findMany()` is needed
- Improvement path: Use Prisma's `include` to load authors in a single query, reducing database round trips
- Impact: Scales linearly with message count; 100 messages = 101 queries

**Notification Audit Log Query Inefficiency:**
- Problem: `/api/notifications` loads all client invoices and requests just to filter audit logs
- Files: `app/api/notifications/route.ts` (lines 21-26)
- Cause: `getClientEntityIds()` function loads full invoice/request objects when only IDs are needed
- Improvement path: Use `.select({ id: true })` in the queries (already done in the code, but the approach is still heavy)
- Impact: For clients with 1000+ invoices, this becomes slow and memory-intensive

**Unindexed Date Queries:**
- Problem: Dashboard route queries payment.paidAt with a calculated date range (line 19)
- Files: `app/api/dashboard/route.ts`
- Cause: No index on `Payment.paidAt` column; full table scan for every dashboard load
- Improvement path: Add database index: `@@index([paidAt])` to Payment model
- Impact: Grows with payment volume; becomes slow at scale

## Fragile Areas

**Status String Management:**
- Files:
  - `prisma/schema.prisma` (multiple models use string for status)
  - `app/api/invoices/[id]/route.ts` (lines 27-32)
  - `app/api/requests/[id]/route.ts` (lines 25-36)
- Why fragile: Status values are hard-coded strings in multiple places. Adding new statuses requires changes across files.
- Safe modification: Create a `lib/constants.ts` with exported `INVOICE_STATUSES` and `REQUEST_STATUSES` enums, then use them everywhere
- Test coverage: No tests verify status transitions are valid

**Invoice Total Calculation:**
- Files: `lib/billing.ts` (lines 30-42)
- Why fragile: Math operations on floats can accumulate rounding errors. Current approach rounds at end, but if calculation logic changes, precision could be lost.
- Safe modification: Add unit tests that verify edge cases (e.g., 3 items at 0.33 price, tax calculations with complex rates)
- Test coverage: None - no tests for `calcInvoiceTotals()`

**Razorpay Event Parsing:**
- Files: `app/api/webhooks/razorpay/route.ts` (lines 14-82)
- Why fragile: Event structure is hard-coded. If Razorpay changes payload structure, parsing silently fails.
- Safe modification: Add extensive logging, validate event schema against Razorpay docs, add tests with sample webhook payloads
- Test coverage: None - no webhook tests

**Client-to-User Relationship Assumptions:**
- Files: `lib/auth.ts` (lines 46-57)
- Why fragile: Auth flow creates a user on first login if none exists. The logic assumes this is safe and idempotent, but concurrent logins could create duplicates.
- Safe modification: Add `UNIQUE` constraint on `(clientId, role)` pair or use `findOrCreate` pattern with locking
- Test coverage: None - no concurrent login tests

## Scaling Limits

**Invoice Number Generation Bottleneck:**
- Current capacity: Works for up to 99,999 invoices per year (format: `INV-YYYY-XXXXX`)
- Limit: Hits 99,999 on day 274 of peak load (no day/monthly sequencing)
- Scaling path: Switch to database `SERIAL` column + query MAX pattern, or implement monthly reset with `INV-YYYY-MM-XXXXX` format

**JWT Token Size:**
- Problem: Every request includes role, clientId, dbUserId, clientPublicId in JWT (auth.ts lines 94-114)
- Current capacity: Works fine for current schema; grows if more claims added
- Limit: Token size > 8KB could exceed cookie size limits in some browsers
- Scaling path: Store minimal claims in JWT, load full user data from session or database per-request

**Concurrent Payment Processing:**
- Problem: Razorpay webhook and payment.paid status update are not idempotent if race condition occurs
- Files: `app/api/webhooks/razorpay/route.ts` (lines 31-35 do check existing payment, but only for success)
- Current capacity: Works for <100 concurrent payments
- Limit: Duplicates or missed payments at high concurrency
- Scaling path: Implement payment deduplication with order ID as unique constraint, use database transactions for all payment mutations

**Audit Log Growth:**
- Problem: Every action writes to audit log; no retention policy
- Files: `prisma/schema.prisma` (AuditLog model)
- Current capacity: Database grows 5-10 MB/month with typical usage
- Limit: Query performance degrades at 10M+ audit entries without partitioning
- Scaling path: Implement audit log archival (move old entries to cold storage), add compound index on (entityType, entityId, createdAt)

## Dependencies at Risk

**NextAuth Version Pinned to 4.24.13:**
- Risk: Version 4.x is older; v5 released with breaking changes. No update path documented.
- Impact: Security patches in v5 won't be available; library will eventually be unsupported
- Migration plan: Test NextAuth v5 migration in dev branch; major breaking changes in session handling but worth doing

**Razorpay SDK at 2.9.6:**
- Risk: Minor version pinning; could miss critical bug fixes
- Impact: Known Razorpay bugs won't be fixed; webhook handling could break
- Migration plan: Use caret semver (^2.9.6) to allow patch updates automatically

**Prisma Pinned to 5.22.0:**
- Risk: Fairly recent version; driver adapter is marked as preview feature
- Impact: Preview features can have breaking changes; if adapter changes, db connection breaks
- Migration plan: Monitor Prisma changelog; test adapter upgrades in CI before production

**No Stripe Integration Detected:**
- Risk: Stripe SDK is installed (package.json line 22) but not used anywhere in codebase
- Impact: Dead dependency; adds bloat and potential security surface
- Migration plan: Either implement Stripe integration or remove package

## Missing Critical Features

**No Invoice Template System:**
- Problem: Invoices render with hard-coded information; no customization for client branding
- Blocks: Clients can't generate branded PDFs; reduces professionalism
- Impact: Medium priority - affects user satisfaction

**No Two-Factor Authentication:**
- Problem: Admin accounts are protected only by Google OAuth; no 2FA option
- Blocks: High-security deployments can't be achieved
- Impact: High priority - security risk for financial data

**No Rate Limiting on APIs:**
- Problem: No rate limiting on payment or webhook endpoints
- Blocks: DOS attacks possible; clients could spam endpoints
- Impact: High priority - availability risk

**No Invoice Reminders:**
- Problem: Overdue invoices aren't automatically tracked or communicated
- Blocks: Clients don't know about overdue amounts
- Impact: Medium priority - revenue collection impact

**No Bulk Invoice Operations:**
- Problem: Creating multiple invoices requires individual API calls
- Blocks: Batch invoicing workflows are inefficient
- Impact: Low priority - convenience feature

## Test Coverage Gaps

**No API Route Tests:**
- What's not tested: All API endpoints lack unit/integration tests
- Files: All files in `app/api/` directory
- Risk: Breaking changes to endpoints go undetected; regressions in auth/authorization logic
- Priority: High - critical business logic

**No Webhook Tests:**
- What's not tested: Razorpay webhook parsing, idempotency, error handling
- Files: `app/api/webhooks/razorpay/route.ts`
- Risk: Payment processing bugs only discovered in production
- Priority: High - critical payment flow

**No Database Transaction Tests:**
- What's not tested: Concurrent invoice/payment creation, race conditions
- Files: `app/api/invoices/route.ts`, `app/api/webhooks/razorpay/route.ts`
- Risk: Data corruption under concurrent load
- Priority: High - data integrity

**No Component Tests:**
- What's not tested: React components, especially `PayButton.tsx`
- Files: `app/dashboard/invoices/[id]/PayButton.tsx`
- Risk: UI bugs, broken Razorpay integration
- Priority: Medium - user experience

**No E2E Tests:**
- What's not tested: Full invoice creation → payment flow
- Risk: Integration points between frontend and backend fail silently
- Priority: Medium - critical user journey

**No Authentication Flow Tests:**
- What's not tested: OAuth signin, client ID login, JWT token generation, role-based access
- Files: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- Risk: Auth bypass or broken auth flows in production
- Priority: Critical - security and usability

---

*Concerns audit: 2026-02-27*

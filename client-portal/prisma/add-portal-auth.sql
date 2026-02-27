-- Add portal credentials to Client table for client-ID-only login
ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "portalEmail"  TEXT,
  ADD COLUMN IF NOT EXISTS "portalSecret" TEXT;

-- Unique constraint so each client has one portal email
CREATE UNIQUE INDEX IF NOT EXISTS "Client_portalEmail_key" ON "Client"("portalEmail");

-- =============================================================
-- Client Portal — Database Schema
-- Paste this entire file into the Neon SQL Editor and run it.
-- =============================================================

-- ──────────────────────────────────────────────
-- CLIENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Client" (
  "id"                 TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"           TEXT        NOT NULL,             -- e.g. CL-2026-00001
  "name"               TEXT        NOT NULL,
  "billingAddress"     TEXT,
  "timezone"           TEXT,
  "currency"           TEXT        NOT NULL DEFAULT 'INR',
  "razorpayCustomerId" TEXT,
  "status"             TEXT        NOT NULL DEFAULT 'active', -- active | suspended
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Client_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "Client_clientId" UNIQUE ("clientId")
);

-- ──────────────────────────────────────────────
-- USERS  (company staff + client users)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
  "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "supabaseUserId" TEXT        NOT NULL,
  "clientId"       TEXT,                                 -- NULL for company staff
  "email"          TEXT        NOT NULL,
  "name"           TEXT,
  -- roles: company_admin | project_manager | accountant | client_admin | client_collaborator
  "role"           TEXT        NOT NULL DEFAULT 'client_admin',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "User_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "User_supabaseUserId" UNIQUE ("supabaseUserId"),
  CONSTRAINT "User_email"          UNIQUE ("email"),
  CONSTRAINT "User_clientId_fkey"  FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ──────────────────────────────────────────────
-- SERVICES  (company's service catalog)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Service" (
  "id"          TEXT    NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "sku"         TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "description" TEXT,
  "price"       FLOAT8  NOT NULL,
  "taxRate"     FLOAT8  NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Service_sku"  UNIQUE ("sku")
);

-- ──────────────────────────────────────────────
-- INVOICES
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "invoiceNumber"   TEXT        NOT NULL,               -- INV-2026-00001
  "clientId"        TEXT        NOT NULL,
  "razorpayOrderId" TEXT,
  -- statuses: draft | pending | partially_paid | paid | overdue | cancelled | refunded
  "status"          TEXT        NOT NULL DEFAULT 'draft',
  "subtotal"        FLOAT8      NOT NULL,
  "taxAmount"       FLOAT8      NOT NULL,
  "totalAmount"     FLOAT8      NOT NULL,
  "currency"        TEXT        NOT NULL DEFAULT 'INR',
  "dueDate"         TIMESTAMPTZ,
  "issuedAt"        TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Invoice_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "Invoice_number"        UNIQUE ("invoiceNumber"),
  CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ──────────────────────────────────────────────
-- INVOICE LINES
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "InvoiceLine" (
  "id"          TEXT   NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "invoiceId"   TEXT   NOT NULL,
  "serviceId"   TEXT,
  "description" TEXT   NOT NULL,
  "quantity"    INT    NOT NULL,
  "unitPrice"   FLOAT8 NOT NULL,
  "taxRate"     FLOAT8 NOT NULL DEFAULT 0,
  "lineTotal"   FLOAT8 NOT NULL,
  CONSTRAINT "InvoiceLine_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceLine_invoice_fkey"  FOREIGN KEY ("invoiceId")
    REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InvoiceLine_service_fkey"  FOREIGN KEY ("serviceId")
    REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ──────────────────────────────────────────────
-- PAYMENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Payment" (
  "id"                TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "invoiceId"         TEXT        NOT NULL,
  "razorpayOrderId"   TEXT,
  "razorpayPaymentId" TEXT,
  "amount"            FLOAT8      NOT NULL,
  "status"            TEXT        NOT NULL DEFAULT 'succeeded',
  "paidAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Payment_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "Payment_invoice_fkey"  FOREIGN KEY ("invoiceId")
    REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ──────────────────────────────────────────────
-- REQUESTS  (file / form requests sent to clients)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Request" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"   TEXT        NOT NULL,
  "title"      TEXT        NOT NULL,
  "fieldsJson" TEXT,                                    -- JSON string
  -- statuses: open | submitted | approved | rejected
  "status"     TEXT        NOT NULL DEFAULT 'open',
  "dueDate"    TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Request_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "Request_client_fkey"   FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ──────────────────────────────────────────────
-- MESSAGES
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Message" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "threadId"  TEXT        NOT NULL,                     -- Invoice or Request ID
  "authorId"  TEXT        NOT NULL,
  "body"      TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- ──────────────────────────────────────────────
-- ATTACHMENTS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Attachment" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "ownerType"   TEXT        NOT NULL,                   -- request | message
  "ownerId"     TEXT        NOT NULL,
  "storagePath" TEXT        NOT NULL,
  -- virusStatus: pending | clean | infected
  "virusStatus" TEXT        NOT NULL DEFAULT 'pending',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- ──────────────────────────────────────────────
-- AUDIT LOG  (immutable financial audit trail)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "actorId"     TEXT        NOT NULL,
  "action"      TEXT        NOT NULL,
  "entityType"  TEXT        NOT NULL,
  "entityId"    TEXT        NOT NULL,
  "changesJson" TEXT,                                   -- JSON string
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ──────────────────────────────────────────────
-- INDEXES  (performance)
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_invoice_client"   ON "Invoice"("clientId");
CREATE INDEX IF NOT EXISTS "idx_invoice_status"   ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "idx_invoiceline_inv"  ON "InvoiceLine"("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_payment_invoice"  ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_request_client"   ON "Request"("clientId");
CREATE INDEX IF NOT EXISTS "idx_message_thread"   ON "Message"("threadId");
CREATE INDEX IF NOT EXISTS "idx_attachment_owner" ON "Attachment"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_auditlog_entity"  ON "AuditLog"("entityId");
CREATE INDEX IF NOT EXISTS "idx_auditlog_actor"   ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "idx_user_client"      ON "User"("clientId");

-- Migration: add_linked_expedients_and_validations
-- Adds: parentExpedientId, expedientRole, notaryFees, registryFees, taxesAmount
-- Adds: DocumentValidation model
-- Adds: documentValidations relation to User

-- Add new columns to expedients table
ALTER TABLE "expedients" ADD COLUMN IF NOT EXISTS "parentExpedientId" TEXT;
ALTER TABLE "expedients" ADD COLUMN IF NOT EXISTS "expedientRole" TEXT;
ALTER TABLE "expedients" ADD COLUMN IF NOT EXISTS "notaryFees" DECIMAL(10,2);
ALTER TABLE "expedients" ADD COLUMN IF NOT EXISTS "registryFees" DECIMAL(10,2);
ALTER TABLE "expedients" ADD COLUMN IF NOT EXISTS "taxesAmount" DECIMAL(10,2);

-- Add self-referential FK for parent expedient
ALTER TABLE "expedients" ADD CONSTRAINT "expedients_parentExpedientId_fkey"
  FOREIGN KEY ("parentExpedientId") REFERENCES "expedients"("id") ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Create document_validations table
CREATE TABLE IF NOT EXISTS "document_validations" (
  "id"          TEXT NOT NULL,
  "documentId"  TEXT NOT NULL,
  "validatedBy" TEXT NOT NULL,
  "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status"      TEXT NOT NULL,
  "comments"    TEXT,
  "expiryDate"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_validations_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for document_validations
ALTER TABLE "document_validations" ADD CONSTRAINT "document_validations_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_validations" ADD CONSTRAINT "document_validations_validatedBy_fkey"
  FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON UPDATE CASCADE;

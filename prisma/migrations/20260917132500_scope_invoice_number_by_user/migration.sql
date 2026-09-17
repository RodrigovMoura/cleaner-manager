-- AlterTable: Add nullable userId first
ALTER TABLE "Invoice" ADD COLUMN "userId" TEXT;

-- Backfill userId from Client
UPDATE "Invoice" i
SET "userId" = c."userId"
FROM "Client" c
WHERE i."clientId" = c."id";

-- Make userId NOT NULL
ALTER TABLE "Invoice" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old global unique constraint
DROP INDEX IF EXISTS "Invoice_invoiceNumber_key";

-- Create new per-user unique index
CREATE UNIQUE INDEX "Invoice_userId_invoiceNumber_key" ON "Invoice"("userId", "invoiceNumber");

-- Add ForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 50.00,
ADD COLUMN     "preferredPaymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER';

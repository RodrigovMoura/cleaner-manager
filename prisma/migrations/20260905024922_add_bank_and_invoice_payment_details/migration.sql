-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paymentAccountName" TEXT,
ADD COLUMN     "paymentAccountNo" TEXT,
ADD COLUMN     "paymentBsb" TEXT,
ADD COLUMN     "paymentPayId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankBsb" TEXT,
ADD COLUMN     "payId" TEXT;

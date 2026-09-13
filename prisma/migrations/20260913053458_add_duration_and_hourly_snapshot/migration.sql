-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "durationMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "hourlyRate" DECIMAL(65,30);

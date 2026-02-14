-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "conditionHash" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

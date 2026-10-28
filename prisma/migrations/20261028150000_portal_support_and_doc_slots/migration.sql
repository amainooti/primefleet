-- AlterTable
ALTER TABLE "Portal" ADD COLUMN "supportName" TEXT,
ADD COLUMN "supportEmail" TEXT,
ADD COLUMN "supportPhone" TEXT;

-- AlterTable
ALTER TABLE "PortalCharge" ADD COLUMN "suffix" TEXT,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PortalDocument" ADD COLUMN "note" TEXT,
ALTER COLUMN "fileName" DROP NOT NULL,
ALTER COLUMN "storedName" DROP NOT NULL,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL;

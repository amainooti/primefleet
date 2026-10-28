-- CreateEnum
CREATE TYPE "PortalStepStatus" AS ENUM ('DONE', 'PENDING', 'TODO');

-- CreateEnum
CREATE TYPE "PortalChargeStatus" AS ENUM ('PAID', 'PROCESSING', 'DUE');

-- CreateTable
CREATE TABLE "Portal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "manageKeyHash" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "dealerName" TEXT NOT NULL DEFAULT 'PrimeFleet Motors LLC',
    "alertText" TEXT,
    "alertActionLabel" TEXT,
    "maintenanceNotes" TEXT,
    "vehicleTitle" TEXT NOT NULL,
    "vehicleStatus" TEXT NOT NULL DEFAULT 'Locked & Reserved',
    "stockNumber" TEXT,
    "vehicleColor" TEXT,
    "vin" TEXT,
    "engine" TEXT,
    "transmission" TEXT,
    "mileage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalStep" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "PortalStepStatus" NOT NULL DEFAULT 'TODO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalCharge" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "amount" TEXT NOT NULL,
    "status" "PortalChargeStatus" NOT NULL DEFAULT 'PROCESSING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortalCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalDocument" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portal_slug_key" ON "Portal"("slug");

-- CreateIndex
CREATE INDEX "PortalStep_portalId_idx" ON "PortalStep"("portalId");

-- CreateIndex
CREATE INDEX "PortalCharge_portalId_idx" ON "PortalCharge"("portalId");

-- CreateIndex
CREATE INDEX "PortalDocument_portalId_idx" ON "PortalDocument"("portalId");

-- AddForeignKey
ALTER TABLE "PortalStep" ADD CONSTRAINT "PortalStep_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalCharge" ADD CONSTRAINT "PortalCharge_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalDocument" ADD CONSTRAINT "PortalDocument_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

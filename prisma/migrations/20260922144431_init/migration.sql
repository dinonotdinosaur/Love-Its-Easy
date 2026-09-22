-- CreateEnum
CREATE TYPE "Tariff" AS ENUM ('LEGKIY', 'KVEST', 'MAKSIMUM', 'DLYA_DVOIKH');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'MODERATION_PENDING', 'MODERATION_FAILED', 'MODERATION_PASSED', 'PAID', 'EXPIRED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tariff" "Tariff" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "templateSlug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "email" TEXT NOT NULL,
    "pinCodeHash" TEXT,
    "subdomainSlug" TEXT,
    "amountKopecks" INTEGER NOT NULL,
    "paymentProvider" TEXT,
    "paymentId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_subdomainSlug_key" ON "Order"("subdomainSlug");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "ConsentLog_orderId_idx" ON "ConsentLog"("orderId");

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

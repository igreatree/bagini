-- AlterTable
ALTER TABLE "Order" ADD COLUMN "extId" TEXT,
ADD COLUMN "ozonOrderId" TEXT,
ADD COLUMN "paymentUrl" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill extId for existing orders
UPDATE "Order" SET "extId" = gen_random_uuid()::text WHERE "extId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "extId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_extId_key" ON "Order"("extId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_ozonOrderId_key" ON "Order"("ozonOrderId");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "probeUserId" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "probeOfferId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_probeUserId_key" ON "Order"("probeUserId");

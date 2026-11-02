-- AlterTable
ALTER TABLE "Order" ADD COLUMN "ozonPostingNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_ozonPostingNumber_key" ON "Order"("ozonPostingNumber");

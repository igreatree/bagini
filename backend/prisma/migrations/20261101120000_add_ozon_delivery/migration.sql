-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'confirmed';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryPointId" INTEGER,
ADD COLUMN "ozonDeliveryNumber" TEXT;

-- CreateTable
CREATE TABLE "DeliveryPoint" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL,
    "shipmentMethodIds" INTEGER[],
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_ozonDeliveryNumber_key" ON "Order"("ozonDeliveryNumber");

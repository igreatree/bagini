-- Delivery API uses int64 IDs. Real shipment method IDs exceed PostgreSQL INTEGER.
ALTER TABLE "DeliveryPoint"
    ALTER COLUMN "id" TYPE BIGINT,
    ALTER COLUMN "shipmentMethodIds" TYPE BIGINT[] USING "shipmentMethodIds"::BIGINT[];

ALTER TABLE "Order" ALTER COLUMN "deliveryPointId" TYPE BIGINT;

ALTER TABLE "Order" ADD COLUMN "ozonDeliveryRequest" JSONB;

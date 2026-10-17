-- Адрес доставки выбирается на странице оплаты Ozon, а не в нашей форме
ALTER TABLE "Order" ALTER COLUMN "recipientName" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

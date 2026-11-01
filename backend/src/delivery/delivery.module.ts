import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { OzonDeliveryService } from "./ozon-delivery.service";
import { DeliveryPointService } from "./delivery-point.service";
import { DeliveryController } from "./delivery.controller";

@Module({
    imports: [HttpModule],
    controllers: [DeliveryController],
    providers: [OzonDeliveryService, DeliveryPointService],
    exports: [OzonDeliveryService, DeliveryPointService],
})
export class DeliveryModule {}

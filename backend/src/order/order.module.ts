import { Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { WebhookController } from "./webhook.controller";
import { PaymentModule } from "../payment/payment.module";

@Module({
    imports: [PaymentModule],
    controllers: [OrderController, WebhookController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule {}

import {
    Body,
    Controller,
    ForbiddenException,
    HttpCode,
    Post,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { OzonService } from "../payment/ozon.service";
import type { OzonNotification } from "../payment/ozon-signature";

@Controller("webhook")
export class WebhookController {
    constructor(
        private readonly orderService: OrderService,
        private readonly ozonService: OzonService,
    ) {}

    // Уведомления Ozon о платежах (URL указывается в настройках токена)
    @Post("invoice")
    @HttpCode(200)
    async invoice(@Body() body: OzonNotification) {
        if (!this.ozonService.verifyNotification(body)) {
            throw new ForbiddenException("Неверная подпись");
        }
        if (body.orderID) {
            await this.orderService.handleOzonNotification(
                String(body.orderID),
            );
        }
        return { success: true };
    }
}

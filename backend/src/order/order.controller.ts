import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Request,
    UseGuards,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CalculateOrderDto, CreateOrderDto } from "./dto/create-order.dto";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";
import { OzonService } from "../payment/ozon.service";
import type { OzonNotification } from "../payment/ozon-signature";

@Controller("order")
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly ozonService: OzonService,
    ) {}

    @Post("calculate")
    calculate(@Body() dto: CalculateOrderDto) {
        const { itemsTotal, deliveryPrice, freeDeliveryFrom, total } =
            this.orderService.calculate(dto.items);
        return { itemsTotal, deliveryPrice, freeDeliveryFrom, total };
    }

    @UseGuards(JwtCookieAuthGuard)
    @Post()
    async create(@Request() req, @Body() dto: CreateOrderDto) {
        const order = await this.orderService.create(req.user.id, dto);
        return { order };
    }

    // Уведомления Ozon о платежах (URL указывается в настройках токена)
    @Post("ozon/notification")
    @HttpCode(200)
    async ozonNotification(@Body() body: OzonNotification) {
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

    @UseGuards(JwtCookieAuthGuard)
    @Get()
    async findAll(@Request() req) {
        const orders = await this.orderService.findAll(req.user.id);
        return { orders };
    }

    @UseGuards(JwtCookieAuthGuard)
    @Get(":id")
    async findOne(@Request() req, @Param("id", ParseIntPipe) id: number) {
        const order = await this.orderService.findOne(req.user.id, id);
        return { order };
    }
}

import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CalculateOrderDto, CreateOrderDto } from "./dto/create-order.dto";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";

@Controller("order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

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
}

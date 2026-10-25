import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Request,
    UseGuards,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { CalculateOrderDto, CreateOrderDto } from "./dto/create-order.dto";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";

@Controller("order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post("calculate")
    async calculate(@Body() dto: CalculateOrderDto) {
        const { itemsTotal, total } = await this.orderService.calculate(
            dto.items,
        );
        return { itemsTotal, total };
    }

    @UseGuards(JwtCookieAuthGuard)
    @Post()
    async create(@Request() req, @Body() dto: CreateOrderDto) {
        const order = await this.orderService.create(req.user.id, dto);
        return { order };
    }

    @UseGuards(JwtCookieAuthGuard)
    @Get()
    async findAll(@Request() req) {
        const orders = await this.orderService.findAll(req.user.id);
        return { orders };
    }

    // Объявлен до :id, иначе "probe" будет принят за номер заказа
    @UseGuards(JwtCookieAuthGuard)
    @Get("probe")
    async findProbePurchase(@Request() req) {
        const purchase = await this.orderService.findProbePurchase(req.user.id);
        return { purchase };
    }

    @UseGuards(JwtCookieAuthGuard)
    @Get(":id")
    async findOne(@Request() req, @Param("id", ParseIntPipe) id: number) {
        const order = await this.orderService.findOne(req.user.id, id);
        return { order };
    }
}

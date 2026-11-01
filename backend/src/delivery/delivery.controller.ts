import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DeliveryPointService } from "./delivery-point.service";
import { SearchPointsDto } from "./dto/search-points.dto";
import { JwtCookieAuthGuard } from "../auth/guards/jwtCookie-auth.guard";

const MIN_QUERY_LENGTH = 3;

@Controller("delivery")
export class DeliveryController {
    constructor(private readonly points: DeliveryPointService) {}

    // Пункты выдачи Ozon по части адреса: ?q=москва тверская
    @UseGuards(JwtCookieAuthGuard)
    @Get("points")
    async search(@Query() { q = "" }: SearchPointsDto) {
        const query = q.trim();
        if (query.length < MIN_QUERY_LENGTH) return { items: [] };
        return { items: await this.points.search(query) };
    }
}

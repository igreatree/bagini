import {
    BadRequestException,
    Controller,
    Get,
    NotFoundException,
    Param,
    Query,
} from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { ListProductsDto } from "./dto/list-products.dto";

const MAX_IDS = 50;
const PRODUCT_ID = /^\d+$/;

@Controller("products")
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) {}

    @Get()
    list(@Query() query: ListProductsDto) {
        return this.catalogService.list(query);
    }

    // Товары корзины: ?ids=1,2,3. Недоступные товары в ответ не попадают.
    @Get("by-ids")
    async findByIds(@Query("ids") ids = "") {
        const list = [...new Set(ids.split(",").filter(Boolean))];
        if (list.length > MAX_IDS || list.some((id) => !PRODUCT_ID.test(id))) {
            throw new BadRequestException("Некорректный список товаров");
        }
        const items = list.length
            ? await this.catalogService.findByIds(list)
            : [];
        return { items };
    }

    @Get(":id")
    async findOne(@Param("id") id: string) {
        const product = PRODUCT_ID.test(id)
            ? await this.catalogService.findOne(id)
            : null;
        if (!product) throw new NotFoundException("Товар не найден");
        return { product };
    }
}

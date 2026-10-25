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
import { SheetService } from "../sheet/sheet.service";

const MAX_IDS = 50;
const PRODUCT_ID = /^\d+$/;

@Controller("products")
export class CatalogController {
    constructor(
        private readonly catalogService: CatalogService,
        private readonly sheet: SheetService,
    ) {}

    // Пробники продаются через таблицу остатков. Если она недоступна, каталог всё
    // равно открывается: при оформлении заказа пробники проверяются отдельно.
    private async probeStocks() {
        try {
            return await this.sheet.getStocks();
        } catch {
            return new Map<string, number>();
        }
    }

    // Пробник можно купить в одном экземпляре и только пока он есть в таблице
    private markProbes<T extends { offerId: string; stock: number }>(
        products: T[],
        stocks: Map<string, number>,
    ) {
        return products.flatMap((product) => {
            const sheetStock = stocks.get(product.offerId);
            if (sheetStock === undefined) return [{ ...product, probe: false }];
            if (sheetStock < 1) return [];
            return [{ ...product, probe: true, stock: 1 }];
        });
    }

    @Get()
    async list(@Query() query: ListProductsDto) {
        const stocks = await this.probeStocks();
        return this.catalogService.list({
            ...query,
            excludeOfferIds: new Set(stocks.keys()),
        });
    }

    @Get("probes")
    async probes() {
        const stocks = await this.sheet.getStocks();
        const products = await this.catalogService.findByOfferIds([
            ...stocks.keys(),
        ]);
        return { items: this.markProbes(products, stocks) };
    }

    // Товары корзины: ?ids=1,2,3. Недоступные товары в ответ не попадают.
    @Get("by-ids")
    async findByIds(@Query("ids") ids = "") {
        const list = [...new Set(ids.split(",").filter(Boolean))];
        if (list.length > MAX_IDS || list.some((id) => !PRODUCT_ID.test(id))) {
            throw new BadRequestException("Некорректный список товаров");
        }
        const products = list.length
            ? await this.catalogService.findByIds(list)
            : [];
        return {
            items: this.markProbes(products, await this.probeStocks()),
        };
    }

    @Get(":id")
    async findOne(@Param("id") id: string) {
        const found = PRODUCT_ID.test(id)
            ? await this.catalogService.findOne(id)
            : null;
        const [product] = found
            ? this.markProbes([found], await this.probeStocks())
            : [];
        if (!product) throw new NotFoundException("Товар не найден");
        return { product };
    }
}

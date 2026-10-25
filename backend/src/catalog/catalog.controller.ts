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
import { SheetItem, SheetService } from "../sheet/sheet.service";

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
    private async probeItems() {
        try {
            return await this.sheet.getItems();
        } catch {
            return new Map<string, SheetItem>();
        }
    }

    // Пробник можно купить в одном экземпляре и только пока он есть в таблице.
    // Цена пробника — из таблицы, цена на Ozon для него не важна.
    private markProbes<
        T extends { offerId: string; stock: number; price: number },
    >(products: T[], items: Map<string, SheetItem>) {
        return products.flatMap((product) => {
            const sheetItem = items.get(product.offerId);
            if (sheetItem === undefined) return [{ ...product, probe: false }];
            if (sheetItem.stock < 1) return [];
            return [
                {
                    ...product,
                    probe: true,
                    stock: 1,
                    price: sheetItem.price ?? product.price,
                },
            ];
        });
    }

    @Get()
    async list(@Query() query: ListProductsDto) {
        const items = await this.probeItems();
        return this.catalogService.list({
            ...query,
            excludeOfferIds: new Set(items.keys()),
        });
    }

    @Get("probes")
    async probes() {
        const sheetItems = await this.sheet.getItems();
        const products = await this.catalogService.findByOfferIds([
            ...sheetItems.keys(),
        ]);
        return { items: this.markProbes(products, sheetItems) };
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
            items: this.markProbes(products, await this.probeItems()),
        };
    }

    @Get(":id")
    async findOne(@Param("id") id: string) {
        const found = PRODUCT_ID.test(id)
            ? await this.catalogService.findOne(id)
            : null;
        const [product] = found
            ? this.markProbes([found], await this.probeItems())
            : [];
        if (!product) throw new NotFoundException("Товар не найден");
        return { product };
    }
}

import {
    BadGatewayException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RedisService } from "../redis/redis.service";
import { SheetService } from "../sheet/sheet.service";

const SELLER_API_URL = "https://api-seller.ozon.ru";
// Максимум для /v3/product/list и /v3/product/info/list
const BATCH_SIZE = 1000;
const MAX_LIST_PAGES = 50;
// "В продаже": товар активен и есть на складе (VISIBLE включает и товары без остатков)
const PRODUCT_VISIBILITY = "IN_SALE";
const LIST_CACHE_KEY = "catalog:products";
// Остатки меняются часто, поэтому кэш короткий
const LIST_CACHE_TTL = 60;
// Маркировка товара почти не меняется, поэтому кэшируем дольше
const MARKING_CACHE_KEY = "catalog:marking";
const MARKING_CACHE_TTL = 60 * 60;
// Атрибут Ozon "Нужен код маркировки"
const MARKING_ATTRIBUTE_ID = 23536;
const DESCRIPTION_CACHE_TTL = 60 * 60;

export type CatalogProduct = {
    id: string;
    offerId: string;
    productName: string;
    price: number;
    images: string[];
    // SKU в системе Ozon: по нему Ozon Доставка находит товар
    sku: number | null;
    // Сколько штук можно купить: остаток на складах за вычетом резерва
    stock: number;
};

export type CatalogPage = {
    items: CatalogProduct[];
    total: number;
    page: number;
    limit: number;
    pages: number;
};

const chunk = <T>(list: T[], size: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < list.length; i += size) {
        chunks.push(list.slice(i, i + size));
    }
    return chunks;
};

const toStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === "string" && item);
    }
    return typeof value === "string" && value ? [value] : [];
};

const toStock = (raw: any) =>
    ((raw?.stocks?.stocks ?? []) as { present?: number; reserved?: number }[])
        .map((stock) =>
            Math.max(0, (stock.present ?? 0) - (stock.reserved ?? 0)),
        )
        .reduce((sum, available) => sum + available, 0);

// Пробники продаются по остатку из таблицы, поэтому нулевой остаток на Ozon
// для них не повод скрывать товар (ignoreStock)
const toProduct = (
    raw: any,
    options: { ignoreStock?: boolean } = {},
): CatalogProduct | null => {
    const price = Math.round(Number(raw?.price));
    const stock = toStock(raw);
    if (!raw?.id || !raw?.name || raw.is_archived || !(price > 0)) return null;
    if (!stock && !options.ignoreStock) return null;

    return {
        id: String(raw.id),
        offerId: String(raw.offer_id ?? ""),
        productName: String(raw.name),
        price,
        images: [
            ...new Set([
                ...toStringList(raw.primary_image),
                ...toStringList(raw.images),
            ]),
        ],
        sku: Number(raw.sku) || null,
        stock,
    };
};

const needsMarking = (item: any) =>
    (
        (item?.attributes ?? []) as {
            id: number;
            values?: { value?: string }[];
        }[]
    )
        .filter((attribute) => attribute.id === MARKING_ATTRIBUTE_ID)
        .some((attribute) =>
            (attribute.values ?? []).some((value) =>
                /^(true|да)$/i.test(String(value.value ?? "").trim()),
            ),
        );

// В описании Ozon встречается HTML-разметка, оставляем только текст
const toPlainText = (html: string) =>
    html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

@Injectable()
export class CatalogService {
    private readonly logger = new Logger(CatalogService.name);
    private loading: Promise<CatalogProduct[]> | null = null;

    constructor(
        private httpService: HttpService,
        private redis: RedisService,
        private sheet: SheetService,
    ) {}

    private get credentials() {
        const apiKey = process.env.OZON_SELLER_API_KEY;
        const clientId = process.env.OZON_SELLER_CLIENT_ID;
        if (!apiKey || !clientId) {
            throw new InternalServerErrorException("Каталог Ozon не настроен");
        }
        return { "Api-Key": apiKey, "Client-Id": clientId };
    }

    private async post(path: string, body: object) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${SELLER_API_URL}${path}`, body, {
                    headers: this.credentials,
                    timeout: 15_000,
                }),
            );
            return response.data;
        } catch (error: any) {
            if (error instanceof InternalServerErrorException) throw error;
            this.logger.error(
                `Ozon Seller ${path} failed: ${error?.message} ${JSON.stringify(error?.response?.data)}`,
            );
            throw new BadGatewayException("Ошибка сервиса каталога");
        }
    }

    private async fetchProductIds() {
        const ids: string[] = [];
        let lastId = "";
        for (let page = 0; page < MAX_LIST_PAGES; page++) {
            const data = await this.post("/v3/product/list", {
                filter: { visibility: PRODUCT_VISIBILITY },
                last_id: lastId,
                limit: BATCH_SIZE,
            });
            const items: { product_id: number | string }[] =
                data?.result?.items ?? [];
            ids.push(...items.map((item) => String(item.product_id)));
            lastId = data?.result?.last_id ?? "";
            if (items.length < BATCH_SIZE || !lastId) break;
        }
        return ids;
    }

    // Для маркированных товаров Ozon Доставка требует двойную фискализацию с
    // кодами маркировки, поэтому такие товары в магазине не продаём.
    private async loadMarking(ids: string[]) {
        const cached = await this.redis.get(MARKING_CACHE_KEY);
        const marking: Record<string, boolean> = cached
            ? JSON.parse(cached)
            : {};

        const missing = ids.filter((id) => !(id in marking));
        for (const batch of chunk(missing, BATCH_SIZE)) {
            const data = await this.post("/v4/product/info/attributes", {
                filter: { product_id: batch, visibility: "ALL" },
                limit: BATCH_SIZE,
            });
            for (const item of data?.result ?? []) {
                marking[String(item.id)] = needsMarking(item);
            }
        }
        if (missing.length > 0) {
            await this.redis.setWithExpiry(
                MARKING_CACHE_KEY,
                JSON.stringify(marking),
                MARKING_CACHE_TTL,
            );
        }
        return marking;
    }

    // Пробники из таблицы остатков: ищем по артикулу, без фильтра «в продаже»
    private async fetchProbes() {
        let offerIds: string[];
        try {
            offerIds = [...(await this.sheet.getStocks()).keys()];
        } catch {
            // Без таблицы каталог работает, а пробники при оформлении заказа не найдутся
            return [];
        }

        const probes: CatalogProduct[] = [];
        for (const batch of chunk(offerIds, BATCH_SIZE)) {
            const data = await this.post("/v3/product/info/list", {
                offer_id: batch,
            });
            for (const raw of data?.items ?? []) {
                const product = toProduct(raw, { ignoreStock: true });
                if (product) probes.push(product);
            }
        }
        return probes;
    }

    private async fetchProducts() {
        const ids = await this.fetchProductIds();
        const products: CatalogProduct[] = [];
        for (const batch of chunk(ids, BATCH_SIZE)) {
            const data = await this.post("/v3/product/info/list", {
                product_id: batch,
            });
            for (const raw of data?.items ?? []) {
                const product = toProduct(raw);
                if (product) products.push(product);
            }
        }

        const known = new Set(products.map((product) => product.id));
        products.push(
            ...(await this.fetchProbes()).filter(
                (probe) => !known.has(probe.id),
            ),
        );

        // Товар, для которого признак маркировки не получен, не продаём
        const marking = await this.loadMarking(products.map((p) => p.id));
        return products.filter((product) => marking[product.id] === false);
    }

    private async loadAll(fresh = false): Promise<CatalogProduct[]> {
        if (!fresh) {
            const cached = await this.redis.get(LIST_CACHE_KEY);
            if (cached) return JSON.parse(cached);
        }

        const products = await this.fetchProducts();
        await this.redis.setWithExpiry(
            LIST_CACHE_KEY,
            JSON.stringify(products),
            LIST_CACHE_TTL,
        );
        return products;
    }

    // Параллельные запросы делят один обход Seller API. fresh пропускает кэш:
    // он нужен при оформлении заказа, чтобы не продать то, чего уже нет.
    private getAll(fresh = false) {
        if (fresh) return this.loadAll(true);
        this.loading ??= this.loadAll().finally(() => {
            this.loading = null;
        });
        return this.loading;
    }

    async list(params: {
        page: number;
        limit: number;
        search?: string;
        // Товары, которые продаются отдельно (пробники), в общем каталоге не показываем
        excludeOfferIds?: Set<string>;
    }): Promise<CatalogPage> {
        const words = (params.search ?? "")
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        const all = (await this.getAll()).filter(
            (product) => !params.excludeOfferIds?.has(product.offerId),
        );
        const found = words.length
            ? all.filter((product) => {
                  const haystack =
                      `${product.productName} ${product.offerId}`.toLowerCase();
                  return words.every((word) => haystack.includes(word));
              })
            : all;

        const pages = Math.max(1, Math.ceil(found.length / params.limit));
        const page = Math.min(params.page, pages);
        const start = (page - 1) * params.limit;

        return {
            items: found.slice(start, start + params.limit),
            total: found.length,
            page,
            limit: params.limit,
            pages,
        };
    }

    async findByIds(ids: string[], options: { fresh?: boolean } = {}) {
        const wanted = new Set(ids);
        const all = await this.getAll(options.fresh);
        return all.filter((product) => wanted.has(product.id));
    }

    async findByOfferIds(offerIds: string[]) {
        const wanted = new Set(offerIds);
        const all = await this.getAll();
        return all.filter((product) => wanted.has(product.offerId));
    }

    async findOne(id: string) {
        const [product] = await this.findByIds([id]);
        if (!product) return null;
        return { ...product, description: await this.getDescription(id) };
    }

    // Описания нет в списке товаров, поэтому запрашиваем отдельно и кэшируем
    private async getDescription(id: string): Promise<string | undefined> {
        const key = `${LIST_CACHE_KEY}:description:${id}`;
        const cached = await this.redis.get(key);
        if (cached !== null) return cached || undefined;

        try {
            const data = await this.post("/v1/product/info/description", {
                product_id: Number(id),
            });
            const description = toPlainText(
                String(data?.result?.description ?? ""),
            );
            await this.redis.setWithExpiry(
                key,
                description,
                DESCRIPTION_CACHE_TTL,
            );
            return description || undefined;
        } catch {
            // Без описания карточка товара всё равно открывается
            return undefined;
        }
    }
}

import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RedisService } from "../redis/redis.service";

const ITEMS_CACHE_KEY = "sheet:items";
// Остатки меняются при каждой покупке, поэтому кэш короткий
const ITEMS_CACHE_TTL = 30;
// Последний удачный ответ: по нему определяем, какие товары пробники, пока Apps Script недоступен
const ITEMS_STALE_KEY = "sheet:items:stale";
const ITEMS_STALE_TTL = 24 * 60 * 60;

export type StockChange = { offerId: string; quantity: number };

// price — цена из таблицы, null если в ответе её нет (тогда действует цена Ozon)
export type SheetItem = { stock: number; price: number | null };

// Пустая или некорректная ячейка — не цена: иначе пустая клетка превратилась бы в 0 ₽
const toPrice = (raw: unknown) => {
    if (raw === null || raw === undefined || raw === "") return null;
    const price = Number(raw);
    return Number.isFinite(price) && price >= 0 ? Math.round(price) : null;
};

// Таблица остатков пробников (Google Sheets) доступна через веб-приложение Apps Script
@Injectable()
export class SheetService {
    private readonly logger = new Logger(SheetService.name);

    constructor(
        private httpService: HttpService,
        private redis: RedisService,
    ) {}

    private get config() {
        const url = process.env.SHEET_URL;
        const token = process.env.SHEET_SCRIPT_TOKEN;
        if (!url || !token) {
            throw new InternalServerErrorException("Пробники не настроены");
        }
        return { url, token };
    }

    // Apps Script всегда отвечает 200: ошибку сценария определяем по ok: false,
    // а HTML вместо JSON означает, что веб-приложение не развёрнуто или нет доступа
    private async request(
        method: "get" | "post",
        payload: object = {},
    ): Promise<any> {
        const { url, token } = this.config;
        try {
            const response = await firstValueFrom(
                method === "get"
                    ? this.httpService.get(url, {
                          params: { token },
                          timeout: 15_000,
                      })
                    : this.httpService.post(
                          url,
                          { token, ...payload },
                          { timeout: 15_000 },
                      ),
            );
            if (typeof response.data !== "object" || response.data === null) {
                throw new Error("unexpected response");
            }
            return response.data;
        } catch (error: any) {
            this.logger.error(
                `Apps Script ${method} failed: ${error?.message}`,
            );
            throw new BadGatewayException("Ошибка сервиса пробников");
        }
    }

    private async fetchItems() {
        const data = await this.request("get");
        if (!data.ok) {
            this.logger.error(`Apps Script get: ${data.error}`);
            throw new BadGatewayException("Ошибка сервиса пробников");
        }
        const items: Record<string, SheetItem> = {};
        for (const item of data.items ?? []) {
            items[String(item.offerId)] = {
                stock: Number(item.stock),
                price: toPrice(item.price),
            };
        }
        return items;
    }

    // Артикул Ozon → остаток и цена пробника в таблице
    async getItems(): Promise<Map<string, SheetItem>> {
        const cached = await this.redis.get(ITEMS_CACHE_KEY);
        if (cached) return new Map(Object.entries(JSON.parse(cached)));

        try {
            const items = await this.fetchItems();
            const json = JSON.stringify(items);
            await this.redis.setWithExpiry(
                ITEMS_CACHE_KEY,
                json,
                ITEMS_CACHE_TTL,
            );
            await this.redis.setWithExpiry(
                ITEMS_STALE_KEY,
                json,
                ITEMS_STALE_TTL,
            );
            return new Map(Object.entries(items));
        } catch (error) {
            const stale = await this.redis.get(ITEMS_STALE_KEY);
            if (!stale) throw error;
            this.logger.warn("Таблица недоступна, используем прошлые данные");
            return new Map(Object.entries(JSON.parse(stale)));
        }
    }

    // Таблица списывает остатки под блокировкой и либо принимает все позиции, либо ни одной
    private async change(action: "reserve" | "release", items: StockChange[]) {
        const data = await this.request("post", { action, items });
        await this.redis.del(ITEMS_CACHE_KEY);
        if (data.ok) return;

        if (data.error === "OUT_OF_STOCK" || data.error === "NOT_FOUND") {
            throw new BadRequestException("Пробник закончился");
        }
        this.logger.error(
            `Apps Script ${action}: ${data.error} ${data.offerId ?? ""}`,
        );
        throw new BadGatewayException("Ошибка сервиса пробников");
    }

    reserve(items: StockChange[]) {
        return this.change("reserve", items);
    }

    release(items: StockChange[]) {
        return this.change("release", items);
    }
}

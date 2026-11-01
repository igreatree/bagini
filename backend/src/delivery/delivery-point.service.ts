import {
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { OzonDeliveryService } from "./ozon-delivery.service";

const SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SYNC_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const PAGE_SIZE = 100;
// Защита от бесконечного обхода, если Ozon не завершит список
const MAX_PAGES = 2000;
const SEARCH_LIMIT = 20;
const MAX_SEARCH_WORDS = 6;

// Справочник пунктов выдачи Ozon Доставки: API отдаёт его только целиком, поэтому
// храним копию в базе и обновляем раз в сутки, а покупателю ищем по ней.
@Injectable()
export class DeliveryPointService
    implements OnApplicationBootstrap, OnModuleDestroy
{
    private readonly logger = new Logger(DeliveryPointService.name);
    private syncing: Promise<void> | null = null;
    private timer?: ReturnType<typeof setInterval>;

    constructor(
        private prisma: PrismaService,
        private ozon: OzonDeliveryService,
    ) {}

    onApplicationBootstrap() {
        // Без доступа к Ozon Доставке справочник не нужен: не мешаем запуску остального
        if (!this.ozon.isConfigured) return;
        this.syncIfStale();
        this.timer = setInterval(
            () => this.syncIfStale(),
            SYNC_CHECK_INTERVAL_MS,
        );
        this.timer.unref();
    }

    onModuleDestroy() {
        clearInterval(this.timer);
    }

    // Обход идёт в фоне: поиск работает по прошлой копии, пока справочник обновляется
    private syncIfStale() {
        this.syncing ??= this.syncIfOutdated()
            .catch((error) =>
                this.logger.error(
                    `Не удалось обновить пункты выдачи: ${error?.message}`,
                ),
            )
            .finally(() => {
                this.syncing = null;
            });
        return this.syncing;
    }

    private async syncIfOutdated() {
        const { _max } = await this.prisma.deliveryPoint.aggregate({
            _max: { syncedAt: true },
        });
        const syncedAt = _max.syncedAt;
        if (syncedAt && Date.now() - syncedAt.getTime() < SYNC_MAX_AGE_MS) {
            return;
        }
        await this.sync();
    }

    async sync() {
        const startedAt = new Date();
        let cursor: string | null = null;
        let total = 0;

        for (let page = 0; page < MAX_PAGES; page++) {
            const list = await this.ozon.listPoints(cursor, PAGE_SIZE);
            const methods = new Map(
                list.points.map((point) => [point.id, point.shipmentMethodIds]),
            );
            const infos = await this.ozon.getPoints([...methods.keys()]);

            await this.prisma.$transaction(
                infos.map((info) => {
                    const data = {
                        name: info.name,
                        address: info.address,
                        type: info.type,
                        latitude: info.latitude,
                        longitude: info.longitude,
                        isActive: info.isActive,
                        shipmentMethodIds: methods.get(info.id) ?? [],
                        syncedAt: new Date(),
                    };
                    return this.prisma.deliveryPoint.upsert({
                        where: { id: info.id },
                        create: { id: info.id, ...data },
                        update: data,
                    });
                }),
            );
            total += infos.length;

            if (
                !list.nextCursor ||
                list.nextCursor === cursor ||
                list.points.length === 0
            ) {
                // Список дочитан: пункты, которых в нём больше нет, закрыты
                await this.prisma.deliveryPoint.updateMany({
                    where: { syncedAt: { lt: startedAt } },
                    data: { isActive: false },
                });
                this.logger.log(`Пункты выдачи Ozon обновлены: ${total}`);
                return;
            }
            cursor = list.nextCursor;
        }
        this.logger.error(
            "Обход пунктов выдачи Ozon прерван: слишком много страниц",
        );
    }

    // Пункты, куда можно отправить посылку нашим способом отгрузки
    private available() {
        return {
            isActive: true,
            shipmentMethodIds: { has: this.ozon.shipmentMethodId ?? 0 },
        };
    }

    // Каждое слово запроса должно встретиться в названии или адресе пункта
    search(query: string) {
        const words = query
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, MAX_SEARCH_WORDS);
        if (words.length === 0) return Promise.resolve([]);

        return this.prisma.deliveryPoint.findMany({
            where: {
                ...this.available(),
                AND: words.map((word) => ({
                    OR: [
                        {
                            address: {
                                contains: word,
                                mode: "insensitive" as const,
                            },
                        },
                        {
                            name: {
                                contains: word,
                                mode: "insensitive" as const,
                            },
                        },
                    ],
                })),
            },
            select: { id: true, name: true, address: true, type: true },
            orderBy: { address: "asc" },
            take: SEARCH_LIMIT,
        });
    }

    findAvailable(id: number) {
        return this.prisma.deliveryPoint.findFirst({
            where: { id, ...this.available() },
            select: { id: true, name: true, address: true },
        });
    }
}

import {
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleDestroy,
    ServiceUnavailableException,
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
        const seenCursors = new Set<string>();
        const seenIds: bigint[] = [];

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
                        shipmentMethodIds: (methods.get(info.id) ?? []).map(
                            BigInt,
                        ),
                    };
                    return this.prisma.deliveryPoint.upsert({
                        where: { id: BigInt(info.id) },
                        create: {
                            id: BigInt(info.id),
                            syncedAt: new Date(0),
                            ...data,
                        },
                        update: data,
                    });
                }),
            );
            total += infos.length;
            seenIds.push(...infos.map((info) => BigInt(info.id)));

            if (!list.nextCursor) {
                // Дату полного обновления меняем только после последней страницы.
                // Иначе сбой на середине обхода делает неполный справочник «свежим» на сутки.
                const updates: ReturnType<
                    typeof this.prisma.deliveryPoint.updateMany
                >[] = [];
                for (let offset = 0; offset < seenIds.length; offset += 1000) {
                    updates.push(
                        this.prisma.deliveryPoint.updateMany({
                            where: {
                                id: {
                                    in: seenIds.slice(offset, offset + 1000),
                                },
                            },
                            data: { syncedAt: startedAt },
                        }),
                    );
                }
                updates.push(
                    this.prisma.deliveryPoint.updateMany({
                        where: { syncedAt: { lt: startedAt } },
                        data: { isActive: false },
                    }),
                );
                await this.prisma.$transaction(updates);
                this.logger.log(`Пункты выдачи Ozon обновлены: ${total}`);
                return;
            }
            if (seenCursors.has(list.nextCursor) || list.points.length === 0) {
                throw new Error(
                    "Ozon вернул незавершённый список пунктов выдачи",
                );
            }
            seenCursors.add(list.nextCursor);
            cursor = list.nextCursor;
        }
        throw new Error(
            "Обход пунктов выдачи Ozon прерван: слишком много страниц",
        );
    }

    // Пункты, куда можно отправить посылку нашим способом отгрузки
    private available() {
        return {
            isActive: true,
            shipmentMethodIds: { has: BigInt(this.ozon.shipmentMethodId ?? 0) },
        };
    }

    // Каждое слово запроса должно встретиться в названии или адресе пункта
    async search(query: string) {
        if (!this.ozon.isConfigured) {
            throw new ServiceUnavailableException("Доставка Ozon не настроена");
        }
        const words = query
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, MAX_SEARCH_WORDS);
        if (words.length === 0) return Promise.resolve([]);

        const points = await this.prisma.deliveryPoint.findMany({
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
        if (points.length === 0 && this.syncing) {
            throw new ServiceUnavailableException(
                "Список пунктов выдачи обновляется. Повторите поиск через минуту",
            );
        }
        return points.map((point) => ({ ...point, id: Number(point.id) }));
    }

    async findAvailable(id: number) {
        const point = await this.prisma.deliveryPoint.findFirst({
            where: { id: BigInt(id), ...this.available() },
            select: { id: true, name: true, address: true },
        });
        return point ? { ...point, id: Number(point.id) } : null;
    }
}

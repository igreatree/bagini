// Зависимости с ESM-пакетами и подключением к БД в юнит-тесте не нужны
jest.mock("../prisma.service", () => ({ PrismaService: class {} }));
jest.mock("./ozon-delivery.service", () => ({
    OzonDeliveryService: class {},
}));

import { DeliveryPointService } from "./delivery-point.service";

describe("DeliveryPointService", () => {
    const info = (id: number) => ({
        id,
        name: `Пункт ${id}`,
        address: `Москва, улица ${id}`,
        type: "PICKUP_POINT",
        latitude: 55.7,
        longitude: 37.6,
        isActive: true,
    });

    const build = (
        options: {
            pages?: { ids: number[]; nextCursor: string | null }[];
            syncedAt?: Date | null;
            isConfigured?: boolean;
        } = {},
    ) => {
        const pages = options.pages ?? [{ ids: [1, 2], nextCursor: null }];
        const listPoints = jest.fn();
        pages.forEach((page) =>
            listPoints.mockResolvedValueOnce({
                points: page.ids.map((id) => ({
                    id,
                    shipmentMethodIds: [77],
                })),
                nextCursor: page.nextCursor,
            }),
        );
        const ozon = {
            isConfigured: options.isConfigured ?? true,
            shipmentMethodId: 77,
            listPoints,
            getPoints: jest
                .fn()
                .mockImplementation(async (ids: number[]) => ids.map(info)),
        };
        const prisma = {
            deliveryPoint: {
                aggregate: jest.fn().mockResolvedValue({
                    _max: { syncedAt: options.syncedAt ?? null },
                }),
                upsert: jest.fn().mockImplementation((args) => args),
                updateMany: jest.fn().mockResolvedValue({ count: 0 }),
                findMany: jest.fn().mockResolvedValue([]),
                findFirst: jest.fn().mockResolvedValue(null),
            },
            $transaction: jest.fn().mockResolvedValue([]),
        };
        const service = new DeliveryPointService(prisma as any, ozon as any);
        return { service, prisma, ozon };
    };

    describe("sync", () => {
        it("walks all pages and stores every point with its shipment methods", async () => {
            const { service, prisma, ozon } = build({
                pages: [
                    { ids: [1, 2], nextCursor: "c1" },
                    { ids: [3], nextCursor: null },
                ],
            });

            await service.sync();

            expect(
                ozon.listPoints.mock.calls.map(([cursor]) => cursor),
            ).toEqual([null, "c1"]);
            const upserts = prisma.$transaction.mock.calls.flatMap(
                ([list]) => list,
            );
            expect(upserts.map((upsert) => upsert.where.id)).toEqual([1, 2, 3]);
            expect(upserts[0].create).toMatchObject({
                id: 1,
                address: "Москва, улица 1",
                shipmentMethodIds: [77],
                isActive: true,
            });
        });

        it("closes points that are no longer in the directory", async () => {
            const { service, prisma } = build();

            await service.sync();

            expect(prisma.deliveryPoint.updateMany).toHaveBeenCalledWith({
                where: { syncedAt: { lt: expect.any(Date) } },
                data: { isActive: false },
            });
        });

        it("keeps old points when the walk fails halfway", async () => {
            const { service, prisma, ozon } = build();
            ozon.listPoints.mockReset().mockRejectedValue(new Error("down"));

            await expect(service.sync()).rejects.toThrow("down");
            expect(prisma.deliveryPoint.updateMany).not.toHaveBeenCalled();
        });

        it("stops when Ozon repeats the cursor", async () => {
            const { service, ozon, prisma } = build({
                pages: [
                    { ids: [1], nextCursor: "c1" },
                    { ids: [2], nextCursor: "c1" },
                ],
            });

            await service.sync();

            expect(ozon.listPoints).toHaveBeenCalledTimes(2);
            expect(prisma.deliveryPoint.updateMany).toHaveBeenCalled();
        });
    });

    describe("bootstrap", () => {
        it("does not call Ozon when delivery is not configured", async () => {
            const { service, prisma } = build({ isConfigured: false });

            service.onApplicationBootstrap();
            service.onModuleDestroy();

            expect(prisma.deliveryPoint.aggregate).not.toHaveBeenCalled();
        });

        it("loads the directory when it is empty", async () => {
            const { service, ozon } = build();

            service.onApplicationBootstrap();
            service.onModuleDestroy();
            await new Promise((resolve) => setImmediate(resolve));

            expect(ozon.listPoints).toHaveBeenCalledTimes(1);
        });

        it("does not reload a fresh directory", async () => {
            const { service, ozon, prisma } = build({ syncedAt: new Date() });

            service.onApplicationBootstrap();
            service.onModuleDestroy();
            await new Promise((resolve) => setImmediate(resolve));

            expect(prisma.deliveryPoint.aggregate).toHaveBeenCalled();
            expect(ozon.listPoints).not.toHaveBeenCalled();
        });

        it("reloads a directory older than a day", async () => {
            const { service, ozon } = build({
                syncedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
            });

            service.onApplicationBootstrap();
            service.onModuleDestroy();
            await new Promise((resolve) => setImmediate(resolve));

            expect(ozon.listPoints).toHaveBeenCalledTimes(1);
        });
    });

    describe("search", () => {
        it("requires every word in the name or address of an open point", async () => {
            const { service, prisma } = build();

            await service.search("москва  тверская");

            const { where, take } =
                prisma.deliveryPoint.findMany.mock.calls[0][0];
            expect(where.isActive).toBe(true);
            expect(where.shipmentMethodIds).toEqual({ has: 77 });
            expect(where.AND).toHaveLength(2);
            expect(where.AND[1].OR[0]).toEqual({
                address: { contains: "тверская", mode: "insensitive" },
            });
            expect(take).toBe(20);
        });

        it("returns nothing for an empty query", async () => {
            const { service, prisma } = build();

            await expect(service.search("   ")).resolves.toEqual([]);
            expect(prisma.deliveryPoint.findMany).not.toHaveBeenCalled();
        });
    });

    describe("findAvailable", () => {
        it("looks for an open point with our shipment method", async () => {
            const { service, prisma } = build();

            await service.findAvailable(555);

            expect(prisma.deliveryPoint.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: 555,
                        isActive: true,
                        shipmentMethodIds: { has: 77 },
                    },
                }),
            );
        });
    });
});

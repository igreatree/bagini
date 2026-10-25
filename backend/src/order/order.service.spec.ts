// Зависимости с ESM-пакетами и подключением к БД в юнит-тесте не нужны
jest.mock("../prisma.service", () => ({ PrismaService: class {} }));
jest.mock("../payment/ozon.service", () => ({ OzonService: class {} }));
jest.mock("../catalog/catalog.service", () => ({ CatalogService: class {} }));
jest.mock("../sheet/sheet.service", () => ({ SheetService: class {} }));

import { BadRequestException } from "@nestjs/common";
import { OrderService } from "./order.service";

describe("OrderService.calculate", () => {
    const product = (id: string, price: number, stock: number) => ({
        id,
        offerId: `offer-${id}`,
        productName: `Товар ${id}`,
        price,
        images: [],
        sku: Number(id) * 10,
        stock,
    });

    // probeStocks: артикул → остаток в таблице пробников
    const build = (
        products: ReturnType<typeof product>[],
        probeStocks: Record<string, number> = {},
    ) => {
        const findByIds = jest.fn().mockResolvedValue(products);
        const service = new OrderService(
            {} as any,
            {} as any,
            {
                findByIds,
            } as any,
            {
                getStocks: jest
                    .fn()
                    .mockResolvedValue(new Map(Object.entries(probeStocks))),
            } as any,
        );
        return { service, findByIds };
    };

    it("takes prices from the catalog and merges duplicate items", async () => {
        const { service, findByIds } = build([
            product("1", 500, 10),
            product("2", 120, 10),
        ]);

        const result = await service.calculate([
            { productId: "1", quantity: 2 },
            { productId: "2", quantity: 1 },
            { productId: "1", quantity: 1 },
        ]);

        expect(findByIds).toHaveBeenCalledWith(["1", "2"], {});
        expect(result.items).toEqual([
            { productId: "1", productName: "Товар 1", price: 500, quantity: 3 },
            { productId: "2", productName: "Товар 2", price: 120, quantity: 1 },
        ]);
        expect(result.itemsTotal).toBe(1620);
        expect(result.total).toBe(1620);
        expect(result.skus.get("1")).toBe(10);
    });

    it("rejects unavailable products", async () => {
        const { service } = build([product("1", 500, 10)]);

        await expect(
            service.calculate([{ productId: "404", quantity: 1 }]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects quantity above stock", async () => {
        const { service } = build([product("1", 500, 2)]);

        await expect(
            service.calculate([{ productId: "1", quantity: 3 }]),
        ).rejects.toThrow("в наличии только 2 шт.");
    });

    describe("probes", () => {
        it("marks items from the probe sheet", async () => {
            const { service } = build(
                [product("1", 500, 10), product("2", 90, 10)],
                {
                    "offer-2": 3,
                },
            );

            const result = await service.calculate([
                { productId: "1", quantity: 2 },
                { productId: "2", quantity: 1 },
            ]);

            expect(result.items.map((i) => i.probeOfferId)).toEqual([
                undefined,
                "offer-2",
            ]);
        });

        it("sells a probe by the sheet stock even when Ozon has none", async () => {
            const { service } = build([product("2", 90, 0)], {
                "offer-2": 3,
            });

            const result = await service.calculate([
                { productId: "2", quantity: 1 },
            ]);

            expect(result.items[0].probeOfferId).toBe("offer-2");
        });

        it("rejects more than one piece of a probe", async () => {
            const { service } = build([product("2", 90, 10)], {
                "offer-2": 3,
            });

            await expect(
                service.calculate([{ productId: "2", quantity: 2 }]),
            ).rejects.toThrow("только в одном экземпляре");
        });

        it("rejects a probe that ran out in the sheet", async () => {
            const { service } = build([product("2", 90, 10)], {
                "offer-2": 0,
            });

            await expect(
                service.calculate([{ productId: "2", quantity: 1 }]),
            ).rejects.toThrow("пробники закончились");
        });

        it("rejects two different probes in one order", async () => {
            const { service } = build(
                [product("2", 90, 10), product("3", 80, 10)],
                {
                    "offer-2": 3,
                    "offer-3": 3,
                },
            );

            await expect(
                service.calculate([
                    { productId: "2", quantity: 1 },
                    { productId: "3", quantity: 1 },
                ]),
            ).rejects.toThrow("только один пробник");
        });
    });
});

describe("OrderService.create with a probe", () => {
    const probeProduct = {
        id: "2",
        offerId: "offer-2",
        productName: "Пробник",
        price: 90,
        images: [],
        sku: 20,
        stock: 5,
    };
    const dto = { items: [{ productId: "2", quantity: 1 }] };
    const item = {
        productId: "2",
        productName: "Пробник",
        price: 90,
        quantity: 1,
        probeOfferId: "offer-2",
    };
    const order = { id: 7, extId: "ext", total: 90, items: [item] };

    const build = (
        overrides: {
            create?: jest.Mock;
            createOzonOrder?: jest.Mock;
            reserve?: jest.Mock;
        } = {},
    ) => {
        const prisma = {
            order: {
                create: overrides.create ?? jest.fn().mockResolvedValue(order),
                update: jest.fn().mockResolvedValue(order),
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                findUniqueOrThrow: jest.fn().mockResolvedValue({
                    ...order,
                    status: "cancelled",
                }),
            },
            user: { findUnique: jest.fn().mockResolvedValue({ email: null }) },
        };
        const ozon = {
            createOrder:
                overrides.createOzonOrder ??
                jest.fn().mockResolvedValue({
                    ozonOrderId: "oz-1",
                    paymentUrl: "https://pay",
                }),
        };
        const sheet = {
            getStocks: jest.fn().mockResolvedValue(new Map([["offer-2", 3]])),
            reserve:
                overrides.reserve ?? jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
        };
        const catalog = {
            findByIds: jest.fn().mockResolvedValue([probeProduct]),
        };
        const service = new OrderService(
            prisma as any,
            ozon as any,
            catalog as any,
            sheet as any,
        );
        return { service, prisma, sheet };
    };

    it("takes the account limit and reserves the probe in the sheet", async () => {
        const { service, prisma, sheet } = build();

        await service.create(42, dto);

        expect(prisma.order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ probeUserId: 42 }),
            }),
        );
        expect(sheet.reserve).toHaveBeenCalledWith([
            { offerId: "offer-2", quantity: 1 },
        ]);
        expect(sheet.release).not.toHaveBeenCalled();
    });

    it("rejects a second probe for the same account", async () => {
        const { service, sheet } = build({
            create: jest.fn().mockRejectedValue({ code: "P2002" }),
        });

        await expect(service.create(42, dto)).rejects.toThrow(
            "только один раз на аккаунт",
        );
        expect(sheet.reserve).not.toHaveBeenCalled();
    });

    it("cancels the order without returning stock when the probe sold out", async () => {
        const { service, prisma, sheet } = build({
            reserve: jest
                .fn()
                .mockRejectedValue(new Error("Пробник закончился")),
        });

        await expect(service.create(42, dto)).rejects.toThrow(
            "Пробник закончился",
        );
        expect(prisma.order.updateMany).toHaveBeenCalledWith({
            where: { id: 7, status: "pending" },
            data: { status: "cancelled", probeUserId: null },
        });
        expect(sheet.release).not.toHaveBeenCalled();
    });

    it("returns the probe to the sheet when the payment cannot be created", async () => {
        const { service, sheet } = build({
            createOzonOrder: jest.fn().mockRejectedValue(new Error("ozon")),
        });

        await expect(service.create(42, dto)).rejects.toThrow("ozon");
        expect(sheet.release).toHaveBeenCalledWith([
            { offerId: "offer-2", quantity: 1 },
        ]);
    });

    it("does not return the probe twice for an order that is already cancelled", async () => {
        const { service, prisma, sheet } = build({
            createOzonOrder: jest.fn().mockRejectedValue(new Error("ozon")),
        });
        prisma.order.updateMany.mockResolvedValue({ count: 0 });

        await expect(service.create(42, dto)).rejects.toThrow("ozon");
        expect(sheet.release).not.toHaveBeenCalled();
    });
});

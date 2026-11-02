// Зависимости с ESM-пакетами и подключением к БД в юнит-тесте не нужны
jest.mock("../prisma.service", () => ({ PrismaService: class {} }));
jest.mock("../payment/ozon.service", () => ({ OzonService: class {} }));
jest.mock("../catalog/catalog.service", () => ({ CatalogService: class {} }));
jest.mock("../sheet/sheet.service", () => ({ SheetService: class {} }));
jest.mock("../delivery/ozon-delivery.service", () => ({
    OzonDeliveryService: class {},
}));
jest.mock("../delivery/delivery-point.service", () => ({
    DeliveryPointService: class {},
}));

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

    // probeStocks: артикул → остаток в таблице пробников,
    // probePrices: артикул → цена в таблице (на цену пробника не влияет, он бесплатный)
    const build = (
        products: ReturnType<typeof product>[],
        probeStocks: Record<string, number> = {},
        probePrices: Record<string, number> = {},
    ) => {
        const findByIds = jest.fn().mockResolvedValue(products);
        const service = new OrderService(
            {} as any,
            {} as any,
            {
                findByIds,
            } as any,
            {
                getItems: jest.fn().mockResolvedValue(
                    new Map(
                        Object.entries(probeStocks).map(([offerId, stock]) => [
                            offerId,
                            {
                                stock,
                                price: probePrices[offerId] ?? null,
                            },
                        ]),
                    ),
                ),
            } as any,
            {} as any,
            {} as any,
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

            const [regular] = (
                await service.calculate([{ productId: "1", quantity: 2 }])
            ).items;
            const [probe] = (
                await service.calculate([{ productId: "2", quantity: 1 }])
            ).items;

            expect(regular.probeOfferId).toBeUndefined();
            expect(probe.probeOfferId).toBe("offer-2");
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

        it("makes a probe free regardless of the Ozon and sheet price", async () => {
            const { service } = build(
                [product("2", 90, 10)],
                { "offer-2": 3 },
                { "offer-2": 50 },
            );

            const result = await service.calculate([
                { productId: "2", quantity: 1 },
            ]);

            expect(result.items[0].price).toBe(0);
            expect(result.total).toBe(0);
        });

        it("rejects a probe together with other items", async () => {
            const { service } = build(
                [product("1", 500, 10), product("2", 90, 10)],
                { "offer-2": 3 },
            );

            await expect(
                service.calculate([
                    { productId: "1", quantity: 1 },
                    { productId: "2", quantity: 1 },
                ]),
            ).rejects.toThrow("отдельным заказом");
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

describe("OrderService.create", () => {
    const probeProduct = {
        id: "2",
        offerId: "offer-2",
        productName: "Пробник",
        price: 90,
        images: [],
        sku: 20,
        stock: 5,
    };
    const regularProduct = { ...probeProduct, id: "1", offerId: "offer-1" };
    const probeDto = {
        items: [{ productId: "2", quantity: 1 }],
        deliveryPointId: 555,
    };
    const item = {
        productId: "2",
        productName: "Пробник",
        price: 0,
        quantity: 1,
        probeOfferId: "offer-2",
    };
    const order = { id: 7, extId: "ext", total: 0, items: [item] };

    const build = (
        overrides: {
            create?: jest.Mock;
            createDeliveryOrder?: jest.Mock;
            approvePosting?: jest.Mock;
            cancelPosting?: jest.Mock;
            reserve?: jest.Mock;
            canDeliverTo?: boolean;
            pointAvailable?: boolean;
            point?: object | null;
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
            user: {
                findUnique: jest.fn().mockResolvedValue({ email: null }),
                findUniqueOrThrow: jest.fn().mockResolvedValue({
                    phone: "79001112233",
                    name: "Анна",
                    lastName: "Иванова",
                }),
            },
        };
        const ozon = {
            createOrder: jest.fn().mockResolvedValue({
                ozonOrderId: "oz-1",
                paymentUrl: "https://pay",
            }),
        };
        const delivery = {
            canDeliverTo: jest
                .fn()
                .mockResolvedValue(overrides.canDeliverTo ?? true),
            isPointAvailable: jest
                .fn()
                .mockResolvedValue(overrides.pointAvailable ?? true),
            createOrder:
                overrides.createDeliveryOrder ??
                jest.fn().mockResolvedValue({
                    orderNumber: "OZ-1",
                    postingNumber: "POST-1",
                }),
            approvePosting:
                overrides.approvePosting ??
                jest.fn().mockResolvedValue(undefined),
            cancelPosting:
                overrides.cancelPosting ??
                jest.fn().mockResolvedValue(undefined),
        };
        const points = {
            findAvailable: jest.fn().mockResolvedValue(
                overrides.point === undefined
                    ? {
                          id: 555,
                          name: "Ozon",
                          address: "Москва, Тверская 1",
                      }
                    : overrides.point,
            ),
        };
        const sheet = {
            getItems: jest
                .fn()
                .mockResolvedValue(
                    new Map([["offer-2", { stock: 3, price: null }]]),
                ),
            reserve:
                overrides.reserve ?? jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
        };
        const catalog = {
            findByIds: jest
                .fn()
                .mockResolvedValue([probeProduct, regularProduct]),
        };
        const service = new OrderService(
            prisma as any,
            ozon as any,
            catalog as any,
            sheet as any,
            delivery as any,
            points as any,
        );
        return { service, prisma, sheet, ozon, delivery, points };
    };

    describe("with a probe", () => {
        it("creates a free Ozon Delivery order without payment", async () => {
            const { service, prisma, sheet, ozon, delivery } = build();

            await service.create(42, probeDto);

            expect(prisma.order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        probeUserId: 42,
                        total: 0,
                        deliveryPointId: 555,
                        address: "Москва, Тверская 1",
                        recipientName: "Анна Иванова",
                    }),
                }),
            );
            expect(sheet.reserve).toHaveBeenCalledWith([
                { offerId: "offer-2", quantity: 1 },
            ]);
            expect(delivery.createOrder).toHaveBeenCalledWith({
                id: 7,
                extId: "ext",
                phone: "79001112233",
                recipientName: "Анна Иванова",
                deliveryPointId: 555,
                description: "Пробник: Пробник",
            });
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 7 },
                    data: {
                        status: "confirmed",
                        ozonDeliveryNumber: "OZ-1",
                        ozonPostingNumber: "POST-1",
                    },
                }),
            );
            expect(delivery.approvePosting).toHaveBeenCalledWith("POST-1");
            expect(ozon.createOrder).not.toHaveBeenCalled();
            expect(sheet.release).not.toHaveBeenCalled();
        });

        it("requires a pickup point", async () => {
            const { service, prisma } = build();

            await expect(
                service.create(42, { items: probeDto.items }),
            ).rejects.toThrow("Выберите пункт выдачи");
            expect(prisma.order.create).not.toHaveBeenCalled();
        });

        it("rejects a pickup point that is unknown or closed", async () => {
            const { service, prisma } = build({ point: null });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "Пункт выдачи недоступен",
            );
            expect(prisma.order.create).not.toHaveBeenCalled();
        });

        it("rejects a pickup point that does not accept the parcel", async () => {
            const { service, prisma } = build({ pointAvailable: false });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "не принимает посылки",
            );
            expect(prisma.order.create).not.toHaveBeenCalled();
        });

        it("rejects a recipient whose phone is not registered in Ozon", async () => {
            const { service, prisma, sheet } = build({ canDeliverTo: false });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "не зарегистрирован в Ozon",
            );
            expect(prisma.order.create).not.toHaveBeenCalled();
            expect(sheet.reserve).not.toHaveBeenCalled();
        });

        it("rejects a second probe for the same account", async () => {
            const { service, sheet } = build({
                create: jest.fn().mockRejectedValue({ code: "P2002" }),
            });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "только один раз на аккаунт",
            );
            expect(sheet.reserve).not.toHaveBeenCalled();
        });

        it("cancels the order without returning stock when the probe sold out", async () => {
            const { service, prisma, sheet, delivery } = build({
                reserve: jest
                    .fn()
                    .mockRejectedValue(new Error("Пробник закончился")),
            });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "Пробник закончился",
            );
            expect(prisma.order.updateMany).toHaveBeenCalledWith({
                where: { id: 7, status: "pending" },
                data: { status: "cancelled", probeUserId: null },
            });
            expect(sheet.release).not.toHaveBeenCalled();
            expect(delivery.createOrder).not.toHaveBeenCalled();
        });

        it("returns the probe and the account limit when Ozon Delivery fails", async () => {
            const { service, prisma, sheet } = build({
                createDeliveryOrder: jest
                    .fn()
                    .mockRejectedValue(new Error("ozon")),
            });

            await expect(service.create(42, probeDto)).rejects.toThrow("ozon");
            expect(prisma.order.updateMany).toHaveBeenCalledWith({
                where: { id: 7, status: "pending" },
                data: { status: "cancelled", probeUserId: null },
            });
            expect(sheet.release).toHaveBeenCalledWith([
                { offerId: "offer-2", quantity: 1 },
            ]);
        });

        it("does not return the probe twice for an order that is already cancelled", async () => {
            const { service, prisma, sheet } = build({
                createDeliveryOrder: jest
                    .fn()
                    .mockRejectedValue(new Error("ozon")),
            });
            prisma.order.updateMany.mockResolvedValue({ count: 0 });

            await expect(service.create(42, probeDto)).rejects.toThrow("ozon");
            expect(sheet.release).not.toHaveBeenCalled();
        });

        it("removes the posting and returns the probe when Ozon refuses to confirm it", async () => {
            const { service, prisma, sheet, delivery } = build({
                approvePosting: jest
                    .fn()
                    .mockRejectedValue(new Error("NotEnoughBalance")),
            });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "NotEnoughBalance",
            );
            expect(delivery.cancelPosting).toHaveBeenCalledWith("POST-1");
            expect(prisma.order.updateMany).toHaveBeenCalledWith({
                where: { id: 7, status: "pending" },
                data: { status: "cancelled", probeUserId: null },
            });
            expect(sheet.release).toHaveBeenCalledWith([
                { offerId: "offer-2", quantity: 1 },
            ]);
            expect(prisma.order.update).not.toHaveBeenCalled();
        });

        it("still frees the probe when the unconfirmed posting cannot be cancelled", async () => {
            const { service, sheet } = build({
                approvePosting: jest
                    .fn()
                    .mockRejectedValue(new Error("NotEnoughBalance")),
                cancelPosting: jest.fn().mockRejectedValue(new Error("down")),
            });

            await expect(service.create(42, probeDto)).rejects.toThrow(
                "NotEnoughBalance",
            );
            expect(sheet.release).toHaveBeenCalled();
        });

        it("keeps the order when it cannot be saved after the parcel was created", async () => {
            const { service, prisma, sheet } = build();
            prisma.order.update.mockRejectedValue(new Error("db"));

            await expect(service.create(42, probeDto)).rejects.toThrow("db");
            expect(prisma.order.updateMany).not.toHaveBeenCalled();
            expect(sheet.release).not.toHaveBeenCalled();
        });
    });

    describe("without a probe", () => {
        it("goes through payment and does not touch Ozon Delivery", async () => {
            const { service, prisma, ozon, delivery, sheet } = build();

            await service.create(42, {
                items: [{ productId: "1", quantity: 1 }],
            });

            expect(ozon.createOrder).toHaveBeenCalled();
            expect(delivery.createOrder).not.toHaveBeenCalled();
            expect(sheet.reserve).not.toHaveBeenCalled();
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { ozonOrderId: "oz-1", paymentUrl: "https://pay" },
                }),
            );
        });
    });
});

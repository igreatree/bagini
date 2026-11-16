// Проверяем совместную работу реальных сервисов заказа и доставки на HTTP-ответах Ozon.
jest.mock("@nestjs/axios", () => ({ HttpService: class {} }));
jest.mock("../prisma.service", () => ({ PrismaService: class {} }));
jest.mock("../payment/ozon.service", () => ({ OzonService: class {} }));
jest.mock("../catalog/catalog.service", () => ({ CatalogService: class {} }));
jest.mock("../sheet/sheet.service", () => ({ SheetService: class {} }));
jest.mock("../delivery/delivery-point.service", () => ({
    DeliveryPointService: class {},
}));

import { of, throwError } from "rxjs";
import { OzonDeliveryService } from "../delivery/ozon-delivery.service";
import { OrderService } from "./order.service";

describe("probe order and Ozon approval", () => {
    const originalEnv = { ...process.env };
    beforeEach(() => {
        process.env.OZON_CLIENT_ID = "client";
        process.env.OZON_CLIENT_SECRET = "secret";
        process.env.OZON_DELIVERY_SHIPMENT_METHOD_ID = "77";
        jest.useFakeTimers();
    });
    afterEach(() => {
        process.env = { ...originalEnv };
        jest.useRealTimers();
    });

    const build = (notFoundAttempts: number) => {
        let approved = false;
        let attempts = 0;
        let stored: any;
        const post = jest.fn((url: string, _body: unknown) => {
            const ok = (data: unknown) =>
                of({ data, status: 200, headers: {} });
            if (url.endsWith("/oauth/token"))
                return ok({ access_token: "token", expires_in: 3600 });
            if (url.endsWith("/v1/delivery/check-client"))
                return ok({ can_be_delivered: true });
            if (url.endsWith("/v1/delivery-point/check-availability"))
                return ok({
                    results: [{ request_id: 1, delivery_point_id: 555 }],
                });
            if (url.endsWith("/v1/order/checkout"))
                return ok({
                    results: [
                        {
                            request_id: 1,
                            posting: {
                                estimated_delivery_cost: {
                                    amount: "101",
                                    currency_code: "RUB",
                                },
                            },
                        },
                    ],
                });
            if (url.endsWith("/v1/order/create"))
                return ok({
                    order_number: "OZ-72",
                    postings: [{ request_id: 1, posting_number: "POST-72" }],
                });
            if (url.endsWith("/v1/posting/approve")) {
                if (++attempts <= notFoundAttempts)
                    return throwError(() => ({
                        response: {
                            status: 404,
                            data: { error: { code: "posting_not_found" } },
                            headers: { "x-o3-trace-id": "trace-72" },
                        },
                    }));
                approved = true;
                return ok("");
            }
            if (url.endsWith("/v1/posting/info"))
                return ok({
                    postings: [
                        {
                            posting_number: "POST-72",
                            status: approved ? "ready_for_shipping" : "created",
                        },
                    ],
                });
            throw Error(`Unexpected mutation or request: ${url}`);
        });
        const delivery = new OzonDeliveryService({ post } as any);
        const prisma = {
            order: {
                create: jest.fn(async ({ data }) => {
                    stored = {
                        id: 72,
                        extId: "uuid-72",
                        status: "pending",
                        ozonPostingNumber: null,
                        ozonOrderId: null,
                        ...data,
                        items: data.items.create,
                    };
                    return { ...stored };
                }),
                update: jest.fn(async ({ data }) => {
                    stored = { ...stored, ...data };
                    return { ...stored };
                }),
                updateMany: jest.fn(),
                findFirst: jest.fn(async () => ({ ...stored })),
                findUniqueOrThrow: jest.fn(async () => ({ ...stored })),
            },
            user: {
                findUniqueOrThrow: jest.fn(async () => ({
                    phone: "79001112233",
                })),
            },
        };
        const sheet = {
            getItems: jest.fn(
                async () => new Map([["probe", { stock: 5, price: null }]]),
            ),
            reserve: jest.fn(async () => undefined),
            release: jest.fn(async () => undefined),
        };
        const service = new OrderService(
            prisma as any,
            {} as any,
            {
                findByIds: jest.fn(async () => [
                    {
                        id: "2",
                        offerId: "probe",
                        productName: "Пробник",
                        price: 100,
                        stock: 5,
                        sku: 20,
                    },
                ]),
            } as any,
            sheet as any,
            delivery,
            {
                findAvailable: jest.fn(async () => ({
                    id: 555,
                    address: "Москва",
                })),
            } as any,
        );
        return { service, prisma, sheet, post };
    };

    const dto = {
        items: [{ productId: "2", quantity: 1 }],
        deliveryPointId: 555,
    };

    it("confirms the same free order after a temporary approval 404", async () => {
        const { service, prisma, sheet, post } = build(1);
        const result = service.create(42, dto);
        await jest.advanceTimersByTimeAsync(500);
        await expect(result).resolves.toMatchObject({
            status: "confirmed",
            probeUserId: 42,
            total: 0,
            deliveryPrice: 0,
            ozonPostingNumber: "POST-72",
        });
        expect(sheet.reserve).toHaveBeenCalledTimes(1);
        expect(sheet.release).not.toHaveBeenCalled();
        expect(prisma.order.updateMany).not.toHaveBeenCalled();
        expect(
            post.mock.calls.filter(([url]) => url.endsWith("/v1/order/create")),
        ).toHaveLength(1);
        expect(
            post.mock.calls
                .filter(([url]) => url.endsWith("/v1/posting/approve"))
                .map(([, body]) => body),
        ).toEqual([
            { posting_number: "POST-72" },
            { posting_number: "POST-72" },
        ]);
    });

    it("holds the reserve and account limit until a later status lookup can approve the posting", async () => {
        const { service, prisma, sheet, post } = build(4);
        const result = service.create(42, dto);
        await jest.advanceTimersByTimeAsync(5000);
        await expect(result).resolves.toMatchObject({
            status: "pending",
            probeUserId: 42,
            ozonPostingNumber: "POST-72",
        });
        expect(sheet.release).not.toHaveBeenCalled();
        expect(prisma.order.updateMany).not.toHaveBeenCalled();
        await expect(service.findOne(42, 72)).resolves.toMatchObject({
            status: "confirmed",
            total: 0,
            probeUserId: 42,
        });
        expect(sheet.reserve).toHaveBeenCalledTimes(1);
        expect(
            post.mock.calls.filter(([url]) => url.endsWith("/v1/order/create")),
        ).toHaveLength(1);
    });
});

// @nestjs/axios — ESM-пакет, jest в CJS его не загружает; здесь нужен только как токен DI
jest.mock("@nestjs/axios", () => ({ HttpService: class {} }));

import { BadGatewayException, Logger } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { OzonDeliveryService } from "./ozon-delivery.service";

describe("OzonDeliveryService", () => {
    const env = { ...process.env };
    beforeEach(() => {
        process.env.OZON_CLIENT_ID = "client";
        process.env.OZON_CLIENT_SECRET = "secret";
        process.env.OZON_DELIVERY_SHIPMENT_METHOD_ID = "77";
    });
    afterEach(() => {
        process.env = { ...env };
    });

    const TOKEN_URL = "https://xapi.ozon.ru/oauth/token";
    const API = "https://api-delivery.ozon.ru";
    const ok = (data: unknown, status = 200, headers = {}) =>
        of({ data, status, headers });
    const failure = (status?: number, data: unknown = {}) =>
        throwError(() => ({
            message: "failed",
            response: status ? { status, data } : undefined,
        }));

    // handlers: путь API → ответы по очереди (последний повторяется)
    const build = (
        handlers: Record<string, any[]> = {},
        token: Record<string, unknown> = {
            access_token: "token-1",
            expires_in: 3600,
            scope: ["delivery-api.delivery"],
        },
    ) => {
        const queues = new Map(
            Object.entries(handlers).map(([path, list]) => [path, [...list]]),
        );
        const post = jest.fn((url: string) => {
            if (url === TOKEN_URL) return ok(token);
            const queue = queues.get(url.replace(API, ""));
            if (!queue) throw new Error(`unexpected request ${url}`);
            return queue.length > 1 ? queue.shift() : queue[0];
        });
        const service = new OzonDeliveryService({ post } as any);
        const apiCalls = () =>
            post.mock.calls.filter(([url]) => url !== TOKEN_URL);
        return { post, service, apiCalls };
    };

    describe("authorization", () => {
        it("requests a token with client credentials and reuses it", async () => {
            const { post, service, apiCalls } = build({
                "/v1/delivery/check-client": [ok({ can_be_delivered: true })],
            });

            await service.canDeliverTo("79001112233");
            await service.canDeliverTo("79001112233");

            const tokenCalls = post.mock.calls.filter(
                ([url]) => url === TOKEN_URL,
            );
            expect(tokenCalls).toHaveLength(1);
            expect(tokenCalls[0][1]).toEqual({
                client_id: "client",
                client_secret: "secret",
                grant_type: "client_credentials",
                scope: [
                    "delivery-api.delivery",
                    "delivery-api.delivery-point",
                    "delivery-api.order",
                    "delivery-api.posting",
                ],
            });
            expect(apiCalls()[0][2].headers.Authorization).toBe(
                "Bearer token-1",
            );
        });

        it("accepts expires_in as an absolute Unix time", async () => {
            const { post, service } = build(
                { "/v1/delivery/check-client": [ok({})] },
                {
                    access_token: "token-1",
                    expires_in: Math.floor(Date.now() / 1000) + 3600,
                },
            );

            await service.canDeliverTo("79001112233");
            await service.canDeliverTo("79001112233");

            expect(
                post.mock.calls.filter(([url]) => url === TOKEN_URL),
            ).toHaveLength(1);
        });

        it("refreshes an expired token", async () => {
            const { post, service } = build(
                { "/v1/delivery/check-client": [ok({})] },
                { access_token: "token-1", expires_in: 30 },
            );

            await service.canDeliverTo("79001112233");
            await service.canDeliverTo("79001112233");

            expect(
                post.mock.calls.filter(([url]) => url === TOKEN_URL),
            ).toHaveLength(2);
        });

        it("gets a new token and repeats the request after 401", async () => {
            const { post, service } = build({
                "/v1/delivery/check-client": [
                    failure(401),
                    ok({ can_be_delivered: true }),
                ],
            });

            await expect(service.canDeliverTo("79001112233")).resolves.toBe(
                true,
            );
            expect(
                post.mock.calls.filter(([url]) => url === TOKEN_URL),
            ).toHaveLength(2);
        });

        it("reports a token issued for another Ozon application", async () => {
            const error = jest
                .spyOn(Logger.prototype, "error")
                .mockImplementation();
            const { service } = build(
                { "/v1/delivery/check-client": [ok({})] },
                {
                    access_token: "token-1",
                    expires_in: 3600,
                    scope: ["seller-app-store-api.payment"],
                },
            );

            await service.canDeliverTo("79001112233");

            expect(error).toHaveBeenCalledWith(
                expect.stringContaining("без доступа к Delivery API"),
            );
            error.mockRestore();
        });

        it("does not report a token with Delivery API access", async () => {
            const error = jest
                .spyOn(Logger.prototype, "error")
                .mockImplementation();
            const { service } = build({
                "/v1/delivery/check-client": [ok({})],
            });

            await service.canDeliverTo("79001112233");

            expect(error).not.toHaveBeenCalled();
            error.mockRestore();
        });

        it("fails when the delivery is not configured", async () => {
            delete process.env.OZON_CLIENT_ID;
            const { service } = build();

            expect(service.isConfigured).toBe(false);
            await expect(service.canDeliverTo("79001112233")).rejects.toThrow(
                "Доставка Ozon не настроена",
            );
        });
    });

    describe("recipient", () => {
        it("sends the phone in the Ozon format", async () => {
            const { service, apiCalls } = build({
                "/v1/delivery/check-client": [ok({ can_be_delivered: false })],
            });

            await expect(service.canDeliverTo("79001112233")).resolves.toBe(
                false,
            );
            expect(apiCalls()[0][1]).toEqual({ phone_number: "+79001112233" });
        });
    });

    describe("pickup points", () => {
        it("reads a page of the directory starting with a null cursor", async () => {
            const { service, apiCalls } = build({
                "/v1/delivery-point/list": [
                    ok({
                        delivery_points: [
                            {
                                delivery_point_id: "10",
                                shipment_method_ids: [77],
                            },
                        ],
                        next_cursor: "",
                    }),
                ],
            });

            const page = await service.listPoints(null, 100);

            expect(apiCalls()[0][1]).toEqual({
                pagination: { cursor: null, limit: 100 },
            });
            expect(page).toEqual({
                points: [{ id: 10, shipmentMethodIds: [77] }],
                nextCursor: null,
            });
        });

        it("maps point details", async () => {
            const { service } = build({
                "/v1/delivery-point/info": [
                    ok({
                        delivery_points: [
                            {
                                delivery_point_id: 10,
                                name: "Ozon Box",
                                full_address: "Москва, Тверская, 1",
                                type: "PICKUP_POINT",
                                is_active: false,
                                coordinates: {
                                    latitude: 55.7,
                                    longitude: 37.6,
                                },
                            },
                        ],
                    }),
                ],
            });

            await expect(service.getPoints([10])).resolves.toEqual([
                {
                    id: 10,
                    name: "Ozon Box",
                    address: "Москва, Тверская, 1",
                    type: "PICKUP_POINT",
                    latitude: 55.7,
                    longitude: 37.6,
                    isActive: false,
                },
            ]);
        });

        it("does not ask Ozon about an empty list of points", async () => {
            const { service, apiCalls } = build();

            await expect(service.getPoints([])).resolves.toEqual([]);
            expect(apiCalls()).toHaveLength(0);
        });

        it("checks that the point accepts the parcel", async () => {
            const { service, apiCalls } = build({
                "/v1/delivery-point/check-availability": [
                    ok({ results: [{ request_id: 1, delivery_point_id: 10 }] }),
                ],
            });

            await expect(service.isPointAvailable(10)).resolves.toBe(true);
            expect(apiCalls()[0][1]).toMatchObject({
                delivery_point_ids: [10],
                shipment_method_id: 77,
                postings: [
                    {
                        request_id: 1,
                        declared_value: { amount: "1", currency_code: "RUB" },
                        dimensions: {
                            weight_g: 100,
                            length_mm: 150,
                            width_mm: 100,
                            height_mm: 50,
                        },
                    },
                ],
            });
        });

        it("reports a point that returned an error as unavailable", async () => {
            const { service } = build({
                "/v1/delivery-point/check-availability": [
                    ok({ results: [{ request_id: 1, error: "CLOSED" }] }),
                ],
            });

            await expect(service.isPointAvailable(10)).resolves.toBe(false);
        });
    });

    describe("createOrder", () => {
        const created = {
            order_number: "OZ-1",
            postings: [{ request_id: 1, posting_number: "POST-1" }],
        };
        const order = {
            id: 7,
            extId: "7d0f6b1e-0000-4000-8000-000000000007",
            phone: "79001112233",
            recipientName: "Анна Иванова",
            deliveryPointId: 10,
            description: "Пробник: Духи",
        };

        it("sends the parcel with the order UUID as idempotency key", async () => {
            const { service, apiCalls } = build({
                "/v1/order/create": [ok(created)],
            });

            await expect(service.createOrder(order)).resolves.toEqual({
                orderNumber: "OZ-1",
                postingNumber: "POST-1",
            });

            const [url, body, config] = apiCalls()[0];
            expect(url).toBe(`${API}/v1/order/create`);
            expect(config.headers["Idempotency-Key"]).toBe(order.extId);
            expect(body).toEqual({
                order_external_id: "7",
                recipient: {
                    phone_number: "+79001112233",
                    full_name: "Анна Иванова",
                },
                delivery: { delivery_point: { delivery_point_id: 10 } },
                postings: [
                    {
                        request_id: 1,
                        shipment_method_id: 77,
                        declared_value: { amount: "1", currency_code: "RUB" },
                        dimensions: {
                            weight_g: 100,
                            length_mm: 150,
                            width_mm: 100,
                            height_mm: 50,
                        },
                        posting_external_id: "7",
                        description: "Пробник: Духи",
                    },
                ],
            });
        });

        it("takes the parcel size and declared value from the environment", async () => {
            process.env.PROBE_WEIGHT_G = "40";
            process.env.PROBE_DECLARED_VALUE = "10";
            const { service, apiCalls } = build({
                "/v1/order/create": [ok(created)],
            });

            await service.createOrder(order);

            const [posting] = apiCalls()[0][1].postings;
            expect(posting.dimensions.weight_g).toBe(40);
            expect(posting.declared_value.amount).toBe("10");
        });

        it("repeats the request with the same key after a network error", async () => {
            const { service, apiCalls } = build({
                "/v1/order/create": [failure(), ok(created)],
            });

            await expect(service.createOrder(order)).resolves.toEqual({
                orderNumber: "OZ-1",
                postingNumber: "POST-1",
            });
            expect(apiCalls()).toHaveLength(2);
            expect(apiCalls()[1][2].headers["Idempotency-Key"]).toBe(
                order.extId,
            );
        });

        it("gives up after one repeat", async () => {
            const { service, apiCalls } = build({
                "/v1/order/create": [failure(502)],
            });

            await expect(service.createOrder(order)).rejects.toBeInstanceOf(
                BadGatewayException,
            );
            expect(apiCalls()).toHaveLength(2);
        });

        it("does not repeat a request that Ozon rejected", async () => {
            const { service, apiCalls } = build({
                "/v1/order/create": [failure(400, { message: "bad" })],
            });

            await expect(service.createOrder(order)).rejects.toBeInstanceOf(
                BadGatewayException,
            );
            expect(apiCalls()).toHaveLength(1);
        });

        it("fails when the response has no order number", async () => {
            const { service } = build({ "/v1/order/create": [ok({})] });

            await expect(service.createOrder(order)).rejects.toBeInstanceOf(
                BadGatewayException,
            );
        });

        it("fails when the response has no posting number", async () => {
            const { service } = build({
                "/v1/order/create": [
                    ok({ order_number: "OZ-1", postings: [] }),
                ],
            });

            await expect(service.createOrder(order)).rejects.toBeInstanceOf(
                BadGatewayException,
            );
        });
    });

    describe("postings", () => {
        it("confirms a posting by its number", async () => {
            const { service, apiCalls } = build({
                "/v1/posting/approve": [ok("")],
            });

            await expect(
                service.approvePosting("POST-1"),
            ).resolves.toBeUndefined();
            expect(apiCalls()[0][0]).toBe(`${API}/v1/posting/approve`);
            expect(apiCalls()[0][1]).toEqual({ posting_number: "POST-1" });
        });

        it("reports a posting that Ozon refused to confirm", async () => {
            const { service, apiCalls } = build({
                "/v1/posting/approve": [
                    failure(400, { error: { code: "NotEnoughBalance" } }),
                ],
            });

            await expect(
                service.approvePosting("POST-1"),
            ).rejects.toBeInstanceOf(BadGatewayException);
            expect(apiCalls()).toHaveLength(1);
        });

        it("cancels a posting by its number", async () => {
            const { service, apiCalls } = build({
                "/v1/posting/cancel": [ok("")],
            });

            await service.cancelPosting("POST-1");

            expect(apiCalls()[0][0]).toBe(`${API}/v1/posting/cancel`);
            expect(apiCalls()[0][1]).toEqual({ posting_number: "POST-1" });
        });
    });

    describe("testcookie", () => {
        const challenge = ok({}, 302, {
            location: "/v1/delivery/check-client",
            "set-cookie": ["tc=abc; Path=/; HttpOnly"],
        });

        it("repeats the request with the cookie and keeps it for the next ones", async () => {
            const { service, apiCalls } = build({
                "/v1/delivery/check-client": [
                    challenge,
                    ok({ can_be_delivered: true }),
                ],
            });

            await service.canDeliverTo("79001112233");
            await service.canDeliverTo("79001112233");

            const cookies = apiCalls().map(
                ([, , config]) => config.headers.Cookie,
            );
            expect(cookies).toEqual([undefined, "tc=abc", "tc=abc"]);
        });

        it("replaces the cookie when Ozon issues a new one", async () => {
            const { service, apiCalls } = build({
                "/v1/delivery/check-client": [
                    challenge,
                    ok({ can_be_delivered: true }),
                    ok({}, 307, {
                        location: "/v1/delivery/check-client",
                        "set-cookie": ["tc=def; Path=/"],
                    }),
                    ok({ can_be_delivered: true }),
                ],
            });

            await service.canDeliverTo("79001112233");
            await service.canDeliverTo("79001112233");

            const cookies = apiCalls().map(
                ([, , config]) => config.headers.Cookie,
            );
            expect(cookies).toEqual([undefined, "tc=abc", "tc=abc", "tc=def"]);
        });

        it("passes the check when requesting the token too", async () => {
            const post = jest.fn((url: string, _body: unknown, config: any) => {
                if (url !== TOKEN_URL) return ok({ can_be_delivered: true });
                return config.headers.Cookie === "tc=1"
                    ? ok({ access_token: "token-1", expires_in: 3600 })
                    : ok({}, 302, {
                          location: TOKEN_URL,
                          "set-cookie": ["tc=1; Path=/"],
                      });
            });
            const service = new OzonDeliveryService({ post } as any);

            await expect(service.canDeliverTo("79001112233")).resolves.toBe(
                true,
            );
            expect(
                post.mock.calls.filter(([url]) => url === TOKEN_URL),
            ).toHaveLength(2);
        });
    });

    describe("scope", () => {
        it("takes the access levels from the environment", async () => {
            process.env.OZON_DELIVERY_SCOPE =
                " delivery-api.all , delivery-api.order ";
            const { post, service } = build({
                "/v1/delivery/check-client": [ok({})],
            });

            await service.canDeliverTo("79001112233");

            expect(post.mock.calls[0][1].scope).toEqual([
                "delivery-api.all",
                "delivery-api.order",
            ]);
        });
    });

    describe("redirects", () => {
        it("repeats the request at the new address on the same origin", async () => {
            const { service, apiCalls } = build({
                "/v1/delivery/check-client": [
                    ok({}, 307, { location: "/v1/delivery/check-client?x=1" }),
                ],
                "/v1/delivery/check-client?x=1": [
                    ok({ can_be_delivered: true }),
                ],
            });

            await expect(service.canDeliverTo("79001112233")).resolves.toBe(
                true,
            );
            expect(apiCalls().map(([url]) => url)).toEqual([
                `${API}/v1/delivery/check-client`,
                `${API}/v1/delivery/check-client?x=1`,
            ]);
            expect(apiCalls()[1][1]).toEqual(apiCalls()[0][1]);
        });

        it("does not follow a redirect to another origin", async () => {
            const { service } = build({
                "/v1/delivery/check-client": [
                    ok({}, 302, { location: "https://evil.test/steal" }),
                ],
            });

            await expect(
                service.canDeliverTo("79001112233"),
            ).rejects.toBeInstanceOf(BadGatewayException);
        });
    });
});

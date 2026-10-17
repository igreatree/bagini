// @nestjs/axios — ESM-пакет, jest в CJS его не загружает; здесь нужен только как токен DI
jest.mock("@nestjs/axios", () => ({ HttpService: class {} }));

import { BadGatewayException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { CatalogService } from "./catalog.service";

const raw = (id: number, name: string, price: string, extra = {}) => ({
    id,
    name,
    offer_id: `offer-${id}`,
    price,
    primary_image: [`https://cdn.ozone.ru/${id}-main.jpg`],
    images: [`https://cdn.ozone.ru/${id}-1.jpg`],
    sku: id * 10,
    stocks: {
        has_stock: true,
        stocks: [
            { present: 3, reserved: 1, source: "fbs" },
            { present: 2, reserved: 0, source: "fbo" },
        ],
    },
    is_archived: false,
    ...extra,
});

describe("CatalogService", () => {
    const env = { ...process.env };
    beforeEach(() => {
        process.env.OZON_SELLER_API_KEY = "key";
        process.env.OZON_SELLER_CLIENT_ID = "client";
    });
    afterEach(() => {
        process.env = { ...env };
    });

    const build = (infoItems: unknown[] = []) => {
        const store = new Map<string, string>();
        const redis = {
            get: jest.fn(async (key: string) => store.get(key) ?? null),
            setWithExpiry: jest.fn(async (key: string, value: string) => {
                store.set(key, value);
            }),
        };
        const post = jest.fn((url: string) => {
            if (url.endsWith("/v3/product/list")) {
                return of({
                    data: {
                        result: {
                            items: infoItems.map((item: any) => ({
                                product_id: item.id,
                            })),
                            last_id: "",
                        },
                    },
                });
            }
            if (url.endsWith("/v3/product/info/list")) {
                return of({ data: { items: infoItems } });
            }
            return of({
                data: { result: { description: "Первая<br>строка <b>2</b>" } },
            });
        });
        const service = new CatalogService({ post } as any, redis as any);
        return { service, post, redis };
    };

    const products = [
        raw(1, "Спрей для объема волос", "1980.0000"),
        raw(2, "Крем для волос", "1500"),
        raw(3, "Лак для волос", "2000.50"),
        raw(4, "Архивный товар", "100", { is_archived: true }),
        raw(5, "Товар без цены", "0"),
        raw(6, "Весь остаток в резерве", "100", {
            stocks: { has_stock: true, stocks: [{ present: 2, reserved: 2 }] },
        }),
        raw(7, "Товар без остатков", "100", {
            stocks: { has_stock: false, stocks: [] },
        }),
    ];

    it("sends seller credentials and maps visible products", async () => {
        const { service, post } = build(products);

        const result = await service.list({ page: 1, limit: 10 });

        const [url, body, config] = post.mock.calls[0] as any;
        expect(url).toBe("https://api-seller.ozon.ru/v3/product/list");
        expect(body.filter).toEqual({ visibility: "IN_SALE" });
        expect(config.headers).toEqual({
            "Api-Key": "key",
            "Client-Id": "client",
        });
        // архивный, бесплатный и без остатков отфильтрованы, цена округлена до рублей
        expect(result.items.map((p) => [p.id, p.price])).toEqual([
            ["1", 1980],
            ["2", 1500],
            ["3", 2001],
        ]);
        // остаток: (3 - 1 резерв) + 2
        expect(result.items[0]).toMatchObject({ sku: 10, stock: 4 });
        expect(result.items[0].images).toEqual([
            "https://cdn.ozone.ru/1-main.jpg",
            "https://cdn.ozone.ru/1-1.jpg",
        ]);
        expect(result.total).toBe(3);
    });

    it("paginates", async () => {
        const { service } = build(products);

        const page2 = await service.list({ page: 2, limit: 2 });
        expect(page2.items.map((p) => p.id)).toEqual(["3"]);
        expect(page2).toMatchObject({ total: 3, page: 2, pages: 2 });

        // страница за пределами диапазона сдвигается на последнюю
        const outOfRange = await service.list({ page: 9, limit: 2 });
        expect(outOfRange.page).toBe(2);
    });

    it("searches by every word in name or offer id, ignoring case", async () => {
        const { service } = build(products);

        const byName = await service.list({
            page: 1,
            limit: 10,
            search: "  КРЕМ  волос ",
        });
        expect(byName.items.map((p) => p.id)).toEqual(["2"]);

        const byOffer = await service.list({
            page: 1,
            limit: 10,
            search: "offer-3",
        });
        expect(byOffer.items.map((p) => p.id)).toEqual(["3"]);

        const none = await service.list({ page: 1, limit: 10, search: "xyz" });
        expect(none).toMatchObject({ items: [], total: 0, pages: 1 });
    });

    it("caches the product list", async () => {
        const { service, post, redis } = build(products);

        await service.list({ page: 1, limit: 10 });
        const callsAfterFirst = post.mock.calls.length;
        await service.list({ page: 1, limit: 10 });

        expect(post.mock.calls.length).toBe(callsAfterFirst);
        expect(redis.setWithExpiry).toHaveBeenCalledTimes(1);
    });

    it("skips the cache when fresh data is requested", async () => {
        const { service, post } = build(products);

        await service.findByIds(["1"]);
        const callsAfterFirst = post.mock.calls.length;
        await service.findByIds(["1"]);
        expect(post.mock.calls.length).toBe(callsAfterFirst);

        await service.findByIds(["1"], { fresh: true });
        expect(post.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });

    it("finds products by ids and skips unknown ones", async () => {
        const { service } = build(products);

        const found = await service.findByIds(["2", "404"]);

        expect(found.map((p) => p.id)).toEqual(["2"]);
    });

    it("returns product with plain-text description", async () => {
        const { service } = build(products);

        const product = await service.findOne("1");

        expect(product?.description).toBe("Первая\nстрока 2");
        expect(await service.findOne("404")).toBeNull();
    });

    it("opens product without description when description request fails", async () => {
        const { service, post } = build(products);
        const original = post.getMockImplementation()!;
        post.mockImplementation((url: string, ...rest: unknown[]) =>
            url.endsWith("/v1/product/info/description")
                ? throwError(() => new Error("boom"))
                : (original as any)(url, ...rest),
        );

        const product = await service.findOne("1");

        expect(product?.productName).toBe("Спрей для объема волос");
        expect(product?.description).toBeUndefined();
    });

    it("fails with bad gateway when seller api is unavailable", async () => {
        const { service, post } = build(products);
        post.mockReturnValue(throwError(() => new Error("down")));

        await expect(
            service.list({ page: 1, limit: 10 }),
        ).rejects.toBeInstanceOf(BadGatewayException);
    });
});

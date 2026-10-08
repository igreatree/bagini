// @nestjs/axios — ESM-пакет, jest в CJS его не загружает; здесь нужен только как токен DI
jest.mock("@nestjs/axios", () => ({ HttpService: class {} }));

import { BadGatewayException } from "@nestjs/common";
import { of } from "rxjs";
import { OzonService } from "./ozon.service";
import { signCreateOrder } from "./ozon-signature";

describe("OzonService", () => {
    const env = { ...process.env };
    beforeEach(() => {
        process.env.OZON_PAY_ACCESS_KEY = "access";
        process.env.OZON_PAY_SECRET_KEY = "secret";
        process.env.OZON_PAY_NOTIFICATION_SECRET_KEY = "notify";
        process.env.FRONTEND_URL = "https://shop.test/";
    });
    afterEach(() => {
        process.env = { ...env };
    });

    const build = (data: unknown) => {
        const post = jest.fn().mockReturnValue(of({ data }));
        return { post, service: new OzonService({ post } as any) };
    };

    it("sends signed createOrder request and returns payment url", async () => {
        const { post, service } = build({
            order: { id: "ozon-1", payLink: "https://pay.ozon.ru/x" },
        });

        const result = await service.createOrder({
            id: 7,
            extId: "ext-7",
            total: 1980,
        });

        expect(result).toEqual({
            ozonOrderId: "ozon-1",
            paymentUrl: "https://pay.ozon.ru/x",
        });
        const [url, body] = post.mock.calls[0];
        expect(url).toBe("https://payapi.ozon.ru/v1/createOrder");
        expect(body).toMatchObject({
            accessKey: "access",
            extId: "ext-7",
            amount: { currencyCode: "643", value: "1980" },
            successUrl: "https://shop.test/order/7",
            failUrl: "https://shop.test/order/7",
        });
        expect(body.requestSign).toBe(
            signCreateOrder({
                accessKey: "access",
                extId: "ext-7",
                paymentAlgorithm: "PAY_ALGO_SMS",
                currencyCode: "643",
                amount: "1980",
                secretKey: "secret",
            }),
        );
    });

    it("fails when response has no payment url", async () => {
        const { service } = build({ order: { id: "ozon-1" } });
        await expect(
            service.createOrder({ id: 1, extId: "e", total: 100 }),
        ).rejects.toBeInstanceOf(BadGatewayException);
    });
});

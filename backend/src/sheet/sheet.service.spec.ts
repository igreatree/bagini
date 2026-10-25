// @nestjs/axios — ESM-пакет, jest в CJS его не загружает; здесь нужен только как токен DI
jest.mock("@nestjs/axios", () => ({ HttpService: class {} }));

import { BadGatewayException, BadRequestException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { SheetService } from "./sheet.service";

describe("SheetService", () => {
    const env = { ...process.env };
    beforeEach(() => {
        process.env.SHEET_URL = "https://script.google.com/macros/s/x/exec";
        process.env.SHEET_SCRIPT_TOKEN = "secret";
    });
    afterEach(() => {
        process.env = { ...env };
    });

    const build = (response: { get?: unknown; post?: unknown } = {}) => {
        const store = new Map<string, string>();
        const redis = {
            get: jest.fn(async (key: string) => store.get(key) ?? null),
            setWithExpiry: jest.fn(async (key: string, value: string) => {
                store.set(key, value);
            }),
            del: jest.fn(async (key: string) => {
                store.delete(key);
            }),
        };
        const http = {
            get: jest.fn(() => response.get as any),
            post: jest.fn(() => response.post as any),
        };
        const service = new SheetService(http as any, redis as any);
        return { service, http, redis, store };
    };

    const sheet = (items: object[]) => of({ data: { ok: true, items } });

    it("reads stocks by offer id and caches them", async () => {
        const { service, http } = build({
            get: sheet([
                { offerId: "A-1", stock: 3 },
                { offerId: "A-2", stock: 0 },
            ]),
        });

        const stocks = await service.getStocks();
        await service.getStocks();

        expect(stocks.get("A-1")).toBe(3);
        expect(stocks.get("A-2")).toBe(0);
        expect(http.get).toHaveBeenCalledTimes(1);
        expect(http.get).toHaveBeenCalledWith(
            "https://script.google.com/macros/s/x/exec",
            expect.objectContaining({ params: { token: "secret" } }),
        );
    });

    it("falls back to the last known stocks when the script is down", async () => {
        const { service, store } = build({
            get: throwError(() => new Error("down")),
        });
        store.set("sheet:stocks:stale", JSON.stringify({ "A-1": 2 }));

        const stocks = await service.getStocks();

        expect(stocks.get("A-1")).toBe(2);
    });

    it("fails when the script is down and there is nothing to fall back to", async () => {
        const { service } = build({ get: throwError(() => new Error("down")) });

        await expect(service.getStocks()).rejects.toBeInstanceOf(
            BadGatewayException,
        );
    });

    it("treats an HTML page instead of JSON as a failure", async () => {
        const { service } = build({ get: of({ data: "<html></html>" }) });

        await expect(service.getStocks()).rejects.toBeInstanceOf(
            BadGatewayException,
        );
    });

    it("reserves stock with the token and drops the stocks cache", async () => {
        const { service, http, redis } = build({
            post: of({ data: { ok: true } }),
        });

        await service.reserve([{ offerId: "A-1", quantity: 1 }]);

        expect(http.post).toHaveBeenCalledWith(
            "https://script.google.com/macros/s/x/exec",
            {
                token: "secret",
                action: "reserve",
                items: [{ offerId: "A-1", quantity: 1 }],
            },
            expect.anything(),
        );
        expect(redis.del).toHaveBeenCalledWith("sheet:stocks");
    });

    it("reports a sold out probe as a bad request", async () => {
        const { service } = build({
            post: of({ data: { ok: false, error: "OUT_OF_STOCK" } }),
        });

        await expect(
            service.reserve([{ offerId: "A-1", quantity: 1 }]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("reports other script errors as a bad gateway", async () => {
        const { service } = build({
            post: of({ data: { ok: false, error: "UNAUTHORIZED" } }),
        });

        await expect(
            service.release([{ offerId: "A-1", quantity: 1 }]),
        ).rejects.toBeInstanceOf(BadGatewayException);
    });
});

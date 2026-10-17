// Зависимости с ESM-пакетами и подключением к БД в юнит-тесте не нужны
jest.mock("../prisma.service", () => ({ PrismaService: class {} }));
jest.mock("../payment/ozon.service", () => ({ OzonService: class {} }));
jest.mock("../catalog/catalog.service", () => ({ CatalogService: class {} }));

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

    const build = (products: ReturnType<typeof product>[]) => {
        const findByIds = jest.fn().mockResolvedValue(products);
        const service = new OrderService(
            {} as any,
            {} as any,
            {
                findByIds,
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
});

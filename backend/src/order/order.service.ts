import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { OzonService } from "../payment/ozon.service";
import type { OrderStatus } from "../../generated/prisma/enums";
import { CreateOrderDto, OrderItemDto } from "./dto/create-order.dto";
import { CatalogService } from "../catalog/catalog.service";
import { SheetService } from "../sheet/sheet.service";

// Статусы заказа на стороне Ozon, которые меняют статус заказа в магазине.
// Остальные (например, STATUS_PAYMENT_PENDING) оставляют заказ как есть.
const mapOzonStatus = (ozonStatus: string): OrderStatus | null => {
    if (ozonStatus === "STATUS_PAID") return "paid";
    if (/CANCEL|EXPIRE|REJECT|FAIL/.test(ozonStatus)) return "cancelled";
    return null;
};

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        private prisma: PrismaService,
        private ozon: OzonService,
        private catalog: CatalogService,
        private sheet: SheetService,
    ) {}

    // Цены берём из каталога Ozon на сервере, клиентским ценам доверять нельзя
    async calculate(
        dtoItems: OrderItemDto[],
        options: { fresh?: boolean } = {},
    ) {
        const quantities = new Map<string, number>();
        for (const { productId, quantity } of dtoItems) {
            quantities.set(
                productId,
                (quantities.get(productId) ?? 0) + quantity,
            );
        }

        const products = new Map(
            (await this.catalog.findByIds([...quantities.keys()], options)).map(
                (product) => [product.id, product],
            ),
        );

        // Пробники — позиции из таблицы остатков. Клиентскому признаку верить нельзя,
        // поэтому определяем их по артикулу и проверяем даже для обычной корзины.
        const probeItems = await this.sheet.getItems();

        const items = [...quantities].map(([productId, quantity]) => {
            const product = products.get(productId);
            if (!product) {
                throw new BadRequestException(
                    `Товар ${productId} больше не доступен`,
                );
            }

            // Остаток и цена пробника ведутся в таблице, остаток и цена на Ozon для него не важны
            const probe = probeItems.get(product.offerId);
            const isProbe = probe !== undefined;
            if (!isProbe && quantity > product.stock) {
                throw new BadRequestException(
                    `«${product.productName}»: в наличии только ${product.stock} шт.`,
                );
            }
            if (probe && probe.stock < 1) {
                throw new BadRequestException(
                    `«${product.productName}»: пробники закончились`,
                );
            }
            if (isProbe && quantity > 1) {
                throw new BadRequestException(
                    `«${product.productName}»: пробник можно купить только в одном экземпляре`,
                );
            }
            return {
                productId,
                productName: product.productName,
                price: probe?.price ?? product.price,
                quantity,
                probeOfferId: isProbe ? product.offerId : undefined,
            };
        });

        if (items.filter((item) => item.probeOfferId).length > 1) {
            throw new BadRequestException(
                "В заказе может быть только один пробник",
            );
        }

        const itemsTotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );

        // SKU нужен Ozon Доставке, в заказе не хранится
        const skus = new Map(
            [...products.values()].map((product) => [product.id, product.sku]),
        );

        // Доставку и её стоимость покупатель выбирает на странице оплаты Ozon
        return { items, itemsTotal, total: itemsTotal, skus };
    }

    async create(userId: number, dto: CreateOrderDto) {
        const { items, itemsTotal, total, skus } = await this.calculate(
            dto.items,
            {
                fresh: true,
            },
        );

        const probe = items.find((item) => item.probeOfferId);

        const order = await this.prisma.order
            .create({
                data: {
                    userId,
                    itemsTotal,
                    deliveryPrice: 0,
                    total,
                    comment: dto.comment,
                    probeUserId: probe ? userId : undefined,
                    items: { create: items },
                },
                include: { items: true },
            })
            .catch((error) => {
                // Уникальный probeUserId: у аккаунта уже есть заказ с пробником
                if (probe && error?.code === "P2002") {
                    throw new BadRequestException(
                        "Пробник можно купить только один раз на аккаунт",
                    );
                }
                throw error;
            });

        if (probe) {
            try {
                await this.sheet.reserve([
                    { offerId: probe.probeOfferId!, quantity: probe.quantity },
                ]);
            } catch (error) {
                // Остаток не списан, возвращать в таблицу нечего
                await this.cancel(order.id, { release: false });
                throw error;
            }
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        try {
            const { ozonOrderId, paymentUrl } = await this.ozon.createOrder({
                id: order.id,
                extId: order.extId,
                total: order.total,
                items: order.items.map((item) => ({
                    ...item,
                    sku: skus.get(item.productId) ?? null,
                })),
                receiptEmail: user?.email,
            });
            return await this.prisma.order.update({
                where: { id: order.id },
                data: { ozonOrderId, paymentUrl },
                include: { items: true },
            });
        } catch (error) {
            await this.cancel(order.id);
            throw error;
        }
    }

    // Пробник текущего аккаунта: неотменённый заказ, который занимает лимит
    async findProbePurchase(userId: number) {
        return this.prisma.order.findUnique({
            where: { probeUserId: userId },
            select: { id: true, status: true },
        });
    }

    // Отмена освобождает лимит аккаунта и возвращает пробник в таблицу. Условие по
    // статусу не даёт вернуть остаток дважды, если заказ отменяют параллельно.
    private async cancel(id: number, options: { release?: boolean } = {}) {
        const { count } = await this.prisma.order.updateMany({
            where: { id, status: "pending" },
            data: { status: "cancelled", probeUserId: null },
        });
        const order = await this.prisma.order.findUniqueOrThrow({
            where: { id },
            include: { items: true },
        });
        if (count > 0 && options.release !== false) {
            await this.releaseProbes(order.items);
        }
        return order;
    }

    private async releaseProbes(
        items: { probeOfferId: string | null; quantity: number }[],
    ) {
        const probes = items.flatMap((item) =>
            item.probeOfferId
                ? [{ offerId: item.probeOfferId, quantity: item.quantity }]
                : [],
        );
        if (probes.length === 0) return;
        try {
            await this.sheet.release(probes);
        } catch {
            // Заказ уже отменён, остаток придётся поправить в таблице вручную
            this.logger.error(
                `Не удалось вернуть остаток в таблицу: ${JSON.stringify(probes)}`,
            );
        }
    }

    findAll(userId: number) {
        return this.prisma.order.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async findOne(userId: number, id: number) {
        const order = await this.prisma.order.findFirst({
            where: { id, userId },
            include: { items: true },
        });
        if (!order) throw new NotFoundException("Заказ не найден");
        return this.syncPayment(order);
    }

    // Статус берём из getOrderStatus, а не из тела уведомления: запрос
    // подписан нашим ключом, подделать ответ нельзя.
    async syncPayment<
        T extends {
            id: number;
            status: OrderStatus;
            extId: string;
            ozonOrderId: string | null;
        },
    >(order: T): Promise<T> {
        if (order.status !== "pending" || !order.ozonOrderId) return order;

        const ozonStatus = await this.ozon.getOrderStatus({
            ozonOrderId: order.ozonOrderId,
            extId: order.extId,
        });
        const status = ozonStatus && mapOzonStatus(ozonStatus);
        if (!status) return order;
        if (status === "cancelled")
            return (await this.cancel(order.id)) as unknown as T;

        return this.prisma.order.update({
            where: { id: order.id },
            data: {
                status,
                paidAt: status === "paid" ? new Date() : undefined,
            },
            include: { items: true },
        }) as unknown as T;
    }

    async handleOzonNotification(ozonOrderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { ozonOrderId },
        });
        if (!order) return false;
        await this.syncPayment(order);
        return true;
    }
}

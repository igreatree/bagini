import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { OzonService } from "../payment/ozon.service";
import type { OrderStatus } from "../../generated/prisma/enums";
import { CreateOrderDto, OrderItemDto } from "./dto/create-order.dto";
import { CATALOG } from "./catalog";
import { calculateDelivery } from "./delivery";

// Статусы заказа на стороне Ozon, которые меняют статус заказа в магазине.
// Остальные (например, STATUS_PAYMENT_PENDING) оставляют заказ как есть.
const mapOzonStatus = (ozonStatus: string): OrderStatus | null => {
    if (ozonStatus === "STATUS_PAID") return "paid";
    if (/CANCEL|EXPIRE|REJECT|FAIL/.test(ozonStatus)) return "cancelled";
    return null;
};

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private ozon: OzonService,
    ) {}

    calculate(dtoItems: OrderItemDto[]) {
        const quantities = new Map<string, number>();
        for (const { productId, quantity } of dtoItems) {
            quantities.set(
                productId,
                (quantities.get(productId) ?? 0) + quantity,
            );
        }

        const items = [...quantities].map(([productId, quantity]) => {
            const product = CATALOG[productId];
            if (!product) {
                throw new BadRequestException(`Товар ${productId} не найден`);
            }
            return {
                productId,
                productName: product.productName,
                price: product.price,
                quantity,
            };
        });

        const itemsTotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );
        const { deliveryPrice, freeDeliveryFrom } =
            calculateDelivery(itemsTotal);

        return {
            items,
            itemsTotal,
            deliveryPrice,
            freeDeliveryFrom,
            total: itemsTotal + deliveryPrice,
        };
    }

    async create(userId: number, dto: CreateOrderDto) {
        const { items, itemsTotal, deliveryPrice, total } = this.calculate(
            dto.items,
        );

        const order = await this.prisma.order.create({
            data: {
                userId,
                itemsTotal,
                deliveryPrice,
                total,
                recipientName: dto.recipientName,
                city: dto.city,
                address: dto.address,
                postalCode: dto.postalCode,
                comment: dto.comment,
                items: { create: items },
            },
            include: { items: true },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        try {
            const { ozonOrderId, paymentUrl } = await this.ozon.createOrder({
                id: order.id,
                extId: order.extId,
                total: order.total,
                receiptEmail: user?.email,
            });
            return await this.prisma.order.update({
                where: { id: order.id },
                data: { ozonOrderId, paymentUrl },
                include: { items: true },
            });
        } catch (error) {
            await this.prisma.order.update({
                where: { id: order.id },
                data: { status: "cancelled" },
            });
            throw error;
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

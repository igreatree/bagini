import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateOrderDto, OrderItemDto } from "./dto/create-order.dto";
import { CATALOG } from "./catalog";
import { calculateDelivery } from "./delivery";

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) {}

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

        return this.prisma.order.create({
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
    }
}

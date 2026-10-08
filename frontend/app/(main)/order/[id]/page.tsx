"use client";

import { useEffect, useState } from "react";
import {
    Button,
    Center,
    Container,
    Loader,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { IconCircleCheck, IconCircleX, IconClock } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOrder } from "@/api/order";
import { formatPrice } from "@/helpers";
import { useUserStore } from "@/store/user";
import { OrderType } from "@/types";

const POLL_INTERVAL_MS = 4000;
const POLL_ATTEMPTS = 15;

export default function OrderPage() {
    const { id } = useParams<{ id: string }>();
    const { clearBasket } = useUserStore();
    const [order, setOrder] = useState<OrderType | null>(null);

    // Уведомление от Ozon может прийти позже, чем покупатель вернётся
    // на сайт, поэтому какое-то время перезапрашиваем статус.
    useEffect(() => {
        let actual = true;
        let attempts = 0;
        let timer: ReturnType<typeof setTimeout>;

        const load = async () => {
            const res = await getOrder(Number(id));
            if (!actual) return;
            if ("order" in res) {
                setOrder(res.order);
                if (res.order.status === "paid") {
                    clearBasket();
                    return;
                }
                if (res.order.status === "cancelled") return;
            }
            if (++attempts < POLL_ATTEMPTS) {
                timer = setTimeout(load, POLL_INTERVAL_MS);
            }
        };
        load();

        return () => {
            actual = false;
            clearTimeout(timer);
        };
    }, [id, clearBasket]);

    if (!order) {
        return (
            <Center py={80}>
                <Loader />
            </Center>
        );
    }

    const view = {
        paid: {
            icon: (
                <IconCircleCheck
                    size={48}
                    color="var(--mantine-color-green-filled)"
                />
            ),
            title: "Заказ оплачен",
            text: "Спасибо за покупку! Мы свяжемся с вами по вопросам доставки.",
        },
        pending: {
            icon: (
                <IconClock size={48} color="var(--mantine-color-pink-filled)" />
            ),
            title: "Ожидаем оплату",
            text: "Если вы уже оплатили заказ, статус обновится в течение минуты.",
        },
        cancelled: {
            icon: (
                <IconCircleX
                    size={48}
                    color="var(--mantine-color-red-filled)"
                />
            ),
            title: "Заказ не оплачен",
            text: "Оплата не прошла или заказ отменён. Можно оформить заказ заново.",
        },
    }[order.status];

    return (
        <Container size="xs" p={0}>
            <Center py={80}>
                <Stack align="center" gap="xs" ta="center">
                    {view.icon}
                    <Title order={3}>{view.title}</Title>
                    <Text c="dimmed">
                        Заказ №{order.id} на сумму {formatPrice(order.total)} ₽
                    </Text>
                    <Text size="sm" c="dimmed">
                        {view.text}
                    </Text>
                    {order.status === "pending" && order.paymentUrl && (
                        <Button component="a" href={order.paymentUrl}>
                            Перейти к оплате
                        </Button>
                    )}
                    <Button
                        component={Link}
                        href={order.status === "cancelled" ? "/basket" : "/"}
                        variant="light"
                    >
                        {order.status === "cancelled"
                            ? "В корзину"
                            : "В каталог"}
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
}

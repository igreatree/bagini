"use client";

import { useEffect, useState } from "react";
import {
    Anchor,
    Badge,
    Button,
    Center,
    Container,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { IconReceiptOff } from "@tabler/icons-react";
import Link from "next/link";
import { getOrders } from "@/api/order";
import { orderStatusColors, orderStatusLabels } from "@/constants";
import { formatPrice } from "@/helpers";
import { useUserStore } from "@/store/user";
import { OrderType } from "@/types";

export default function OrdersPage() {
    const { user } = useUserStore();
    const [orders, setOrders] = useState<OrderType[] | null>(null);

    useEffect(() => {
        if (!user) return;
        let actual = true;
        getOrders().then((res) => {
            if (actual) setOrders("orders" in res ? res.orders : []);
        });
        return () => {
            actual = false;
        };
    }, [user]);

    if (!user) {
        return (
            <Center py={80}>
                <Stack align="center" gap="xs">
                    <Text size="lg" fw={500}>
                        Войдите, чтобы увидеть свои заказы
                    </Text>
                    <Button component={Link} href="/auth">
                        Войти
                    </Button>
                </Stack>
            </Center>
        );
    }

    if (orders === null) {
        return (
            <Center py={80}>
                <Loader />
            </Center>
        );
    }

    if (orders.length === 0) {
        return (
            <Center py={80}>
                <Stack align="center" gap="xs">
                    <IconReceiptOff
                        size={48}
                        color="var(--mantine-color-pink-filled)"
                    />
                    <Text size="lg" fw={500}>
                        Заказов пока нет
                    </Text>
                    <Button component={Link} href="/">
                        В каталог
                    </Button>
                </Stack>
            </Center>
        );
    }

    return (
        <Container size="md" p={0}>
            <Title order={2} mb="lg">
                Мои заказы
            </Title>

            <Stack gap="md">
                {orders.map((order) => (
                    <Paper key={order.id} withBorder radius="md" p="md">
                        <Group justify="space-between" mb="xs">
                            <Anchor
                                component={Link}
                                href={`/order/${order.id}`}
                                fw={600}
                                c="pink"
                            >
                                Заказ №{order.id}
                            </Anchor>
                            <Badge
                                variant="light"
                                color={orderStatusColors[order.status]}
                            >
                                {orderStatusLabels[order.status]}
                            </Badge>
                        </Group>
                        <Text size="xs" c="dimmed" mb="sm">
                            {new Date(order.createdAt).toLocaleString("ru-RU", {
                                dateStyle: "long",
                                timeStyle: "short",
                            })}
                        </Text>

                        <Stack gap={4} mb="sm">
                            {order.items.map((item) => (
                                <Group
                                    key={item.id}
                                    justify="space-between"
                                    wrap="nowrap"
                                    align="flex-start"
                                >
                                    <Text size="sm">
                                        {item.productName} × {item.quantity}
                                    </Text>
                                    <Text size="sm" style={{ flexShrink: 0 }}>
                                        {formatPrice(
                                            item.price * item.quantity,
                                        )}{" "}
                                        ₽
                                    </Text>
                                </Group>
                            ))}
                        </Stack>

                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                                Доставка:{" "}
                                {order.deliveryPrice > 0
                                    ? `${formatPrice(order.deliveryPrice)} ₽`
                                    : "бесплатно"}
                            </Text>
                            <Text fw={700}>{formatPrice(order.total)} ₽</Text>
                        </Group>
                        {order.status === "pending" && order.paymentUrl && (
                            <Button
                                component="a"
                                href={order.paymentUrl}
                                size="xs"
                                mt="sm"
                            >
                                Оплатить
                            </Button>
                        )}
                    </Paper>
                ))}
            </Stack>
        </Container>
    );
}

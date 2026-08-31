"use client";

import { useMemo, useState } from "react";
import {
    Container,
    Paper,
    Group,
    Text,
    Title,
    Button,
    Divider,
    Stack,
    ActionIcon,
    NumberInput,
    Badge,
    Center,
} from "@mantine/core";
import { IconTrash, IconShoppingCartOff } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useUserStore } from "@/store/user";
import { IProduct } from "@/types";
import { useMockStore } from "@/store/mock";
import Image from "next/image";
import Link from "next/link";

interface BasketItem {
    product: IProduct;
    quantity: number;
}

function formatPrice(value: number) {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function BasketPage() {
    const { basket, updateBasket, basketQuantityChange } = useUserStore();
    const { products } = useMockStore();
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const items: BasketItem[] = useMemo(() => {
        return basket.map((item) => {
            const product = products.find((p) => p.id === item.id)!;
            return { product, quantity: item.count };
        });
    }, [basket, products]);

    const total = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
    );

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const handleQuantityChange = (id: string, value: number | string) => {
        const quantity = Number(value);
        if (!quantity || quantity < 1) return;
        basketQuantityChange(id, quantity);
    };

    const handleRemove = (id: string, name: string) => {
        updateBasket(id);
        notifications.show({
            message: `«${name}» удалён из корзины`,
            color: "gray",
        });
    };

    const handleCheckout = async () => {
        try {
            setCheckoutLoading(true);
            // await onCheckout?.(items);
            console.log({ items });
        } finally {
            setCheckoutLoading(false);
        }
    };

    // if (loading) {
    //     return (
    //         <Container size="md" py="xl">
    //             <Stack gap="md">
    //                 <Skeleton height={28} width={200} />
    //                 {[1, 2, 3].map((i) => (
    //                     <Skeleton key={i} height={100} radius="md" />
    //                 ))}
    //             </Stack>
    //         </Container>
    //     );
    // }

    if (items.length === 0) {
        return (
            <Container size="md" py="xl">
                <Center py={80}>
                    <Stack align="center" gap="xs">
                        <IconShoppingCartOff
                            size={48}
                            color="var(--mantine-color-pink-filled)"
                        />
                        <Text size="lg" fw={500}>
                            Корзина пуста
                        </Text>
                        <Text size="sm" c="dimmed">
                            Добавьте товары, чтобы оформить заказ
                        </Text>
                        <Button component={Link} href="/">
                            В каталог
                        </Button>
                    </Stack>
                </Center>
            </Container>
        );
    }

    return (
        <Container size="md" px={0}>
            <Group mb="lg">
                <Title order={2}>Корзина</Title>
                <Title order={3} c="pink">
                    ({totalCount})
                </Title>
            </Group>

            <Stack gap="md">
                {items.map(({ product, quantity }) => (
                    <Paper key={product.id} withBorder radius="md" p="md">
                        <Group align="flex-start" wrap="nowrap">
                            <Image
                                src={`/mock/images/${product.images[0]}`}
                                alt={product.productName}
                                width={139}
                                height={180}
                                style={{
                                    objectFit: "cover",
                                }}
                            />

                            <Stack gap={4} style={{ flex: 1 }}>
                                <Group
                                    justify="space-between"
                                    wrap="nowrap"
                                    align="flex-start"
                                >
                                    <Stack gap={0}>
                                        <Link
                                            href={`/product/${product.id}`}
                                            style={{
                                                fontWeight: 500,
                                                color: "var(--mantine-color-pink-filled)",
                                            }}
                                        >
                                            {product.productName}
                                        </Link>
                                        <Badge size="xs" variant="light" mt={4}>
                                            {product.type}
                                        </Badge>
                                    </Stack>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() =>
                                            handleRemove(
                                                product.id,
                                                product.productName,
                                            )
                                        }
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>

                                <Text
                                    mih={82}
                                    size="sm"
                                    c="dimmed"
                                    lineClamp={4}
                                >
                                    {product.description}
                                </Text>

                                <Group
                                    justify="space-between"
                                    align="center"
                                    mt="xs"
                                >
                                    <NumberInput
                                        value={quantity}
                                        onChange={(value) =>
                                            handleQuantityChange(
                                                product.id,
                                                value,
                                            )
                                        }
                                        min={1}
                                        max={99}
                                        w={60}
                                        size="xs"
                                    />
                                    <Text fw={600}>
                                        {formatPrice(product.price * quantity)}
                                    </Text>
                                </Group>
                            </Stack>
                        </Group>
                    </Paper>
                ))}
            </Stack>

            <Divider my="lg" />

            <Paper withBorder radius="md" p="lg">
                <Group justify="space-between" mb="md">
                    <Text size="lg">Итого</Text>
                    <Text size="xl" fw={700}>
                        {formatPrice(total)}
                    </Text>
                </Group>
                <Button
                    fullWidth
                    size="md"
                    loading={checkoutLoading}
                    onClick={handleCheckout}
                >
                    Оформить заказ
                </Button>
            </Paper>
        </Container>
    );
}

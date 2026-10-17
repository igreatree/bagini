"use client";

import { useEffect, useMemo, useState } from "react";
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
    Center,
    Checkbox,
    Anchor,
    Skeleton,
    Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconTrash, IconShoppingCartOff, IconPhoto } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useUserStore } from "@/store/user";
import { createOrder } from "@/api/order";
import { getProductsByIds } from "@/api/product";
import { IProduct } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const {
        user,
        basket,
        updateBasket,
        basketQuantityChange,
        buyTermsApplied,
        setBuyTermsApplied,
    } = useUserStore();
    const [products, setProducts] = useState<IProduct[] | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const router = useRouter();

    const form = useForm({
        initialValues: { comment: "" },
    });

    // Корзина хранит только id: актуальные название и цену берём из каталога
    const basketIds = basket.map((item) => item.id).join(",");

    useEffect(() => {
        if (!basketIds) return;
        let actual = true;
        getProductsByIds(basketIds.split(",")).then((res) => {
            if (!actual || !("items" in res)) return;
            setProducts(res.items);

            const available = new Set(res.items.map((product) => product.id));
            const unavailable = basketIds
                .split(",")
                .filter((id) => !available.has(id));
            if (unavailable.length > 0) {
                unavailable.forEach((id) => updateBasket(id));
                notifications.show({
                    message:
                        "Некоторые товары закончились и удалены из корзины",
                    color: "gray",
                });
            }

            // В корзине не может быть больше, чем есть в наличии
            const reduced = res.items.filter((product) => {
                const count = useUserStore
                    .getState()
                    .basket.find((item) => item.id === product.id)?.count;
                return count !== undefined && count > product.stock;
            });
            reduced.forEach((product) =>
                basketQuantityChange(product.id, product.stock),
            );
            if (reduced.length > 0) {
                notifications.show({
                    message:
                        "Количество некоторых товаров уменьшено до остатка на складе",
                    color: "gray",
                });
            }
        });
        return () => {
            actual = false;
        };
        // updateBasket из zustand-стора стабилен
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basketIds]);

    const items: BasketItem[] = useMemo(() => {
        return basket.flatMap((item) => {
            const product = products?.find((p) => p.id === item.id);
            return product ? [{ product, quantity: item.count }] : [];
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

    const handleCheckout = async (values: typeof form.values) => {
        let redirecting = false;
        try {
            setCheckoutLoading(true);
            const res = await createOrder({
                items: items.map(({ product, quantity }) => ({
                    productId: product.id,
                    quantity,
                })),
                comment: values.comment.trim() || undefined,
            });
            if ("order" in res && res.order.paymentUrl) {
                redirecting = true;
                window.location.href = res.order.paymentUrl;
            }
        } finally {
            // Во время перехода на страницу оплаты Ozon кнопка остаётся заблокированной
            if (!redirecting) setCheckoutLoading(false);
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

    if (basket.length > 0 && items.length === 0) {
        return (
            <Container size="xl" p={0}>
                <Stack gap="md">
                    {basket.map((item) => (
                        <Skeleton key={item.id} height={100} radius="md" />
                    ))}
                </Stack>
            </Container>
        );
    }

    if (items.length === 0) {
        return (
            <Container size="xl" p={0}>
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
        <Container size="xl" p={0}>
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
                            <div
                                style={{
                                    position: "relative",
                                    width: 139,
                                    height: 180,
                                    flexShrink: 0,
                                }}
                            >
                                {product.images[0] ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.productName}
                                        fill
                                        sizes="139px"
                                        style={{ objectFit: "contain" }}
                                    />
                                ) : (
                                    <Center h="100%">
                                        <IconPhoto
                                            size={40}
                                            color="var(--mantine-color-gray-4)"
                                        />
                                    </Center>
                                )}
                            </div>

                            <Stack gap={4} style={{ flex: 1 }}>
                                <Group
                                    justify="space-between"
                                    wrap="nowrap"
                                    align="flex-start"
                                >
                                    <Link
                                        href={`/product/${product.id}`}
                                        style={{
                                            fontWeight: 500,
                                            color: "var(--mantine-color-pink-filled)",
                                        }}
                                    >
                                        {product.productName}
                                    </Link>
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
                                        max={Math.min(99, product.stock)}
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

            <Paper withBorder radius="md" p="lg" mb="md">
                <Textarea
                    label="Комментарий к заказу"
                    placeholder="Необязательно"
                    autosize
                    minRows={2}
                    maxLength={500}
                    {...form.getInputProps("comment")}
                />
                <Text size="xs" c="dimmed" mt="xs">
                    Адрес и способ доставки вы выберете на странице оплаты
                </Text>
            </Paper>

            <Paper withBorder radius="md" p="lg">
                <Group justify="space-between" mb="xs">
                    <Text c="dimmed">Товары</Text>
                    <Text>{formatPrice(total)}</Text>
                </Group>
                <Group justify="space-between" mb={4}>
                    <Text c="dimmed">Доставка</Text>
                    <Text>Рассчитывается при оплате</Text>
                </Group>
                <Group justify="space-between" mb="md" mt="md">
                    <Text size="lg">Итого за товары</Text>
                    <Text size="xl" fw={700}>
                        {formatPrice(total)}
                    </Text>
                </Group>
                <Checkbox
                    checked={buyTermsApplied}
                    onChange={(e) => setBuyTermsApplied(e.target.checked)}
                    styles={{ body: { alignItems: "center" } }}
                    mb="md"
                    label={
                        <Text size="xs" c="dimmed">
                            Ознакомлен и согласен с{" "}
                            <Anchor
                                href="/terms/payment-and-delivery"
                                c="pink"
                                size="xs"
                            >
                                правилами оплаты и доставки
                            </Anchor>
                            {" и "}
                            <Anchor
                                component={Link}
                                href="/terms/return-policy"
                                c="pink"
                                size="xs"
                            >
                                правилами возврата и обмена товара
                            </Anchor>
                        </Text>
                    }
                />
                <Button
                    fullWidth
                    size="md"
                    loading={checkoutLoading}
                    disabled={!buyTermsApplied}
                    onClick={() => {
                        if (!user) {
                            router.push("/auth");
                            return;
                        }
                        handleCheckout(form.getValues());
                    }}
                >
                    Оформить заказ
                </Button>
            </Paper>
        </Container>
    );
}

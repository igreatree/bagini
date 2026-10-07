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
    Badge,
    Center,
    Checkbox,
    Anchor,
    TextInput,
    Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconTrash, IconShoppingCartOff } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useUserStore } from "@/store/user";
import { calculateOrder, createOrder } from "@/api/order";
import { IProduct, OrderQuoteType } from "@/types";
import { useMockStore } from "@/store/mock";
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
    const { products } = useMockStore();
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [quote, setQuote] = useState<OrderQuoteType | null>(null);
    const router = useRouter();

    const form = useForm({
        initialValues: {
            recipientName: [user?.name, user?.lastName]
                .filter(Boolean)
                .join(" "),
            city: "",
            address: "",
            postalCode: "",
            comment: "",
        },
        validate: {
            recipientName: (value: string) =>
                value.trim().length < 2 ? "Укажите получателя" : null,
            city: (value: string) =>
                value.trim().length < 2 ? "Укажите город" : null,
            address: (value: string) =>
                value.trim().length < 5
                    ? "Укажите улицу, дом и квартиру"
                    : null,
            postalCode: (value: string) =>
                value && !/^\d{6}$/.test(value)
                    ? "Индекс состоит из 6 цифр"
                    : null,
        },
    });

    useEffect(() => {
        if (basket.length === 0) return;
        let actual = true;
        calculateOrder(
            basket.map(({ id, count }) => ({ productId: id, quantity: count })),
        ).then((res) => {
            if (actual && "deliveryPrice" in res) setQuote(res);
        });
        return () => {
            actual = false;
        };
    }, [basket]);

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

    const handleCheckout = async (values: typeof form.values) => {
        try {
            setCheckoutLoading(true);
            const res = await createOrder({
                items: items.map(({ product, quantity }) => ({
                    productId: product.id,
                    quantity,
                })),
                recipientName: values.recipientName.trim(),
                city: values.city.trim(),
                address: values.address.trim(),
                postalCode: values.postalCode || undefined,
                comment: values.comment.trim() || undefined,
            });
            if ("order" in res) {
                notifications.show({
                    title: "Заказ создан",
                    message: `Заказ №${res.order.id} на сумму ${formatPrice(res.order.total)}`,
                    color: "green",
                });
            }
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

            <Paper withBorder radius="md" p="lg" mb="md">
                <Title order={4} mb="md">
                    Доставка
                </Title>
                <Stack gap="sm">
                    <TextInput
                        label="Получатель"
                        placeholder="Имя и фамилия"
                        {...form.getInputProps("recipientName")}
                    />
                    <Group grow align="flex-start">
                        <TextInput
                            label="Город"
                            {...form.getInputProps("city")}
                        />
                        <TextInput
                            label="Индекс"
                            placeholder="Необязательно"
                            maxLength={6}
                            {...form.getInputProps("postalCode")}
                        />
                    </Group>
                    <TextInput
                        label="Адрес"
                        placeholder="Улица, дом, квартира"
                        {...form.getInputProps("address")}
                    />
                    <Textarea
                        label="Комментарий"
                        placeholder="Необязательно"
                        autosize
                        minRows={2}
                        maxLength={500}
                        {...form.getInputProps("comment")}
                    />
                </Stack>
            </Paper>

            <Paper withBorder radius="md" p="lg">
                <Group justify="space-between" mb="xs">
                    <Text c="dimmed">Товары</Text>
                    <Text>{formatPrice(total)}</Text>
                </Group>
                <Group justify="space-between" mb={4}>
                    <Text c="dimmed">Доставка</Text>
                    <Text>
                        {quote === null
                            ? "—"
                            : quote.deliveryPrice > 0
                              ? formatPrice(quote.deliveryPrice)
                              : "Бесплатно"}
                    </Text>
                </Group>
                {quote !== null &&
                    quote.deliveryPrice > 0 &&
                    quote.freeDeliveryFrom > quote.itemsTotal && (
                        <Text size="xs" c="dimmed" mb="md">
                            Бесплатная доставка от{" "}
                            {formatPrice(quote.freeDeliveryFrom)}, осталось
                            добавить на{" "}
                            {formatPrice(
                                quote.freeDeliveryFrom - quote.itemsTotal,
                            )}
                        </Text>
                    )}
                <Group justify="space-between" mb="md" mt="md">
                    <Text size="lg">Итого</Text>
                    <Text size="xl" fw={700}>
                        {formatPrice(total + (quote?.deliveryPrice ?? 0))}
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
                        if (form.validate().hasErrors) return;
                        handleCheckout(form.getValues());
                    }}
                >
                    Оформить заказ
                </Button>
            </Paper>
        </Container>
    );
}

"use client";

import Link from "next/link";
import { ActionIcon, Button, Group, Stack, Text } from "@mantine/core";
import {
    IconArrowRight,
    IconBasket,
    IconMinus,
    IconPlus,
} from "@tabler/icons-react";
import { useUserStore } from "@/store/user";
import type { IProduct } from "@/types";

type Props = Pick<IProduct, "id" | "productName" | "stock" | "probe"> & {
    disabled?: boolean;
};

const buttonStyles = {
    root: { height: "auto", minHeight: 36, padding: "8px" },
    label: { whiteSpace: "normal" as const, lineHeight: 1.2 },
};

export const ProductCartControls = ({
    id,
    productName,
    stock,
    probe,
    disabled,
}: Props) => {
    const { basket, updateBasket, basketQuantityChange } = useUserStore();
    const item = basket.find((entry) => entry.id === id);
    const maxQuantity = Math.min(
        probe ? 1 : 99,
        Math.max(0, Math.floor(stock)),
    );

    const add = () => {
        if (!useUserStore.getState().basket.some((entry) => entry.id === id))
            updateBasket(id);
    };
    const change = (delta: number) => {
        const current = useUserStore
            .getState()
            .basket.find((entry) => entry.id === id);
        if (!current || probe) return;
        const next = current.count + delta;
        if (next <= 0) updateBasket(id);
        else if (delta < 0 || next <= maxQuantity)
            basketQuantityChange(id, next);
    };

    return (
        <Stack
            gap={6}
            w="100%"
            role="group"
            aria-label={`Корзина: ${productName}`}
            onClick={(event) => event.stopPropagation()}
        >
            {!item ? (
                <Button
                    fullWidth
                    disabled={disabled || maxQuantity < 1}
                    onClick={add}
                    leftSection={<IconBasket size={18} />}
                    styles={buttonStyles}
                >
                    Добавить в корзину
                </Button>
            ) : (
                <>
                    {!probe && (
                        <Group
                            gap={4}
                            justify="space-between"
                            wrap="nowrap"
                            bg="gray.0"
                            bdrs="sm"
                            p={2}
                        >
                            <ActionIcon
                                variant="subtle"
                                size={36}
                                onClick={() => change(-1)}
                                aria-label="Уменьшить количество"
                            >
                                <IconMinus size={18} />
                            </ActionIcon>
                            <Text
                                component="output"
                                fw={600}
                                size="sm"
                                aria-label="Количество товара"
                                aria-live="polite"
                            >
                                {item.count}
                            </Text>
                            <ActionIcon
                                variant="subtle"
                                size={36}
                                disabled={item.count >= maxQuantity}
                                onClick={() => change(1)}
                                aria-label="Увеличить количество"
                                title={
                                    item.count >= maxQuantity
                                        ? `Максимум ${maxQuantity} шт.`
                                        : "Добавить ещё один"
                                }
                            >
                                <IconPlus size={18} />
                            </ActionIcon>
                        </Group>
                    )}
                    <Button
                        component={Link}
                        href="/basket"
                        fullWidth
                        variant="light"
                        rightSection={<IconArrowRight size={17} />}
                        styles={buttonStyles}
                    >
                        Перейти в корзину
                    </Button>
                </>
            )}
        </Stack>
    );
};

"use client";

import { formatPrice } from "@/helpers";
import { useUserStore } from "@/store/user";
import { IProductCard } from "@/types";
import { Card, Badge, Button, Text, Stack } from "@mantine/core";
import { IconBasket, IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export const ProductCard = ({
    productName,
    id,
    price,
    images,
    type,
}: IProductCard) => {
    const { basket, updateBasket } = useUserStore();
    const inBasket = basket.find((item) => item.id === id);
    const router = useRouter();

    return (
        <Card
            shadow="sm"
            padding={0}
            bg="#ffffff9c"
            onClick={() => router.push(`/product/${id}`)}
        >
            <Card.Section
                pos="relative"
                w="100%"
                style={{ aspectRatio: "3/4" }}
            >
                <Badge
                    style={{ position: "absolute", right: 10, top: 10 }}
                    color="red"
                >
                    Новинка
                </Badge>
                <Image
                    src={`/mock/images/${images[0]}`}
                    fill
                    alt="product"
                    style={{
                        objectFit: "contain",
                    }}
                />
            </Card.Section>
            <Stack p="sm" gap="xs">
                <Badge size="xs" variant="light">
                    {type}
                </Badge>
                <Text fw={500} lineClamp={2} title={productName}>
                    {productName}
                </Text>

                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        updateBasket(id);
                    }}
                    leftSection={inBasket ? <IconCheck /> : <IconBasket />}
                    fullWidth
                    variant={inBasket ? "outline" : "filled"}
                >
                    {formatPrice(price)}₽
                </Button>
            </Stack>
        </Card>
    );
};

"use client";

import { formatPrice } from "@/helpers";
import { useUserStore } from "@/store/user";
import { IProductCard } from "@/types";
import { Card, Badge, Button, Text } from "@mantine/core";
import { IconBasket, IconCheck } from "@tabler/icons-react";
import Image from "next/image";

export const ProductCard = ({
    productName,
    id,
    price,
    images,
    type,
}: IProductCard) => {
    const { basket, updateBasket } = useUserStore();

    return (
        <Card miw={300} shadow="sm" padding="lg" bg="#ffffff9c">
            <Card.Section style={{ display: "flex", justifyContent: "center" }}>
                <Badge
                    style={{ position: "absolute", right: 10, top: 10 }}
                    color="red"
                >
                    Новинка
                </Badge>
                <Image
                    src={`/mock/images/${images[0]}`}
                    height={260}
                    width={200}
                    alt="Norway"
                />
            </Card.Section>
            <Text lineClamp={1} fz="sm" c="dimmed" mb="sm" mt="sm" title={type}>
                {type}
            </Text>
            <Text fw={500} lineClamp={2} title={productName}>
                {productName}
            </Text>

            <Button
                onClick={() => updateBasket(id)}
                color="pink"
                leftSection={
                    basket.includes(id) ? <IconCheck /> : <IconBasket />
                }
                fullWidth
                mt="md"
                variant={basket.includes(id) ? "outline" : "filled"}
            >
                {formatPrice(price)}₽
            </Button>
        </Card>
    );
};

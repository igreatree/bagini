"use client";

import { formatPrice } from "@/helpers";
import { IProductCard } from "@/types";
import { Card, Badge, Button, Text } from "@mantine/core";
import { IconBasket } from "@tabler/icons-react";
import Image from "next/image";

export const ProductCard = ({
    productName,
    id,
    price,
    images,
    type,
}: IProductCard) => {
    return (
        <Card
            miw={300}
            shadow="sm"
            padding="lg"
            onClick={() => console.log(id)}
            bg="#ffffff9c"
        >
            <Card.Section style={{ display: "flex", justifyContent: "center" }}>
                <Badge
                    style={{ position: "absolute", right: 10, top: 10 }}
                    color="pink"
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
                color="pink"
                variant="gradient"
                gradient={{ from: "pink", to: "orange", deg: 90 }}
                leftSection={<IconBasket />}
                fullWidth
                mt="md"
            >
                {formatPrice(price)}₽
            </Button>
        </Card>
    );
};

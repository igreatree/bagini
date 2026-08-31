"use client";

import { formatPrice } from "@/helpers";
import { useUserStore } from "@/store/user";
import { IProductCard } from "@/types";
import { Card, Badge, Button, Text } from "@mantine/core";
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
    const { user, basket, updateBasket } = useUserStore();
    const inBasket = basket.find((item) => item.id === id);
    const router = useRouter();

    return (
        <Card
            miw={300}
            shadow="sm"
            padding="lg"
            bg="#ffffff9c"
            onClick={() => router.push(`/product/${id}`)}
        >
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
            <Badge size="xs" variant="light" mb="sm" mt="md">
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
                mt="md"
                variant={inBasket ? "outline" : "filled"}
            >
                {formatPrice(price)}₽
            </Button>
        </Card>
    );
};

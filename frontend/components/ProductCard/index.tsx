"use client";

import { formatPriceLabel } from "@/helpers";
import { useUserStore } from "@/store/user";
import { IProductCard } from "@/types";
import { Card, Badge, Button, Text, Stack, Center } from "@mantine/core";
import { IconBasket, IconCheck, IconPhoto } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export const ProductCard = ({
    productName,
    id,
    price,
    images,
    probe,
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
            style={{ display: "flex", flexDirection: "column" }}
        >
            <Card.Section
                pos="relative"
                w="100%"
                style={{ aspectRatio: "3/4" }}
            >
                <Badge
                    style={{ position: "absolute", right: 10, top: 10 }}
                    color={probe ? "pink" : "red"}
                >
                    {probe ? "Пробник" : "Новинка"}
                </Badge>
                {images[0] ? (
                    <Image
                        src={images[0]}
                        fill
                        sizes="(max-width: 768px) 50vw, 230px"
                        alt={productName}
                        style={{
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <Center h="100%">
                        <IconPhoto
                            size={48}
                            color="var(--mantine-color-gray-4)"
                        />
                    </Center>
                )}
            </Card.Section>
            <Stack p="sm" gap="xs" style={{ flex: 1 }}>
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
                    mt="auto"
                    variant={inBasket ? "outline" : "filled"}
                >
                    {formatPriceLabel(price)}
                </Button>
            </Stack>
        </Card>
    );
};

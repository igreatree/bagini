"use client";

import { formatPriceLabel } from "@/helpers";
import { IProductCard } from "@/types";
import { Card, Badge, Text, Stack, Center } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProductCartControls } from "../ProductCartControls";

export const ProductCard = ({
    productName,
    id,
    price,
    images,
    probe,
    stock,
    disabled,
}: IProductCard & { disabled?: boolean }) => {
    const router = useRouter();

    return (
        <Card
            shadow="sm"
            padding={0}
            bg="#ffffff9c"
            onClick={(e) => {
                // Клик по кнопке, в том числе недоступной, карточку не открывает
                if ((e.target as HTMLElement).closest("button, a")) return;
                router.push(`/product/${id}`);
            }}
            style={{ display: "flex", flexDirection: "column" }}
        >
            <Card.Section
                pos="relative"
                w="100%"
                style={{ aspectRatio: "3/4" }}
            >
                <Badge
                    style={{ position: "absolute", right: 10, top: 10 }}
                    color={probe ? "blue" : "red"}
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

                <Text fw={700} size="lg" mt="auto">
                    {formatPriceLabel(price)}
                </Text>
                <ProductCartControls
                    id={id}
                    productName={productName}
                    stock={stock}
                    probe={probe}
                    disabled={disabled}
                />
            </Stack>
        </Card>
    );
};

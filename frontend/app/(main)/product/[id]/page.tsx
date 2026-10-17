"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/helpers";
import { useUserStore } from "@/store/user";
import { IProduct } from "@/types";
import {
    Container,
    Grid,
    Stack,
    Group,
    Text,
    Title,
    Button,
    Paper,
    Divider,
    UnstyledButton,
    NumberInput,
    Skeleton,
    Center,
} from "@mantine/core";
import {
    IconBasket,
    IconCheck,
    IconChevronLeft,
    IconPhoto,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getProduct } from "@/api/product";

export default function ProductPage() {
    const { basket, updateBasket, basketQuantityChange } = useUserStore();
    const router = useRouter();
    const [activeImage, setActiveImage] = useState(0);
    const [loaded, setLoaded] = useState<{
        id: string;
        product: IProduct | null;
    } | null>(null);
    const pathname = usePathname();
    const productId = pathname.split("/").pop()!;

    useEffect(() => {
        let actual = true;
        getProduct(productId).then((res) => {
            if (actual) {
                setLoaded({
                    id: productId,
                    product: "product" in res ? res.product : null,
                });
            }
        });
        return () => {
            actual = false;
        };
    }, [productId]);

    const handleQuantityChange = (id: string, value: number | string) => {
        const quantity = Number(value);
        if (!quantity || quantity < 1) return;
        basketQuantityChange(id, quantity);
    };

    const backButton = (
        <Button
            mb="md"
            variant="transparent"
            leftSection={<IconChevronLeft />}
            onClick={() => router.back()}
            size="lg"
        >
            Назад
        </Button>
    );

    if (loaded?.id !== productId) {
        return (
            <Container size="xl" p={0}>
                {backButton}
                <Grid gap="sm">
                    <Grid.Col span={{ base: 12, sm: 5 }}>
                        <Skeleton style={{ aspectRatio: "3/4" }} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 7 }}>
                        <Stack gap="sm">
                            <Skeleton height={32} />
                            <Skeleton height={120} />
                        </Stack>
                    </Grid.Col>
                </Grid>
            </Container>
        );
    }

    const { product } = loaded;

    if (!product) {
        return (
            <Container size="xl" p={0}>
                {backButton}
                <Center py={80}>
                    <Text size="lg" fw={500}>
                        Товар не найден или больше не доступен
                    </Text>
                </Center>
            </Container>
        );
    }

    const inBasket = basket.find((item) => item.id === product.id);
    const image = product.images[activeImage];

    return (
        <Container size="xl" p={0}>
            {backButton}

            <Grid gap="sm">
                <Grid.Col span={{ base: 12, sm: 5 }}>
                    <Stack gap="sm">
                        <Paper
                            radius="md"
                            style={{
                                position: "relative",
                                aspectRatio: "3/4",
                            }}
                        >
                            {image ? (
                                <Image
                                    src={image}
                                    alt={product.productName}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 40vw"
                                    style={{ objectFit: "contain" }}
                                />
                            ) : (
                                <Center h="100%">
                                    <IconPhoto
                                        size={64}
                                        color="var(--mantine-color-gray-4)"
                                    />
                                </Center>
                            )}
                        </Paper>

                        {product.images.length > 1 && (
                            <Group gap="xs">
                                {product.images.map((image, index) => (
                                    <UnstyledButton
                                        key={image + index}
                                        onClick={() => setActiveImage(index)}
                                    >
                                        <Paper
                                            withBorder
                                            radius="sm"
                                            style={{
                                                borderColor:
                                                    activeImage === index
                                                        ? "var(--mantine-color-pink-5)"
                                                        : undefined,
                                                borderWidth:
                                                    activeImage === index
                                                        ? 2
                                                        : 0,
                                                position: "relative",
                                                aspectRatio: "3/4",
                                            }}
                                            miw={80}
                                        >
                                            <Image
                                                src={image}
                                                alt={`${product.productName} ${index + 1}`}
                                                fill
                                                sizes="80px"
                                                style={{ objectFit: "contain" }}
                                            />
                                        </Paper>
                                    </UnstyledButton>
                                ))}
                            </Group>
                        )}
                    </Stack>
                </Grid.Col>

                <Grid.Col
                    span={{ base: 12, sm: 7 }}
                    p="sm"
                    bdrs="sm"
                    bg="#ffffff9c"
                >
                    <Stack gap="sm">
                        <Title order={2}>{product.productName}</Title>

                        {product.description && (
                            <Text c="dimmed" style={{ whiteSpace: "pre-line" }}>
                                {product.description}
                            </Text>
                        )}

                        <Divider my="sm" />

                        <Group justify="space-between" align="center">
                            {inBasket && (
                                <Group
                                    justify="space-between"
                                    align="center"
                                    mt="xs"
                                >
                                    <NumberInput
                                        value={inBasket.count}
                                        onChange={(value) =>
                                            handleQuantityChange(
                                                product.id,
                                                value,
                                            )
                                        }
                                        min={1}
                                        max={Math.min(99, product.stock)}
                                        w={90}
                                        size="md"
                                    />
                                    <Text fw={700} size="xl">
                                        {formatPrice(
                                            product.price * inBasket.count,
                                        )}
                                        ₽
                                    </Text>
                                </Group>
                            )}
                            {!inBasket && (
                                <Text fw={700} size="xl">
                                    {formatPrice(product.price)}₽
                                </Text>
                            )}

                            <Button
                                onClick={() => updateBasket(product.id)}
                                leftSection={
                                    inBasket ? <IconCheck /> : <IconBasket />
                                }
                                variant={inBasket ? "outline" : "filled"}
                                size="md"
                            >
                                {inBasket ? "В корзине" : "В корзину"}
                            </Button>
                        </Group>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
// ("use client");

// import { useState } from "react";
// import { formatPrice } from "@/helpers";
// import { useUserStore } from "@/store/user";
// import { IProduct } from "@/types";
// import {
//     Container,
//     Grid,
//     Stack,
//     Group,
//     Badge,
//     Text,
//     Title,
//     Button,
//     Paper,
//     Divider,
//     UnstyledButton,
//     Box,
//     Breadcrumbs,
//     Anchor,
// } from "@mantine/core";
// import { IconBasket, IconCheck, IconChevronLeft } from "@tabler/icons-react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";

// interface ProductPageProps {
//     product: IProduct;
// }

// // Поля характеристик, которые выводим списком.
// // hairType и texture опциональные — попадут в список только если есть значение.
// function getCharacteristics(product: IProduct) {
//     const rows: { label: string; value?: string }[] = [
//         { label: "Бренд", value: product.brand },
//         { label: "Линия", value: product.line },
//         { label: "Название", value: product.name },
//         { label: "Тип", value: product.type },
//         { label: "Назначение", value: product.purpose },
//         { label: "Объём", value: product.volume },
//         { label: "Фиксация", value: product.hold },
//         { label: "Тип волос", value: product.hairType },
//         { label: "Текстура", value: product.texture },
//         { label: "Эффект", value: product.effect },
//         { label: "Аромат", value: product.scent },
//         { label: "Страна бренда", value: product.countryOfBrand },
//         { label: "Форма", value: product.form },
//     ];

//     return rows.filter((row) => Boolean(row.value));
// }

// export const ProductPage = ({ product }: ProductPageProps) => {
//     const { basket, updateBasket } = useUserStore();
//     const router = useRouter();
//     const [activeImage, setActiveImage] = useState(0);

//     const inBasket = basket.find((item) => item.id === product.id);
//     const characteristics = getCharacteristics(product);

//     return (
//         <Container size="lg" py="xl">
//             <Breadcrumbs mb="lg">
//                 <Anchor size="sm" onClick={() => router.push("/")}>
//                     Главная
//                 </Anchor>
//                 <Anchor
//                     size="sm"
//                     onClick={() => router.push(`/catalog?type=${product.type}`)}
//                 >
//                     {product.type}
//                 </Anchor>
//                 <Text size="sm" c="dimmed">
//                     {product.productName}
//                 </Text>
//             </Breadcrumbs>

//             <UnstyledButton
//                 onClick={() => router.back()}
//                 mb="md"
//                 style={{ display: "flex", alignItems: "center", gap: 4 }}
//             >
//                 <IconChevronLeft size={16} />
//                 <Text size="sm">Назад</Text>
//             </UnstyledButton>

//             <Grid gutter="xl">
//                 {/* Галерея изображений */}
//                 <Grid.Col span={{ base: 12, sm: 5 }}>
//                     <Stack gap="sm">
//                         <Paper
//                             withBorder
//                             radius="md"
//                             p="md"
//                             style={{
//                                 display: "flex",
//                                 justifyContent: "center",
//                                 alignItems: "center",
//                                 position: "relative",
//                             }}
//                         >
//                             <Image
//                                 src={`/mock/images/${product.images[activeImage]}`}
//                                 alt={product.productName}
//                                 height={400}
//                                 width={320}
//                                 style={{ objectFit: "contain" }}
//                             />
//                         </Paper>

//                         {product.images.length > 1 && (
//                             <Group gap="xs">
//                                 {product.images.map((image, index) => (
//                                     <UnstyledButton
//                                         key={image + index}
//                                         onClick={() => setActiveImage(index)}
//                                     >
//                                         <Paper
//                                             withBorder
//                                             radius="sm"
//                                             p={4}
//                                             style={{
//                                                 borderColor:
//                                                     activeImage === index
//                                                         ? "var(--mantine-color-pink-5)"
//                                                         : undefined,
//                                                 borderWidth:
//                                                     activeImage === index
//                                                         ? 2
//                                                         : 1,
//                                             }}
//                                         >
//                                             <Image
//                                                 src={`/mock/images/${image}`}
//                                                 alt={`${product.productName} ${index + 1}`}
//                                                 height={64}
//                                                 width={64}
//                                                 style={{ objectFit: "contain" }}
//                                             />
//                                         </Paper>
//                                     </UnstyledButton>
//                                 ))}
//                             </Group>
//                         )}
//                     </Stack>
//                 </Grid.Col>

//                 {/* Информация о товаре */}
//                 <Grid.Col span={{ base: 12, sm: 7 }}>
//                     <Stack gap="sm">
//                         <Badge size="xs" variant="light">
//                             {product.type}
//                         </Badge>

//                         <Title order={2}>{product.productName}</Title>

//                         <Text c="dimmed">{product.description}</Text>

//                         <Divider my="sm" />

//                         <Group justify="space-between" align="center">
//                             <Text fw={700} size="xl">
//                                 {formatPrice(product.price)}₽
//                             </Text>

//                             <Button
//                                 onClick={() => updateBasket(product.id)}
//                                 leftSection={
//                                     inBasket ? <IconCheck /> : <IconBasket />
//                                 }
//                                 variant={inBasket ? "outline" : "filled"}
//                                 size="md"
//                             >
//                                 {inBasket ? "В корзине" : "В корзину"}
//                             </Button>
//                         </Group>

//                         <Divider my="sm" />

//                         <Title order={4} mb="xs">
//                             Характеристики
//                         </Title>

//                         <Box>
//                             {characteristics.map((row, index) => (
//                                 <Group
//                                     key={row.label}
//                                     justify="space-between"
//                                     py={8}
//                                     style={{
//                                         borderBottom:
//                                             index < characteristics.length - 1
//                                                 ? "1px solid var(--mantine-color-gray-2)"
//                                                 : undefined,
//                                     }}
//                                 >
//                                     <Text size="sm" c="dimmed">
//                                         {row.label}
//                                     </Text>
//                                     <Text size="sm" fw={500}>
//                                         {row.value}
//                                     </Text>
//                                 </Group>
//                             ))}
//                         </Box>
//                     </Stack>
//                 </Grid.Col>
//             </Grid>
//         </Container>
//     );
// };

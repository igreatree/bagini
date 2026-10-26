"use client";

import { useEffect, useState } from "react";
import {
    Button,
    Center,
    Container,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { IconCircleCheck, IconClock } from "@tabler/icons-react";
import Link from "next/link";
import { getProbePurchase } from "@/api/order";
import { getProbes } from "@/api/product";
import { ProbesBanner } from "@/components/ProbesBanner";
import { ProductCard } from "@/components/ProductCard";
import { useIsMobile } from "@/hooks";
import { useUserStore } from "@/store/user";
import type { IProduct, ProbePurchaseType } from "@/types";

export default function ProbesPage() {
    const isMobile = useIsMobile();
    const { user } = useUserStore();
    // undefined — ещё грузим, null — не удалось загрузить
    const [probes, setProbes] = useState<IProduct[] | null | undefined>();
    const [attempt, setAttempt] = useState(0);
    const [purchase, setPurchase] = useState<{
        userId: number;
        value: ProbePurchaseType | null;
    } | null>(null);

    useEffect(() => {
        let actual = true;
        getProbes().then((res) => {
            if (actual) setProbes("items" in res ? res.items : null);
        });
        return () => {
            actual = false;
        };
    }, [attempt]);

    useEffect(() => {
        if (!user) return;
        let actual = true;
        getProbePurchase().then((res) => {
            if (!actual) return;
            setPurchase({
                userId: user.id,
                value: "purchase" in res ? res.purchase : null,
            });
        });
        return () => {
            actual = false;
        };
    }, [user]);

    const purchaseLoading = !!user && purchase?.userId !== user.id;
    const bought = user && purchase?.userId === user.id ? purchase.value : null;

    const gridProps = {
        minColWidth: isMobile ? 150 : 230,
        autoFlow: "auto-fill" as const,
        spacing: isMobile ? 4 : "sm",
    };

    const renderContent = () => {
        if (probes === undefined || purchaseLoading) {
            return (
                <SimpleGrid {...gridProps}>
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton
                            key={index}
                            style={{ aspectRatio: "3/4.6" }}
                        />
                    ))}
                </SimpleGrid>
            );
        }

        // Один пробник на аккаунт: после покупки остальные недоступны
        if (bought) {
            const paid = bought.status === "paid";
            const Icon = paid ? IconCircleCheck : IconClock;
            return (
                <Center py={60}>
                    <Stack align="center" gap="xs">
                        <Icon
                            size={48}
                            color="var(--mantine-color-blue-filled)"
                        />
                        <Text size="lg" fw={500}>
                            {paid
                                ? "Вы уже приобрели пробник"
                                : "Пробник ждёт оплаты"}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                            {paid
                                ? "Пробник можно купить один раз на аккаунт"
                                : "Оплатите заказ, чтобы получить пробник"}
                        </Text>
                        <Button component={Link} href={`/order/${bought.id}`}>
                            К заказу
                        </Button>
                    </Stack>
                </Center>
            );
        }

        if (probes === null) {
            return (
                <Center py={60}>
                    <Stack align="center" gap="xs">
                        <Text>Не удалось загрузить пробники</Text>
                        <Button
                            variant="light"
                            onClick={() => {
                                setProbes(undefined);
                                setAttempt((n) => n + 1);
                            }}
                        >
                            Повторить
                        </Button>
                    </Stack>
                </Center>
            );
        }

        if (probes.length === 0) {
            return (
                <Center py={60}>
                    <Text c="dimmed">Пробников пока нет</Text>
                </Center>
            );
        }

        return (
            <SimpleGrid {...gridProps}>
                {probes.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </SimpleGrid>
        );
    };

    return (
        <Container w="100%" size="xl" p={0}>
            <Stack gap="md">
                {!bought && <ProbesBanner />}
                <Group align="baseline">
                    <Title order={2}>Пробники</Title>
                    <Text c="dimmed">Один пробник на аккаунт</Text>
                </Group>
                {renderContent()}
            </Stack>
        </Container>
    );
}

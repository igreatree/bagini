"use client";

import { useEffect, useState } from "react";
import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { useUserStore } from "@/store/user";

export const CookieBanner = () => {
    const [opened, setOpened] = useState(false);
    const { authTermsApplied, setAuthTermsApplied } = useUserStore();

    useEffect(() => {
        if (!authTermsApplied) {
            setOpened(true);
        }
    }, [authTermsApplied]);

    const handleConsent = (value: boolean) => {
        setAuthTermsApplied(value);
        setOpened(false);
    };

    if (!opened) {
        return null;
    }

    return (
        <Paper
            shadow="xl"
            radius="lg"
            p="lg"
            withBorder
            style={{
                position: "fixed",
                zIndex: 1000,
                bottom: 20,
                left: 20,
                right: 20,
            }}
        >
            <Stack gap="xs">
                <Text fw={600} size="lg">
                    Использование файлов cookie
                </Text>

                <Text size="sm" c="dimmed">
                    Мы используем файлы cookie и метрические данные, чтобы сайт
                    работал корректно, а также для анализа посещаемости и
                    улучшения работы магазина.
                </Text>

                <Text size="sm" c="dimmed">
                    Продолжая использовать сайт, вы соглашаетесь с обработкой
                    данных в соответствии с{" "}
                    <Link
                        href="/terms/privacy-policy"
                        style={{
                            color: "var(--mantine-color-pink-filled)",
                        }}
                    >
                        Политикой обработки персональных данных
                    </Link>{" "}
                    и{" "}
                    <Link
                        href="/terms/cookie-consent"
                        style={{
                            color: "var(--mantine-color-pink-filled)",
                        }}
                    >
                        согласием на обработку cookie
                    </Link>
                    .
                </Text>

                <Text size="sm" c="dimmed">
                    Условия использования магазина указаны в{" "}
                    <Link
                        href="/terms/public-offer"
                        style={{
                            color: "var(--mantine-color-pink-filled)",
                        }}
                    >
                        Публичной оферте
                    </Link>
                    .
                </Text>

                <Group justify="flex-end">
                    <Button
                        variant="default"
                        onClick={() => handleConsent(false)}
                    >
                        Отказаться
                    </Button>

                    <Button onClick={() => handleConsent(true)}>Принять</Button>
                </Group>
            </Stack>
        </Paper>
    );
};

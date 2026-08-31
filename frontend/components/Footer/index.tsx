import { Group, Stack, Text } from "@mantine/core";
import Link from "next/link";

export const Footer = () => {
    return (
        <footer>
            <Group
                bg="#ffffff9c"
                p="md"
                justify="space-between"
                align="flex-start"
            >
                <Text>© 2026 Bagini</Text>
                <Group gap="md" visibleFrom="xs" fz="sm" align="flex-start">
                    <Stack gap="xs">
                        <Link
                            href="/terms/payment-and-delivery"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Оплата и доставка
                        </Link>
                        <Link
                            href="/terms/return-policy"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Правила возврата и обмена товара
                        </Link>
                        <Link
                            href="/terms/privacy-policy"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Политика обработки персональных данных
                        </Link>
                        <Link
                            href="/terms/advertising-consent"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Согласие на получение рекламно-информационных
                            материалов
                        </Link>
                        <Link
                            href="/terms/cookie-consent"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Согласие на обработку файлов cookie и метрических
                            данных
                        </Link>
                    </Stack>
                </Group>
            </Group>
        </footer>
    );
};

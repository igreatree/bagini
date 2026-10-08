"use client";

import {
    Burger,
    Drawer,
    Stack,
    NavLink,
    Text,
    Divider,
    BurgerProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/store/user";

const menuItems = [
    {
        label: "Каталог",
        href: "/",
    },
    {
        label: "Мои заказы",
        href: "/orders",
        authOnly: true,
    },
    {
        label: "Оплата и доставка",
        href: "/terms/payment-and-delivery",
    },
    {
        label: "Контакты",
        href: "/contacts",
    },
    {
        label: "Правила возврата и обмена товара",
        href: "/terms/return-policy",
    },
    {
        label: "Публичная оферта интернет-магазина",
        href: "/terms/public-offer",
    },
    {
        label: "Политика обработки персональных данных",
        href: "/terms/privacy-policy",
    },
    {
        label: "Согласие на обработку файлов cookie и метрических данных",
        href: "/terms/cookie-consent",
    },
];

export const HeaderMenu = (props: BurgerProps) => {
    const [opened, { open, close }] = useDisclosure(false);
    const pathname = usePathname();
    const { user } = useUserStore();
    const items = menuItems.filter((item) => !item.authOnly || user);

    return (
        <>
            <Burger
                size="sm"
                opened={opened}
                onClick={open}
                aria-label="Открыть меню"
                {...props}
            />

            <Drawer
                opened={opened}
                onClose={close}
                title={
                    <Image
                        src="/logo.svg"
                        alt="Bagini logo"
                        width={90}
                        height={37}
                        loading="eager"
                    />
                }
                padding="lg"
                size="md"
            >
                <Stack gap="xs" flex={1}>
                    {items.map((item) => (
                        <NavLink
                            key={item.href}
                            component={Link}
                            href={item.href}
                            label={item.label}
                            active={pathname === item.href}
                            onClick={close}
                            bdrs="md"
                            styles={{
                                label: {
                                    whiteSpace: "normal",
                                },
                            }}
                        />
                    ))}
                </Stack>

                <Divider my="xl" />

                <Text size="sm" c="dimmed">
                    © {new Date().getFullYear()} Bagini
                </Text>
            </Drawer>
        </>
    );
};

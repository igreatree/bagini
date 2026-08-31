"use client";

import {
    ActionIcon,
    AppShell,
    Avatar,
    Box,
    Button,
    Group,
    Indicator,
    Menu,
    ScrollArea,
    ThemeIcon,
} from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import { IconBasket, IconLogout, IconUser } from "@tabler/icons-react";
import { useUserStore } from "@/store/user";
import { getInitials } from "@/helpers";
import { useRouter } from "next/navigation";
import { HeaderMenu } from "@/components/HeaderMenu";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, basket, logout } = useUserStore();
    const router = useRouter();

    return (
        <AppShell header={{ height: 60 }}>
            <AppShell.Header bg="#ffffff9c" style={{ border: "none" }}>
                <Group h="100%" px="md">
                    <HeaderMenu hiddenFrom="sm" />
                    <Group justify="space-between" style={{ flex: 1 }}>
                        <Link
                            href="/"
                            style={{ display: "flex", alignItems: "center" }}
                        >
                            <Image
                                src="/logo.svg"
                                alt="Bagini logo"
                                width={90}
                                height={37}
                                loading="eager"
                            />
                        </Link>
                        <Group>
                            <Box visibleFrom="sm">
                                <HeaderMenu />
                            </Box>
                            {user ? (
                                <>
                                    <Indicator
                                        inline
                                        label={basket.length}
                                        size={16}
                                        offset={2}
                                        disabled={!basket.length}
                                    >
                                        <ActionIcon
                                            variant="outline"
                                            radius="50%"
                                            size="lg"
                                            onClick={() =>
                                                router.push("/basket")
                                            }
                                        >
                                            <IconBasket />
                                        </ActionIcon>
                                    </Indicator>
                                    <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <Box style={{ cursor: "pointer" }}>
                                                {user.name ? (
                                                    <Avatar
                                                        size={34}
                                                        radius="50%"
                                                        color="pink"
                                                    >
                                                        {getInitials(user)}
                                                    </Avatar>
                                                ) : (
                                                    <ThemeIcon
                                                        variant="outline"
                                                        radius="50%"
                                                        size="lg"
                                                    >
                                                        <IconUser />
                                                    </ThemeIcon>
                                                )}
                                            </Box>
                                        </Menu.Target>

                                        <Menu.Dropdown>
                                            <Menu.Item
                                                leftSection={
                                                    <IconUser size={14} />
                                                }
                                                component={Link}
                                                href="/profile"
                                            >
                                                Профиль
                                            </Menu.Item>

                                            <Menu.Divider />
                                            <Menu.Item
                                                color="pink"
                                                onClick={logout}
                                                leftSection={
                                                    <IconLogout size={14} />
                                                }
                                            >
                                                Выйти
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/auth")}
                                >
                                    Войти
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Main style={{ height: "100vh", overflow: "hidden" }}>
                <ScrollArea h="100%">
                    <Box p="sm" mih="calc(100vh - 60px)">
                        {children}
                    </Box>
                    <Footer />
                    <CookieBanner />
                </ScrollArea>
            </AppShell.Main>
        </AppShell>
    );
}

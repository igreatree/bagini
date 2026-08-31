"use client";

import {
    ActionIcon,
    AppShell,
    Avatar,
    Box,
    Button,
    Group,
    Indicator,
    ScrollArea,
} from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import { IconBasket, IconUser } from "@tabler/icons-react";
import { useUserStore } from "@/store/user";
import { getInitials } from "@/helpers";
import { useRouter } from "next/navigation";
import { HeaderMenu } from "@/components/HeaderMenu";
import { Footer } from "@/components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, basket } = useUserStore();
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
                                    {user.name ? (
                                        <Avatar
                                            size={34}
                                            radius="50%"
                                            component={Link}
                                            href="/profile"
                                            color="pink"
                                        >
                                            {getInitials(user)}
                                        </Avatar>
                                    ) : (
                                        <ActionIcon
                                            variant="outline"
                                            radius="50%"
                                            size="lg"
                                            onClick={() =>
                                                router.push("/profile")
                                            }
                                        >
                                            <IconUser />
                                        </ActionIcon>
                                    )}
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
                    <Box p="sm">{children}</Box>
                    <Footer />
                </ScrollArea>
            </AppShell.Main>
        </AppShell>
    );
}

"use client";

import {
    ActionIcon,
    AppShell,
    Avatar,
    Burger,
    Button,
    Group,
    Indicator,
    ScrollArea,
    Stack,
    Text,
    UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import Link from "next/link";
import { IconBasket, IconUser } from "@tabler/icons-react";
import { useUserStore } from "@/store/user";
import { getInitials } from "@/helpers";
import { useRouter } from "next/navigation";
import styles from "./main.module.scss";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const { user, basket } = useUserStore();
    const router = useRouter();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { desktop: true, mobile: !opened },
            }}
            footer={{ height: 60 }}
            padding="sm"
        >
            <AppShell.Header bg="#ffffff9c" style={{ border: "none" }}>
                <Group h="100%" px="md">
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />
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
                            <Group ml="xl" gap="xs" visibleFrom="sm">
                                <UnstyledButton
                                    component={Link}
                                    href="/"
                                    className={styles.link}
                                >
                                    Продукты
                                </UnstyledButton>
                                <UnstyledButton
                                    component={Link}
                                    href="/contacts"
                                    className={styles.link}
                                >
                                    Контакты
                                </UnstyledButton>
                            </Group>
                            {user ? (
                                <>
                                    <Indicator
                                        inline
                                        label={basket.length}
                                        color="pink"
                                        size={16}
                                        offset={2}
                                        disabled={!basket.length}
                                    >
                                        <ActionIcon
                                            variant="outline"
                                            radius="50%"
                                            color="pink"
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
                                            color="pink"
                                            component={Link}
                                            href="/profile"
                                        >
                                            {getInitials(user)}
                                        </Avatar>
                                    ) : (
                                        <ActionIcon
                                            variant="outline"
                                            radius="50%"
                                            color="pink"
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
                                    color="pink"
                                    onClick={() => router.push("/auth")}
                                >
                                    Войти
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar py="md" px={4}>
                <Stack justify="space-between" h="100%">
                    <Stack gap={0}>
                        <UnstyledButton
                            component={Link}
                            href="/"
                            className={styles.link}
                        >
                            Продукты
                        </UnstyledButton>
                        <UnstyledButton
                            component={Link}
                            href="/contacts"
                            className={styles.link}
                        >
                            Контакты
                        </UnstyledButton>
                    </Stack>
                    <Stack gap={0}>
                        <UnstyledButton
                            component={Link}
                            href="/terms/privacy-policy"
                            className={styles.link}
                        >
                            Политика конфиденциальности
                        </UnstyledButton>
                        <UnstyledButton
                            component={Link}
                            href="/terms/public-offer"
                            className={styles.link}
                        >
                            Публичная оферта
                        </UnstyledButton>
                    </Stack>
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main style={{ height: "100vh", overflow: "hidden" }}>
                <ScrollArea h="100%">{children}</ScrollArea>
            </AppShell.Main>
            <AppShell.Footer
                bg="#ffffff9c"
                px="md"
                style={{
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Group w="100%" justify="space-between">
                    <Text>© 2026 Bagini</Text>
                    <Group gap="md" visibleFrom="xs">
                        <Link
                            href="/terms/privacy-policy"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Политика конфиденциальности
                        </Link>
                        <Link
                            href="/terms/public-offer"
                            style={{
                                textDecoration: "none",
                                color: "var(--mantine-color-pink-filled)",
                            }}
                        >
                            Публичная оферта
                        </Link>
                    </Group>
                </Group>
            </AppShell.Footer>
        </AppShell>
    );
}

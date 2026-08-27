"use client";

import {
    ActionIcon,
    AppShell,
    Burger,
    Group,
    UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import Link from "next/link";
import styles from "./main.module.scss";
import { IconBasket, IconUser } from "@tabler/icons-react";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { desktop: true, mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />
                    <Group justify="space-between" style={{ flex: 1 }}>
                        <Image
                            src="/logo.svg"
                            alt="Bagini logo"
                            width={90}
                            height={37}
                            loading="eager"
                        />
                        <Group>
                            <Group ml="xl" gap={0} visibleFrom="sm">
                                <UnstyledButton
                                    component={Link}
                                    href="/"
                                    className={styles.link}
                                >
                                    Продукты
                                </UnstyledButton>
                                <UnstyledButton
                                    component={Link}
                                    href="about"
                                    className={styles.link}
                                >
                                    О нас
                                </UnstyledButton>
                                <UnstyledButton className={styles.link}>
                                    Контакты
                                </UnstyledButton>
                            </Group>

                            <ActionIcon
                                variant="outline"
                                radius="50%"
                                color="pink"
                                size="lg"
                            >
                                <IconBasket />
                            </ActionIcon>
                            <ActionIcon
                                variant="outline"
                                radius="50%"
                                color="pink"
                                size="lg"
                            >
                                <IconUser />
                            </ActionIcon>
                        </Group>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar py="md" px={4}>
                <UnstyledButton className={styles.link}>
                    Продукты
                </UnstyledButton>
                <UnstyledButton className={styles.link}>О нас</UnstyledButton>
                <UnstyledButton className={styles.link}>
                    Контакты
                </UnstyledButton>
            </AppShell.Navbar>

            <AppShell.Main>{children}</AppShell.Main>
        </AppShell>
    );
}

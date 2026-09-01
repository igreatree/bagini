import { getInitials } from "@/helpers";
import {
    Container,
    Group,
    Indicator,
    ActionIcon,
    Menu,
    Avatar,
    ThemeIcon,
    Button,
    Box,
} from "@mantine/core";
import { IconBasket, IconUser, IconLogout } from "@tabler/icons-react";
import { HeaderMenu } from "../HeaderMenu";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import Image from "next/image";
import Link from "next/link";

export const Header = () => {
    const { user, basket, logout } = useUserStore();
    const router = useRouter();

    return (
        <Container h="100%" w="100%" size="xl">
            <Group h="100%">
                <HeaderMenu hiddenFrom="sm" />
                <Group justify="space-between" style={{ flex: 1 }}>
                    <Link
                        href="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                        }}
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
                                onClick={() => router.push("/basket")}
                            >
                                <IconBasket />
                            </ActionIcon>
                        </Indicator>
                        {user ? (
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
                                        leftSection={<IconUser size={14} />}
                                        component={Link}
                                        href="/profile"
                                    >
                                        Профиль
                                    </Menu.Item>

                                    <Menu.Divider />
                                    <Menu.Item
                                        color="pink"
                                        onClick={logout}
                                        leftSection={<IconLogout size={14} />}
                                    >
                                        Выйти
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
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
        </Container>
    );
};

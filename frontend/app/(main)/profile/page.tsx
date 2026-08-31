"use client";

import { useEffect, useState } from "react";
import {
    Container,
    Paper,
    Avatar,
    Group,
    Text,
    Title,
    TextInput,
    Button,
    Divider,
    Badge,
    Stack,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconPencil,
    IconCheck,
    IconX,
    IconPhone,
    IconMail,
    IconUser,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useUserStore } from "@/store/user";
import { getInitials } from "@/helpers";
import { roleColors, roleLabels } from "@/constants";

export default function ProfilePage() {
    const { updateUser, getUser, user } = useUserStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            name: user?.name ?? "",
            lastName: user?.lastName ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
        },
        validate: {
            email: (value: string) =>
                value && !/^\S+@\S+\.\S+$/.test(value)
                    ? "Некорректный email"
                    : null,
            phone: (value: string) =>
                !/^\+?\d{10,15}$/.test(value)
                    ? "Некорректный номер телефона"
                    : null,
            name: (value: string) =>
                value.trim().length === 0 ? "Введите имя" : null,
        },
    });

    const handleCancel = () => {
        form.setValues({
            name: user?.name ?? "",
            lastName: user?.lastName ?? "",
            email: user?.email ?? "",
            phone: user?.phone,
        });
        setIsEditing(false);
    };

    const handleSubmit = async (values: typeof form.values) => {
        try {
            setLoading(true);
            await updateUser(values);
            notifications.show({
                title: "Готово",
                message: "Профиль успешно обновлён",
                color: "green",
            });
            setIsEditing(false);
        } catch (e) {
            notifications.show({
                title: "Ошибка",
                message: "Не удалось сохранить изменения",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        if (user) {
            form.setValues({
                name: user.name ?? "",
                lastName: user.lastName ?? "",
                email: user.email ?? "",
                phone: user.phone,
            });
            form.resetDirty({
                name: user.name ?? "",
                lastName: user.lastName ?? "",
                email: user.email ?? "",
                phone: user.phone,
            });
        }
    }, [user]);

    return (
        <Container size="sm" py="xl" px={0}>
            <Paper withBorder shadow="sm" radius="md" p="xl">
                <Group justify="space-between" align="flex-start" mb="lg">
                    <Group>
                        <Avatar size={80} radius="xl" color="pink">
                            {getInitials(user)}
                        </Avatar>
                        <div>
                            <Title order={3}>
                                {user?.name || user?.lastName
                                    ? `${user?.name ?? ""} ${user?.lastName ?? ""}`.trim()
                                    : "Без имени"}
                            </Title>
                            <Badge
                                color={roleColors[user?.role || "user"]}
                                variant="light"
                                mt={4}
                            >
                                {roleLabels[user?.role || "user"]}
                            </Badge>
                        </div>
                    </Group>
                </Group>

                <Divider mb="lg" />

                {!isEditing ? (
                    <Stack gap="md">
                        <Group gap="xs">
                            <IconUser size={18} color="gray" />
                            <Text size="sm" c="dimmed">
                                Имя:
                            </Text>
                            <Text size="sm">{user?.name || "—"}</Text>
                        </Group>
                        <Group gap="xs">
                            <IconUser size={18} color="gray" />
                            <Text size="sm" c="dimmed">
                                Фамилия:
                            </Text>
                            <Text size="sm">{user?.lastName || "—"}</Text>
                        </Group>
                        <Group gap="xs">
                            <IconPhone size={18} color="gray" />
                            <Text size="sm" c="dimmed">
                                Телефон:
                            </Text>
                            <Text size="sm">{user?.phone}</Text>
                        </Group>
                        <Group gap="xs">
                            <IconMail size={18} color="gray" />
                            <Text size="sm" c="dimmed">
                                Email:
                            </Text>
                            <Text size="sm">{user?.email || "—"}</Text>
                        </Group>
                        <Button
                            mt="md"
                            leftSection={<IconPencil size={18} />}
                            variant="light"
                            onClick={() => setIsEditing(true)}
                        >
                            Редактировать
                        </Button>
                    </Stack>
                ) : (
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="Имя"
                                placeholder="Введите имя"
                                {...form.getInputProps("name")}
                            />
                            <TextInput
                                label="Фамилия"
                                placeholder="Введите фамилию"
                                {...form.getInputProps("lastName")}
                            />
                            <TextInput
                                readOnly
                                label="Телефон"
                                placeholder="+79991234567"
                                {...form.getInputProps("phone")}
                            />
                            <TextInput
                                label="Email"
                                placeholder="example@mail.com"
                                {...form.getInputProps("email")}
                            />

                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="default"
                                    leftSection={<IconX size={16} />}
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    leftSection={<IconCheck size={16} />}
                                    loading={loading}
                                >
                                    Сохранить
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                )}
            </Paper>
        </Container>
    );
}

"use client";

import {
    Anchor,
    Box,
    Container,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconBuildingStore,
    IconHeart,
    IconId,
    IconMail,
    IconMapPin,
    IconPhone,
    IconSend,
} from "@tabler/icons-react";
import Image from "next/image";

export default function ContactsPage() {
    return (
        <Container size="md" py={{ base: 30, sm: 60 }} px={0}>
            <Stack gap="xl">
                {/* Header */}
                <Stack align="center" gap="sm">
                    <Image
                        alt="brand"
                        width="200"
                        height="90"
                        src="/logo.svg"
                    />

                    <Title order={1} ta="center">
                        Свяжитесь с нами
                    </Title>

                    <Text c="dimmed" ta="center" maw={600} size="lg">
                        Мы всегда рады ответить на ваши вопросы и помочь с
                        заказом
                    </Text>
                </Stack>

                {/* Company */}
                <Paper withBorder radius="lg" p={{ base: "md", sm: "xl" }}>
                    <Group align="flex-start" wrap="nowrap" gap="lg">
                        <ThemeIcon size={60} radius="xl" variant="light">
                            <IconBuildingStore size={28} />
                        </ThemeIcon>

                        <Stack gap="md" style={{ flex: 1 }}>
                            <Text size="sm" fw={600} c="dimmed" tt="uppercase">
                                Наименование
                            </Text>

                            <Title order={2} size="h3">
                                Индивидуальный предприниматель
                                <br />
                                Фурсов Александр Даниилович
                            </Title>

                            <Divider />

                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                <Info
                                    icon={<IconId size={18} />}
                                    label="ИНН"
                                    value="110110671716"
                                />

                                <Info
                                    icon={<IconId size={18} />}
                                    label="ОГРНИП"
                                    value="326237500324397"
                                />
                            </SimpleGrid>
                        </Stack>
                    </Group>
                </Paper>

                {/* Contacts */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* Address */}
                    <ContactCard
                        icon={<IconMapPin size={25} />}
                        title="Юридический и фактический адрес"
                    >
                        Краснодарский край,
                        <br />
                        Тбилисский район,
                        <br />
                        хутор Марьинский,
                        <br />
                        улица Мамеева, дом 55
                    </ContactCard>

                    {/* Phone */}
                    <ContactCard
                        icon={<IconPhone size={25} />}
                        title="Телефон для экстренной связи"
                    >
                        <Anchor
                            href="tel:+79680179438"
                            size="xl"
                            fw={600}
                            underline="never"
                            c="pink"
                        >
                            +7 968 017-94-38
                        </Anchor>
                    </ContactCard>

                    {/* Email */}
                    <ContactCard
                        icon={<IconMail size={25} />}
                        title="Почта для обращений"
                    >
                        <Anchor
                            href="mailto:bagini.help@yandex.ru"
                            size="lg"
                            fw={600}
                            c="pink"
                        >
                            bagini.help@yandex.ru
                        </Anchor>
                    </ContactCard>

                    {/* Help */}
                    <ContactCard
                        icon={<IconSend size={25} />}
                        title="По каким вопросам можно обратиться?"
                    >
                        <Text c="dimmed" lh={1.7}>
                            По вопросам заказов, доставки, оплаты, возврата
                            товаров и другой информации о продукции Bagini.
                        </Text>
                    </ContactCard>
                </SimpleGrid>

                {/* Bottom */}
                <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }}>
                    <Group justify="space-between" align="center">
                        <Group>
                            <ThemeIcon size={50} radius="xl" variant="light">
                                <IconHeart size={24} />
                            </ThemeIcon>

                            <Box>
                                <Title order={3}>Мы на связи</Title>

                                <Text c="dimmed">
                                    Если у вас остались вопросы — напишите нам,
                                    и мы постараемся помочь.
                                </Text>
                            </Box>
                        </Group>
                    </Group>
                </Paper>

                <Text size="sm" c="dimmed" ta="center">
                    © 2026 Bagini.shop
                </Text>
            </Stack>
        </Container>
    );
}

function Info({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <Stack gap={4}>
            <Group gap="xs">
                <ThemeIcon size="sm" variant="light">
                    {icon}
                </ThemeIcon>

                <Text size="sm" c="dimmed">
                    {label}
                </Text>
            </Group>

            <Text fw={600} size="lg">
                {value}
            </Text>
        </Stack>
    );
}

function ContactCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Paper withBorder radius="lg" p="lg" h="100%">
            <Stack gap="md">
                <ThemeIcon size={52} radius="xl" variant="light">
                    {icon}
                </ThemeIcon>

                <Text fw={600}>{title}</Text>

                <Box>
                    {typeof children === "string" ? (
                        <Text lh={1.7}>{children}</Text>
                    ) : (
                        children
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}

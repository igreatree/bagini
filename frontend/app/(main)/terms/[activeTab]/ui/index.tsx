import {
    Stack,
    Title,
    Paper,
    ThemeIcon,
    Group,
    Badge,
    Divider,
    Box,
    Text,
} from "@mantine/core";

export const Section = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => {
    return (
        <Stack gap="md">
            <Title order={2} size="h3">
                {title}
            </Title>

            {children}
        </Stack>
    );
};

export const InfoCard = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => {
    return (
        <Paper withBorder radius="md" p="lg">
            <Stack gap="sm">
                <ThemeIcon size="lg" radius="xl" variant="light" color="pink">
                    {icon}
                </ThemeIcon>

                <Text fw={600}>{title}</Text>

                <Text size="sm" c="dimmed" lh={1.6}>
                    {children}
                </Text>
            </Stack>
        </Paper>
    );
};

export const DeliveryCard = ({
    number,
    icon,
    title,
    subtitle,
    children,
}: {
    number: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => {
    return (
        <Paper withBorder radius="md" p={{ base: "md", sm: "lg" }}>
            <Stack gap="md">
                <Group wrap="nowrap">
                    <ThemeIcon
                        size="xl"
                        radius="xl"
                        variant="light"
                        color="pink"
                    >
                        {icon}
                    </ThemeIcon>

                    <Box>
                        <Group gap="xs">
                            <Badge variant="light" color="pink">
                                {number}
                            </Badge>

                            <Text fw={600}>{title}</Text>
                        </Group>

                        <Text size="sm" c="dimmed">
                            {subtitle}
                        </Text>
                    </Box>
                </Group>

                <Divider />

                {children}
            </Stack>
        </Paper>
    );
};

export const DeliveryInfo = ({
    label,
    value,
}: {
    label: string;
    value: string;
}) => {
    return (
        <Group align="flex-start" wrap="nowrap">
            <Text fw={600} miw={140}>
                {label}:
            </Text>

            <Text size="sm" c="dimmed">
                {value}
            </Text>
        </Group>
    );
};

export const Info = ({ label, value }: { label: string; value: string }) => {
    return (
        <Group align="flex-start" wrap="nowrap">
            <Text fw={600} miw={100}>
                {label}:
            </Text>

            <Text>{value}</Text>
        </Group>
    );
};

export const Item = ({
    number,
    children,
}: {
    number: string;
    children: React.ReactNode;
}) => {
    return (
        <Text lh={1.8}>
            <Text component="span" fw={600}>
                {number}.
            </Text>{" "}
            {children}
        </Text>
    );
};

export const DataBlock = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => {
    return (
        <Paper withBorder radius="md" p="lg">
            <Group mb="md">
                <ThemeIcon variant="light" radius="xl" color="pink">
                    {icon}
                </ThemeIcon>

                <Text fw={600}>{title}</Text>
            </Group>

            {children}
        </Paper>
    );
};

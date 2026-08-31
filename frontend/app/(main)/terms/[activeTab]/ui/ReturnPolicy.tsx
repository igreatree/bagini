"use client";

import {
    Alert,
    Anchor,
    Badge,
    Container,
    Divider,
    Group,
    List,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconAlertTriangle,
    IconArrowBackUp,
    IconCalendarClock,
    IconCamera,
    IconCircleCheck,
    IconCircleX,
    IconClock,
    IconCreditCard,
    IconDroplet,
    IconLock,
    IconArrowsShuffle,
    IconPackageOff,
    IconSend,
} from "@tabler/icons-react";
import { DeliveryCard, Info, Section } from ".";

export const ReturnPolicy = () => {
    return (
        <Container size="md" p={0}>
            <Paper
                radius="lg"
                p={{ base: "md", sm: "xl" }}
                shadow="sm"
                withBorder
            >
                <Stack gap="xl">
                    {/* Header */}
                    <Stack gap="sm" align="center">
                        <ThemeIcon size={60} radius="xl" variant="light">
                            <IconArrowBackUp size={30} />
                        </ThemeIcon>

                        <Title order={1} ta="center">
                            Правила возврата
                            <br />и обмена товара
                        </Title>

                        <Text c="dimmed" ta="center">
                            Интернет-магазин косметики Bagini
                        </Text>

                        <Badge
                            variant="light"
                            size="lg"
                            leftSection={<IconCalendarClock size={14} />}
                        >
                            Актуальная редакция
                        </Badge>
                    </Stack>

                    <Divider />

                    <Text lh={1.7}>
                        Мы стремимся к тому, чтобы каждая покупка в нашем
                        интернет-магазине приносила вам радость. Пожалуйста,
                        внимательно ознакомьтесь с правилами возврата и обмена
                        парфюмерно-косметической продукции, установленными
                        законодательством Российской Федерации.
                    </Text>

                    <Section title="1. Товар надлежащего качества (не подошел цвет, аромат, бренд)">
                        <Stack gap="md">
                            <Alert
                                icon={<IconCircleX size={20} />}
                                title="Возврат и обмен не производятся"
                                variant="light"
                                color="red"
                            >
                                Согласно Постановлению Правительства РФ № 2463,
                                парфюмерно-косметические товары надлежащего
                                качества входят в перечень товаров, не
                                подлежащих возврату или обмену. Если вы вскрыли
                                защитную слюду, открыли баночку или просто
                                поняли, что вам не подошел оттенок помады,
                                текстура крема или аромат парфюма — вернуть или
                                обменять такой товар нельзя. Это продиктовано
                                строгими санитарно-гигиеническими нормами для
                                вашей же безопасности.
                            </Alert>

                            <Paper withBorder radius="md" p="lg">
                                <Group align="flex-start" wrap="nowrap">
                                    <ThemeIcon
                                        size="lg"
                                        radius="xl"
                                        variant="light"
                                    >
                                        <IconCircleCheck size={20} />
                                    </ThemeIcon>

                                    <Stack gap={4}>
                                        <Text fw={600}>
                                            Единственное исключение
                                        </Text>

                                        <Text size="sm" c="dimmed" lh={1.7}>
                                            Вы имеете право отказаться от
                                            косметики в любой момент до ее
                                            фактического получения (пока посылка
                                            находится в пути или лежит в пункте
                                            выдачи СДЭК/Боксберри/ Почты/других
                                            типов доставки, доступных для
                                            покупателя в момент оформления
                                            заказа). В этом случае мы вернем вам
                                            деньги за товар, но удержим
                                            стоимость расходов на обратную
                                            доставку посылки к нам на склад (ст.
                                            26.1 Закона РФ «О защите прав
                                            потребителей»).
                                        </Text>
                                    </Stack>
                                </Group>
                            </Paper>
                        </Stack>
                    </Section>

                    <Section title="2. Товар ненадлежащего качества (брак / ошибка комплектации)">
                        <Text mb="sm">
                            Если вы получили товар с дефектом или в посылке
                            оказалось не то средство, которое вы заказывали, вы
                            имеете полное право на возврат денег или замену
                            товара. Что признается браком или нарушением условий
                            продажи в косметике:
                        </Text>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Paper withBorder radius="md" p="lg">
                                <Group align="flex-start" wrap="nowrap">
                                    <ThemeIcon variant="light" radius="xl">
                                        <IconClock size={18} />
                                    </ThemeIcon>

                                    <Stack gap={2}>
                                        <Text fw={600} size="sm">
                                            Истекший срок годности
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            На момент передачи товара вам.
                                        </Text>
                                    </Stack>
                                </Group>
                            </Paper>

                            <Paper withBorder radius="md" p="lg">
                                <Group align="flex-start" wrap="nowrap">
                                    <ThemeIcon variant="light" radius="xl">
                                        <IconDroplet size={18} />
                                    </ThemeIcon>

                                    <Stack gap={2}>
                                        <Text fw={600} size="sm">
                                            Нарушение герметичности
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            Средство протекло, разбился флакон.
                                        </Text>
                                    </Stack>
                                </Group>
                            </Paper>

                            <Paper withBorder radius="md" p="lg">
                                <Group align="flex-start" wrap="nowrap">
                                    <ThemeIcon variant="light" radius="xl">
                                        <IconPackageOff size={18} />
                                    </ThemeIcon>

                                    <Stack gap={2}>
                                        <Text fw={600} size="sm">
                                            Производственный брак
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            Не работает помпа, сломан дозатор —
                                            пользоваться средством невозможно.
                                        </Text>
                                    </Stack>
                                </Group>
                            </Paper>

                            <Paper withBorder radius="md" p="lg">
                                <Group align="flex-start" wrap="nowrap">
                                    <ThemeIcon variant="light" radius="xl">
                                        <IconArrowsShuffle size={18} />
                                    </ThemeIcon>

                                    <Stack gap={2}>
                                        <Text fw={600} size="sm">
                                            Пересортица
                                        </Text>

                                        <Text size="sm" c="dimmed">
                                            Вам по ошибке прислали другой крем,
                                            объем или бренд.
                                        </Text>
                                    </Stack>
                                </Group>
                            </Paper>
                        </SimpleGrid>
                    </Section>

                    <Section title="3. Как оформить возврат брака">
                        <Stack gap="md">
                            <DeliveryCard
                                number="Шаг 1"
                                icon={<IconCamera size={22} />}
                                title="Зафиксируйте проблему"
                                subtitle="Фото или видео дефекта"
                            >
                                <Text size="sm" c="dimmed" lh={1.7}>
                                    Сделайте четкие фотографии или снимите
                                    короткое видео, на котором виден дефект,
                                    повреждение или срок годности товара.
                                </Text>
                            </DeliveryCard>

                            <DeliveryCard
                                number="Шаг 2"
                                icon={<IconSend size={22} />}
                                title="Отправьте заявку"
                                subtitle="На электронную почту магазина"
                            >
                                <Text size="sm" c="dimmed" lh={1.7}>
                                    Напишите нам на{" "}
                                    <Anchor
                                        href="mailto:bagini.help@yandex.ru"
                                        c="pink"
                                    >
                                        bagini.help@yandex.ru
                                    </Anchor>
                                    . В теме письма укажите: «Возврат по заказу
                                    № [номер вашего заказа]». В самом письме
                                    кратко опишите ситуацию и прикрепите
                                    сделанные фото/видео.
                                </Text>
                            </DeliveryCard>

                            <DeliveryCard
                                number="Шаг 3"
                                icon={<IconClock size={22} />}
                                title="Ожидайте ответа"
                                subtitle="Рассмотрение обращения"
                            >
                                <Text size="sm" c="dimmed" lh={1.7}>
                                    Мы рассмотрим ваше обращение в течение 10
                                    календарных дней (ст. 22 Закона РФ «О защите
                                    прав потребителей»).
                                </Text>
                            </DeliveryCard>
                        </Stack>
                    </Section>

                    <Section title="4. Порядок и сроки возврата денежных средств">
                        <List spacing="sm">
                            <List.Item>
                                Если брак или ошибка комплектации
                                подтверждаются, мы возвращаем вам полную
                                стоимость товара, а также компенсируем ваши
                                расходы на доставку (если они были);
                            </List.Item>

                            <List.Item>
                                Деньги возвращаются исключительно на тот же
                                банковский счет (карту), с которой производилась
                                оплата заказа на сайте;
                            </List.Item>

                            <List.Item>
                                Срок зачисления денег на ваш счет после
                                одобрения возврата составляет от 1 до 5 рабочих
                                дней (точный срок зависит от вашего банка).
                            </List.Item>
                        </List>

                        <Alert
                            mt="md"
                            icon={<IconCreditCard size={20} />}
                            title="Важно"
                            variant="light"
                        >
                            Возврат денежных средств осуществляется тем же
                            способом, которым была произведена оплата заказа.
                        </Alert>
                    </Section>

                    <Divider />

                    <Paper withBorder radius="md" p="lg">
                        <Stack gap="sm">
                            <Group gap="xs">
                                <ThemeIcon
                                    size="sm"
                                    radius="xl"
                                    variant="light"
                                >
                                    <IconAlertTriangle size={14} />
                                </ThemeIcon>

                                <Text fw={600} size="sm">
                                    Юридический адрес и реквизиты для связи
                                </Text>
                            </Group>

                            <Info
                                label="ИП"
                                value="Фурсов Александр Даниилович"
                            />

                            <Info label="ОГРНИП" value="326237500324397" />

                            <Info label="ИНН" value="110110671716" />

                            <Info
                                label="Адрес претензий"
                                value="352353, Краснодарский край, Тбилисский район, хутор Марьинский, улица Мамеева, дом 55"
                            />

                            <Group gap="xs">
                                <Text fw={600} miw={100}>
                                    Email:
                                </Text>

                                <Anchor
                                    href="mailto:bagini.help@yandex.ru"
                                    c="pink"
                                >
                                    bagini.help@yandex.ru
                                </Anchor>
                            </Group>
                        </Stack>
                    </Paper>

                    <Group justify="center">
                        <ThemeIcon size="lg" radius="xl" variant="light">
                            <IconLock size={18} />
                        </ThemeIcon>

                        <Text size="sm" c="dimmed" ta="center">
                            © 2026 Bagini.shop заботится о ваших покупках
                        </Text>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
};

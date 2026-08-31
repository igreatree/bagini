"use client";

import {
    Alert,
    Anchor,
    Badge,
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
    IconAlertCircle,
    IconBox,
    IconBuildingBank,
    IconCheck,
    IconCreditCard,
    IconMail,
    IconMapPin,
    IconPackage,
    IconQrcode,
    IconReceipt,
    IconShieldCheck,
    IconTruck,
} from "@tabler/icons-react";
import { DeliveryCard, DeliveryInfo, Info, InfoCard, Section } from ".";

export const PaymentAndDelivery = () => {
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
                            <IconTruck size={30} />
                        </ThemeIcon>

                        <Title order={1} ta="center">
                            Оплата и доставка
                        </Title>

                        <Text c="dimmed" ta="center">
                            Условия оплаты и получения заказов Bagini
                        </Text>

                        <Badge
                            variant="light"
                            size="lg"
                            leftSection={<IconPackage size={14} />}
                        >
                            Доставка по всей России
                        </Badge>
                    </Stack>

                    <Divider />

                    {/* Payment */}
                    <Section title="Способы и условия оплаты">
                        <Text lh={1.8}>
                            Вы можете оплатить свой заказ в рублях РФ
                            непосредственно в момент оформления на нашем сайте.
                            Мы работаем <b>без НДС</b> в связи с применением
                            специального налогового режима.
                        </Text>

                        <Title order={3} size="h4">
                            Доступные способы онлайн-оплаты
                        </Title>

                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <InfoCard
                                icon={<IconCreditCard size={24} />}
                                title="Банковские карты"
                            >
                                Оплата банковскими картами МИР, Visa и
                                MasterCard, выданными банками Российской
                                Федерации.
                            </InfoCard>

                            <InfoCard
                                icon={<IconQrcode size={24} />}
                                title="Система быстрых платежей"
                            >
                                Быстрая оплата через мобильное приложение вашего
                                банка без необходимости вводить данные карты.
                            </InfoCard>
                        </SimpleGrid>
                    </Section>

                    {/* Payment Security */}
                    <Section title="Безопасность платежей">
                        <Alert
                            icon={<IconShieldCheck size={22} />}
                            title="Ваши платежные данные защищены"
                            variant="light"
                        >
                            Оплата происходит через защищенный платежный шлюз
                            банка-эквайера с использованием современных
                            протоколов шифрования SSL / TLS и технологии
                            3D-Secure.
                        </Alert>

                        <Text lh={1.8}>
                            Наш сайт{" "}
                            <b>
                                не собирает, не обрабатывает и не хранит данные
                                банковских карт
                            </b>
                            . Весь процесс оплаты проходит через защищенную
                            инфраструктуру платежного сервиса.
                        </Text>

                        <Paper withBorder radius="md" p="md">
                            <Group align="flex-start" wrap="nowrap">
                                <ThemeIcon
                                    size="lg"
                                    radius="xl"
                                    variant="light"
                                >
                                    <IconReceipt size={20} />
                                </ThemeIcon>

                                <Box>
                                    <Text fw={600} mb={4}>
                                        Электронный кассовый чек
                                    </Text>

                                    <Text size="sm" c="dimmed">
                                        После совершения платежа электронный
                                        кассовый чек направляется на указанный
                                        при оформлении заказа адрес email.
                                    </Text>
                                </Box>
                            </Group>
                        </Paper>
                    </Section>

                    <Divider />

                    {/* Delivery */}
                    <Section title="Способы, сроки и стоимость доставки">
                        <Text lh={1.8}>
                            Все заказы бережно упаковываются и передаются в
                            службу доставки в течение <b>1–2 рабочих дней</b> с
                            момента подтверждения заказа.
                        </Text>

                        <Alert
                            icon={<IconMapPin size={20} />}
                            title="Доставляем по всей России"
                            variant="light"
                        >
                            Срок и стоимость доставки зависят от региона и
                            выбранного способа получения заказа.
                        </Alert>
                    </Section>

                    {/* Delivery Methods */}
                    <Stack gap="md">
                        <DeliveryCard
                            number="1"
                            icon={<IconBox size={24} />}
                            title="Пункты выдачи заказов"
                            subtitle="СДЭК, Ozon и Боксберри"
                        >
                            <DeliveryInfo
                                label="Срок доставки"
                                value="от 2 до 7 рабочих дней"
                            />

                            <DeliveryInfo
                                label="Стоимость"
                                value="Рассчитывается автоматически в корзине при оформлении заказа."
                            />

                            <Alert
                                icon={<IconCheck size={18} />}
                                title="Бесплатная доставка"
                                variant="light"
                            >
                                При заказе на сумму от <b>4 000 рублей</b>{" "}
                                доставка до пункта выдачи осуществляется
                                бесплатно.
                            </Alert>
                        </DeliveryCard>

                        <DeliveryCard
                            number="2"
                            icon={<IconTruck size={24} />}
                            title="Курьерская доставка"
                            subtitle="Доставка до двери"
                        >
                            <DeliveryInfo
                                label="Срок доставки"
                                value="от 2 до 5 рабочих дней"
                            />

                            <DeliveryInfo
                                label="Стоимость"
                                value="Рассчитывается в зависимости от города назначения."
                            />

                            <Text size="sm" c="dimmed">
                                Курьер может связаться с вами по телефону перед
                                прибытием.
                            </Text>
                        </DeliveryCard>

                        <DeliveryCard
                            number="3"
                            icon={<IconMail size={24} />}
                            title="Почта России"
                            subtitle="Доставка посылкой"
                        >
                            <DeliveryInfo
                                label="Срок доставки"
                                value="от 5 до 14 рабочих дней"
                            />

                            <Text size="sm" c="dimmed">
                                Подходит для удаленных населенных пунктов, где
                                отсутствуют коммерческие пункты выдачи.
                            </Text>
                        </DeliveryCard>
                    </Stack>

                    {/* Tracking */}
                    <Section title="Как отследить заказ?">
                        <Paper withBorder radius="md" p="lg">
                            <Group align="flex-start" wrap="nowrap">
                                <ThemeIcon
                                    size="xl"
                                    radius="xl"
                                    variant="light"
                                >
                                    <IconPackage size={24} />
                                </ThemeIcon>

                                <Stack gap={6}>
                                    <Text fw={600}>Отслеживание посылки</Text>

                                    <Text size="sm" c="dimmed" lh={1.7}>
                                        После передачи заказа в транспортную
                                        компанию на ваш номер телефона и email
                                        придет уведомление с <b>трек-номером</b>
                                        .
                                    </Text>

                                    <Text size="sm" c="dimmed" lh={1.7}>
                                        По нему вы сможете отслеживать
                                        перемещение заказа на сайте
                                        соответствующей службы доставки.
                                    </Text>
                                </Stack>
                            </Group>
                        </Paper>
                    </Section>

                    {/* Important */}
                    <Alert
                        icon={<IconAlertCircle size={22} />}
                        title="Проверка заказа при получении"
                        variant="light"
                    >
                        Пожалуйста, проверяйте целостность внешней упаковки и
                        соответствие товаров заказу непосредственно в момент
                        получения, в присутствии курьера или сотрудника пункта
                        выдачи.
                    </Alert>

                    <Divider />

                    {/* Seller */}
                    <Section title="Реквизиты продавца">
                        <Paper withBorder radius="md" p="lg">
                            <Stack gap="sm">
                                <Info
                                    label="Продавец"
                                    value="Индивидуальный предприниматель Фурсов Александр Даниилович"
                                />

                                <Info label="ИНН" value="110110671716" />

                                <Info label="ОГРНИП" value="326237500324397" />

                                <Group gap="xs">
                                    <Text fw={600}>Email:</Text>

                                    <Anchor
                                        href="mailto:bagini.help@yandex.ru"
                                        c="pink"
                                    >
                                        bagini.help@yandex.ru
                                    </Anchor>
                                </Group>
                            </Stack>
                        </Paper>
                    </Section>

                    <Divider />

                    <Group justify="center">
                        <ThemeIcon size="lg" radius="xl" variant="light">
                            <IconBuildingBank size={18} />
                        </ThemeIcon>

                        <Text size="sm" c="dimmed" ta="center">
                            © 2026 Bagini.shop Безопасная оплата и доставка по
                            всей России
                        </Text>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
};

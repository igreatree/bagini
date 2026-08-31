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
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconCalendar,
    IconChartBar,
    IconCookie,
    IconDeviceAnalytics,
    IconInfoCircle,
    IconLock,
    IconMail,
    IconSettings,
} from "@tabler/icons-react";
import { DataBlock, Info, Item, Section } from ".";

export const CookieConsent = () => {
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
                            <IconCookie size={30} />
                        </ThemeIcon>

                        <Title order={1} ta="center">
                            Согласие на обработку
                            <br />
                            файлов cookie и метрических данных
                        </Title>

                        <Text c="dimmed" ta="center">
                            Интернет-магазин косметики Bagini
                        </Text>

                        <Badge
                            variant="light"
                            size="lg"
                            leftSection={<IconCalendar size={14} />}
                        >
                            Актуальная редакция
                        </Badge>
                    </Stack>

                    <Divider />

                    <Text lh={1.7}>
                        Продолжая работу на интернет-сайте (далее — «Сайт»),
                        Пользователь в соответствии с Федеральным законом от
                        27.07.2006 г. № 152-ФЗ «О персональных данных» выражает
                        свое согласие Индивидуальному предпринимателю{" "}
                        <b>Фурсову Александру Данииловичу</b> (ОГРНИП:{" "}
                        <b>326237500324397</b>, ИНН: <b>110110671716</b>, адрес:
                        352353, Краснодарский край, Тбилисский район, хутор
                        Марьинский, улица Мамеева, дом 55) (далее — «Оператор»)
                        на автоматизированную обработку файлов cookie и иных
                        метрических данных.
                    </Text>

                    <Section title="1. Что такое файлы cookie">
                        <Text lh={1.7}>
                            Файлы cookie (куки) — это небольшие текстовые файлы,
                            которые загружаются на устройство Пользователя
                            (компьютер, смартфон, планшет) при посещении Сайта.
                            Они позволяют Сайту запоминать действия и
                            предпочтения Пользователя (например, товары в
                            корзине, языковые настройки, авторизацию), чтобы
                            упростить повторное посещение страниц.
                        </Text>
                    </Section>

                    <Section title="2. Перечень обрабатываемых данных">
                        <DataBlock
                            icon={<IconDeviceAnalytics size={20} />}
                            title="Данные, собираемые в автоматическом режиме"
                        >
                            <List spacing="xs">
                                <List.Item>Файлы cookie;</List.Item>

                                <List.Item>IP-адрес устройства;</List.Item>

                                <List.Item>
                                    Тип, язык и версия веб-браузера;
                                </List.Item>

                                <List.Item>
                                    Тип операционной системы и модель
                                    устройства;
                                </List.Item>

                                <List.Item>
                                    Разрешение экрана устройства;
                                </List.Item>

                                <List.Item>
                                    Информация об источнике перехода на Сайт
                                    (рекламное объявление, поисковая система,
                                    сторонний сайт);
                                </List.Item>

                                <List.Item>
                                    Сведения о действиях Пользователя на Сайте
                                    (просмотренные страницы, клики, добавление
                                    товаров в корзину, время нахождения на
                                    сайте).
                                </List.Item>
                            </List>
                        </DataBlock>
                    </Section>

                    <Section title="3. Цели обработки данных">
                        <Text mb="sm">
                            Оператор обрабатывает файлы cookie и метрические
                            данные исключительно в целях:
                        </Text>

                        <List spacing="sm">
                            <List.Item>
                                Обеспечения корректного и безопасного
                                функционирования Сайта (технические и сессионные
                                cookie для работы корзины и личного кабинета);
                            </List.Item>

                            <List.Item>
                                Анализа пользовательской активности, ведения
                                статистики посещаемости Сайта и улучшения
                                качества его работы;
                            </List.Item>

                            <List.Item>
                                Повышения удобства использования Сайта для
                                Пользователей;
                            </List.Item>

                            <List.Item>
                                Предоставления релевантной персонализированной
                                информации и рекламных предложений (при наличии
                                отдельного согласия).
                            </List.Item>
                        </List>
                    </Section>

                    <Section title="4. Используемые сервисы веб-аналитики">
                        <Paper withBorder radius="md" p="lg">
                            <Group align="flex-start" wrap="nowrap">
                                <ThemeIcon
                                    size="lg"
                                    radius="xl"
                                    variant="light"
                                >
                                    <IconChartBar size={20} />
                                </ThemeIcon>

                                <Text size="sm" c="dimmed" lh={1.7}>
                                    Для сбора и анализа метрических данных
                                    Оператор может использовать сторонние
                                    легальные сервисы веб-аналитики, включая, но
                                    не ограничиваясь: Яндекс Метрика,
                                    Спутник/Аналитика и иные системы
                                    автоматизированного анализа. Указанные
                                    сервисы обрабатывают данные в соответствии
                                    со своими политиками конфиденциальности.
                                </Text>
                            </Group>
                        </Paper>
                    </Section>

                    <Section title="5. Срок действия и отзыв согласия">
                        <Stack gap="md">
                            <Item number="5.1">
                                Настоящее Согласие вступает в силу с момента
                                начала использования Сайта Пользователем
                                (включая конклюдентные действия: клик по кнопке
                                «Принять/ОК» на всплывающем баннере, скроллинг
                                страниц или продолжение просмотра контента) и
                                действует до момента его отзыва.
                            </Item>

                            <Item number="5.2">
                                Пользователь может в любой момент отозвать
                                настоящее Согласие, изменив настройки своего
                                интернет-браузера и заблокировав сохранение
                                файлов cookie для данного Сайта, либо полностью
                                удалив ранее сохраненные файлы cookie через меню
                                очистки истории браузера.
                            </Item>

                            <Item number="5.3">
                                Прекращение обработки файлов cookie Пользователя
                                может привести к тому, что отдельные сервисы,
                                разделы и функции Сайта (включая оформление
                                заказа и сохранение товаров в корзине) станут
                                недоступны для использования.
                            </Item>

                            <Alert
                                icon={<IconSettings size={20} />}
                                title="Управление cookie"
                                variant="light"
                            >
                                Отключить cookie можно в настройках вашего
                                браузера. По вопросам обработки данных напишите
                                нам на{" "}
                                <Anchor
                                    href="mailto:bagini.help@yandex.ru"
                                    c="pink"
                                >
                                    bagini.help@yandex.ru
                                </Anchor>
                                .
                            </Alert>
                        </Stack>
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
                                    <IconInfoCircle size={14} />
                                </ThemeIcon>

                                <Text fw={600} size="sm">
                                    Сведения об операторе
                                </Text>
                            </Group>

                            <Info
                                label="ИП"
                                value="Фурсов Александр Даниилович"
                            />

                            <Info label="ОГРНИП" value="326237500324397" />

                            <Info label="ИНН" value="110110671716" />
                        </Stack>
                    </Paper>

                    <Group justify="center">
                        <ThemeIcon size="lg" radius="xl" variant="light">
                            <IconLock size={18} />
                        </ThemeIcon>

                        <Text size="sm" c="dimmed" ta="center">
                            © 2026 Bagini.shop заботится о конфиденциальности
                            ваших данных
                        </Text>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
};

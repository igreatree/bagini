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
    IconBellRinging,
    IconBrandTelegram,
    IconBrandWhatsapp,
    IconCalendar,
    IconLock,
    IconMail,
    IconMessageCircle,
    IconPhone,
    IconSpeakerphone,
    IconUnlink,
} from "@tabler/icons-react";
import { DataBlock, Info, Item, Section } from ".";

export const AdvertisingConsent = () => {
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
                            <IconSpeakerphone size={30} />
                        </ThemeIcon>

                        <Title order={1} ta="center">
                            Согласие на получение
                            <br />
                            рекламно-информационных материалов
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
                        Действуя свободно, своей волей и в своем интересе, а
                        также подтверждая свою правоспособность, Я (далее —
                        «Пользователь») в соответствии со ст. 18 Федерального
                        закона от 13.03.2006 г. № 38-ФЗ «О рекламе» и ст. 9
                        Федерального закона от 27.07.2006 г. № 152-ФЗ «О
                        персональных данных», предоставляю свое согласие
                        Индивидуальному предпринимателю{" "}
                        <b>Фурсову Александру Данииловичу</b> (ОГРНИП:{" "}
                        <b>326237500324397</b>, ИНН: <b>110110671716</b>, адрес:
                        352353, Краснодарский край, Тбилисский район, хутор
                        Марьинский, улица Мамеева, дом 55) (далее — «Продавец»)
                        на направление мне рекламно-информационных материалов.
                    </Text>

                    <Section title="1. Условия направления материалов">
                        <Stack gap="md">
                            <Item number="1.1">
                                Настоящее Согласие дает право Продавцу
                                осуществлять рассылку информации о товарах,
                                услугах, специальных предложениях, акциях,
                                бонусах, мероприятиях, скидках и новостях
                                Продавца, а также партнеров Продавца.
                            </Item>

                            <Item number="1.2">
                                Направление материалов может осуществляться по
                                указанным мной каналам связи:
                            </Item>

                            <Paper withBorder radius="md" p="lg">
                                <List spacing="sm">
                                    <List.Item
                                        icon={
                                            <ThemeIcon
                                                size="sm"
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconMessageCircle size={12} />
                                            </ThemeIcon>
                                        }
                                    >
                                        SMS-сообщения на номер мобильного
                                        телефона;
                                    </List.Item>

                                    <List.Item
                                        icon={
                                            <ThemeIcon
                                                size="sm"
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconMail size={12} />
                                            </ThemeIcon>
                                        }
                                    >
                                        Электронные письма на адрес электронной
                                        почты (email);
                                    </List.Item>

                                    <List.Item
                                        icon={
                                            <ThemeIcon
                                                size="sm"
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconBellRinging size={12} />
                                            </ThemeIcon>
                                        }
                                    >
                                        Push-уведомления на устройства;
                                    </List.Item>

                                    <List.Item
                                        icon={
                                            <ThemeIcon
                                                size="sm"
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconPhone size={12} />
                                            </ThemeIcon>
                                        }
                                    >
                                        Звонки на номер мобильного телефона;
                                    </List.Item>

                                    <List.Item
                                        icon={
                                            <ThemeIcon
                                                size="sm"
                                                radius="xl"
                                                variant="light"
                                            >
                                                <IconBrandWhatsapp size={12} />
                                            </ThemeIcon>
                                        }
                                    >
                                        Мессенджеры (включая Telegram, WhatsApp,
                                        Viber) и социальные сети.
                                    </List.Item>
                                </List>
                            </Paper>
                        </Stack>
                    </Section>

                    <Section title="2. Персональные данные">
                        <Text mb="sm">
                            Для достижения указанной цели я разрешаю Продавцу
                            обрабатывать (собирать, записывать,
                            систематизировать, накапливать, хранить, уточнять,
                            извлекать, использовать, обезличивать, блокировать,
                            удалять, уничтожать) следующие персональные данные:
                        </Text>

                        <DataBlock
                            icon={<IconBrandTelegram size={20} />}
                            title="Обрабатываемые данные"
                        >
                            <List spacing="xs">
                                <List.Item>Фамилия, имя, отчество;</List.Item>

                                <List.Item>
                                    Номер контактного телефона;
                                </List.Item>

                                <List.Item>
                                    Адрес электронной почты (email).
                                </List.Item>
                            </List>
                        </DataBlock>
                    </Section>

                    <Section title="3. Срок действия и порядок отзыва">
                        <Stack gap="md">
                            <Item number="3.1">
                                Настоящее Согласие вступает в силу с момента
                                проставления отметки («галочки») в
                                соответствующем поле на сайте Продавца и
                                действует бессрочно.
                            </Item>

                            <Item number="3.2">
                                Согласие может быть отозвано мной в любой момент
                                без объяснения причин.
                            </Item>

                            <Item number="3.3">
                                Для отзыва Согласия я могу направить письмо в
                                свободной форме на электронную почту Продавца
                                либо перейти по специальной ссылке «Отписаться
                                от рассылки», которая содержится в каждом
                                отправляемом Продавцом электронном письме.
                            </Item>

                            <Item number="3.4">
                                Продавец обязуется прекратить отправку рекламных
                                сообщений в течение 3 (трех) рабочих дней с
                                момента получения уведомления об отзыве.
                            </Item>

                            <Alert
                                icon={<IconUnlink size={20} />}
                                title="Отзыв согласия"
                                variant="light"
                            >
                                Направьте письмо на{" "}
                                <Anchor
                                    href="mailto:bagini.help@yandex.ru"
                                    c="pink"
                                >
                                    bagini.help@yandex.ru
                                </Anchor>{" "}
                                с темой «Отзыв согласия на получение рекламы».
                            </Alert>
                        </Stack>
                    </Section>

                    <Divider />

                    <Paper withBorder radius="md" p="lg">
                        <Stack gap="sm">
                            <Info
                                label="Продавец"
                                value="ИП Фурсов Александр Даниилович"
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

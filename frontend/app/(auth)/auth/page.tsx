"use client";

import { useUserStore } from "@/store/user";
import {
    Center,
    Stack,
    Title,
    Text,
    MaskInput,
    Button,
    Anchor,
    PinInput,
    Transition,
    TextInput,
    RollingNumber,
} from "@mantine/core";
import { useMask } from "@mantine/hooks";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthPage() {
    const { sendSmsCode, verifySmsCode, updateUser, user } = useUserStore();
    const [step, setStep] = useState<"sendCode" | "verifyCode" | "fillProfile">(
        "sendCode",
    );
    const [code, setCode] = useState("");
    const { ref, value, rawValue } = useMask({ mask: "+7 (999) 999-99-99" });
    const [name, setName] = useState("");
    const [counter, setCounter] = useState(60);
    const [nameError, setNameError] = useState("");
    const [restartInterval, setRestartInterval] = useState(true);

    const sendCodeHandler = async () => {
        const success = await sendSmsCode(`7${rawValue}`);
        if (success) setStep("verifyCode");
    };

    const verifyCodeHandler = async (completeCode: string) => {
        const user = await verifySmsCode(completeCode);
        if (user) {
            if (!user.name) setStep("fillProfile");
            else redirect("/");
        }
    };

    const updateUserHandler = async () => {
        if (!name) {
            setNameError("Введите имя");
        } else {
            await updateUser({ name });
            redirect("/");
        }
    };

    useEffect(() => {
        if (user && step === "sendCode") redirect("/");
    }, [user, step]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === "verifyCode") {
            setCounter(60);
            interval = setInterval(() => setCounter((prev) => --prev), 1000);
        }
        return () => {
            clearInterval(interval);
        };
    }, [step, restartInterval]);

    return (
        <Center h="100vh">
            <Transition
                mounted={step === "sendCode"}
                transition="fade-up"
                duration={200}
            >
                {(style) => (
                    <Stack style={style} p="xl" bdrs="md" bg="#ffffff9c">
                        <Stack gap={0}>
                            <Title order={2} fz={26} lts="-0.01em">
                                Вход и регистрация
                            </Title>
                            <Text c="dimmed" size="sm" mt={6}>
                                Укажите номер телефона для подтверждения
                            </Text>
                        </Stack>
                        <MaskInput
                            ref={ref}
                            size="lg"
                            label="Номер телефона"
                            mask="+7 (999) 999-99-99"
                            placeholder="+7 (___) ___-__-__"
                        />
                        <Button
                            disabled={rawValue.length !== 10}
                            size="lg"
                            onClick={sendCodeHandler}
                        >
                            Получить код
                        </Button>
                        <Text size="xs" c="dimmed" ta="center" w={320}>
                            Продолжая, вы соглашаетесь с{" "}
                            <Anchor
                                component={Link}
                                href="/terms/privacy-policy"
                                c="pink"
                                size="xs"
                            >
                                политикой конфиденциальности
                            </Anchor>{" "}
                            и{" "}
                            <Anchor
                                component={Link}
                                href="/terms/public-offer"
                                c="pink"
                                size="xs"
                            >
                                публичной офертой
                            </Anchor>
                        </Text>
                    </Stack>
                )}
            </Transition>
            <Transition
                mounted={step === "verifyCode"}
                transition="fade-up"
                duration={200}
            >
                {(style) => (
                    <Stack style={style} p="xl" bdrs="md" bg="#ffffff9c">
                        <Stack gap={0}>
                            <Title order={2} fz={26} lts="-0.01em">
                                Введите код
                            </Title>
                            <Text c="dimmed" size="sm" mt={6} w={220}>
                                На номер телефона {value} поступит звонок.
                                Укажите последние 4 цифры номера, который вам
                                позвонит
                            </Text>
                        </Stack>
                        <PinInput
                            length={4}
                            size="lg"
                            radius="md"
                            type="number"
                            value={code}
                            onChange={setCode}
                            onComplete={(completeCode) =>
                                verifyCodeHandler(completeCode)
                            }
                        />
                        {counter >= 0 && (
                            <RollingNumber
                                style={{ justifyContent: "center" }}
                                value={counter}
                                fz="36px"
                                c="pink"
                            />
                        )}
                        {counter < 0 && (
                            <Button
                                size="lg"
                                onClick={async () => {
                                    await sendCodeHandler();
                                    setCode("");
                                    setRestartInterval((prev) => !prev);
                                }}
                            >
                                Получить код повторно
                            </Button>
                        )}
                    </Stack>
                )}
            </Transition>
            <Transition
                mounted={step === "fillProfile"}
                transition="fade-up"
                duration={200}
            >
                {(style) => (
                    <Stack style={style} p="xl" bdrs="md" bg="#ffffff9c">
                        <Stack gap={0}>
                            <Title order={2} fz={26} lts="-0.01em">
                                Как вас зовут?
                            </Title>
                            <Text c="dimmed" size="sm" mt={6}>
                                Похоже, вы здесь впервые — заполним профиль
                            </Text>
                        </Stack>
                        <TextInput
                            required
                            label="Имя"
                            placeholder="Ваше имя"
                            size="md"
                            error={nameError}
                            radius="md"
                            value={name}
                            onChange={(e) => {
                                setNameError("");
                                setName(e.target.value);
                            }}
                        />
                        <Button
                            disabled={!name}
                            size="lg"
                            onClick={updateUserHandler}
                        >
                            Завершить регистрацию
                        </Button>
                    </Stack>
                )}
            </Transition>
        </Center>
    );
}

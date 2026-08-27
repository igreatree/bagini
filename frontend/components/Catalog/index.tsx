"use client";

import { Group, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import {
    IconFlameFilled,
    IconSparkles2Filled,
    IconVaccineBottle,
} from "@tabler/icons-react";
import styles from "./catalog.module.scss";

export const Catalog = () => {
    return (
        <Group bg="#ffffff9c" bdrs="20" p="md" className={styles.catalog}>
            <UnstyledButton
                component={Stack}
                align="center"
                gap="sm"
                className={styles.item}
            >
                <ThemeIcon className={styles.image} size={100} bg="pink.0">
                    <IconSparkles2Filled
                        size={50}
                        color="var(--mantine-color-pink-filled)"
                    />
                </ThemeIcon>
                <Text>Новинки</Text>
            </UnstyledButton>
            <UnstyledButton
                component={Stack}
                align="center"
                gap="sm"
                className={styles.item}
            >
                <ThemeIcon className={styles.image} size={100} bg="pink.0">
                    <IconFlameFilled
                        size={50}
                        color="var(--mantine-color-pink-filled)"
                    />
                </ThemeIcon>
                <Text>Популярное</Text>
            </UnstyledButton>
            <UnstyledButton
                component={Stack}
                align="center"
                gap="sm"
                className={styles.item}
            >
                <ThemeIcon className={styles.image} size={100} bg="pink.0">
                    <IconVaccineBottle
                        size={50}
                        color="var(--mantine-color-pink-filled)"
                    />
                </ThemeIcon>
                <Text>Все</Text>
            </UnstyledButton>
        </Group>
    );
};

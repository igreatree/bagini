"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "@mantine/core";
import styles from "./terms.module.scss";
import { PublicOffer } from "./ui/PublicOffer";
import { PrivacyPolicy } from "./ui/PrivacyPolicy";
import { PaymentAndDelivery } from "./ui/PaymentAndDelivery";

export default function Terms() {
    const router = useRouter();
    const pathname = usePathname();
    const activeTab = pathname.split("/").pop();

    return (
        <Tabs
            value={activeTab}
            color="pink"
            onChange={(value) => router.push(`/terms/${value}`)}
            classNames={styles}
            variant="unstyled"
        >
            <Tabs.List>
                <Tabs.Tab value="payment-and-delivery">
                    Оплата и доставка
                </Tabs.Tab>
                <Tabs.Tab value="public-offer">Публичная оферта</Tabs.Tab>
                <Tabs.Tab value="privacy-policy">
                    Политика конфиденциальности
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="payment-and-delivery">
                <PaymentAndDelivery />
            </Tabs.Panel>
            <Tabs.Panel value="public-offer">
                <PublicOffer />
            </Tabs.Panel>
            <Tabs.Panel value="privacy-policy">
                <PrivacyPolicy />
            </Tabs.Panel>
        </Tabs>
    );
}

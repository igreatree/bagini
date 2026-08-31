"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select, Tabs } from "@mantine/core";
import styles from "./terms.module.scss";
import { PublicOffer } from "./ui/PublicOffer";
import { PrivacyPolicy } from "./ui/PrivacyPolicy";
import { PaymentAndDelivery } from "./ui/PaymentAndDelivery";
import { AdvertisingConsent } from "./ui/AdvertisingConsent";
import { CookieConsent } from "./ui/CookieConsent";
import { PersonalDataConsent } from "./ui/PersonalDataConsent";
import { ReturnPolicy } from "./ui/ReturnPolicy";

const termsItems = [
    {
        value: "payment-and-delivery",
        label: "Оплата и доставка",
    },
    {
        value: "public-offer",
        label: "Публичная оферта",
    },
    {
        value: "privacy-policy",
        label: "Политика обработки персональных данных",
    },
    {
        value: "advertising-consent",
        label: "Согласие на получение рекламно-информационных материалов",
    },
    {
        value: "cookie-consent",
        label: "Согласие на обработку файлов cookie и метрических данных",
    },
    {
        value: "personal-data-consent",
        label: "Согласие на обработку персональных данных",
    },
    {
        value: "return-policy",
        label: "Правила возврата и обмена товара",
    },
];

export default function Terms() {
    const router = useRouter();
    const pathname = usePathname();
    const activeTab = pathname.split("/").pop();

    const handleChange = (value: string | null) => {
        if (value) {
            router.push(`/terms/${value}`);
        }
    };

    return (
        <>
            <Tabs
                value={activeTab}
                onChange={(value) => router.push(`/terms/${value}`)}
                classNames={styles}
                variant="unstyled"
            >
                <Select
                    className={styles.mobileSelect}
                    data={termsItems}
                    value={activeTab}
                    onChange={handleChange}
                    label="Выберите раздел"
                    searchable={false}
                    allowDeselect={false}
                    mb="md"
                    hiddenFrom="sm"
                />
                <Tabs.List visibleFrom="sm">
                    {termsItems.map((item) => (
                        <Tabs.Tab key={item.value} value={item.value}>
                            {item.label}
                        </Tabs.Tab>
                    ))}
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
                <Tabs.Panel value="advertising-consent">
                    <AdvertisingConsent />
                </Tabs.Panel>
                <Tabs.Panel value="cookie-consent">
                    <CookieConsent />
                </Tabs.Panel>
                <Tabs.Panel value="personal-data-consent">
                    <PersonalDataConsent />
                </Tabs.Panel>
                <Tabs.Panel value="return-policy">
                    <ReturnPolicy />
                </Tabs.Panel>
            </Tabs>
        </>
    );
}

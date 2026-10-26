import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { YandexMetrika } from "@/components/YandexMetrika";
import { Notifications } from "@mantine/notifications";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Bagini",
    description: "Магазин женской косметики",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <head>
                <ColorSchemeScript />
            </head>
            <body className={inter.className}>
                <YandexMetrika />
                <MantineProvider theme={theme}>
                    <Notifications position="top-right" />
                    {children}
                </MantineProvider>
            </body>
        </html>
    );
}

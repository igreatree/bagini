import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { theme } from "./theme";

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
                <MantineProvider theme={theme}>{children}</MantineProvider>
            </body>
        </html>
    );
}

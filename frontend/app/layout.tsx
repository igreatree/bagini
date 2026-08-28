import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import Grainient from "@/components/Background";

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
                <Grainient
                    color1="#FF9FFC"
                    color2="#ffffff"
                    color3="#cf97c9"
                    timeSpeed={1.25}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={2}
                    warpAmplitude={50}
                    blendAngle={0}
                    blendSoftness={0.05}
                    rotationAmount={500}
                    noiseScale={2}
                    grainAmount={0.1}
                    grainScale={2}
                    grainAnimated={false}
                    contrast={1.5}
                    gamma={1}
                    saturation={1}
                    centerX={0}
                    centerY={0}
                    zoom={0.9}
                />
                <MantineProvider theme={theme}>{children}</MantineProvider>
            </body>
        </html>
    );
}

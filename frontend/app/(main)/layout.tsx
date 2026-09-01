"use client";

import { AppShell, Box, ScrollArea } from "@mantine/core";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { Header } from "@/components/Header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell header={{ height: 60 }}>
            <AppShell.Header bg="#ffffff9c" style={{ border: "none" }}>
                <Header />
            </AppShell.Header>
            <AppShell.Main style={{ height: "100vh", overflow: "hidden" }}>
                <ScrollArea h="100%">
                    <Box p="sm" mih="calc(100vh - 60px)">
                        {children}
                    </Box>
                    <Footer />
                    <CookieBanner />
                </ScrollArea>
            </AppShell.Main>
        </AppShell>
    );
}

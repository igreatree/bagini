import { Center } from "@mantine/core";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <Center h="100vh">{children}</Center>;
}

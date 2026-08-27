import { Catalog } from "@/components/Catalog";
import Layout from "./(main)/layout";
import { Center, Stack } from "@mantine/core";

export default function MainPage() {
    return (
        <Layout>
            <Stack>
                <Center>
                    <Catalog />
                </Center>
            </Stack>
        </Layout>
    );
}

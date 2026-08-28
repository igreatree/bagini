import { Catalog } from "@/components/Catalog";
import Layout from "./(main)/layout";
import { Center, Stack } from "@mantine/core";
import { Products } from "@/components/Products";

export default function MainPage() {
    return (
        <Layout>
            <Stack>
                <Center>
                    <Catalog />
                </Center>
                <Products />
            </Stack>
        </Layout>
    );
}

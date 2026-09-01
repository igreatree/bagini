"use client";

import { Container, SimpleGrid } from "@mantine/core";
import { ProductCard } from "../ProductCard";
import { useMockStore } from "@/store/mock";
import { useIsMobile } from "@/hooks";

export const Products = () => {
    const { products } = useMockStore();
    const isMobile = useIsMobile();

    return (
        <Container w="100%" size="xl" p={0}>
            <SimpleGrid
                minColWidth={isMobile ? 150 : 230}
                autoFlow="auto-fill"
                spacing={isMobile ? 4 : "sm"}
            >
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </SimpleGrid>
        </Container>
    );
};

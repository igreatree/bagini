"use client";

import { SimpleGrid } from "@mantine/core";
import { ProductCard } from "../ProductCard";
import { useMockStore } from "@/store/mock";

export const Products = () => {
    const { products } = useMockStore();

    return (
        <SimpleGrid minColWidth={300} autoFlow="auto-fill">
            {products.map((product) => (
                <ProductCard key={product.id} {...product} />
            ))}
        </SimpleGrid>
    );
};

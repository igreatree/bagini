import { SimpleGrid } from "@mantine/core";
import products from "../../mock/products.json";
import { ProductCard } from "../ProductCard";

export const Products = () => {
    return (
        <SimpleGrid minColWidth={300} autoFlow="auto-fill">
            {products.data.map((product) => (
                <ProductCard key={product.id} {...product} />
            ))}
        </SimpleGrid>
    );
};

import type { ErrorResponseType, IProduct, ProductsPageType } from "../types";
import Api from "./client";

export const getProducts = async (params: {
    page: number;
    limit: number;
    search?: string;
}): Promise<ProductsPageType | ErrorResponseType> => {
    try {
        const response = await Api.get("/products", { params });

        return response.data;
    } catch (error) {
        console.error("getProducts error:", error);
        return error as ErrorResponseType;
    }
};

export const getProduct = async (
    id: string,
): Promise<{ product: IProduct } | ErrorResponseType> => {
    try {
        const response = await Api.get(`/products/${id}`);

        return response.data;
    } catch (error) {
        console.error("getProduct error:", error);
        return error as ErrorResponseType;
    }
};

export const getProductsByIds = async (
    ids: string[],
): Promise<{ items: IProduct[] } | ErrorResponseType> => {
    try {
        const response = await Api.get("/products/by-ids", {
            params: { ids: ids.join(",") },
        });

        return response.data;
    } catch (error) {
        console.error("getProductsByIds error:", error);
        return error as ErrorResponseType;
    }
};

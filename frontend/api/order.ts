import type {
    CreateOrderType,
    ErrorResponseType,
    OrderQuoteType,
    OrderType,
} from "../types";
import Api from "./client";

export const calculateOrder = async (
    items: CreateOrderType["items"],
): Promise<OrderQuoteType | ErrorResponseType> => {
    try {
        const response = await Api.post("/order/calculate", { items });

        return response.data;
    } catch (error) {
        console.error("calculateOrder error:", error);
        return error as ErrorResponseType;
    }
};

export const createOrder = async (
    order: CreateOrderType,
): Promise<{ order: OrderType } | ErrorResponseType> => {
    try {
        const response = await Api.post("/order", order);

        return response.data;
    } catch (error) {
        console.error("createOrder error:", error);
        return error as ErrorResponseType;
    }
};

import type {
    CreateOrderType,
    ErrorResponseType,
    OrderQuoteType,
    OrderType,
    ProbePurchaseType,
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

export const getOrder = async (
    id: number,
): Promise<{ order: OrderType } | ErrorResponseType> => {
    try {
        const response = await Api.get(`/order/${id}`);

        return response.data;
    } catch (error) {
        console.error("getOrder error:", error);
        return error as ErrorResponseType;
    }
};

export const getOrders = async (): Promise<
    { orders: OrderType[] } | ErrorResponseType
> => {
    try {
        const response = await Api.get("/order");

        return response.data;
    } catch (error) {
        console.error("getOrders error:", error);
        return error as ErrorResponseType;
    }
};

export const getProbePurchase = async (): Promise<
    { purchase: ProbePurchaseType | null } | ErrorResponseType
> => {
    try {
        const response = await Api.get("/order/probe");

        return response.data;
    } catch (error) {
        console.error("getProbePurchase error:", error);
        return error as ErrorResponseType;
    }
};

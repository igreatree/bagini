import type { DeliveryPointType, ErrorResponseType } from "../types";
import Api from "./client";

export const searchDeliveryPoints = async (
    q: string,
): Promise<{ items: DeliveryPointType[] } | ErrorResponseType> => {
    try {
        const response = await Api.get("/delivery/points", { params: { q } });

        return response.data;
    } catch (error) {
        console.error("searchDeliveryPoints error:", error);
        return error as ErrorResponseType;
    }
};

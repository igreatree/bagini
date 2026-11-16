import type {
    DeliveryPointType,
    ErrorResponseType,
    MapBoundsType,
    MapPointsType,
} from "../types";
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

export const getDeliveryPointsInBounds = async (
    bounds: MapBoundsType,
): Promise<MapPointsType | ErrorResponseType> => {
    try {
        const response = await Api.get("/delivery/points/map", {
            params: bounds,
        });
        return response.data;
    } catch (error) {
        return error as ErrorResponseType;
    }
};

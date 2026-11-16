import type { DeliveryPointType } from "@/types";

export type MappedPoint = DeliveryPointType & {
    latitude: number;
    longitude: number;
};
export type MapFocus = { positions: [number, number][]; zoom?: number };

export const hasCoordinates = (
    point: DeliveryPointType,
): point is MappedPoint =>
    typeof point.latitude === "number" &&
    Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 85 &&
    typeof point.longitude === "number" &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.longitude) <= 180;

export const pointTypeLabel = (type: string | null) =>
    type?.toLowerCase() === "postamat" ? "Постамат" : "Пункт выдачи";

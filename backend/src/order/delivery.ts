const DEFAULT_DELIVERY_PRICE = 300;
const DEFAULT_FREE_DELIVERY_FROM = 5000;

const readRubles = (value: string | undefined, fallback: number) => {
    if (value === undefined || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0
        ? Math.round(number)
        : fallback;
};

export const calculateDelivery = (itemsTotal: number) => {
    const basePrice = readRubles(
        process.env.DELIVERY_PRICE,
        DEFAULT_DELIVERY_PRICE,
    );
    // 0 в FREE_DELIVERY_FROM отключает бесплатную доставку
    const freeFrom = readRubles(
        process.env.FREE_DELIVERY_FROM,
        DEFAULT_FREE_DELIVERY_FROM,
    );
    const isFree = freeFrom > 0 && itemsTotal >= freeFrom;

    return {
        deliveryPrice: isFree ? 0 : basePrice,
        freeDeliveryFrom: freeFrom,
    };
};

import { AxiosError } from "axios";

export type UserRoleType = "admin" | "moderator" | "user";

export type ErrorResponseType = AxiosError<{
    message: string;
    status: number;
}>;

export type QuerySearchType = {
    skip?: number;
    take?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
};

export type UserType = {
    id: number;
    phone: string;
    role: UserRoleType;
    email?: string;
    name?: string;
    lastName?: string;
};

export interface IProduct {
    id: string;
    productName: string;
    description: string;
    price: number;
    images: string[];

    brand: string;
    line: string;
    name: string;
    type: string;
    purpose: string;
    volume: string;
    hold: string;
    hairType?: string;
    texture?: string;
    effect: string;
    scent: string;
    countryOfBrand: string;
    form: string;
}

export type IProductCard = Pick<
    IProduct,
    "productName" | "price" | "images" | "type" | "id"
>;

export type CreateOrderType = {
    items: { productId: string; quantity: number }[];
    recipientName: string;
    city: string;
    address: string;
    postalCode?: string;
    comment?: string;
};

export type OrderType = {
    id: number;
    status: "pending" | "paid" | "cancelled";
    itemsTotal: number;
    deliveryPrice: number;
    total: number;
};

export type OrderQuoteType = {
    itemsTotal: number;
    deliveryPrice: number;
    freeDeliveryFrom: number;
    total: number;
};

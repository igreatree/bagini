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
    offerId: string;
    productName: string;
    price: number;
    images: string[];
    description?: string;
}

export type IProductCard = Pick<
    IProduct,
    "productName" | "price" | "images" | "id"
>;

export type ProductsPageType = {
    items: IProduct[];
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export type CreateOrderType = {
    items: { productId: string; quantity: number }[];
    comment?: string;
};

export type OrderStatusType = "pending" | "paid" | "cancelled";

export type OrderItemType = {
    id: number;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
};

export type OrderType = {
    id: number;
    status: OrderStatusType;
    createdAt: string;
    items: OrderItemType[];
    itemsTotal: number;
    deliveryPrice: number;
    total: number;
    paymentUrl: string | null;
};

export type OrderQuoteType = {
    itemsTotal: number;
    total: number;
};

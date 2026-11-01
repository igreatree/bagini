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
    // Сколько штук можно купить
    stock: number;
    // Пробник: продаётся отдельно, один на аккаунт
    probe?: boolean;
}

export type IProductCard = Pick<
    IProduct,
    "productName" | "price" | "images" | "id" | "probe"
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
    // Пункт выдачи Ozon: обязателен для заказа с пробником
    deliveryPointId?: number;
};

// confirmed — бесплатный заказ (пробник): оплаты нет, посылка передана в Ozon Доставку
export type OrderStatusType = "pending" | "paid" | "confirmed" | "cancelled";

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
    // Пункт выдачи, если адрес выбирали на сайте (заказ с пробником)
    address: string | null;
};

export type DeliveryPointType = {
    id: number;
    name: string;
    address: string;
    type: string | null;
};

// Заказ с пробником, который занимает лимит аккаунта (отменённые не учитываются)
export type ProbePurchaseType = {
    id: number;
    status: OrderStatusType;
};

export type OrderQuoteType = {
    itemsTotal: number;
    total: number;
};

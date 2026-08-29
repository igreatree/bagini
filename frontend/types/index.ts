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

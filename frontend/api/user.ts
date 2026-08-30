import type { ErrorResponseType, QuerySearchType, UserType } from "../types";
import Api from "./client";

export const getUsers = async (
    query: QuerySearchType,
): Promise<{ users: UserType[]; total: number } | ErrorResponseType> => {
    try {
        const response = await Api.get("/user/all", { params: query });

        return response.data;
    } catch (error) {
        console.error("getUsers error:", error);
        return error as ErrorResponseType;
    }
};

export const getCurrentUser = async (): Promise<
    { user: UserType } | ErrorResponseType
> => {
    try {
        const response = await Api.get("/user");

        return response.data;
    } catch (error) {
        console.error("getCurrentUser error:", error);
        return error as ErrorResponseType;
    }
};

export const updateUser = async (
    user: Partial<Omit<UserType, "id" | "phone">>,
): Promise<{ user: UserType } | ErrorResponseType> => {
    try {
        const response = await Api.put("/user", user);

        return response.data;
    } catch (error) {
        console.error("updateUser error:", error);
        return error as ErrorResponseType;
    }
};

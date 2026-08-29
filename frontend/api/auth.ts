import type { ErrorResponseType, UserRoleType, UserType } from "../types";
import Api from "./client";

export const sendSmsCode = async (
    phone: string,
): Promise<{ success: boolean } | ErrorResponseType> => {
    try {
        const response = await Api.post("/auth/send-sms-code", { phone });

        return response.data;
    } catch (error) {
        console.error("Send sms code error:", error);
        return error as ErrorResponseType;
    }
};

export const verifySmsCode = async (
    phone: string,
    code: string,
): Promise<{ user: UserType } | ErrorResponseType> => {
    try {
        const response = await Api.post("/auth/verify-sms-code", {
            phone,
            code,
        });

        return response.data;
    } catch (error) {
        console.error("Verify sms code error:", error);
        return error as ErrorResponseType;
    }
};

export const logout = async () => {
    try {
        const response = await Api.get("/auth/logout");

        return response.data;
    } catch (error) {
        console.error("Logout error:", error);
        throw new Error("Logout error");
    }
};

export const authCheck = async (): Promise<
    { role: UserRoleType } | ErrorResponseType
> => {
    try {
        const response = await Api.get("/auth/check");

        return response.data;
    } catch (error) {
        console.error("Check error:", error);
        return error as ErrorResponseType;
    }
};

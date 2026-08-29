import type { ErrorResponseType } from "../types";

export const formatPrice = (price: number): string => {
    return price.toLocaleString("ru-RU");
};

export const processErrorMessage = (data: ErrorResponseType) => {
    const message = data.response?.data.message;
    if (message) {
        switch (message) {
            case "Unauthorized":
                return "Не авторизован";
            default:
                return message;
        }
    } else {
        return "Неизвестная ошибка";
    }
};

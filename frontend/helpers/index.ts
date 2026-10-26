import type { ErrorResponseType, UserType } from "../types";

export const formatPrice = (price: number): string => {
    return price.toLocaleString("ru-RU");
};

// Пробники отдаём с нулевой ценой: вместо «0 ₽» показываем «Бесплатно»
export const formatPriceLabel = (price: number, separator = ""): string => {
    return price === 0 ? "Бесплатно" : `${formatPrice(price)}${separator}₽`;
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
export const getInitials = (user: UserType | null) => {
    if (!user) return "A";
    const first = user.name?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    return (first + last).toUpperCase() || user.phone.slice(-2);
};

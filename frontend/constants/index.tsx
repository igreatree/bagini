import { OrderStatusType, UserRoleType } from "@/types";

export const roleLabels: Record<UserRoleType, string> = {
    admin: "Администратор",
    moderator: "Менеджер",
    user: "Пользователь",
};

export const roleColors: Record<UserRoleType, string> = {
    admin: "red",
    moderator: "blue",
    user: "gray",
};

export const orderStatusLabels: Record<OrderStatusType, string> = {
    pending: "Ожидает оплаты",
    paid: "Оплачен",
    cancelled: "Не оплачен",
};

export const orderStatusColors: Record<OrderStatusType, string> = {
    pending: "yellow",
    paid: "green",
    cancelled: "red",
};

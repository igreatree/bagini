import { UserRoleType } from "@/types";

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

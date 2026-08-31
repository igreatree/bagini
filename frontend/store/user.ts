import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authCheck, sendSmsCode, verifySmsCode, logout } from "../api/auth";
import type { UserType } from "../types";
import { getCurrentUser, updateUser } from "@/api/user";

type UserStoreType = {
    user: UserType | null;
    phone: string | null;
    isLoaded: boolean;
    basket: { id: string; count: number }[];
    sendSmsCode: (phone: string) => Promise<boolean>;
    verifySmsCode: (code: string) => Promise<UserType | null>;
    updateUser: (
        user: Partial<Omit<UserType, "id" | "phone">>,
    ) => Promise<UserType | null>;
    getUser: () => Promise<void>;
    logout: () => Promise<void>;
    check: () => Promise<boolean>;
    updateBasket: (id: string) => void;
    basketQuantityChange: (id: string, count: number) => void;
};

export const useUserStore = create<UserStoreType>()(
    persist(
        (set, get) => ({
            user: null,
            phone: null,
            isLoaded: false,
            basket: [],
            sendSmsCode: async (phone) => {
                const res = await sendSmsCode(phone);
                if ("success" in res) {
                    set({ phone });
                    return true;
                }
                return false;
            },
            verifySmsCode: async (code) => {
                const { phone } = get();
                if (phone) {
                    const res = await verifySmsCode(phone, code);
                    if ("user" in res) {
                        set({ user: res.user });
                        return res.user;
                    }
                    return null;
                }
                return null;
            },
            updateUser: async (user) => {
                const res = await updateUser(user);
                if ("user" in res) {
                    set({ user: res.user });
                    return res.user;
                }
                return null;
            },
            getUser: async () => {
                const res = await getCurrentUser();
                if ("user" in res) set({ user: res.user });
            },
            logout: async () => {
                await logout();
                set({ user: null, isLoaded: true });
                location.href = "/auth";
            },
            check: async () => {
                const res = await authCheck();
                const authorized = "role" in res;
                if (authorized) {
                    set((state) => ({
                        isLoaded: true,
                        user: { ...state.user!, role: res.role },
                    }));
                } else {
                    set({ isLoaded: true, user: null });
                }

                return authorized;
            },
            updateBasket: (id) => {
                set((state) => ({
                    basket: state.basket.find((item) => item.id === id)
                        ? state.basket.filter((item) => item.id !== id)
                        : [...state.basket, { id, count: 1 }],
                }));
            },
            basketQuantityChange: (id, count) => {
                set((state) => ({
                    basket: state.basket.map((item) =>
                        item.id !== id ? item : { id, count },
                    ),
                }));
            },
        }),
        {
            name: "user-store",
            version: 1,
            partialize: ({ user, basket }) => ({
                user,
                basket,
            }),
        },
    ),
);

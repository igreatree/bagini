import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authCheck, sendSmsCode, verifySmsCode, logout } from "../api/auth";
import type { UserType } from "../types";

type UserStoreType = {
    user: UserType | null;
    phone: string | null;
    isLoaded: boolean;
    sendSmsCode: (phone: string) => Promise<boolean>;
    verifySmsCode: (code: string) => Promise<boolean>;
    logout: () => Promise<void>;
    check: () => Promise<boolean>;
};

export const useUserStore = create<UserStoreType>()(
    persist(
        (set, get) => ({
            user: null,
            phone: null,
            isLoaded: false,
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
                        return true;
                    }
                    return false;
                }
                return false;
            },
            logout: async () => {
                await logout();
                set({ user: null, isLoaded: true });
                location.href = "/";
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
        }),
        {
            name: "User-store",
            version: 1,
            partialize: ({ user, phone }) => ({
                user,
                phone,
            }),
        },
    ),
);

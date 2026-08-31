import { IProduct } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import mock from "@/mock/products.json";

type MockStoreType = {
    products: IProduct[];
};

export const useMockStore = create<MockStoreType>()(
    persist(
        () => ({
            products: mock.data as IProduct[],
        }),
        {
            name: "mock-store",
            version: 1,
        },
    ),
);

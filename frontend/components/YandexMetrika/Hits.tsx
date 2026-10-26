"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { YANDEX_METRIKA_ID } from "@/constants";

type Ym = (id: number, method: string, ...args: unknown[]) => void;

// Переходы между страницами не перезагружают сайт, поэтому счётчик сам видит
// только первую. Остальные просмотры отправляем при смене адреса.
export const YandexMetrikaHits = () => {
    const pathname = usePathname();
    const query = useSearchParams().toString();
    const lastUrl = useRef<string | null>(null);

    useEffect(() => {
        const url = query ? `${pathname}?${query}` : pathname;
        const previous = lastUrl.current;
        lastUrl.current = url;
        // Первую страницу уже отправил init, повторный запуск эффекта — тоже
        if (previous === null || previous === url) return;

        const ym = (window as unknown as { ym?: Ym }).ym;
        ym?.(YANDEX_METRIKA_ID, "hit", url, {
            referer: `${window.location.origin}${previous}`,
        });
    }, [pathname, query]);

    return null;
};

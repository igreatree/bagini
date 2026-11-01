"use client";

import { useEffect, useState } from "react";
import { Loader, Select } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { searchDeliveryPoints } from "@/api/delivery";
import type { DeliveryPointType } from "@/types";

const MIN_QUERY_LENGTH = 3;
const SEARCH_DELAY_MS = 300;

// Поиск пункта выдачи Ozon по части адреса. Пункты ищет сервер, поэтому список
// не фильтруем на клиенте.
export const DeliveryPointSelect = ({
    value,
    onChange,
}: {
    value: DeliveryPointType | null;
    onChange: (point: DeliveryPointType | null) => void;
}) => {
    const [search, setSearch] = useState("");
    const [query] = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
    const [result, setResult] = useState<{
        query: string;
        items: DeliveryPointType[];
    }>({ query: "", items: [] });

    useEffect(() => {
        if (query.length < MIN_QUERY_LENGTH) return;
        let actual = true;
        searchDeliveryPoints(query).then((res) => {
            if (actual) {
                setResult({ query, items: "items" in res ? res.items : [] });
            }
        });
        return () => {
            actual = false;
        };
    }, [query]);

    const searching = query.length >= MIN_QUERY_LENGTH;
    const loading = searching && result.query !== query;

    // Выбранный пункт остаётся в списке, даже когда он не попал в новую выдачу
    const points = new Map<number, DeliveryPointType>();
    if (value) points.set(value.id, value);
    if (searching) result.items.forEach((point) => points.set(point.id, point));

    return (
        <Select
            label="Пункт выдачи Ozon"
            placeholder="Начните вводить город или улицу"
            withAsterisk
            searchable
            clearable
            data={[...points.values()].map((point) => ({
                value: String(point.id),
                label: point.address,
            }))}
            value={value ? String(value.id) : null}
            onChange={(id) =>
                onChange(id ? (points.get(Number(id)) ?? null) : null)
            }
            searchValue={search}
            onSearchChange={setSearch}
            filter={({ options }) => options}
            nothingFoundMessage={
                !searching
                    ? "Введите не меньше трёх символов"
                    : loading
                      ? "Ищем пункты выдачи…"
                      : "Пункты выдачи не найдены"
            }
            rightSection={loading ? <Loader size={16} /> : undefined}
            mb="md"
        />
    );
};

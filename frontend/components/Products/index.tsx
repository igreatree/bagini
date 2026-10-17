"use client";

import { useEffect, useRef, useState } from "react";
import {
    Button,
    Center,
    CloseButton,
    Container,
    Pagination,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { ProductCard } from "../ProductCard";
import { getProducts } from "@/api/product";
import { useIsMobile } from "@/hooks";
import type { ProductsPageType } from "@/types";

const PAGE_SIZE = 24;

export const Products = () => {
    const isMobile = useIsMobile();
    const gridRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search.trim(), 400);
    // Номер страницы относится к поисковому запросу, для которого его выбрали:
    // при новом запросе показываем первую страницу без лишнего запроса
    const [pageState, setPageState] = useState({ search: "", page: 1 });
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<{
        key: string;
        data: ProductsPageType | null;
    } | null>(null);

    const page = pageState.search === debouncedSearch ? pageState.page : 1;
    const requestKey = `${debouncedSearch}|${page}|${attempt}`;
    const loading = result?.key !== requestKey;
    const data = result?.data;

    useEffect(() => {
        let actual = true;
        getProducts({
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
        }).then((res) => {
            if (actual) {
                setResult({
                    key: requestKey,
                    data: "items" in res ? res : null,
                });
            }
        });
        return () => {
            actual = false;
        };
    }, [page, debouncedSearch, requestKey]);

    const handlePageChange = (value: number) => {
        setPageState({ search: debouncedSearch, page: value });
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const gridProps = {
        minColWidth: isMobile ? 150 : 230,
        autoFlow: "auto-fill" as const,
        spacing: isMobile ? 4 : "sm",
    };

    return (
        <Container w="100%" size="xl" p={0}>
            <Stack ref={gridRef} gap="md">
                <TextInput
                    size="md"
                    placeholder="Поиск по названию или артикулу"
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    leftSection={<IconSearch size={18} />}
                    rightSection={
                        search ? (
                            <CloseButton
                                aria-label="Очистить поиск"
                                onClick={() => setSearch("")}
                            />
                        ) : undefined
                    }
                    maxLength={100}
                />

                {!data && loading && (
                    <SimpleGrid {...gridProps}>
                        {Array.from({ length: 8 }, (_, index) => (
                            <Skeleton
                                key={index}
                                style={{ aspectRatio: "3/4.6" }}
                            />
                        ))}
                    </SimpleGrid>
                )}

                {!data && !loading && (
                    <Center py={60}>
                        <Stack align="center" gap="xs">
                            <Text>Не удалось загрузить каталог</Text>
                            <Button
                                variant="light"
                                onClick={() => setAttempt((n) => n + 1)}
                            >
                                Повторить
                            </Button>
                        </Stack>
                    </Center>
                )}

                {data && data.items.length === 0 && (
                    <Center py={60}>
                        <Text c="dimmed">
                            {debouncedSearch
                                ? "По вашему запросу ничего не найдено"
                                : "Товаров пока нет"}
                        </Text>
                    </Center>
                )}

                {data && data.items.length > 0 && (
                    <SimpleGrid
                        {...gridProps}
                        style={{ opacity: loading ? 0.5 : 1 }}
                    >
                        {data.items.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </SimpleGrid>
                )}

                {data && data.pages > 1 && (
                    <Center pb="md">
                        <Pagination
                            total={data.pages}
                            value={page}
                            onChange={handlePageChange}
                            disabled={loading}
                            siblings={isMobile ? 0 : 1}
                        />
                    </Center>
                )}
            </Stack>
        </Container>
    );
};

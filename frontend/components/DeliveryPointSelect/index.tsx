"use client";

import {
    Component,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import {
    Alert,
    Badge,
    Button,
    Center,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import {
    IconCheck,
    IconCurrentLocation,
    IconMapPin,
    IconSearch,
} from "@tabler/icons-react";
import {
    getDeliveryPointsInBounds,
    searchDeliveryPoints,
} from "@/api/delivery";
import type { DeliveryPointType, MapBoundsType, MapPointsType } from "@/types";
import { hasCoordinates, pointTypeLabel, type MapFocus } from "./map-types";
import styles from "./delivery-point.module.css";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
    ssr: false,
    loading: () => (
        <Center h="100%">
            <Loader aria-label="Загрузка карты" />
        </Center>
    ),
});
const EMPTY_POINTS: DeliveryPointType[] = [];

class MapBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? (
            <Center h="100%" p="lg">
                <Text ta="center" c="dimmed">
                    Карту не удалось загрузить. Найдите пункт выдачи по адресу в
                    списке.
                </Text>
            </Center>
        ) : (
            this.props.children
        );
    }
}

export const DeliveryPointSelect = ({
    value,
    onChange,
}: {
    value: DeliveryPointType | null;
    onChange: (point: DeliveryPointType | null) => void;
}) => {
    const mobile = useMediaQuery("(max-width: 48em)");
    const [opened, setOpened] = useState(false);
    const [candidate, setCandidate] = useState<DeliveryPointType | null>(null);
    const [search, setSearch] = useState("");
    const trimmed = search.trim();
    const [query] = useDebouncedValue(trimmed, 300);
    const [attempt, setAttempt] = useState(0);
    const [searchResult, setSearchResult] = useState<{
        query: string;
        attempt: number;
        items: DeliveryPointType[];
        failed: boolean;
    } | null>(null);
    const [bounds, setBounds] = useState<MapBoundsType | null>(null);
    const [area] = useDebouncedValue(bounds, 250);
    const [areaResult, setAreaResult] = useState<
        | (MapPointsType & {
              key: string;
              attempt: number;
              failed: boolean;
          })
        | null
    >(null);
    const [focus, setFocus] = useState<MapFocus | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [tileError, setTileError] = useState(false);
    const areaKey = area ? JSON.stringify(area) : "";

    const onBoundsChange = useCallback((next: MapBoundsType | null) => {
        setBounds((previous) =>
            JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
        );
    }, []);

    useEffect(() => {
        if (!opened || query.length < 3 || query !== trimmed) return;
        let actual = true;
        searchDeliveryPoints(query).then((response) => {
            if (!actual) return;
            const items = "items" in response ? response.items : [];
            setSearchResult({
                query,
                attempt,
                items,
                failed: !("items" in response),
            });
            const positions = items
                .filter(hasCoordinates)
                .map(
                    (point) =>
                        [point.latitude, point.longitude] as [number, number],
                );
            if (positions.length) setFocus({ positions });
        });
        return () => {
            actual = false;
        };
    }, [opened, query, trimmed, attempt]);

    useEffect(() => {
        if (!opened || !areaKey) return;
        let actual = true;
        const requestedBounds: MapBoundsType = JSON.parse(areaKey);
        getDeliveryPointsInBounds(requestedBounds).then((response) => {
            if (!actual) return;
            setAreaResult({
                key: areaKey,
                attempt,
                ...("items" in response
                    ? { ...response, failed: false }
                    : { items: [], truncated: false, failed: true }),
            });
        });
        return () => {
            actual = false;
        };
    }, [opened, areaKey, attempt]);

    const searching = trimmed.length >= 3;
    const searchLoading =
        searching &&
        (searchResult?.query !== trimmed || searchResult.attempt !== attempt);
    const areaLoading =
        !!areaKey &&
        (areaResult?.key !== areaKey || areaResult.attempt !== attempt);
    const searchPoints =
        searchResult?.query === trimmed ? searchResult.items : EMPTY_POINTS;
    const areaPoints =
        areaKey && areaResult?.key === areaKey
            ? areaResult.items
            : EMPTY_POINTS;
    const list = searching ? searchPoints : areaPoints;
    const loading = searching ? searchLoading : areaLoading;
    const failed = searching
        ? !searchLoading && searchResult?.failed
        : !areaLoading && areaResult?.failed;
    const mapPoints = useMemo(() => {
        const points = new Map<number, DeliveryPointType>();
        [
            ...areaPoints,
            ...searchPoints,
            ...(candidate ? [candidate] : []),
        ].forEach((point) => points.set(point.id, point));
        return [...points.values()];
    }, [areaPoints, searchPoints, candidate]);

    const select = (point: DeliveryPointType) => {
        setCandidate(point);
        if (hasCoordinates(point))
            setFocus({
                positions: [[point.latitude, point.longitude]],
                zoom: 16,
            });
    };
    const confirm = (point: DeliveryPointType) => {
        onChange(point);
        setOpened(false);
    };
    const locate = () => {
        if (!navigator.geolocation) {
            setLocationError(
                "Геолокация недоступна. Найдите ПВЗ по городу или улице",
            );
            return;
        }
        setLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLocating(false);
                setSearch("");
                setFocus({
                    positions: [[coords.latitude, coords.longitude]],
                    zoom: 14,
                });
            },
            () => {
                setLocating(false);
                setLocationError(
                    "Не удалось определить местоположение. Разрешите доступ к геолокации или введите город и улицу",
                );
            },
            { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
        );
    };
    const open = () => {
        setCandidate(value);
        setSearch("");
        setLocationError(null);
        setTileError(false);
        setFocus(
            value && hasCoordinates(value)
                ? { positions: [[value.latitude, value.longitude]], zoom: 16 }
                : null,
        );
        setOpened(true);
    };

    return (
        <>
            <Text size="sm" fw={500} mb={6}>
                Пункт выдачи Ozon{" "}
                <Text component="span" c="red">
                    *
                </Text>
            </Text>
            <div className={styles.summary}>
                <div className={styles.summaryText}>
                    <Group gap={6} mb={5}>
                        <IconMapPin size={18} />
                        <Text size="sm" fw={500}>
                            {value
                                ? pointTypeLabel(value.type) + " Ozon"
                                : "Выберите удобный пункт выдачи"}
                        </Text>
                    </Group>
                    <Text size="sm" c={value ? undefined : "dimmed"}>
                        {value?.address ?? "Найдите ПВЗ на карте или по адресу"}
                    </Text>
                    <Text size="xs" c="blue" mt={4}>
                        Доставка бесплатно
                    </Text>
                </div>
                <Button
                    variant={value ? "light" : "filled"}
                    leftSection={<IconMapPin size={17} />}
                    onClick={open}
                >
                    {value ? "Изменить" : "Выбрать на карте"}
                </Button>
            </div>
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={<Text fw={600}>Выберите пункт выдачи Ozon</Text>}
                size={1100}
                fullScreen={mobile}
                classNames={{ body: styles.modalBody }}
                centered
                radius={mobile ? 0 : "lg"}
                closeButtonProps={{ "aria-label": "Закрыть выбор ПВЗ" }}
            >
                <div className={styles.toolbar}>
                    <TextInput
                        className={styles.search}
                        placeholder="Город, улица или адрес"
                        aria-label="Поиск пункта выдачи по адресу"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.currentTarget.value)
                        }
                        leftSection={<IconSearch size={18} />}
                        rightSection={
                            searchLoading ? <Loader size={16} /> : undefined
                        }
                    />
                    <Button
                        variant="light"
                        onClick={locate}
                        loading={locating}
                        aria-label="Найти пункты выдачи рядом со мной"
                        leftSection={<IconCurrentLocation size={18} />}
                    >
                        <span className={styles.locateText}>Рядом со мной</span>
                    </Button>
                </div>
                {locationError && (
                    <Alert color="yellow" mb="sm">
                        {locationError}
                    </Alert>
                )}
                {tileError && (
                    <Alert color="yellow" mb="sm">
                        Часть карты не загрузилась. ПВЗ можно выбрать в списке
                        по адресу.
                    </Alert>
                )}
                <div className={styles.layout}>
                    <div className={styles.resultsPane}>
                        <Text size="xs" c="dimmed" mb={8} px={4}>
                            {searching
                                ? "По вашему запросу"
                                : "Пункты на карте"}
                        </Text>
                        <div
                            className={styles.results}
                            aria-label="Список пунктов выдачи"
                            aria-busy={!!loading}
                        >
                            {loading ? (
                                <Center h={100}>
                                    <Loader
                                        size="sm"
                                        aria-label="Загрузка пунктов выдачи"
                                    />
                                </Center>
                            ) : failed ? (
                                <Stack gap="sm" p="md">
                                    <Text size="sm">
                                        Не удалось загрузить пункты выдачи
                                    </Text>
                                    <Button
                                        variant="light"
                                        onClick={() => setAttempt((n) => n + 1)}
                                    >
                                        Повторить
                                    </Button>
                                </Stack>
                            ) : list.length ? (
                                list.map((point) => (
                                    <button
                                        key={point.id}
                                        type="button"
                                        className={`${styles.point} ${candidate?.id === point.id ? styles.pointSelected : ""}`}
                                        aria-pressed={
                                            candidate?.id === point.id
                                        }
                                        onClick={() => select(point)}
                                    >
                                        <span className={styles.pointType}>
                                            {pointTypeLabel(point.type)} Ozon{" "}
                                            {candidate?.id === point.id
                                                ? "· Выбран"
                                                : ""}
                                        </span>
                                        <span className={styles.pointAddress}>
                                            {point.address}
                                        </span>
                                        {!hasCoordinates(point) && (
                                            <span className={styles.pointType}>
                                                Без отметки на карте
                                            </span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className={styles.empty}>
                                    {searching
                                        ? "Пункты выдачи не найдены. Уточните город или улицу"
                                        : !bounds
                                          ? "Приблизьте карту или найдите ПВЗ по городу и улице"
                                          : "В этой области пунктов выдачи нет. Передвиньте карту или введите адрес"}
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        className={styles.mapPanel}
                        role="region"
                        aria-label="Карта пунктов выдачи Ozon"
                    >
                        {opened && (
                            <MapBoundary>
                                <DeliveryMap
                                    points={mapPoints}
                                    selected={candidate}
                                    focus={focus}
                                    onSelect={select}
                                    onConfirm={confirm}
                                    onBoundsChange={onBoundsChange}
                                    onTileError={setTileError}
                                    compact={!!mobile}
                                />
                            </MapBoundary>
                        )}
                        {areaLoading ? (
                            <div className={styles.mapStatus}>
                                Загружаем пункты выдачи…
                            </div>
                        ) : !bounds ? (
                            <div className={styles.mapStatus}>
                                Приблизьте карту, чтобы увидеть пункты выдачи
                            </div>
                        ) : areaResult?.key === areaKey &&
                          areaResult.truncated ? (
                            <div className={styles.mapStatus}>
                                В этой области много ПВЗ. Приблизьте карту,
                                чтобы увидеть остальные
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className={styles.footer}>
                    <div className={styles.footerAddress} aria-live="polite">
                        {candidate ? (
                            <>
                                <Badge variant="light" size="sm" mb={5}>
                                    Доставка бесплатно
                                </Badge>
                                <Text size="sm" fw={500}>
                                    {candidate.address}
                                </Text>
                            </>
                        ) : (
                            <Text size="sm" c="dimmed">
                                Выберите пункт на карте или в списке
                            </Text>
                        )}
                    </div>
                    <Button
                        className={styles.confirm}
                        disabled={!candidate}
                        leftSection={<IconCheck size={18} />}
                        onClick={() => candidate && confirm(candidate)}
                    >
                        Выбрать этот ПВЗ
                    </Button>
                </div>
            </Modal>
        </>
    );
};

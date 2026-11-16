"use client";

import { useCallback, useEffect, useRef } from "react";
import { divIcon, latLngBounds, type Marker as LeafletMarker } from "leaflet";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { DeliveryPointType, MapBoundsType } from "@/types";
import {
    hasCoordinates,
    pointTypeLabel,
    type MapFocus,
    type MappedPoint,
} from "./map-types";
import styles from "./delivery-point.module.css";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const MIN_POINTS_ZOOM = 9;
const TILE_URL =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const makeIcon = (selected: boolean) =>
    divIcon({
        className: `${styles.pin} ${selected ? styles.pinSelected : ""}`,
        html: '<span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>',
        iconSize: [36, 42],
        iconAnchor: [18, 40],
        popupAnchor: [0, -38],
    });
const normalIcon = makeIcon(false);
const selectedIcon = makeIcon(true);

function MapPosition({
    focus,
    onBoundsChange,
}: {
    focus: MapFocus | null;
    onBoundsChange: (bounds: MapBoundsType | null) => void;
}) {
    const map = useMap();
    const reportBounds = useCallback(() => {
        if (map.getZoom() < MIN_POINTS_ZOOM) {
            onBoundsChange(null);
            return;
        }
        const area = map.getBounds();
        const round = (number: number) => Number(number.toFixed(4));
        onBoundsChange({
            south: round(Math.max(-85, area.getSouth())),
            north: round(Math.min(85, area.getNorth())),
            west: round(Math.max(-180, area.getWest())),
            east: round(Math.min(180, area.getEast())),
        });
    }, [map, onBoundsChange]);
    useMapEvents({ moveend: reportBounds });
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
            reportBounds();
        });
        observer.observe(map.getContainer());
        reportBounds();
        return () => observer.disconnect();
    }, [map, reportBounds]);
    useEffect(() => {
        if (!focus?.positions.length) return;
        if (focus.positions.length === 1) {
            map.setView(focus.positions[0], focus.zoom ?? 16, {
                animate: false,
            });
        } else {
            map.fitBounds(latLngBounds(focus.positions), {
                padding: [35, 35],
                maxZoom: 14,
                animate: false,
            });
        }
    }, [focus, map]);
    return null;
}

function PointMarker({
    point,
    selected,
    onSelect,
    onConfirm,
    showPopup,
}: {
    point: MappedPoint;
    selected: boolean;
    onSelect: (point: DeliveryPointType) => void;
    onConfirm: (point: DeliveryPointType) => void;
    showPopup: boolean;
}) {
    const marker = useRef<LeafletMarker>(null);
    useEffect(() => {
        if (selected && showPopup) marker.current?.openPopup();
    }, [selected, showPopup]);
    return (
        <Marker
            ref={marker}
            position={[point.latitude, point.longitude]}
            icon={selected ? selectedIcon : normalIcon}
            title={point.address}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(point) }}
        >
            {showPopup && (
                <Popup minWidth={200} maxWidth={280}>
                    <div className={styles.popup}>
                        <small>{pointTypeLabel(point.type)} Ozon</small>
                        <strong>{point.address}</strong>
                        <span>Доставка пробника бесплатно</span>
                        <button type="button" onClick={() => onConfirm(point)}>
                            Выбрать этот ПВЗ
                        </button>
                    </div>
                </Popup>
            )}
        </Marker>
    );
}

export default function DeliveryMap({
    points,
    selected,
    focus,
    onSelect,
    onConfirm,
    onBoundsChange,
    onTileError,
    compact,
}: {
    points: DeliveryPointType[];
    selected: DeliveryPointType | null;
    focus: MapFocus | null;
    onSelect: (point: DeliveryPointType) => void;
    onConfirm: (point: DeliveryPointType) => void;
    onBoundsChange: (bounds: MapBoundsType | null) => void;
    onTileError: (failed: boolean) => void;
    compact: boolean;
}) {
    const center =
        selected && hasCoordinates(selected)
            ? ([selected.latitude, selected.longitude] as [number, number])
            : DEFAULT_CENTER;
    return (
        <MapContainer
            center={center}
            zoom={selected ? 16 : 12}
            minZoom={4}
            maxZoom={19}
            maxBounds={[
                [-85, -180],
                [85, 180],
            ]}
            maxBoundsViscosity={1}
            className={styles.map}
            scrollWheelZoom
        >
            <TileLayer
                url={TILE_URL}
                attribution={TILE_ATTRIBUTION}
                maxZoom={19}
                noWrap
                eventHandlers={{
                    tileerror: () => onTileError(true),
                    tileload: () => onTileError(false),
                }}
            />
            <MapPosition focus={focus} onBoundsChange={onBoundsChange} />
            <MarkerClusterGroup
                chunkedLoading
                showCoverageOnHover={false}
                maxClusterRadius={45}
                disableClusteringAtZoom={16}
                iconCreateFunction={(cluster: {
                    getChildCount: () => number;
                }) =>
                    divIcon({
                        className: styles.cluster,
                        html: `<span>${cluster.getChildCount()}</span>`,
                        iconSize: [42, 42],
                    })
                }
            >
                {points.filter(hasCoordinates).map((point) => (
                    <PointMarker
                        key={point.id}
                        point={point}
                        selected={selected?.id === point.id}
                        onSelect={onSelect}
                        onConfirm={onConfirm}
                        showPopup={!compact}
                    />
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    );
}

import { Box } from "@mantine/core";
import { getImageProps } from "next/image";

const ALT =
    "Получи пробник бесплатно: выбери один пробник, добавь в корзину, выбери ПВЗ Озон";

// Для телефона и ПК разные картинки: <picture> загружает только подходящую.
// 48em — breakpoint sm в Mantine, как у hiddenFrom/visibleFrom.
export const ProbesBanner = () => {
    const common = { alt: ALT, fetchPriority: "high" as const };
    const {
        props: { srcSet: desktop, sizes: desktopSizes },
    } = getImageProps({
        ...common,
        src: "/banners/probes-pc.png",
        width: 1942,
        height: 809,
        sizes: "(min-width: 1400px) 1320px, 100vw",
    });
    const {
        props: { srcSet: mobile, ...image },
    } = getImageProps({
        ...common,
        src: "/banners/probes-mobile.png",
        width: 1585,
        height: 992,
        sizes: "100vw",
    });

    return (
        <Box bdrs="lg" style={{ overflow: "hidden", lineHeight: 0 }}>
            <picture>
                <source
                    media="(min-width: 48em)"
                    srcSet={desktop}
                    sizes={desktopSizes}
                />
                <img
                    {...image}
                    alt={ALT}
                    srcSet={mobile}
                    style={{ width: "100%", height: "auto" }}
                />
            </picture>
        </Box>
    );
};

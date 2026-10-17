import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        // Фото товаров из Ozon
        remotePatterns: [{ protocol: "https", hostname: "**.ozone.ru" }],
    },
};

export default nextConfig;

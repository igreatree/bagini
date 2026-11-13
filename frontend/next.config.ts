import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    async redirects() {
        return [{ source: "/probs", destination: "/prob", permanent: true }];
    },
    images: {
        // Фото товаров из Ozon
        remotePatterns: [{ protocol: "https", hostname: "**.ozone.ru" }],
    },
};

export default nextConfig;

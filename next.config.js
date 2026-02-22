/** @type {import('next').NextConfig} */
const nextConfig = {
    // 启用压缩
    compress: true,

    // 图片优化配置
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        minimumCacheTTL: 60,
    },

    // 生产环境优化
    productionBrowserSourceMaps: false,

    // 实验性功能
    experimental: {
        // 优化CSS
        optimizeCss: true,
        // 优化包导入
        optimizePackageImports: ['@/components', '@/lib', '@/services']
    },

    // 兼容 Turbopack
    turbopack: {},

    // 性能优化
    poweredByHeader: false,

    // 重定向优化
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    }
                ],
            },
        ];
    },
    reactStrictMode: true,
};

const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
});

// Sentry配置
// const { withSentryConfig } = require("@sentry/nextjs");

/* const sentryWebpackPluginOptions = {
    // 静默上传Source Maps
    silent: true,
    // 组织和项目
    org: "scanf2006",
    project: "global-news-pwa",
}; */

// 导出配置(目前仅PWA)
module.exports = withPWA(nextConfig);

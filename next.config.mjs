/** @type {import('next').NextConfig} */
const nextConfig = {
    // Turbopack configuration for Next.js 16+
    turbopack: {},
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
    },
};

export default nextConfig;

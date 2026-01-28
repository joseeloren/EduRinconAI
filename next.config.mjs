/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
    },
};

export default nextConfig;

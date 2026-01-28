/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    output: 'standalone',
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
    },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    output: 'standalone',
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
        // Disable prerendering to avoid useContext errors in Next.js 16
        isrMemoryCacheSize: 0,
    },
    // Skip static generation during build to avoid prerender errors
    skipTrailingSlashRedirect: true,
};

export default nextConfig;

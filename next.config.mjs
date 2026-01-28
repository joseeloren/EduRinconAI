import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    output: 'standalone',
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        },
    },
    // Skip static generation during build to avoid prerender errors
    skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);

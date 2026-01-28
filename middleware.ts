import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';

// Create i18n middleware
const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es'],

    // Used when no locale matches
    defaultLocale: 'es'
});

// Middleware function that combines auth and i18n
export default auth((req) => {
    // If the user is authenticated (or not), we still want to run i18n middleware
    // except for API routes which are handled separately (and typically ignored by the matcher below)
    return intlMiddleware(req);
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(es|en)/:path*']
};

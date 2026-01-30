import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['es', 'en'],

    // Used when no locale matches
    defaultLocale: 'es'
});

export const config = {
    // Match only internationalized pathnames
    // Exclude api, _next, models, and files with extensions
    matcher: ['/((?!api|_next|models|.*\\..*).*)']
};

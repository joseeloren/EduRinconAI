import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const intlMiddleware = createMiddleware({
    locales: ['en', 'es'],
    defaultLocale: 'es'
});

const publicRoutes = ['/', '/login', '/register', '/es/login', '/en/login', '/es', '/en'];

export default auth(async (req) => {
    const { nextUrl } = req;
    const isPublicRoute = publicRoutes.some(route => nextUrl.pathname === route || nextUrl.pathname.startsWith('/es/login') || nextUrl.pathname.startsWith('/en/login'));
    const isLoggedIn = !!req.auth;

    // Execute internationalization middleware first
    const response = intlMiddleware(req as unknown as NextRequest);

    // If it's a public route, allow access
    if (isPublicRoute || nextUrl.pathname === '/es' || nextUrl.pathname === '/en') {
        return response;
    }

    // Protection for private routes
    if (!isLoggedIn) {
        const locale = nextUrl.pathname.split('/')[1] || 'es';
        // If already on login page (regardless of locale), allow
        if (nextUrl.pathname.includes('/login')) {
            return response;
        }
        return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
    }

    return response;
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

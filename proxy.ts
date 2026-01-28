import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

// Define route permissions
const publicRoutes = ['/', '/login', '/register'];
const adminRoutes = ['/admin'];
const teacherRoutes = ['/teacher'];
const studentRoutes = ['/student'];

export async function proxy(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!session?.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = session.user.role;

    // Check admin routes
    if (pathname.startsWith('/admin')) {
        if (userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Check teacher routes
    if (pathname.startsWith('/teacher')) {
        if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Check student routes
    if (pathname.startsWith('/student')) {
        if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // For chat routes, verify user has access to the assistant
    if (pathname.startsWith('/chat/')) {
        // This will be checked in the page component for performance
        // Middleware just ensures authentication
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

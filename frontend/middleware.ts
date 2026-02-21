import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Role-based route access control
const roleRoutePermissions: Record<string, string[]> = {
    admin: ['/admin', '/dashboard'],
    army_medical_officer: ['/dashboard'],
    public_medical_official: ['/dashboard'],
    // Uppercase fallbacks
    ADMIN: ['/admin', '/dashboard'],
    DOCTOR: ['/dashboard'],
    SPECIALIST: ['/dashboard'],
    MEDIC: ['/dashboard'],
};

// Public routes that don't require authentication (including landing at /)
const publicRoutes = ['/auth/login', '/auth/register', '/api'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes, root (landing), and static files
    if (pathname === '/' || publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Get session token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // Redirect to login if no token
    if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check role-based access for protected routes
    const userRole = (token.role as string) || 'army_medical_officer';
    const allowedRoutes = roleRoutePermissions[userRole] || ['/dashboard'];

    // Check if user can access this route
    const canAccess = allowedRoutes.some(route => pathname.startsWith(route));

    if (!canAccess) {
        // Redirect to dashboard if trying to access unauthorized route
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow access
    return NextResponse.next();
}

// Middleware is NOT used in mobile/desktop static export builds
// Mobile auth uses direct API calls via lib/mobile-auth.ts
export const config = {
    matcher: process.env.MOBILE_BUILD === 'true'
        ? []  // Empty = middleware disabled for static export
        : ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
